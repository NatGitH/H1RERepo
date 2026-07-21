import email

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import IntegrityError
import json, datetime, jwt, requests, random
from django.conf import settings
import requests
from .models import Company, HRUser, Roles
import uuid
import argon2
from argon2 import PasswordHasher
from .models import JobRequirement, ApprovalRequirement, EmployerAccountRequest, Notification, ApprovalNotification, ApprovalCompany, Document, Interview, AuditLog, EmailLog, AIEvaluationLog, SubscriptionPayment

# Subscription plan pricing (revision #10 — payment history). PHP / month.
PLAN_PRICES = {"free": 0, "standard": 899, "enterprise": 1999}

def log_payment(company_id, plan, status="paid", note=""):
    """Record one subscription payment/event row. Guarded — never breaks the caller."""
    try:
        SubscriptionPayment.objects.create(
            payment_id=uuid.uuid4(),
            company_id=company_id,
            plan=(plan or "").lower(),
            amount=PLAN_PRICES.get((plan or "").lower(), 0),
            status=status,
            note=note,
        )
    except Exception as e:
        print("log_payment error:", e)

# AI-procedure versioning (revision #4). Keep in sync with the n8n Evaluate
# workflow: the LLM model runs there, the weighted blend is defined in its parse
# node. These labels are stamped on every AI_Evaluation_Logs row for review.
AI_MODEL_NAME      = "openai/gpt-oss-120b"
AI_WEIGHTS_VERSION = "v1 — llm = 0.50*skills + 0.30*role + 0.10*impact + 0.10*soft; hire = 0.90*llm + 0.10*semantic"

ph = PasswordHasher()

# ── Two separate trails ─────────────────────────────────────────────────────
# NOTIFICATIONS (Notifications table) are transient — the user can Clear them.
# AUDIT LOGS (Audit_Logs table) are PERMANENT (panel-mandated) — no clear button.
# The Audit_Logs table has no company_id column (frozen schema), so we carry the
# owning company inside action_details as a "[c:<company_id>] " prefix and scope
# the Activity tab by that marker. Both writes are fully guarded so a logging
# failure can never break the action that triggered it.

def notify_company(company_id, ntype, title, message):
    """Create a company-scoped (owner-facing) notification. Clearable."""
    if not company_id:
        return
    try:
        Notification.objects.create(
            notification_id=uuid.uuid4(),
            recipient_company_id=company_id,
            notification_type=ntype,
            title=title,
            message=message,
            is_read=False,
        )
    except Exception as e:
        print("notify_company error:", e)

def notify_user(user_id, ntype, title, message):
    """Create a per-user notification. Clearable."""
    if not user_id:
        return
    try:
        Notification.objects.create(
            notification_id=uuid.uuid4(),
            recipient_user_id=user_id,
            notification_type=ntype,
            title=title,
            message=message,
            is_read=False,
        )
    except Exception as e:
        print("notify_user error:", e)

def log_audit(company_id, action_type, message, performed_by_user_id=None,
              applicant_id=None, requirement_id=None):
    """Write a PERMANENT audit row to Audit_Logs. Company scope is stored as a
    '[c:<company_id>] ' prefix in action_details (no company_id column exists)."""
    if not company_id:
        return
    try:
        AuditLog.objects.create(
            audit_log_id=uuid.uuid4(),
            applicant_id=(applicant_id or None),
            performed_by_user_id=(performed_by_user_id or None),
            requirement_id=(requirement_id or None),
            action_type=action_type,
            action_details=f"[c:{company_id}] {message}",
        )
    except Exception as e:
        print("audit log error:", e)

PLAN_FEATURES = {
    "free":       {"job_posts": 2,    "resumes": 30,   "interview": False, "reject": False, "pros_cons": False, "audit": False},
    "standard":   {"job_posts": 6,    "resumes": 300,  "interview": True,  "reject": True,  "pros_cons": True,  "audit": False},
    "enterprise": {"job_posts": None, "resumes": None, "interview": True,  "reject": True,  "pros_cons": True,  "audit": True},
}

def plan_features(plan):
    return PLAN_FEATURES.get((plan or "free").lower(), PLAN_FEATURES["free"])

def get_company_plan(company_id):
    c = Company.objects.filter(company_id=company_id).first()
    return (c.subscription_plan or "free").lower() if c and c.subscription_plan else "free"

def make_token(payload: dict) -> str:
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

def fmt_ph(dt):
    """Format a datetime in Philippine time (UTC+8) as MM/DD/YYYY HH:MM AM/PM."""
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    ph = dt.astimezone(datetime.timezone(datetime.timedelta(hours=8)))
    return ph.strftime("%m/%d/%Y %I:%M %p")

@csrf_exempt
@require_POST
def login_owner(request):
    try:
        data     = json.loads(request.body)
        email    = data.get("email", "").strip()
        password = data.get("password", "").strip()

        company = Company.objects.get(owner_email=email)

        try:
            ph.verify(company.owner_password, password)
        except argon2.exceptions.VerifyMismatchError:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        try:
            approval = ApprovalCompany.objects.get(subscribing_company_id=company.company_id)
            if approval.action_status == "pending":
                return JsonResponse({"error": "Your company is pending admin approval. Please wait for an admin to approve your account."}, status=403)
            if approval.action_status == "rejected":
                return JsonResponse({"error": "Your company registration has been rejected. Please contact support."}, status=403)
        except ApprovalCompany.DoesNotExist:
            pass

        token = make_token({
            "role":       "owner",
            "company_id": str(company.company_id),
            "email":      email,
        })

        return JsonResponse({
            "token":        token,
            "role":         "owner",
            "company_id":   str(company.company_id),
            "company_name": company.company_name,
            "company_logo": company.company_logo or None,
            "subscription_plan": (company.subscription_plan or "free").lower(),
        })

    except Company.DoesNotExist:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def register_company(request):
    try:
        company_name   = request.POST.get("company_name", "").strip()
        email          = request.POST.get("email", "").strip()
        password       = request.POST.get("password", "").strip()
        staff_password = request.POST.get("staff_password", "").strip()
        plan           = request.POST.get("plan", "free").strip()

        if not all([company_name, email, password]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if len(password) < 8:
            return JsonResponse({"error": "Password must be at least 8 characters"}, status=400)

        if staff_password and len(staff_password) < 8:
            return JsonResponse({"error": "Staff password must be at least 8 characters"}, status=400)

        if Company.objects.filter(owner_email=email).exists():
            return JsonResponse({"error": "Email already registered"}, status=400)

        if Company.objects.filter(company_name__iexact=company_name).exists():
            return JsonResponse({"error": "Company name already exists."}, status=400)

        now    = datetime.datetime.utcnow()
        expiry = now + datetime.timedelta(days=30)

        hashed       = ph.hash(password)
        hashed_staff = ph.hash(staff_password) if staff_password else None

        company = Company.objects.create(
            company_name=company_name,
            owner_email=email,
            owner_password=hashed,
            staff_password=hashed_staff,
            subscription_plan=plan,
            subscription_start=now,
            subscription_expiry=expiry,
        )

        ApprovalCompany.objects.create(
            ap_companies_id=uuid.uuid4(),
            subscribing_company_id=company.company_id,
            action_status="pending",
        )

        log_audit(company_id=company.company_id, action_type="COMPANY_CREATED",
                  message=f"Company account '{company_name}' was created.")
        log_payment(company.company_id, plan, note="Initial subscription")

        try:
            from supabase import create_client
            from django.conf import settings
            sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

            doc_fields = {
                "business_permit": "Business Permit",
                "dti_sec":         "DTI/SEC Registration",
                "bir":             "BIR Certificate",
            }

            for field_name, label in doc_fields.items():
                file_obj = request.FILES.get(field_name)
                if not file_obj:
                    continue

                ext      = file_obj.name.split(".")[-1]
                storage_path = f"{company.company_id}/{field_name}.{ext}"

                file_bytes = file_obj.read()
                sb.storage.from_("company-documents").upload(
                    storage_path,
                    file_bytes,
                    {"content-type": file_obj.content_type, "upsert": "true"}
                )

                public_url = sb.storage.from_("company-documents").get_public_url(storage_path)

                Document.objects.create(
                    document_id=uuid.uuid4(),
                    company_id=company.company_id,
                    document_name=label,
                    document_type=field_name,
                    document_url=public_url,
                )
        except Exception as doc_err:
            print("Document upload error:", doc_err)

        print(f"[n8n] N8N_BASE_URL = {settings.N8N_BASE_URL}")
        try:
            resp = requests.post(
                f"{settings.N8N_BASE_URL}/webhook/register-confirmation",
                json={
                    "email":      email,
                    "first_name": company_name,
                    "last_name":  "",
                },
                timeout=5,
            )
            print(f"[n8n] register-confirmation -> HTTP {resp.status_code}")
        except Exception as n8n_err:
            print("[n8n] register-confirmation error:", n8n_err)

        try:
            from .models import Admin
            admin_emails = [a.admin_email for a in Admin.objects.all() if a.admin_email]
            if admin_emails:
                resp = requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/admin-new-company",
                    json={
                        "admin_emails": ",".join(admin_emails),
                        "company_name": company_name,
                        "owner_email":  email,
                    },
                    timeout=5,
                )
                print(f"[n8n] admin-new-company -> HTTP {resp.status_code} (recipients: {admin_emails})")
            else:
                print("[n8n] admin-new-company SKIPPED: no admin_email found in the Admin table")
        except Exception as n8n_err:
            print("[n8n] admin-new-company error:", n8n_err)

        return JsonResponse({"message": "Company registered successfully", "company_id": str(company.company_id)})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
@require_POST
def save_document(request):
    try:
        data          = json.loads(request.body)
        company_id    = data.get("company_id", "").strip()
        document_name = data.get("document_name", "").strip()
        document_type = data.get("document_type", "").strip()
        document_url  = data.get("document_url", "").strip()

        if not all([company_id, document_url]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        Document.objects.create(
            document_id=uuid.uuid4(),
            company_id=company_id,
            document_name=document_name,
            document_type=document_type,
            document_url=document_url,
        )

        return JsonResponse({"message": "Document saved"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
@require_POST
def delete_employer(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role not in ["owner", "HRManager"]:
            return JsonResponse({"error": "Only owners and HR managers can delete employers"}, status=403)

        data    = json.loads(request.body)
        user_id = data.get("user_id", "").strip()

        if role == "owner":
            comp = Company.objects.filter(company_id=payload.get("company_id")).first()
            deleter_email = comp.owner_email if comp else ""
            deleter_role  = "Owner"
        else:
            actor = HRUser.objects.filter(user_id=payload.get("user_id")).first()
            deleter_email = actor.email if actor else ""
            deleter_role  = "HR Manager"
        deleted_by = f"{deleter_email} ({deleter_role})" if deleter_email else deleter_role

        user = HRUser.objects.get(user_id=user_id)
        deleted_email = user.email
        deleted_name  = f"{user.firstname or ''} {user.lastname or ''}".strip() or user.username or "there"
        user.delete()

        try:
            if deleted_email:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/employer-deleted",
                    json={"email": deleted_email, "name": deleted_name, "deleted_by": deleted_by},
                    timeout=5,
                )
        except Exception as n8n_err:
            print("employer deleted email error:", n8n_err)

        return JsonResponse({"message": "Employer deleted successfully"})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def check_company_name(request):
    try:
        data         = json.loads(request.body)
        company_name = data.get("company_name", "").strip()

        if Company.objects.filter(company_name__iexact=company_name).exists():
            return JsonResponse(
                {"error": "A company with this name already exists. If this is a branch, "
                "please use a unique name like 'Company - Branch'."},
                status=400
            )

        return JsonResponse({"message": "Company name is available"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def find_company(request):
    try:
        data           = json.loads(request.body)
        company_name   = data.get("company_name", "").strip()
        staff_password = data.get("staff_password", "").strip()

        company = Company.objects.get(company_name=company_name)

        try:
            ph.verify(company.staff_password, staff_password)
        except argon2.exceptions.VerifyMismatchError:
            return JsonResponse({"error": "Invalid credentials"}, status=401)
        except Exception:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        return JsonResponse({
            "company_id":   str(company.company_id),
            "company_name": company.company_name,
        })

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def check_approval_status(request):
    try:
        data  = json.loads(request.body)
        email = data.get("email", "").strip()

        company = Company.objects.get(owner_email=email)

        try:
            approval = ApprovalCompany.objects.get(subscribing_company_id=company.company_id)
            return JsonResponse({"status": approval.action_status})
        except ApprovalCompany.DoesNotExist:
            return JsonResponse({"status": "pending"})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def create_hr_account(request):
    try:
        data       = json.loads(request.body)
        username   = data.get("username", "").strip()
        email      = data.get("email", "").strip()
        password   = data.get("password", "").strip()
        company_id = data.get("company_id", "").strip()
        role_name  = data.get("role", "HRStaff").strip()

        firstname       = data.get("firstname", "").strip()
        lastname        = data.get("lastname", "").strip()
        birthdate       = data.get("birthdate") or None
        bio             = data.get("bio", "").strip()
        profile_picture = data.get("profile_picture") or None

        if not all([username, email, password, company_id, firstname, lastname]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if len(password) < 8:
            return JsonResponse({"error": "Password must be at least 8 characters"}, status=400)

        # email + username are UNIQUE across the whole Users table (not per company),
        # so check globally — otherwise the raw Postgres "Users_email_key" error leaks.
        if HRUser.objects.filter(email=email).exists():
            return JsonResponse({"error": "That email is already registered."}, status=400)

        if HRUser.objects.filter(username=username).exists():
            return JsonResponse({"error": "That username is already taken."}, status=400)

        role   = Roles.objects.get(role_name=role_name)
        hashed = ph.hash(password)

        user = HRUser.objects.create(
            user_id=uuid.uuid4(),
            role_id=role.role_id,
            company_id=company_id,
            username=username,
            email=email,
            password=hashed,
            firstname=firstname,
            lastname=lastname,
            birthdate=birthdate,
            bio=bio,
            profile_picture=profile_picture,
            account_status="pending",
        )

        EmployerAccountRequest.objects.create(
            request_id=uuid.uuid4(),
            requested_user_id=user.user_id,
            company_id=company_id,
            requested_email=email,
            request_status="pending",
        )

        try:
            managers = HRUser.objects.filter(
                company_id=company_id,
                role_id__in=Roles.objects.filter(
                    role_name__in=["HRManager"]
                ).values_list("role_id", flat=True)
            )
            for mgr in managers:
                Notification.objects.create(
                    notification_id=uuid.uuid4(),
                    recipient_user_id=mgr.user_id,
                    notification_type="new_account_request",
                    title="New Account Request",
                    message=f"{firstname} {lastname} has requested to join your team and is waiting for approval.",
                    is_read=False,
                )

            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_company_id=company_id,
                notification_type="new_account_request",
                title="New Account Request",
                message=f"{firstname} {lastname} has requested to join your team and is waiting for approval.",
                is_read=False,
            )
        except Exception as notif_err:
            print("Notification error:", notif_err)

        try:
            requests.post(
                f"{settings.N8N_BASE_URL}/webhook/register-confirmation",
                json={
                    "email":      email,
                    "first_name": firstname,
                    "last_name":  lastname,
                },
                timeout=5,
            )
        except Exception as n8n_err:
            print("n8n error:", n8n_err)

        return JsonResponse({"message": "Account created successfully"})

    except Roles.DoesNotExist:
        return JsonResponse({"error": "Invalid role"}, status=400)
    except IntegrityError as e:
        # Safety net for a race between the checks above and the insert (or any other
        # unique violation) — surface a friendly message, never the raw SQL error.
        msg = str(e).lower()
        if "email" in msg:
            return JsonResponse({"error": "That email is already registered."}, status=400)
        if "username" in msg:
            return JsonResponse({"error": "That username is already taken."}, status=400)
        return JsonResponse({"error": "That account already exists."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def login_hr(request):
    try:
        data       = json.loads(request.body)
        email      = (data.get("email") or "").strip()
        password   = (data.get("password") or "").strip()
        company_id = (data.get("company_id") or "").strip()

        if not company_id:
            return JsonResponse({"error": "Please select your company before logging in."}, status=400)

        try:
            approval = ApprovalCompany.objects.get(subscribing_company_id=company_id)
            if approval.action_status == "rejected":
                return JsonResponse({"error": "This company's access has been revoked. Please contact support."}, status=403)
        except ApprovalCompany.DoesNotExist:
            pass

        user = HRUser.objects.get(email=email, company_id=company_id)

        try:
            ph.verify(user.password, password)
        except argon2.exceptions.VerifyMismatchError:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        if user.account_status == "pending":
            return JsonResponse({"error": "Your account is pending approval. Please wait for an admin to approve your account."}, status=403)

        if user.account_status == "rejected":
            return JsonResponse({"error": "Your account has been rejected. Please contact your administrator."}, status=403)

        role_obj = Roles.objects.get(role_id=user.role_id)
        role     = role_obj.role_name

        token = make_token({
            "role":       role,
            "user_id":    str(user.user_id),
            "company_id": str(company_id),
            "email":      email,
        })

        return JsonResponse({
            "token":      token,
            "role":       role,
            "user_id":    str(user.user_id),
            "company_id": str(company_id),
            "subscription_plan": get_company_plan(company_id),
        })

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def update_hr_profile(request):
    try:
        data            = json.loads(request.body)
        email           = data.get("email", "").strip()
        company_id      = data.get("company_id", "").strip()
        firstname       = data.get("firstname", "").strip()
        lastname        = data.get("lastname", "").strip()
        birthdate       = data.get("birthdate", None)
        bio             = data.get("bio", "").strip()
        profile_picture = data.get("profile_picture", None)

        user = HRUser.objects.get(email=email, company_id=company_id)
        if firstname:        user.firstname        = firstname
        if lastname:         user.lastname         = lastname
        if birthdate:        user.birthdate        = birthdate
        if bio:              user.bio              = bio
        if profile_picture:  user.profile_picture  = profile_picture

        user.save()
        return JsonResponse({"message": "Profile updated successfully"})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    

@csrf_exempt
@require_POST
def forgot_password(request):
    try:
        data  = json.loads(request.body)
        email = data.get("email", "").strip()

        try:
            user = HRUser.objects.get(email=email)
        except HRUser.DoesNotExist:
            print(f"DEBUG: email '{email}' not found in HRUser table")
            return JsonResponse({"message": "If that email exists, a reset link was sent."})

        token = make_token({"user_id": str(user.user_id), "purpose": "password_reset"})

        reset_link = f"{settings.FRONTEND_URL}/#/HR-New-Password?token={token}"
        
        try:
            requests.post(
                f"{settings.N8N_BASE_URL}/webhook/password-reset",
                json={
                    "email":      email,
                    "username":   user.username,
                    "reset_link": reset_link,
                },
                timeout=5,
            )
        except Exception as n8n_err:
            print("n8n error:", n8n_err)

        return JsonResponse({"message": "If that email exists, a reset link was sent."})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def send_reset_code(request):
    """Email a 6-digit password-reset code (stored in the Django cache for 10 min)."""
    try:
        data   = json.loads(request.body)
        email  = data.get("email", "").strip()
        origin = (data.get("origin") or "").strip()

        user    = HRUser.objects.filter(email=email).first()
        company = None if user else Company.objects.filter(owner_email=email).first()

        if origin == "owner" and not company:
            return JsonResponse({"error": "No company is registered with this email."}, status=404)

        if origin == "staff":
            company_id = (data.get("company_id") or "").strip()
            if not company_id:
                return JsonResponse({"error": "Missing company context. Please sign in to your company again."}, status=400)
            staff = HRUser.objects.filter(email=email, company_id=company_id).first()
            if not staff:
                return JsonResponse({"error": "That email doesn't belong to a staff or manager in this company."}, status=404)

        if not user and not company:
            return JsonResponse({"message": "If that email exists, a code was sent."})

        display_name = user.username if user else company.company_name
        code = f"{random.randint(0, 999999):06d}"
        from django.core.cache import cache
        cache.set(f"pwcode:{email}", code, timeout=600)

        try:
            requests.post(
                f"{settings.N8N_BASE_URL}/webhook/password-reset-code",
                json={"email": email, "username": display_name, "code": code},
                timeout=5,
            )
        except Exception as n8n_err:
            print("reset code email error:", n8n_err)

        return JsonResponse({"message": "If that email exists, a code was sent."})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def verify_reset_code(request):
    """Check a submitted code against the one stored in the cache."""
    try:
        data  = json.loads(request.body)
        email = data.get("email", "").strip()
        code  = data.get("code", "").strip()

        from django.core.cache import cache
        stored = cache.get(f"pwcode:{email}")
        if not stored or stored != code:
            return JsonResponse({"error": "Invalid or expired code"}, status=400)

        return JsonResponse({"message": "Code verified"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def reset_password(request):
    """Set a new password via EITHER the emailed link (JWT token) or the emailed code."""
    try:
        data      = json.loads(request.body)
        token     = data.get("token", "").strip()
        email     = data.get("email", "").strip()
        code      = data.get("code", "").strip()
        new_pass  = data.get("new_password", "").strip()

        if not new_pass:
            return JsonResponse({"error": "New password is required"}, status=400)
        if len(new_pass) < 8:
            return JsonResponse({"error": "Password must be at least 8 characters"}, status=400)

        if token:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if payload.get("purpose") != "password_reset":
                return JsonResponse({"error": "Invalid token"}, status=400)
            user = HRUser.objects.get(user_id=payload["user_id"])
            user.password = ph.hash(new_pass)
            user.save()
            return JsonResponse({"message": "Password reset successfully"})

        if email and code:
            from django.core.cache import cache
            stored = cache.get(f"pwcode:{email}")
            if not stored or stored != code:
                return JsonResponse({"error": "Invalid or expired code"}, status=400)
            cache.delete(f"pwcode:{email}")

            hashed = ph.hash(new_pass)
            hr = HRUser.objects.filter(email=email).first()
            if hr:
                hr.password = hashed
                hr.save()
                return JsonResponse({"message": "Password reset successfully"})

            company = Company.objects.filter(owner_email=email).first()
            if company:
                company.owner_password = hashed
                company.save()
                return JsonResponse({"message": "Password reset successfully"})

            return JsonResponse({"error": "User not found"}, status=404)

        return JsonResponse({"error": "Missing reset token or code"}, status=400)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Reset link has expired"}, status=401)
    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    

def get_auto_reject_threshold(company_id):
    """The company's auto-reject minimum H!RE Score, or None if not set.
    Stored as a Notification row (type 'auto_reject_threshold') because the DB
    schema is frozen — same key/value-in-Notifications trick as plan changes."""
    n = Notification.objects.filter(
        recipient_company_id=company_id,
        notification_type="auto_reject_threshold",
    ).order_by("-created_at").first()
    if not n:
        return None
    try:
        return float(n.message)
    except (TypeError, ValueError):
        return None

@csrf_exempt
def auto_reject_threshold(request):
    """GET returns the company's auto-reject threshold; POST (owner/manager) sets
    or clears it. Applicants scoring below the threshold are auto-rejected."""
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")
        if not company_id:
            return JsonResponse({"error": "No company"}, status=400)

        if request.method == "GET":
            return JsonResponse({"threshold": get_auto_reject_threshold(company_id)})

        # Auto-reject is set on the upload screen (per batch), so any company user
        # who can upload resumes may set it — including HR Staff.
        if role not in ["owner", "HRManager", "HRStaff"]:
            return JsonResponse({"error": "Not allowed to set auto-reject"}, status=403)

        data = json.loads(request.body)
        raw  = data.get("threshold", None)

        Notification.objects.filter(
            recipient_company_id=company_id,
            notification_type="auto_reject_threshold",
        ).delete()

        if raw is None or raw == "":
            return JsonResponse({"threshold": None, "message": "Auto-reject disabled"})
        try:
            val = float(raw)
        except (TypeError, ValueError):
            return JsonResponse({"error": "Threshold must be a number"}, status=400)
        if val < 0 or val > 100:
            return JsonResponse({"error": "Threshold must be between 0 and 100"}, status=400)

        Notification.objects.create(
            notification_id=uuid.uuid4(),
            recipient_company_id=company_id,
            notification_type="auto_reject_threshold",
            title="Auto-Reject Threshold",
            message=str(val),
            is_read=True,
        )
        return JsonResponse({"threshold": val, "message": "Auto-reject threshold set"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def create_meet_link(request):
    """Ask n8n to create a real Google Meet link (via a Google Calendar event)
    and return it. Requires a Google Calendar OAuth2 credential configured on the
    'H!RE - Create Meet Link' workflow in n8n."""
    try:
        decode_token(request)
        data = json.loads(request.body)
        interview_date = data.get("interview_date")
        if not interview_date:
            return JsonResponse({"error": "interview_date is required"}, status=400)

        body = {
            "applicant_name": data.get("applicant_name", "Applicant"),
            "job_title":      data.get("job_title", ""),
            "interview_date": interview_date,
            "request_id":     str(uuid.uuid4()),
        }
        resp = requests.post(f"{settings.N8N_BASE_URL}/webhook/create-meet-link", json=body, timeout=20)
        if not resp.ok:
            return JsonResponse({"error": "Could not create a meeting link. Paste one manually."}, status=502)
        try:
            out = resp.json()
        except ValueError:
            out = {}
        link = out.get("meet_link") or out.get("hangoutLink") or ""
        if not link:
            return JsonResponse({"error": "No meeting link was returned. Paste one manually."}, status=502)
        return JsonResponse({"meet_link": link})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except requests.exceptions.RequestException:
        return JsonResponse({"error": "Could not reach the meeting service."}, status=502)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def evaluate_resume(request):
    try:
        payload    = decode_token(request)
        user_id = payload.get("user_id")
        company_id = payload.get("company_id")

        resume_file    = request.FILES.get("resume")
        requirement_id = request.POST.get("requirement_id", "").strip()

        if not resume_file:
            return JsonResponse({"error": "No resume file uploaded"}, status=400)
        if not requirement_id:
            return JsonResponse({"error": "No requirement selected"}, status=400)

        resume_bytes = resume_file.read()

        if requirement_id == "auto":
            approved = JobRequirement.objects.filter(
                company_id=company_id, is_deleted=False, current_status="approved")
            reqs_payload = [{
                "requirement_id": str(r.requirement_id),
                "job_title":      r.job_title,
                "description":    r.description,
                "qualifications": r.qualifications,
            } for r in approved]
            if not reqs_payload:
                return JsonResponse({"error": "No approved requirements to match against."}, status=400)
            try:
                match_resp = requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/match-resume",
                    files={"resume": (resume_file.name, resume_bytes, resume_file.content_type)},
                    data={"requirements": json.dumps(reqs_payload)},
                    timeout=90,
                )
                best_id = match_resp.json().get("best_requirement_id") if match_resp.ok else None
            except Exception as match_err:
                print("auto-match error:", match_err)
                best_id = None
            if not best_id:
                return JsonResponse({"error": "Could not auto-match this file to a position. Please pick one manually."}, status=502)
            requirement_id = best_id

        req = JobRequirement.objects.get(
            requirement_id=requirement_id,
            company_id=company_id,
            is_deleted=False
        )

        feats = plan_features(get_company_plan(company_id))
        if feats["resumes"] is not None:
            from supabase import create_client
            sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            req_ids = [str(r) for r in JobRequirement.objects.filter(
                company_id=company_id).values_list("requirement_id", flat=True)]
            used = 0
            if req_ids:
                rows = sb.table("Evaluations").select("evaluation_id, application_status").in_(
                    "requirement_id", req_ids).execute().data
                used = sum(1 for r in rows if r.get("application_status") != "removed")
            if used >= feats["resumes"]:
                return JsonResponse(
                    {"error": f"You've reached your plan's limit of {feats['resumes']} resume "
                              f"evaluations. Upgrade your plan to evaluate more."},
                    status=403,
                )

        n8n_url = getattr(settings, "N8N_EVALUATE_WEBHOOK_URL", "http://localhost:5678/webhook/evaluate-resume")

        files = {
            "resume": (resume_file.name, resume_bytes, resume_file.content_type),
        }
        data = {
            "requirement_id":      str(req.requirement_id),
            "job_title":           req.job_title,
            "description":         req.description,
            "qualifications":      req.qualifications,
            "uploaded_by_user_id": str(user_id) if user_id else "",
            "evaluated_by_user_id": str(user_id) if user_id else "",
        }

        n8n_response = requests.post(n8n_url, files=files, data=data, timeout=60)

        if not n8n_response.ok:
            return JsonResponse(
                {"error": "This file is not considered a Resume in our system."},
                status=422
            )

        try:
            result = n8n_response.json()
        except ValueError:
            return JsonResponse(
                {"error": "This file is not considered a Resume in our system."},
                status=422
            )

        # Auto-reject: if the company set a minimum H!RE Score and this resume is
        # below it, mark the evaluation 'rejected' (not removed). The scheduled
        # reject workflow then emails the applicant + cleans up after the grace
        # period. Guarded so a failure never breaks the evaluation response.
        try:
            threshold = get_auto_reject_threshold(company_id)
            score     = result.get("hire_score")
            eval_id   = result.get("evaluation_id")
            if threshold is not None and eval_id is not None and score is not None and float(score) < float(threshold):
                from supabase import create_client
                sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                sb.table("Evaluations").update({
                    "application_status": "rejected",
                    "rejected_at":        datetime.datetime.utcnow().isoformat(),
                }).eq("evaluation_id", str(eval_id)).execute()
                result["auto_rejected"] = True
        except Exception as ar_err:
            print("auto-reject error:", ar_err)

        # AI-procedure log (revision #4): record the model + weights version and the
        # sub-scores behind this H!RE Score for internal review over time. Guarded —
        # logging must never break the evaluation response.
        try:
            def _num(v):
                try:
                    return float(v)
                except (TypeError, ValueError):
                    return None
            sk, ro = _num(result.get("skills_match")), _num(result.get("role_relevance"))
            im, so = _num(result.get("impact")), _num(result.get("soft_signals"))
            llm = None
            if None not in (sk, ro, im, so):
                llm = round(0.50 * sk + 0.30 * ro + 0.10 * im + 0.10 * so, 2)
            AIEvaluationLog.objects.create(
                evaluation_id=result.get("evaluation_id"),
                company_id=company_id,
                requirement_id=req.requirement_id,
                model_name=result.get("model_name") or AI_MODEL_NAME,
                weights_version=AI_WEIGHTS_VERSION,
                semantic_score=_num(result.get("semantic_score")),
                skills_match=sk, role_relevance=ro, impact=im, soft_signals=so,
                llm_score=llm, hire_score=_num(result.get("hire_score")),
            )
        except Exception as log_err:
            print("ai log error:", log_err)

        return JsonResponse(result, status=201)

    except JobRequirement.DoesNotExist:
        return JsonResponse({"error": "Requirement not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Could not reach evaluation service: {str(e)}"}, status=502)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_evaluations(request):
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")

        from supabase import create_client
        from django.conf import settings
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        reqs = JobRequirement.objects.filter(
            company_id=company_id,
            is_deleted=False
        ).values_list("requirement_id", flat=True)

        req_ids = [str(r) for r in reqs]

        if not req_ids:
            return JsonResponse([], safe=False)

        evals = sb.table("Evaluations").select("*").in_(
            "requirement_id", req_ids
        ).execute().data

        # Requirement details straight from Django (its DB connection bypasses RLS,
        # which the anon Supabase client cannot read past on Job_Requirements).
        req_map = {
            str(r.requirement_id): r
            for r in JobRequirement.objects.filter(requirement_id__in=req_ids)
        }

        results = []
        for ev in evals:
            # Skip soft-removed evaluations (rejected past the 1h grace, archived by the reject workflow)
            if ev.get("application_status") == "removed":
                continue
            resume = sb.table("Resumes").select("*").eq(
                "resume_id", ev["resume_id"]
            ).execute().data

            pros = sb.table("Evaluation_Pros").select("pros_text").eq(
                "evaluation_id", ev["evaluation_id"]
            ).execute().data

            cons = sb.table("Evaluation_Cons").select("cons_text").eq(
                "evaluation_id", ev["evaluation_id"]
            ).execute().data

            req_obj = req_map.get(str(ev["requirement_id"]))

            applicant = sb.table("Applicants").select("*").eq(
                "applicant_id", resume[0]["applicant_id"]
            ).execute().data if resume else []

            # Latest interview row via ORM (also RLS-guarded for the anon client)
            interview_obj = Interview.objects.filter(
                evaluation_id=ev["evaluation_id"]
            ).order_by("-date_created").first()

            results.append({
                "evaluation_id":  ev["evaluation_id"],
                "resume_id":      ev["resume_id"],
                "hire_score":     float(ev["hire_score"]),
                "summary":        ev["ai_summary"],
                "applicant_name": applicant[0]["full_name"] if applicant else "Unknown Applicant",
                "applicant_email": applicant[0]["email"] if applicant else "",
                "applicant_phone": applicant[0].get("phone") if applicant else "",
                "status":         ev["application_status"],
                "pros":           [p["pros_text"] for p in pros],
                "cons":           [c["cons_text"] for c in cons],
                "file_name":      resume[0]["file_name"] if resume else "",
                "file_path":      resume[0]["file_path"] if resume else "",
                "job_title":      req_obj.job_title if req_obj else "",
                "job_description":    req_obj.description if req_obj else "",
                "job_qualifications": req_obj.qualifications if req_obj else "",
                "evaluated_by":   get_user_fullname(ev.get("evaluated_by_user_id")),
                "rejected_at":       ev.get("rejected_at"),
                "shortlisted_by":    get_user_fullname(ev.get("shortlisted_by_user_id")),
                "shortlisted_by_user_id": ev.get("shortlisted_by_user_id"),
                "interview_date": interview_obj.interview_date.isoformat() if interview_obj and interview_obj.interview_date else None,
                "interview_location": interview_obj.message if interview_obj else None,
                "action_made_by": get_user_fullname(ev.get("action_made_by_user_id")),
                "action_made_by_user_id": ev.get("action_made_by_user_id"),
            })

        return JsonResponse(results, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_evaluation_status(request, evaluation_id):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")

        data   = json.loads(request.body)
        status = data.get("status", "").strip()

        if status not in ["pending", "shortlisted", "rejected", "interview_sent", "hired"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        feats = plan_features(get_company_plan(payload.get("company_id")))
        if status == "interview_sent" and not feats["interview"]:
            return JsonResponse({"error": "Interview scheduling isn't available on your plan. Please upgrade."}, status=403)
        if status == "rejected" and not feats["reject"]:
            return JsonResponse({"error": "Rejecting with email isn't available on your plan. Use Remove Resume instead."}, status=403)

        from supabase import create_client
        from django.conf import settings
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        audit_applicant_id   = None
        audit_requirement_id = None
        try:
            _ev = sb.table("Evaluations").select("resume_id, requirement_id").eq(
                "evaluation_id", str(evaluation_id)
            ).execute().data
            if _ev:
                audit_requirement_id = _ev[0].get("requirement_id")
                _res = sb.table("Resumes").select("applicant_id").eq(
                    "resume_id", _ev[0].get("resume_id")
                ).execute().data if _ev[0].get("resume_id") else []
                if _res:
                    audit_applicant_id = _res[0].get("applicant_id")
        except Exception as lookup_err:
            print("audit lookup error:", lookup_err)

        update_data = {"application_status": status}

        if status == "rejected":
            update_data["rejected_at"] = datetime.datetime.utcnow().isoformat()
            update_data["action_made_by_user_id"] = str(user_id) if user_id else None
        elif status == "shortlisted":
            update_data["action_made_by_user_id"] = str(user_id) if user_id else None
            update_data["rejected_at"] = None
            # Stamp the first shortlist time for the time-to-shortlist metric (#4).
            update_data["shortlisted_at"] = datetime.datetime.utcnow().isoformat()
        elif status == "hired":
            # Terminal "hired" outcome — powers time-to-fill (#4).
            update_data["action_made_by_user_id"] = str(user_id) if user_id else None
            update_data["hired_at"] = datetime.datetime.utcnow().isoformat()
        elif status == "pending":
            update_data["rejected_at"] = None
        elif status == "interview_sent":
            interview_date = data.get("interview_date")
            message        = data.get("message", "")
            meeting_type   = data.get("meeting_type", "")
            meeting_link   = data.get("meeting_link", "")
            if not interview_date:
                return JsonResponse({"error": "interview_date is required"}, status=400)

            try:
                dt = datetime.datetime.fromisoformat(interview_date.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                if dt <= datetime.datetime.now(datetime.timezone.utc):
                    return JsonResponse({"error": "Interview date must be in the future"}, status=400)
            except (ValueError, AttributeError):
                pass

            # Record who moved this applicant to interview — used for the per-user
            # visibility filter in the Profile "For Interview Applicants" panel.
            update_data["action_made_by_user_id"] = str(user_id) if user_id else None

            # Save the interview row via Django ORM (its direct Postgres connection
            # bypasses the Interviews table's row-level-security policy, which blocks
            # the anon Supabase client). Owners have no Users row, so scheduled_by
            # may be None — the column is nullable for exactly this case.
            # The Interviews.message column stores the meeting location / link
            # (Zoom URL or address) so it can be shown in the interview panel.
            Interview.objects.create(
                interview_id=uuid.uuid4(),
                evaluation_id=evaluation_id,
                scheduled_by_user_id=(user_id or None),
                interview_date=interview_date,
                message=meeting_link,
                interview_status="scheduled",
                sent_date=datetime.datetime.utcnow(),
            )

            try:
                from zoneinfo import ZoneInfo
                _s  = str(interview_date).replace("Z", "+00:00")
                _dt = datetime.datetime.fromisoformat(_s)
                if _dt.tzinfo is None:
                    _dt = _dt.replace(tzinfo=ZoneInfo("UTC"))
                date_display = _dt.astimezone(ZoneInfo("Asia/Manila")).strftime("%B %d, %Y at %I:%M %p") + " (PHT)"
            except Exception:
                date_display = interview_date

            try:
                ev_rows   = sb.table("Evaluations").select("resume_id, hire_score, requirement_id").eq("evaluation_id", str(evaluation_id)).execute().data
                ev        = ev_rows[0] if ev_rows else {}
                res_rows  = sb.table("Resumes").select("applicant_id").eq("resume_id", ev.get("resume_id")).execute().data if ev.get("resume_id") else []
                appl_rows = sb.table("Applicants").select("full_name, email").eq("applicant_id", res_rows[0]["applicant_id"]).execute().data if res_rows else []
                appl      = appl_rows[0] if appl_rows else {}
                # Job_Requirements + Companies are RLS-locked for the anon key, so read
                # them via Django ORM (bypasses RLS) — otherwise the interview email
                # would go out with a blank job title and company name.
                req_obj   = JobRequirement.objects.filter(requirement_id=ev.get("requirement_id")).first() if ev.get("requirement_id") else None
                req       = {"job_title": req_obj.job_title, "company_id": str(req_obj.company_id)} if req_obj else {}
                comp_obj  = Company.objects.filter(company_id=req.get("company_id")).first() if req.get("company_id") else None
                comp      = {"company_name": comp_obj.company_name, "owner_email": comp_obj.owner_email} if comp_obj else {}

                # Who scheduled this interview (the interviewer). Owners have no
                # Users row → fall back to the company owner email.
                interviewer_name = get_user_fullname(user_id)
                if user_id:
                    iu = HRUser.objects.filter(user_id=user_id).first()
                    interviewer_email = iu.email if iu else ""
                else:
                    interviewer_email = comp.get("owner_email", "")
                cc_list = [e for e in [comp.get("owner_email", ""), interviewer_email] if e and "@" in e]
                cc_value = ",".join(sorted(set(cc_list)))

                recipient = (appl.get("email") or "").strip()
                if recipient and "@" in recipient and "placeholder" not in recipient:
                    requests.post(
                        f"{settings.N8N_BASE_URL}/webhook/interview-invitation",
                        json={
                            "email":            recipient,
                            "cc":               cc_value,
                            "full_name":        appl.get("full_name") or "Applicant",
                            "job_title":        req.get("job_title", ""),
                            "company_name":     comp.get("company_name", ""),
                            "interviewer_name": interviewer_name,
                            "hire_score":       float(ev.get("hire_score") or 0),
                            "interview_date":   date_display,
                            "meeting_type":     meeting_type,
                            "meeting_link":     meeting_link,
                            "message":          message,
                        },
                        timeout=5,
                    )
                    # Record the sent invitation in Email_Logs (the applicant-email
                    # audit record). Guarded — logging must never break the status
                    # update. Written via the ORM to bypass the table's RLS.
                    try:
                        EmailLog.objects.create(
                            email_log_id=uuid.uuid4(),
                            applicant_id=res_rows[0]["applicant_id"],
                            evaluation_id=evaluation_id,
                            sent_by_user_id=(user_id or None),
                            recipient_email=recipient,
                            message=(f"Interview invitation for {req.get('job_title', '')} "
                                     f"on {date_display}") + (f" — {message}" if message else ""),
                        )
                    except Exception as log_err:
                        print("interview email log error:", log_err)
                else:
                    print("interview email skipped: applicant has no valid email on file")
            except Exception as n8n_err:
                print("interview email error:", n8n_err)

        sb.table("Evaluations").update(update_data).eq("evaluation_id", str(evaluation_id)).execute()

        appl_name = "Applicant"
        if audit_applicant_id:
            try:
                _an = sb.table("Applicants").select("full_name").eq(
                    "applicant_id", str(audit_applicant_id)).execute().data
                if _an and _an[0].get("full_name"):
                    appl_name = _an[0]["full_name"]
            except Exception:
                pass

        actor          = get_user_fullname(user_id)
        company_id_tok = payload.get("company_id")

        if status == "interview_sent":
            raw_dt = data.get("interview_date")
            try:
                from zoneinfo import ZoneInfo
                _s = str(raw_dt).replace("Z", "+00:00")
                _d = datetime.datetime.fromisoformat(_s)
                if _d.tzinfo is None:
                    _d = _d.replace(tzinfo=ZoneInfo("UTC"))
                when = _d.astimezone(ZoneInfo("Asia/Manila")).strftime("%m/%d/%Y %I:%M %p") + " (PHT)"
            except Exception:
                when = raw_dt
            log_audit(
                company_id=company_id_tok,
                action_type="INTERVIEW_SENT",
                message=f"Interview sent to {appl_name} by {actor} for {when}",
                performed_by_user_id=user_id,
                applicant_id=audit_applicant_id,
                requirement_id=audit_requirement_id,
            )
        elif status == "shortlisted":
            notify_company(company_id_tok, "applicant_shortlisted", "Applicant Shortlisted",
                           f"{appl_name} was shortlisted by {actor}.")
        elif status == "hired":
            notify_company(company_id_tok, "applicant_hired", "Applicant Hired",
                           f"{appl_name} was marked as hired by {actor}.")
            log_audit(
                company_id=company_id_tok,
                action_type="APPLICANT_HIRED",
                message=f"{appl_name} was marked as hired by {actor}",
                performed_by_user_id=user_id,
                applicant_id=audit_applicant_id,
                requirement_id=audit_requirement_id,
            )
        elif status == "rejected":
            notify_company(company_id_tok, "applicant_rejected", "Applicant Rejected",
                           f"{appl_name} was rejected by {actor}. Removal in 1 hour unless cancelled.")
        elif status == "pending":
            notify_company(company_id_tok, "applicant_pending", "Rejection Cancelled",
                           f"{appl_name} was moved back to pending by {actor}.")

        return JsonResponse({"message": "Status updated", "status": status})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def remove_evaluation(request, evaluation_id):
    """Permanently remove one applicant's evaluation. This is the free tier's
    'Remove Resume' action (it has no reject-with-email), but any plan may use it.
    Deletes the Evaluation, its Pros/Cons, the Resume row + storage file, and the
    Applicant row."""
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")
        user_id    = payload.get("user_id")

        from supabase import create_client
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        ev = sb.table("Evaluations").select("resume_id, requirement_id").eq(
            "evaluation_id", str(evaluation_id)).execute().data
        if not ev:
            return JsonResponse({"error": "Not found"}, status=404)

        # Security: the evaluation must belong to the caller's company.
        req_id = ev[0].get("requirement_id")
        if not JobRequirement.objects.filter(requirement_id=req_id, company_id=company_id).exists():
            return JsonResponse({"error": "Forbidden"}, status=403)

        resume_id    = ev[0].get("resume_id")
        applicant_id = None
        file_path    = None
        appl_name    = "An applicant"
        if resume_id:
            res = sb.table("Resumes").select("applicant_id, file_path").eq(
                "resume_id", resume_id).execute().data
            if res:
                applicant_id = res[0].get("applicant_id")
                file_path    = res[0].get("file_path")
        if applicant_id:
            _an = sb.table("Applicants").select("full_name").eq(
                "applicant_id", applicant_id).execute().data
            if _an and _an[0].get("full_name"):
                appl_name = _an[0]["full_name"]

        # Delete children first, then parents.
        # Clear rows that FK this evaluation/applicant so the deletes don't hit a
        # Postgres 23503 (e.g. an Audit_Logs entry from a prior interview, or an
        # Email_Logs row). Audit_Logs.applicant_id is nullable -> null it (keeps
        # the permanent entry); Email_Logs FKs are NOT NULL -> delete the rows.
        EmailLog.objects.filter(evaluation_id=evaluation_id).delete()
        if applicant_id:
            AuditLog.objects.filter(applicant_id=applicant_id).update(applicant_id=None)
        sb.table("Evaluation_Pros").delete().eq("evaluation_id", str(evaluation_id)).execute()
        sb.table("Evaluation_Cons").delete().eq("evaluation_id", str(evaluation_id)).execute()
        sb.table("Evaluations").delete().eq("evaluation_id", str(evaluation_id)).execute()
        if resume_id:
            sb.table("Resumes").delete().eq("resume_id", resume_id).execute()
        if applicant_id:
            sb.table("Applicants").delete().eq("applicant_id", applicant_id).execute()

        if file_path:
            try:
                bucket, _, path = file_path.partition("/")
                if bucket and path:
                    sb.storage.from_(bucket).remove([path])
            except Exception as storage_err:
                print("resume storage cleanup error:", storage_err)

        log_audit(company_id=company_id, action_type="APPLICANT_REMOVED",
                  message=f"{get_user_fullname(user_id)} removed {appl_name}",
                  performed_by_user_id=user_id, applicant_id=None, requirement_id=req_id)

        return JsonResponse({"message": "Applicant removed"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def remove_interview(request, evaluation_id):
    """Cancel a scheduled interview AND remove the applicant. Emails the applicant
    that their interview was cancelled (with the interviewer's reason) and records
    a permanent audit entry."""
    try:
        payload    = decode_token(request)
        user_id    = payload.get("user_id")
        company_id = payload.get("company_id")
        data       = json.loads(request.body)
        reason     = (data.get("reason") or "").strip()

        from supabase import create_client
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        ev = sb.table("Evaluations").select("resume_id, requirement_id").eq(
            "evaluation_id", str(evaluation_id)).execute().data
        if not ev:
            return JsonResponse({"error": "Not found"}, status=404)

        req_id = ev[0].get("requirement_id")
        # Security: the evaluation must belong to the caller's company.
        if not JobRequirement.objects.filter(requirement_id=req_id, company_id=company_id).exists():
            return JsonResponse({"error": "Forbidden"}, status=403)

        resume_id    = ev[0].get("resume_id")
        applicant_id = None
        file_path    = None
        appl_name, appl_email = "Applicant", ""
        if resume_id:
            res = sb.table("Resumes").select("applicant_id, file_path").eq("resume_id", resume_id).execute().data
            if res:
                applicant_id = res[0].get("applicant_id")
                file_path    = res[0].get("file_path")
                if applicant_id:
                    appl = sb.table("Applicants").select("full_name, email").eq("applicant_id", applicant_id).execute().data
                    if appl:
                        appl_name  = appl[0].get("full_name") or "Applicant"
                        appl_email = appl[0].get("email") or ""

        req_obj      = JobRequirement.objects.filter(requirement_id=req_id).first() if req_id else None
        job_title    = req_obj.job_title if req_obj else ""
        comp_obj     = Company.objects.filter(company_id=req_obj.company_id).first() if req_obj else None
        company_name = comp_obj.company_name if comp_obj else ""

        try:
            if appl_email and "@" in appl_email and "placeholder" not in appl_email:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/interview-cancelled",
                    json={
                        "email":        appl_email,
                        "full_name":    appl_name,
                        "job_title":    job_title,
                        "company_name": company_name,
                        "reason":       reason,
                    },
                    timeout=5,
                )
        except Exception as n8n_err:
            print("interview cancelled email error:", n8n_err)

        Interview.objects.filter(evaluation_id=evaluation_id).delete()
        # Clear child rows that reference this evaluation/applicant first, or the
        # Evaluations/Applicants deletes below hit FK violations (Postgres 23503):
        #  - Email_Logs FKs evaluation_id + applicant_id (NOT NULL) -> delete rows.
        #  - Audit_Logs FKs applicant_id (nullable) -> null it so the permanent
        #    audit entries survive (the applicant name lives in the details text).
        EmailLog.objects.filter(evaluation_id=evaluation_id).delete()
        if applicant_id:
            AuditLog.objects.filter(applicant_id=applicant_id).update(applicant_id=None)
        sb.table("Evaluation_Pros").delete().eq("evaluation_id", str(evaluation_id)).execute()
        sb.table("Evaluation_Cons").delete().eq("evaluation_id", str(evaluation_id)).execute()
        sb.table("Evaluations").delete().eq("evaluation_id", str(evaluation_id)).execute()
        if resume_id:
            sb.table("Resumes").delete().eq("resume_id", resume_id).execute()
        if applicant_id:
            sb.table("Applicants").delete().eq("applicant_id", applicant_id).execute()
        if file_path:
            try:
                bucket, _, path = file_path.partition("/")
                if bucket and path:
                    sb.storage.from_(bucket).remove([path])
            except Exception as storage_err:
                print("resume storage cleanup error:", storage_err)

        # AUDIT (permanent) — shows in the bell's Activity tab. The applicant row
        # was just deleted above, so pass applicant_id=None: otherwise the FK
        # (Audit_Logs -> Applicants) rejects the insert and the entry silently
        # never appears. The applicant's name is preserved in the message text.
        log_audit(company_id=company_id, action_type="INTERVIEW_REMOVED",
                  message=f"{get_user_fullname(user_id)} cancelled the interview for {appl_name}" + (f" — reason: {reason}" if reason else ""),
                  performed_by_user_id=user_id, applicant_id=None, requirement_id=req_id)

        return JsonResponse({"message": "Interview removed"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def heartbeat(request):
    """Presence ping — bumps the caller's updated_at so they read as online.
    The frontend calls this on an interval while the app is open."""
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")
        if user_id:
            u = HRUser.objects.filter(user_id=user_id).first()
            if u:
                u.save(update_fields=["updated_at"])  # auto_now bumps the timestamp
        return JsonResponse({"ok": True})
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_employers(request):
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")
        role       = payload.get("role")

        if role not in ["owner", "HRManager"]:
            return JsonResponse({"error": "Forbidden"}, status=403)

        users = HRUser.objects.filter(company_id=company_id)

        STALE_SECONDS = 90
        now = datetime.datetime.now(datetime.timezone.utc)

        data = []
        for u in users:
            role_name = ""
            try:
                role_obj  = Roles.objects.get(role_id=u.role_id)
                role_name = role_obj.role_name
            except Roles.DoesNotExist:
                pass

            status = u.account_status or "pending"
            if status in ("active", "on_break", "on_leave"):
                ua = u.updated_at
                if ua:
                    if ua.tzinfo is None:
                        ua = ua.replace(tzinfo=datetime.timezone.utc)
                    if (now - ua).total_seconds() > STALE_SECONDS:
                        status = "offline"

            data.append({
                "id":              str(u.user_id),
                "name":            f"{u.firstname or ''} {u.lastname or ''}".strip() or u.username or "No Name",
                "email":           u.email or "",
                "bio":             u.bio or "",
                "profile_picture": u.profile_picture or "",
                "account_status":  status,
                "role_name":       role_name,
            })

        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def approve_reject_account(request):
    try:
        payload     = decode_token(request)
        role        = payload.get("role")
        reviewer_id = payload.get("user_id")

        if role not in ["owner", "HRManager"]:
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        user_id    = data.get("user_id", "").strip()
        new_status = data.get("status", "").strip()

        if new_status not in ["active", "rejected"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        user = HRUser.objects.get(user_id=user_id)
        target_company = user.company_id
        target_name    = f"{user.firstname or ''} {user.lastname or ''}".strip() or user.username or "an employee"
        actor          = get_user_fullname(reviewer_id)

        try:
            emp_request = EmployerAccountRequest.objects.get(
                requested_user_id=user_id,
                request_status="pending"
            )
            emp_request.request_status      = new_status
            emp_request.reviewed_by_user_id = reviewer_id
            emp_request.reviewed_at         = datetime.datetime.utcnow()
            emp_request.save()
        except EmployerAccountRequest.DoesNotExist:
            pass

        if new_status == "rejected":
            user.delete()
            log_audit(company_id=target_company, action_type="EMPLOYER_REJECTED",
                      message=f"{actor} rejected the employer account for {target_name}",
                      performed_by_user_id=reviewer_id)
            return JsonResponse({"message": "Account rejected and deleted"})

        user.account_status = new_status
        user.save()

        log_audit(company_id=target_company, action_type="EMPLOYER_APPROVED",
                  message=f"{actor} approved the employer account for {target_name}",
                  performed_by_user_id=reviewer_id)

        try:
            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_user_id=user.user_id,
                notification_type="welcome",
                title="Welcome to H!RE! \U0001F389",
                message=f"Hi {user.firstname or user.username}, your account has been approved. Welcome to the team!",
                is_read=False,
            )
        except Exception as notif_err:
            print("Notification error:", notif_err)

        return JsonResponse({"message": f"Account {new_status}", "status": new_status})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def change_role(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role not in ["owner", "HRManager"]:
            return JsonResponse({"error": "Only owners and managers can change roles"}, status=403)

        data      = json.loads(request.body)
        user_id   = data.get("user_id", "").strip()
        role_name = data.get("role_name", "").strip()

        if role_name not in ["HRStaff", "HRManager"]:
            return JsonResponse({"error": "Invalid role"}, status=400)

        role_obj      = Roles.objects.get(role_name=role_name)
        user          = HRUser.objects.get(user_id=user_id)
        user.role_id  = role_obj.role_id
        user.save()

        display_role = "HR Manager" if role_name == "HRManager" else "HR Staff"
        actor        = get_user_fullname(payload.get("user_id"))
        target_name  = f"{user.firstname or ''} {user.lastname or ''}".strip() or user.username or "an employee"

        notify_user(user.user_id, "role_change", "Your Role Was Changed",
                    f"Your role was changed to {display_role} by {actor}.")

        log_audit(company_id=user.company_id, action_type="ROLE_CHANGED",
                  message=f"{actor} changed {target_name}'s role to {display_role}",
                  performed_by_user_id=payload.get("user_id"))

        return JsonResponse({"message": f"Role changed to {role_name}"})

    except Roles.DoesNotExist:
        return JsonResponse({"error": "Role not found"}, status=404)
    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def get_user_fullname(user_id):
    """Helper to get full name from user_id, returns 'Owner' if None"""
    if not user_id:
        return "Owner"
    try:
        user = HRUser.objects.get(user_id=user_id)
        name = f"{user.firstname or ''} {user.lastname or ''}".strip()
        return name or user.username or str(user_id)
    except HRUser.DoesNotExist:
        return str(user_id)

@csrf_exempt
def requirements_list(request):
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")

        if request.method == "GET":
            reqs = JobRequirement.objects.filter(
                company_id=company_id,
                is_deleted=False
            ).order_by("-date_created")

            data = [
                {
                    "id":             str(r.requirement_id),
                    "job_title":      r.job_title,
                    "description":    r.description,
                    "qualifications": r.qualifications,
                    "status":         r.current_status,
                    "date_created":   r.date_created.strftime("%m/%d/%Y"),
                    "created_by":     get_user_fullname(r.created_by_user_id),
                    "modified_by":    get_user_fullname(r.modified_by_user_id) if r.modified_by_user_id else None,
                    "date_modified":  r.date_updated.strftime("%m/%d/%Y") if (r.modified_by_user_id and r.date_updated) else None,
                    "pending_changes": r.pending_changes,
                }
                for r in reqs
            ]
            return JsonResponse(data, safe=False)

        if request.method == "POST":
            data           = json.loads(request.body)
            job_title      = data.get("job_title", "").strip()
            description    = data.get("description", "").strip()
            qualifications = data.get("qualifications", "").strip()
            user_id        = payload.get("user_id")
            role           = payload.get("role")

            if not all([job_title, description, qualifications]):
                return JsonResponse({"error": "All fields are required"}, status=400)

            feats = plan_features(get_company_plan(company_id))
            if feats["job_posts"] is not None:
                active_posts = JobRequirement.objects.filter(company_id=company_id, is_deleted=False).count()
                if active_posts >= feats["job_posts"]:
                    return JsonResponse(
                        {"error": f"Your plan allows up to {feats['job_posts']} active job posts. "
                                  f"Delete one or upgrade your plan to add more."},
                        status=403,
                    )

            req = JobRequirement.objects.create(
            requirement_id     = uuid.uuid4(),
            company_id         = company_id,
            created_by_user_id = user_id or None,
            job_title          = job_title,
            description        = description,
            qualifications     = qualifications,
            current_status     = "pending",
            is_deleted         = False,
        )

        try:
            managers = HRUser.objects.filter(
                company_id=company_id,
                role_id__in=Roles.objects.filter(
                    role_name__in=["HRManager"]
                ).values_list("role_id", flat=True)
            )
            for mgr in managers:
                Notification.objects.create(
                    notification_id=uuid.uuid4(),
                    recipient_user_id=mgr.user_id,
                    notification_type="new_requirement",
                    title="New Job Requirement",
                    message=f"{get_user_fullname(user_id)} created a new requirement for '{job_title}', waiting for approval.",
                    is_read=False,
                )

            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_company_id=company_id,
                notification_type="new_requirement",
                title="New Job Requirement",
                message=f"{get_user_fullname(user_id)} created a new requirement for '{job_title}', waiting for approval.",
                is_read=False,
            )
        except Exception as notif_err:
            print("Notification error:", notif_err)

        return JsonResponse({
                "id":             str(req.requirement_id),
                "job_title":      req.job_title,
                "description":    req.description,
                "qualifications": req.qualifications,
                "status":         req.current_status,
                "date_created":   req.date_created.strftime("%m/%d/%Y"),
                "date_updated":   req.date_updated.strftime("%m/%d/%Y") if req.date_updated else None,
                "created_by":     get_user_fullname(user_id),
                "modified_by":    None,
                "pending_changes": None,
            }, status=201)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def requirement_detail(request, req_id):
    try:
        payload = decode_token(request)
        role    = payload.get("role")
        user_id = payload.get("user_id")

        req = JobRequirement.objects.get(requirement_id=req_id, is_deleted=False)

        if request.method == "PATCH":
            if role not in ["HRManager", "owner"]:
                return JsonResponse({"error": "Forbidden"}, status=403)

            data          = json.loads(request.body)
            action_status = data.get("status", "").strip()

            if action_status not in ["approved", "rejected"]:
                return JsonResponse({"error": "Invalid status"}, status=400)
            
            if action_status in ["approved", "rejected"] and role not in ["HRManager", "owner"]:
                return JsonResponse({"error": "Forbidden"}, status=403)

            was_modification = bool(req.pending_changes)

            if action_status == "approved" and req.pending_changes:
                req.job_title      = req.pending_changes.get("job_title", req.job_title)
                req.description    = req.pending_changes.get("description", req.description)
                req.qualifications = req.pending_changes.get("qualifications", req.qualifications)
                req.pending_changes = None

            req.current_status = action_status
            req.save()

            company_id_from_token = payload.get("company_id")

            ApprovalRequirement.objects.create(
                ap_requirement_id=uuid.uuid4(),
                requirement_id=req.requirement_id,
                reviewed_by_user_id=user_id if role != "owner" else None,
                reviewed_by_company_id=company_id_from_token if role == "owner" else None,
                action_status=action_status,
            )

            try:
                if req.created_by_user_id:
                    notif = Notification.objects.create(
                        notification_id=uuid.uuid4(),
                        recipient_user_id=req.created_by_user_id,
                        notification_type="requirement_approval",
                        title=(f"Requirement Modification {action_status.capitalize()}"
                               if was_modification else
                               f"Job Requirement {action_status.capitalize()}"),
                        message=(f"Your modification to '{req.job_title}' has been {action_status}."
                                 if was_modification else
                                 f"Your requirement for '{req.job_title}' has been {action_status}."),
                        is_read=False,
                    )
                    ApprovalNotification.objects.create(
                        ap_notification_id=uuid.uuid4(),
                        requirement_id=req.requirement_id,
                        notification_id=notif.notification_id,
                        action_status=action_status,
                    )
            except Exception as notif_err:
                print("Notification error:", notif_err)

            if was_modification:
                audit_action  = f"REQUIREMENT_MODIFICATION_{action_status.upper()}"
                audit_message = f"{get_user_fullname(user_id)} {action_status} the modification of requirement '{req.job_title}'"
            else:
                audit_action  = f"REQUIREMENT_{action_status.upper()}"
                audit_message = f"{get_user_fullname(user_id)} {action_status} the requirement '{req.job_title}'"
            log_audit(company_id=company_id_from_token,
                      action_type=audit_action,
                      message=audit_message,
                      performed_by_user_id=user_id,
                      requirement_id=req.requirement_id)

            return JsonResponse({
                "id":     str(req.requirement_id),
                "status": req.current_status,
            })

        if request.method == "PUT":
            data           = json.loads(request.body)
            new_job_title  = data.get("job_title", req.job_title).strip()
            new_desc       = data.get("description", req.description).strip()
            new_quals      = data.get("qualifications", req.qualifications).strip()

            if role in ["HRManager", "owner"]:
                req.job_title      = new_job_title
                req.description    = new_desc
                req.qualifications = new_quals
                req.modified_by_user_id = user_id
                req.pending_changes     = None
                req.save()
                log_audit(company_id=payload.get("company_id"),
                          action_type="REQUIREMENT_MODIFIED",
                          message=f"{get_user_fullname(user_id)} modified the requirement '{req.job_title}'",
                          performed_by_user_id=user_id, requirement_id=req.requirement_id)
                return JsonResponse({
                    "id":             str(req.requirement_id),
                    "job_title":      req.job_title,
                    "description":    req.description,
                    "qualifications": req.qualifications,
                    "status":         req.current_status,
                    "modified_by":    get_user_fullname(user_id),
                    "pending_changes": None,
                })

            elif role == "HRStaff":
                req.pending_changes     = {
                    "job_title":      new_job_title,
                    "description":    new_desc,
                    "qualifications": new_quals,
                }
                req.modified_by_user_id = user_id
                req.current_status      = "changes_pending"
                req.save()

                try:
                    asker   = get_user_fullname(user_id)
                    pc_msg  = f"{asker} proposed changes to '{req.job_title}'."
                    # Managers (per-user).
                    managers = HRUser.objects.filter(
                        company_id=payload.get("company_id"),
                        role_id__in=Roles.objects.filter(
                            role_name__in=["HRManager"]
                        ).values_list("role_id", flat=True)
                    )
                    for mgr in managers:
                        Notification.objects.create(
                            notification_id=uuid.uuid4(),
                            recipient_user_id=mgr.user_id,
                            notification_type="changes_pending",
                            title="Requirement Edit Pending Approval",
                            message=pc_msg,
                            is_read=False,
                        )
                    notify_company(
                        payload.get("company_id"),
                        "changes_pending",
                        "Requirement Edit Pending Approval",
                        pc_msg,
                    )
                except Exception as notif_err:
                    print("Notification error:", notif_err)

                return JsonResponse({
                    "id":              str(req.requirement_id),
                    "job_title":       req.job_title,
                    "description":     req.description,
                    "qualifications":  req.qualifications,
                    "status":          req.current_status,
                    "modified_by":     get_user_fullname(user_id),
                    "pending_changes": req.pending_changes,
                })
            else:
                return JsonResponse({"error": "Forbidden"}, status=403)

        if request.method == "DELETE":
            if role == "HRStaff":
                return JsonResponse({"error": "Forbidden"}, status=403)
            deleted_title = req.job_title
            company_id_from_token = payload.get("company_id")
            actor = get_user_fullname(user_id)
            ApprovalRequirement.objects.filter(requirement_id=req.requirement_id).delete()
            AuditLog.objects.filter(requirement_id=req.requirement_id).update(requirement_id=None)
            req.delete()

            log_audit(company_id=company_id_from_token,
                      action_type="REQUIREMENT_DELETED",
                      message=f"{actor} deleted the requirement '{deleted_title}'",
                      performed_by_user_id=user_id)

            return JsonResponse({"message": "Deleted"})

    except JobRequirement.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_bio(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")
        data    = json.loads(request.body)
        bio     = data.get("bio", "").strip()[:500]

        user     = HRUser.objects.get(user_id=user_id)
        user.bio = bio
        user.save()

        return JsonResponse({"message": "Bio updated"})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_hr_profile(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")

        user = HRUser.objects.get(user_id=user_id)

        return JsonResponse({
            "firstname":       user.firstname or "",
            "lastname":        user.lastname or "",
            "username":        user.username or "",
            "email":           user.email or "",
            "birthdate":       str(user.birthdate) if user.birthdate else "",
            "bio":             user.bio or "",
            "profile_picture": user.profile_picture or "",
            "account_status":  user.account_status or "",
        })

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_owner_profile(request):
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")

        company = Company.objects.get(company_id=company_id)

        return JsonResponse({
            "company_name":         company.company_name or "",
            "owner_email":          company.owner_email or "",
            "subscription_plan":    company.subscription_plan or "",
            "subscription_expiry":  company.subscription_expiry.strftime("%b %d, %Y") if company.subscription_expiry else "",
            "logo":                 company.company_logo or "",
            "description":          company.company_description or "",
        })

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_hr_status(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")

        data   = json.loads(request.body)
        status = data.get("status", "").strip()

        if status not in ["active", "on_break", "on_leave", "offline"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        user = HRUser.objects.get(user_id=user_id)
        user.account_status = status
        user.save()

        return JsonResponse({"message": "Status updated", "status": status})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_profile_picture(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")

        data            = json.loads(request.body)
        profile_picture = data.get("profile_picture", "").strip()

        if not profile_picture:
            return JsonResponse({"error": "No image URL provided"}, status=400)

        user = HRUser.objects.get(user_id=user_id)
        user.profile_picture = profile_picture
        user.save()

        return JsonResponse({"message": "Profile picture updated", "profile_picture": profile_picture})

    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_company_logo(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can update the company logo"}, status=403)

        data = json.loads(request.body)
        logo = data.get("logo", "").strip()

        if not logo:
            return JsonResponse({"error": "No logo URL provided"}, status=400)

        company = Company.objects.get(company_id=company_id)
        company.company_logo = logo
        company.save()

        return JsonResponse({"message": "Company logo updated", "logo": logo})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def update_company_name(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can update the company name"}, status=403)

        data         = json.loads(request.body)
        company_name = data.get("company_name", "").strip()

        if not company_name:
            return JsonResponse({"error": "Company name cannot be empty"}, status=400)

        if Company.objects.filter(company_name__iexact=company_name).exclude(company_id=company_id).exists():
            return JsonResponse({"error": "A company with this name already exists"}, status=400)

        company = Company.objects.get(company_id=company_id)
        company.company_name = company_name
        company.save()

        return JsonResponse({"message": "Company name updated", "company_name": company_name})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def update_company_password(request):
    """Updates the staff password (the one HR staff use to log in via find-company)."""
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can update the company password"}, status=403)

        data             = json.loads(request.body)
        current_password = data.get("current_password", "").strip()
        new_password     = data.get("new_password", "").strip()

        if not current_password or not new_password:
            return JsonResponse({"error": "Both current and new passwords are required"}, status=400)

        if len(new_password) < 8:
            return JsonResponse({"error": "Password must be at least 8 characters"}, status=400)

        company = Company.objects.get(company_id=company_id)

        try:
            ph.verify(company.staff_password, current_password)
        except argon2.exceptions.VerifyMismatchError:
            return JsonResponse({"error": "Wrong Password"}, status=400)

        company.staff_password = ph.hash(new_password)
        company.save()

        return JsonResponse({"message": "Company password updated successfully"})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def update_company_description(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can update the company description"}, status=403)

        data        = json.loads(request.body)
        description = data.get("description", "").strip()[:1500]

        company = Company.objects.get(company_id=company_id)
        company.company_description = description
        company.save()
        return JsonResponse({"message": "Company description updated", "description": description})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def renew_subscription(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can renew the subscription"}, status=403)

        data     = json.loads(request.body)
        new_plan = data.get("plan", "").strip()

        if new_plan not in ["free", "standard", "enterprise"]:
            return JsonResponse({"error": "Invalid plan"}, status=400)

        company = Company.objects.get(company_id=company_id)

        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        is_same_plan = (new_plan == company.subscription_plan)

        if is_same_plan:
            base_date = company.subscription_expiry if (company.subscription_expiry and company.subscription_expiry > now) else now
        else:
            base_date = now

        new_expiry = base_date + datetime.timedelta(days=30)

        company.subscription_plan   = new_plan
        company.subscription_start  = now
        company.subscription_expiry = new_expiry
        company.save()

        return JsonResponse({
            "message":             "Subscription updated successfully",
            "subscription_plan":   company.subscription_plan,
            "subscription_expiry": company.subscription_expiry.strftime("%b %d, %Y"),
            "was_renewal":         is_same_plan,
        })

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def request_plan_change(request):
    """Owner REQUESTS a plan change; an admin approves/rejects it (owner can't change directly).
    Stored as a Notification row (type 'plan_change_request') since the schema is frozen."""
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can request a plan change"}, status=403)

        data     = json.loads(request.body)
        new_plan = data.get("plan", "").strip().lower()
        if new_plan not in ["free", "standard", "enterprise"]:
            return JsonResponse({"error": "Invalid plan"}, status=400)

        company = Company.objects.get(company_id=company_id)

        Notification.objects.filter(
            recipient_company_id=company_id,
            notification_type="plan_change_request",
        ).delete()

        Notification.objects.create(
            notification_id=uuid.uuid4(),
            recipient_company_id=company_id,
            notification_type="plan_change_request",
            title="Plan Change Request",
            message=new_plan,
            is_read=False,
        )

        try:
            from .models import Admin
            admin_emails = [a.admin_email for a in Admin.objects.all() if a.admin_email]
            if admin_emails:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/admin-plan-change",
                    json={
                        "admin_emails":   ",".join(admin_emails),
                        "company_name":   company.company_name,
                        "current_plan":   company.subscription_plan or "free",
                        "requested_plan": new_plan,
                    },
                    timeout=5,
                )
        except Exception as n8n_err:
            print("admin plan-change email error:", n8n_err)

        return JsonResponse({"message": "Plan change requested", "requested_plan": new_plan})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def admin_get_pending_plans(request):
    """Pending plan-change requests for the admin dashboard."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        reqs = Notification.objects.filter(
            notification_type="plan_change_request"
        ).order_by("-created_at")

        data = []
        for n in reqs:
            company = Company.objects.filter(company_id=n.recipient_company_id).first()
            if not company:
                continue
            data.append({
                "id":             str(n.notification_id),
                "company_id":     str(n.recipient_company_id),
                "company_name":   company.company_name or "",
                "company_logo":   company.company_logo or "",
                "current_plan":   company.subscription_plan or "free",
                "requested_plan": n.message or "",
                "requested_at":   n.created_at.strftime("%m/%d/%Y"),
            })
        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def admin_approve_reject_plan(request):
    """Admin approves or rejects a plan-change request (the approval IS the change)."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        notif_id   = data.get("id", "").strip()
        new_status = data.get("status", "").strip()
        if new_status not in ["approved", "rejected"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        req = Notification.objects.get(notification_id=notif_id, notification_type="plan_change_request")
        company_id     = req.recipient_company_id
        requested_plan = (req.message or "").strip().lower()
        company        = Company.objects.get(company_id=company_id)

        if new_status == "approved" and requested_plan in ["free", "standard", "enterprise"]:
            now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
            company.subscription_plan   = requested_plan
            company.subscription_start  = now
            company.subscription_expiry = now + datetime.timedelta(days=30)
            company.save()
            log_payment(company_id, requested_plan, note="Plan change approved")
            title = "Plan Change Approved"
            msg   = f"Your subscription plan change to '{requested_plan}' has been approved."
        else:
            title = "Plan Change Declined"
            msg   = f"Your subscription plan change to '{requested_plan}' was declined by the admin."

        try:
            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_company_id=company_id,
                notification_type="plan_change_result",
                title=title,
                message=msg,
                is_read=False,
            )
        except Exception as notif_err:
            print("plan change result notification error:", notif_err)

        log_audit(company_id=company_id,
                  action_type=f"PLAN_{new_status.upper()}",
                  message=f"The H!RE admin {new_status} the subscription plan change to '{requested_plan}'.")

        req.delete()
        return JsonResponse({"message": f"Plan change {new_status}", "status": new_status})

    except Notification.DoesNotExist:
        return JsonResponse({"error": "Request not found"}, status=404)
    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def admin_set_subscription(request):
    """Admin directly sets any company's subscription plan. Start resets to now
    and the term is always one month."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        company_id = (data.get("company_id") or "").strip()
        new_plan   = (data.get("plan") or "").strip().lower()
        expiry_str = (data.get("expiry") or "").strip()
        if new_plan not in ["free", "standard", "enterprise"]:
            return JsonResponse({"error": "Invalid plan"}, status=400)

        company = Company.objects.get(company_id=company_id)
        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

        if new_plan == "free":
            new_expiry = None            # free tier has no expiry
        elif expiry_str:
            try:
                exp_date = datetime.datetime.strptime(expiry_str, "%Y-%m-%d")
                new_expiry = exp_date.replace(hour=23, minute=59, second=59,
                                              tzinfo=datetime.timezone.utc)
            except ValueError:
                return JsonResponse({"error": "Invalid expiry date"}, status=400)
        else:
            new_expiry = now + datetime.timedelta(days=30)

        company.subscription_plan   = new_plan
        company.subscription_start  = now
        company.subscription_expiry = new_expiry
        company.save()
        log_payment(company_id, new_plan, note="Set by H!RE admin")

        try:
            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_company_id=company_id,
                notification_type="plan_change_result",
                title="Plan Updated",
                message=f"Your subscription plan was set to '{new_plan}' by the H!RE admin.",
                is_read=False,
            )
        except Exception as notif_err:
            print("admin set subscription notification error:", notif_err)

        log_audit(company_id=company_id, action_type="PLAN_SET",
                  message=f"The H!RE admin set the subscription plan to '{new_plan}'.")

        return JsonResponse({
            "message":             "Subscription updated",
            "subscription_plan":   new_plan,
            "subscription_start":  company.subscription_start.strftime("%b %d, %Y"),
            "subscription_expiry": company.subscription_expiry.strftime("%b %d, %Y"),
        })

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_company(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        company_id = payload.get("company_id")

        if role != "owner":
            return JsonResponse({"error": "Only owners can delete the company"}, status=403)

        if request.method != "DELETE":
            return JsonResponse({"error": "Method not allowed"}, status=405)

        company = Company.objects.get(company_id=company_id)

        try:
            from supabase import create_client
            from django.conf import settings
            sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

            folder = company.storage_folder or str(company.company_id)
            files  = sb.storage.from_("company-documents").list(folder)
            if files:
                paths = [f"{folder}/{f['name']}" for f in files]
                sb.storage.from_("company-documents").remove(paths)
        except Exception as storage_err:
            print("Storage cleanup error:", storage_err)

        Document.objects.filter(company_id=company_id).delete()
        Notification.objects.filter(recipient_company_id=company_id).delete()

        HRUser.objects.filter(company_id=company_id).delete()
        ApprovalCompany.objects.filter(subscribing_company_id=company_id).delete()
        EmployerAccountRequest.objects.filter(company_id=company_id).delete()
        JobRequirement.objects.filter(company_id=company_id).delete()

        company.delete()

        return JsonResponse({"message": "Company deleted successfully"})

    except Company.DoesNotExist:
        return JsonResponse({"error": "Company not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def get_notifications(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        user_id    = payload.get("user_id")
        company_id = payload.get("company_id")

        if role == "owner":
            notifs = Notification.objects.filter(
                recipient_company_id=company_id
            ).exclude(
                notification_type__in=["plan_change_request", "auto_reject_threshold"]
            ).order_by("-created_at")[:20]
        else:
            if not user_id:
                return JsonResponse([], safe=False)
            notifs = Notification.objects.filter(
                recipient_user_id=user_id
            ).order_by("-created_at")[:20]

        data = [
            {
                "id":       str(n.notification_id),
                "type":     n.notification_type,
                "title":    n.title,
                "message":  n.message,
                "is_read":  n.is_read,
                "created_at": fmt_ph(n.created_at),
            }
            for n in notifs
        ]
        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def mark_notifications_read(request):
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        user_id    = payload.get("user_id")
        company_id = payload.get("company_id")

        if role == "owner":
            Notification.objects.filter(
                recipient_company_id=company_id,
                is_read=False
            ).update(is_read=True)
        else:
            Notification.objects.filter(
                recipient_user_id=user_id,
                is_read=False
            ).update(is_read=True)

        return JsonResponse({"message": "Notifications marked as read"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

INTERNAL_NOTIF_TYPES = ["plan_change_request", "auto_reject_threshold"]

@csrf_exempt
@require_POST
def clear_notifications(request):
    """Clear (delete) the caller's notifications. Audit logs are NOT touched —
    they live in a separate, permanent table."""
    try:
        payload    = decode_token(request)
        role       = payload.get("role")
        user_id    = payload.get("user_id")
        company_id = payload.get("company_id")

        if role == "owner":
            Notification.objects.filter(recipient_company_id=company_id).exclude(
                notification_type__in=INTERNAL_NOTIF_TYPES).delete()
        else:
            Notification.objects.filter(recipient_user_id=user_id).exclude(
                notification_type__in=INTERNAL_NOTIF_TYPES).delete()

        return JsonResponse({"message": "Notifications cleared"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_audit_logs(request):
    """Permanent, company-scoped audit trail for the navbar 'Activity' tab.
    Scoped by the '[c:<company_id>]' marker stored in action_details."""
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")
        if not company_id:
            return JsonResponse([], safe=False)

        marker = f"[c:{company_id}]"
        logs = AuditLog.objects.filter(
            action_details__startswith=marker
        ).order_by("-created_at")[:50]

        data = [
            {
                "id":           str(lg.audit_log_id),
                "action_type":  lg.action_type,
                "details":      (lg.action_details or "").replace(marker, "", 1).strip(),
                "performed_by": get_user_fullname(lg.performed_by_user_id),
                "created_at":   fmt_ph(lg.created_at),
            }
            for lg in logs
        ]
        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def login_admin(request):
    try:
        data       = json.loads(request.body)
        # Single identity field: accept either the admin's email OR username.
        identifier = (data.get("identifier") or data.get("username") or data.get("email") or "").strip()
        password   = data.get("password", "").strip()

        if not identifier or not password:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        from .models import Admin
        from django.db.models import Q
        admin = Admin.objects.get(Q(admin_username=identifier) | Q(admin_email=identifier))

        # New admins (created via admin management) are argon2-hashed. Legacy seeded
        # admins may still be plaintext — fall back to a direct compare for those.
        stored = admin.admin_password or ""
        if stored.startswith("$argon2"):
            try:
                ph.verify(stored, password)
            except argon2.exceptions.VerifyMismatchError:
                return JsonResponse({"error": "Invalid credentials"}, status=401)
        elif stored != password:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        token = make_token({
            "role":     "admin",
            "admin_id": str(admin.admin_id),
            "email":    admin.admin_email,
        })

        return JsonResponse({
            "token":    token,
            "role":     "admin",
            "admin_id": str(admin.admin_id),
            "email":    admin.admin_email,
        })

    except Exception as e:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    
@csrf_exempt
def admin_get_dashboard(request):
    try:
        payload  = decode_token(request)
        role     = payload.get("role")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        now = datetime.datetime.utcnow()

        total_companies    = Company.objects.count()
        pending_approval   = ApprovalCompany.objects.filter(action_status="pending").count()
        active_subs        = Company.objects.filter(subscription_expiry__gte=now).count()
        revoked            = ApprovalCompany.objects.filter(action_status="rejected").count()

        return JsonResponse({
            "total_companies":  total_companies,
            "pending_approval": pending_approval,
            "active_subs":      active_subs,
            "revoked":          revoked,
        })

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
def admin_get_companies(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        companies = Company.objects.all().order_by("-date_created")

        data = []
        for c in companies:
            try:
                approval = ApprovalCompany.objects.get(subscribing_company_id=c.company_id)
                approval_status = approval.action_status
            except ApprovalCompany.DoesNotExist:
                approval_status = "pending"

            now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
            if c.subscription_expiry:
                days_left = (c.subscription_expiry - now).days
                if days_left < 0:
                    sub_status = "expired"
                elif days_left <= 7:
                    sub_status = "expiring"
                else:
                    sub_status = "active"
            else:
                sub_status = "unknown"

            total_employees  = HRUser.objects.filter(company_id=c.company_id).count()
            active_employees = HRUser.objects.filter(company_id=c.company_id, account_status="active").count()

            data.append({
                "id":                 str(c.company_id),
                "company_name":       c.company_name or "",
                "owner_email":        c.owner_email or "",
                "subscription_plan":  c.subscription_plan or "",
                "subscription_start": c.subscription_start.strftime("%b %d, %Y") if c.subscription_start else "",
                "subscription_expiry": c.subscription_expiry.strftime("%b %d, %Y") if c.subscription_expiry else "",
                "company_logo":       c.company_logo or "",
                "approval_status":    approval_status,
                "subscription_status": sub_status,
                "date_created":       c.date_created.strftime("%m/%d/%Y"),
                "total_employees":    total_employees,
                "active_employees":   active_employees,
            })

        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def admin_get_pending_companies(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        pending = ApprovalCompany.objects.filter(action_status="pending")

        data = []
        for p in pending:
            try:
                company = Company.objects.get(company_id=p.subscribing_company_id)
                data.append({
                    "ap_id":         str(p.ap_companies_id),
                    "id":            str(company.company_id),
                    "company_name":  company.company_name or "",
                    "owner_email":   company.owner_email or "",
                    "company_logo":  company.company_logo or "",
                    "plan":          company.subscription_plan or "",
                    "date_created":  company.date_created.strftime("%m/%d/%Y"),
                })
            except Company.DoesNotExist:
                pass

        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def _purge_company(company_id):
    """Hard-delete a company and everything attached to it (Storage files + all
    related rows). Used by both an admin *reject* (declining a pending
    registration) and an admin *delete*. Storage cleanup is best-effort."""
    try:
        from supabase import create_client
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        folder = str(company_id)
        files  = sb.storage.from_("company-documents").list(folder)
        if files:
            paths = [f"{folder}/{f['name']}" for f in files]
            sb.storage.from_("company-documents").remove(paths)
    except Exception as storage_err:
        print("Storage cleanup error:", storage_err)

    Document.objects.filter(company_id=company_id).delete()
    Notification.objects.filter(recipient_company_id=company_id).delete()
    HRUser.objects.filter(company_id=company_id).delete()
    ApprovalCompany.objects.filter(subscribing_company_id=company_id).delete()
    EmployerAccountRequest.objects.filter(company_id=company_id).delete()
    JobRequirement.objects.filter(company_id=company_id).delete()
    Company.objects.filter(company_id=company_id).delete()

@csrf_exempt
@require_POST
def admin_approve_reject_company(request):
    try:
        payload  = decode_token(request)
        role     = payload.get("role")
        admin_id = payload.get("admin_id")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        ap_id      = data.get("ap_id", "").strip()
        new_status = data.get("status", "").strip()

        if new_status not in ["approved", "rejected"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        approval   = ApprovalCompany.objects.get(ap_companies_id=ap_id)
        company_id = approval.subscribing_company_id
        company    = Company.objects.filter(company_id=company_id).first()

        try:
            if company:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/company-approval",
                    json={
                        "email":        company.owner_email,
                        "company_name": company.company_name,
                        "status":       new_status,
                    },
                    timeout=5,
                )
        except Exception as n8n_err:
            print("company approval email error:", n8n_err)

        if new_status == "rejected":
            _purge_company(company_id)
            return JsonResponse({"message": "Company rejected and removed", "status": "rejected"})

        approval.action_status        = "approved"
        approval.reviewed_by_admin_id = admin_id
        approval.time_of_action       = datetime.datetime.utcnow()
        approval.save()

        log_audit(company_id=company_id, action_type="COMPANY_APPROVED",
                  message="The H!RE admin approved this company's registration.")

        return JsonResponse({"message": "Company approved", "status": "approved"})

    except ApprovalCompany.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def admin_revoke_company(request):
    try:
        payload  = decode_token(request)
        role     = payload.get("role")
        admin_id = payload.get("admin_id")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        company_id = (data.get("company_id") or "").strip()
        reason     = (data.get("reason") or "").strip()

        if not reason:
            return JsonResponse({"error": "A reason for revoking is required."}, status=400)

        company = Company.objects.get(company_id=company_id)
        company.subscription_plan = "free"
        company.save()

        approval = ApprovalCompany.objects.get(subscribing_company_id=company_id)
        approval.action_status        = "rejected"
        approval.reviewed_by_admin_id = admin_id
        approval.time_of_action       = datetime.datetime.utcnow()
        approval.save()

        # Permanent record of the revocation + its reason (Audit_Logs).
        try:
            log_audit(
                company_id=company_id,
                action_type="COMPANY_REVOKED",
                message=f"The H!RE admin revoked {company.company_name} — reason: {reason}",
            )
        except Exception as audit_err:
            print("revoke audit error:", audit_err)

        try:
            if company.owner_email:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/company-status",
                    json={"email": company.owner_email, "name": company.company_name, "status": "revoked", "reason": reason},
                    timeout=5,
                )
        except Exception as n8n_err:
            print("company revoked email error:", n8n_err)

        return JsonResponse({"message": "Company revoked and downgraded to free tier", "subscription_plan": "free"})

    except (Company.DoesNotExist, ApprovalCompany.DoesNotExist):
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_company_documents(request, company_id):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        docs = Document.objects.filter(company_id=company_id)

        data = [
            {
                "id":            str(d.document_id),
                "document_name": d.document_name,
                "document_type": d.document_type,
                "document_url":  d.document_url,
            }
            for d in docs
        ]
        return JsonResponse(data, safe=False)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
@require_POST
def admin_restore_company(request):
    try:
        payload  = decode_token(request)
        role     = payload.get("role")
        admin_id = payload.get("admin_id")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        company_id = data.get("company_id", "").strip()

        approval = ApprovalCompany.objects.get(subscribing_company_id=company_id)
        approval.action_status        = "approved"
        approval.reviewed_by_admin_id = admin_id
        approval.time_of_action       = datetime.datetime.utcnow()
        approval.save()

        try:
            company = Company.objects.filter(company_id=company_id).first()
            if company and company.owner_email:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/company-status",
                    json={"email": company.owner_email, "name": company.company_name, "status": "restored"},
                    timeout=5,
                )
        except Exception as n8n_err:
            print("company restored email error:", n8n_err)

        return JsonResponse({"message": "Company restored"})

    except ApprovalCompany.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def admin_delete_company(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)

        data       = json.loads(request.body)
        company_id = (data.get("company_id") or "").strip()

        company = Company.objects.filter(company_id=company_id).first()
        if not company:
            return JsonResponse({"error": "Company not found"}, status=404)

        del_email = company.owner_email
        del_name  = company.company_name

        _purge_company(company_id)

        try:
            if del_email:
                requests.post(
                    f"{settings.N8N_BASE_URL}/webhook/company-status",
                    json={"email": del_email, "name": del_name, "status": "deleted"},
                    timeout=5,
                )
        except Exception as n8n_err:
            print("company deleted email error:", n8n_err)

        return JsonResponse({"message": "Company permanently deleted"})
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ---------------------------------------------------------------------------
# Revision #4 — metrics & measurable outcomes (Specific Objectives)
# ---------------------------------------------------------------------------

def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _metrics_from_rows(rows):
    """Compute funnel + efficiency metrics from a list of Evaluations rows."""
    rows = [r for r in rows if r.get("application_status") != "removed"]
    total = len(rows)
    by_status = {"pending": 0, "shortlisted": 0, "interview_sent": 0, "hired": 0, "rejected": 0}
    bands = {"strong": 0, "good": 0, "fair": 0, "weak": 0}
    tts, ttf, scores = [], [], []
    for r in rows:
        st = r.get("application_status") or "pending"
        if st in by_status:
            by_status[st] += 1
        hs = r.get("hire_score")
        if hs is not None:
            try:
                hs = float(hs)
                scores.append(hs)
                if   hs >= 80: bands["strong"] += 1
                elif hs >= 60: bands["good"]   += 1
                elif hs >= 45: bands["fair"]   += 1
                else:          bands["weak"]   += 1
            except (ValueError, TypeError):
                pass
        c = _parse_dt(r.get("created_at"))
        s = _parse_dt(r.get("shortlisted_at"))
        h = _parse_dt(r.get("hired_at"))
        if c and s and s >= c: tts.append((s - c).total_seconds() / 3600)
        if c and h and h >= c: ttf.append((h - c).total_seconds() / 3600)

    def avg(xs):
        return round(sum(xs) / len(xs), 1) if xs else None

    advanced = by_status["shortlisted"] + by_status["interview_sent"] + by_status["hired"]
    return {
        "total_evaluated": total,
        "by_status": by_status,
        "shortlisted_or_beyond": advanced,
        "hired": by_status["hired"],
        "shortlist_rate": round(advanced / total * 100, 1) if total else None,
        "hire_rate": round(by_status["hired"] / total * 100, 1) if total else None,
        "score_bands": bands,
        "avg_hire_score": avg(scores),
        "avg_time_to_shortlist_hours": avg(tts),
        "avg_time_to_fill_hours": avg(ttf),
        "time_to_shortlist_n": len(tts),
        "time_to_fill_n": len(ttf),
    }


# Full column set (needs the metrics_ai_logs.sql migration). Falls back to the
# always-present columns so metrics degrade (no efficiency) instead of 500ing if
# the migration hasn't been run yet.
_EVAL_FULL_COLS = "application_status, hire_score, created_at, shortlisted_at, hired_at, requirement_id"
_EVAL_MIN_COLS  = "application_status, hire_score, requirement_id"


def _eval_select(cols, req_ids=None):
    from django.conf import settings
    from supabase import create_client
    sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    q = sb.table("Evaluations").select(cols)
    if req_ids is not None:
        q = q.in_("requirement_id", req_ids)
    return q.execute().data or []


def _eval_rows(req_ids=None):
    """Fetch evaluation rows for metrics, tolerating a missing migration."""
    try:
        return _eval_select(_EVAL_FULL_COLS, req_ids)
    except Exception:
        return _eval_select(_EVAL_MIN_COLS, req_ids)


def _eval_rows_for_requirements(req_ids):
    if not req_ids:
        return []
    return _eval_rows(req_ids)


@csrf_exempt
def get_metrics(request):
    """Company-scoped hiring metrics (owner / HR Manager) — revision #4."""
    try:
        payload = decode_token(request)
        if payload.get("role") not in ("owner", "HRManager"):
            return JsonResponse({"error": "Forbidden"}, status=403)
        company_id = payload.get("company_id")
        req_ids = [str(r) for r in JobRequirement.objects.filter(
            company_id=company_id).values_list("requirement_id", flat=True)]
        data = _metrics_from_rows(_eval_rows_for_requirements(req_ids))
        data["model"] = {"name": AI_MODEL_NAME, "weights_version": AI_WEIGHTS_VERSION}
        return JsonResponse(data)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def admin_get_metrics(request):
    """Platform-wide metrics + per-company breakdown (admin) — revision #4."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)
        from collections import defaultdict
        rows = _eval_rows()
        overall = _metrics_from_rows(rows)

        reqmap  = {str(r.requirement_id): str(r.company_id) for r in JobRequirement.objects.all()}
        compmap = {str(c.company_id): c.company_name for c in Company.objects.all()}
        grouped = defaultdict(list)
        for r in rows:
            cid = reqmap.get(str(r.get("requirement_id")))
            if cid:
                grouped[cid].append(r)
        companies = []
        for cid, rs in grouped.items():
            m = _metrics_from_rows(rs)
            companies.append({"company_id": cid, "company_name": compmap.get(cid, "—"), **m})
        companies.sort(key=lambda x: -x["total_evaluated"])
        return JsonResponse({
            "overall": overall,
            "companies": companies,
            "model": {"name": AI_MODEL_NAME, "weights_version": AI_WEIGHTS_VERSION},
        })
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_payments(request):
    """Subscription payment history for the caller's company (revision #10)."""
    try:
        payload = decode_token(request)
        if payload.get("role") not in ("owner", "HRManager"):
            return JsonResponse({"error": "Forbidden"}, status=403)
        rows = SubscriptionPayment.objects.filter(
            company_id=payload.get("company_id")).order_by("-created_at")[:50]
        out = [{
            "payment_id": str(p.payment_id),
            "plan":       p.plan,
            "amount":     float(p.amount) if p.amount is not None else None,
            "status":     p.status,
            "note":       p.note,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        } for p in rows]
        return JsonResponse(out, safe=False)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def admin_get_payments(request):
    """All companies' subscription payment history (admin view)."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)
        compmap = {str(c.company_id): c.company_name for c in Company.objects.all()}
        rows = SubscriptionPayment.objects.all().order_by("-created_at")[:300]
        out = [{
            "payment_id":   str(p.payment_id),
            "company_name": compmap.get(str(p.company_id), "—"),
            "plan":         p.plan,
            "amount":       float(p.amount) if p.amount is not None else None,
            "status":       p.status,
            "note":         p.note,
            "created_at":   p.created_at.isoformat() if p.created_at else None,
        } for p in rows]
        return JsonResponse(out, safe=False)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def admin_list_admins(request):
    """List admin users (revision #12 — dynamic admin management)."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)
        from .models import Admin
        me = str(payload.get("admin_id"))
        out = [{
            "admin_id": str(a.admin_id),
            "admin_username": a.admin_username,
            "admin_email": a.admin_email,
            "is_self": str(a.admin_id) == me,
        } for a in Admin.objects.all().order_by("admin_username")]
        return JsonResponse(out, safe=False)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_POST
def admin_create_admin(request):
    """Create a new admin with an argon2-hashed password (revision #12)."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)
        from .models import Admin
        from django.db.models import Q
        data     = json.loads(request.body)
        username = (data.get("username") or "").strip()
        email    = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()
        if not username or not email or not password:
            return JsonResponse({"error": "Username, email, and password are required."}, status=400)
        if len(password) < 8:
            return JsonResponse({"error": "Password must be at least 8 characters."}, status=400)
        if Admin.objects.filter(Q(admin_username=username) | Q(admin_email=email)).exists():
            return JsonResponse({"error": "An admin with that username or email already exists."}, status=409)
        Admin.objects.create(
            admin_id=uuid.uuid4(),
            admin_username=username,
            admin_email=email,
            admin_password=ph.hash(password),
        )
        return JsonResponse({"message": "Admin added"})
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_POST
def admin_delete_admin(request):
    """Remove an admin (revision #12). Can't remove yourself or the last admin."""
    try:
        payload = decode_token(request)
        if payload.get("role") != "admin":
            return JsonResponse({"error": "Forbidden"}, status=403)
        from .models import Admin
        data   = json.loads(request.body)
        target = (data.get("admin_id") or "").strip()
        me     = str(payload.get("admin_id"))
        if target == me:
            return JsonResponse({"error": "You can't remove your own admin account."}, status=400)
        if Admin.objects.count() <= 1:
            return JsonResponse({"error": "Can't remove the last admin."}, status=400)
        Admin.objects.filter(admin_id=target).delete()
        return JsonResponse({"message": "Admin removed"})
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_ai_logs(request):
    """AI-procedure log (revision #4): model + weights version and sub-scores per
    evaluation. Admin sees all; owner / HR Manager see their own company."""
    try:
        payload = decode_token(request)
        role = payload.get("role")
        qs = AIEvaluationLog.objects.all().order_by("-created_at")
        if role == "admin":
            pass
        elif role in ("owner", "HRManager"):
            qs = qs.filter(company_id=payload.get("company_id"))
        else:
            return JsonResponse({"error": "Forbidden"}, status=403)
        out = [{
            "ai_log_id":       str(x.ai_log_id),
            "evaluation_id":   str(x.evaluation_id) if x.evaluation_id else None,
            "model_name":      x.model_name,
            "weights_version": x.weights_version,
            "semantic_score":  x.semantic_score,
            "skills_match":    x.skills_match,
            "role_relevance":  x.role_relevance,
            "impact":          x.impact,
            "soft_signals":    x.soft_signals,
            "llm_score":       x.llm_score,
            "hire_score":      x.hire_score,
            "created_at":      x.created_at.isoformat() if x.created_at else None,
        } for x in qs[:200]]
        return JsonResponse(out, safe=False)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)