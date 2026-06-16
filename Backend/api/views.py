import email

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json, datetime, jwt, requests
from django.conf import settings
import requests
from .models import Company, HRUser, Roles
import uuid
import argon2
from argon2 import PasswordHasher
from .models import JobRequirement, ApprovalRequirement, EmployerAccountRequest, Notification, ApprovalNotification

ph = PasswordHasher()

def make_token(payload: dict) -> str:
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

# LOGINS
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

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

        token = make_token({
            "role":       "owner",
            "company_id": str(company.company_id),
            "email":      email,
        })

        return JsonResponse({"token": token, "role": "owner", "company_id": str(company.company_id)})

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

        if Company.objects.filter(owner_email=email).exists():
            return JsonResponse({"error": "Email already registered"}, status=400)

        if Company.objects.filter(company_name__iexact=company_name).exists():
            return JsonResponse({"error": "Company name already exists."}, status=400)

        hashed       = ph.hash(password)
        hashed_staff = ph.hash(staff_password) if staff_password else None

        Company.objects.create(
            company_name=company_name,
            owner_email=email,
            owner_password=hashed,
            staff_password=hashed_staff,
            subscription_plan=plan,
        )

        # Notify n8n to send welcome email
        try:
            requests.post(
                "http://localhost:5678/webhook/register-confirmation",
                json={
                    "email":      email,
                    "first_name": company_name,
                    "last_name":  "",
                },
                timeout=5,
            )
        except Exception as n8n_err:
            print("n8n error:", n8n_err)

        return JsonResponse({"message": "Company registered successfully"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
@require_POST
def delete_employer(request):
    try:
        payload = decode_token(request)
        role    = payload.get("role")

        if role != "owner":
            return JsonResponse({"error": "Only owners can delete employers"}, status=403)

        data    = json.loads(request.body)
        user_id = data.get("user_id", "").strip()

        user = HRUser.objects.get(user_id=user_id)
        user.delete()

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


# HR Account
# --------------------------------------------------------------------------------------------------------------------

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

        if not all([username, email, password, company_id]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if HRUser.objects.filter(email=email, company_id=company_id).exists():
            return JsonResponse({"error": "Email already registered"}, status=400)

        role   = Roles.objects.get(role_name=role_name)
        hashed = ph.hash(password)

        user = HRUser.objects.create(
            user_id=uuid.uuid4(),
            role_id=role.role_id,
            company_id=company_id,
            username=username,
            email=email,
            password=hashed,
            account_status="pending",
        )

        # Log into Employer_Account_Requests
        EmployerAccountRequest.objects.create(
            request_id=uuid.uuid4(),
            requested_user_id=user.user_id,
            company_id=company_id,
            requested_email=email,
            request_status="pending",
        )

        # Notify n8n to send welcome email
        try:
            requests.post(
                "http://localhost:5678/webhook/register-confirmation",
                json={
                    "email":      email,
                    "first_name": username,
                    "last_name":  "",
                },
                timeout=5,
            )
        except Exception as n8n_err:
            print("n8n error:", n8n_err)

        return JsonResponse({"message": "Account created successfully"})

    except Roles.DoesNotExist:
        return JsonResponse({"error": "Invalid role"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_POST
def login_hr(request):
    try:
        data       = json.loads(request.body)
        email      = data.get("email", "").strip()
        password   = data.get("password", "").strip()
        company_id = data.get("company_id", "").strip()

        if not company_id:
            return JsonResponse({"error": "Missing company ID"}, status=400)

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
    
    
# Password Reset
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

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

        # Generate a reset token (reuse JWT, expires in 30 min)
        token = make_token({"user_id": str(user.user_id), "purpose": "password_reset"})

        reset_link = f"http://localhost:5173/hr-new-password?token={token}"

        # Notify n8n to send reset email
        try:
            requests.post(
                "http://localhost:5678/webhook/password-reset",
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
def reset_password(request):
    try:
        data      = json.loads(request.body)
        token     = data.get("token", "").strip()
        new_pass  = data.get("new_password", "").strip()

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

        if payload.get("purpose") != "password_reset":
            return JsonResponse({"error": "Invalid token"}, status=400)

        user = HRUser.objects.get(user_id=payload["user_id"])
        user.password = ph.hash(new_pass)
        user.save()

        return JsonResponse({"message": "Password reset successfully"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Reset link has expired"}, status=401)
    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    
# Applicants / AI Evaluation 
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

@csrf_exempt
@require_POST
def evaluate_resume(request):
    try:
        payload    = decode_token(request)
        user_id    = payload.get("user_id") or payload.get("company_id")
        company_id = payload.get("company_id")

        # Get the uploaded file
        resume_file    = request.FILES.get("resume")
        requirement_id = request.POST.get("requirement_id", "").strip()

        if not resume_file:
            return JsonResponse({"error": "No resume file uploaded"}, status=400)
        if not requirement_id:
            return JsonResponse({"error": "No requirement selected"}, status=400)

        # Get the job requirement from DB
        req = JobRequirement.objects.get(
            requirement_id=requirement_id,
            company_id=company_id,
            is_deleted=False
        )

        # Read file bytes
        file_bytes = resume_file.read()
        file_name  = resume_file.name
        file_type  = resume_file.content_type

        # Run AI evaluation
        from .ai_engine import evaluate_resume as run_evaluation
        result = run_evaluation(
            file_bytes         = file_bytes,
            file_name          = file_name,
            file_type          = file_type,
            requirement_id     = str(req.requirement_id),
            job_title          = req.job_title,
            description        = req.description,
            qualifications     = req.qualifications,
            uploaded_by_user_id = str(user_id),
        )

        return JsonResponse(result, status=201)

    except JobRequirement.DoesNotExist:
        return JsonResponse({"error": "Requirement not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
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

        # Get all evaluations for this company's requirements
        reqs = JobRequirement.objects.filter(
            company_id=company_id,
            is_deleted=False
        ).values_list("requirement_id", flat=True)

        req_ids = [str(r) for r in reqs]

        if not req_ids:
            return JsonResponse([], safe=False)

        # Fetch evaluations
        evals = sb.table("Evaluations").select("*").in_(
            "requirement_id", req_ids
        ).execute().data

        results = []
        for ev in evals:
            # Get resume info
            resume = sb.table("Resumes").select("*").eq(
                "resume_id", ev["resume_id"]
            ).execute().data

            # Get pros
            pros = sb.table("Evaluation_Pros").select("pros_text").eq(
                "evaluation_id", ev["evaluation_id"]
            ).execute().data

            # Get cons
            cons = sb.table("Evaluation_Cons").select("cons_text").eq(
                "evaluation_id", ev["evaluation_id"]
            ).execute().data

            # Get requirement info
            req_info = sb.table("Job_Requirements").select(
                "job_title"
            ).eq("requirement_id", ev["requirement_id"]).execute().data

            results.append({
                "evaluation_id":  ev["evaluation_id"],
                "resume_id":      ev["resume_id"],
                "hire_score":     float(ev["hire_score"]),
                "summary":        ev["ai_summary"],
                "status":         ev["applicationtion_status"],
                "pros":           [p["pros_text"] for p in pros],
                "cons":           [c["cons_text"] for c in cons],
                "file_name":      resume[0]["file_name"] if resume else "",
                "file_path":      resume[0]["file_path"] if resume else "",
                "job_title":      req_info[0]["job_title"] if req_info else "",
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

        data   = json.loads(request.body)
        status = data.get("status", "").strip()

        if status not in ["shortlisted", "rejected", "pending"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        from supabase import create_client
        from django.conf import settings
        sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        sb.table("Evaluations").update({
            "applicationtion_status": status
        }).eq("evaluation_id", str(evaluation_id)).execute()

        return JsonResponse({"message": "Status updated", "status": status})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



# Employer
# --------------------------------------------------------------------------------------------------------------------

@csrf_exempt
def get_employers(request):
    try:
        payload    = decode_token(request)
        company_id = payload.get("company_id")
        role       = payload.get("role")

        if role not in ["owner", "HRManager"]:
            return JsonResponse({"error": "Forbidden"}, status=403)

        users = HRUser.objects.filter(company_id=company_id)

        data = []
        for u in users:
            role_name = ""
            try:
                role_obj  = Roles.objects.get(role_id=u.role_id)
                role_name = role_obj.role_name
            except Roles.DoesNotExist:
                pass

            data.append({
                "id":              str(u.user_id),
                "name":            f"{u.firstname or ''} {u.lastname or ''}".strip() or u.username or "No Name",
                "email":           u.email or "",
                "bio":             u.bio or "",
                "profile_picture": u.profile_picture or "",
                "account_status":  u.account_status or "pending",
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

        # Update Employer_Account_Requests
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
            return JsonResponse({"message": "Account rejected and deleted"})

        user.account_status = new_status
        user.save()

        try:
            Notification.objects.create(
                notification_id=uuid.uuid4(),
                recipient_user_id=user.user_id,
                notification_type="welcome",
                title="Welcome to H!RE! 🎉",
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

        if role != "owner":
            return JsonResponse({"error": "Only owners can change roles"}, status=403)

        data      = json.loads(request.body)
        user_id   = data.get("user_id", "").strip()
        role_name = data.get("role_name", "").strip()

        if role_name not in ["HRStaff", "HRManager"]:
            return JsonResponse({"error": "Invalid role"}, status=400)

        role_obj      = Roles.objects.get(role_name=role_name)
        user          = HRUser.objects.get(user_id=user_id)
        user.role_id  = role_obj.role_id
        user.save()

        return JsonResponse({"message": f"Role changed to {role_name}"})

    except Roles.DoesNotExist:
        return JsonResponse({"error": "Role not found"}, status=404)
    except HRUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Requirement
# --------------------------------------------------------------------------------------------------------------------

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
                    "pending_changes": r.pending_changes,  # json or None
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

            # If approving and there are pending_changes, apply them
            if action_status == "approved" and req.pending_changes:
                req.job_title      = req.pending_changes.get("job_title", req.job_title)
                req.description    = req.pending_changes.get("description", req.description)
                req.qualifications = req.pending_changes.get("qualifications", req.qualifications)
                req.pending_changes = None

            req.current_status = action_status
            req.save()

            ApprovalRequirement.objects.create(
                ap_requirement_id=uuid.uuid4(),
                requirement_id=req.requirement_id,
                reviewed_by_user_id=user_id,
                action_status=action_status,
            )

            try:
                if req.created_by_user_id:
                    notif = Notification.objects.create(
                        notification_id=uuid.uuid4(),
                        recipient_user_id=req.created_by_user_id,
                        notification_type="requirement_approval",
                        title=f"Job Requirement {action_status.capitalize()}",
                        message=f"Your requirement for '{req.job_title}' has been {action_status}.",
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
                # Apply directly
                req.job_title      = new_job_title
                req.description    = new_desc
                req.qualifications = new_quals
                req.modified_by_user_id = user_id
                req.pending_changes     = None
                req.save()
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
                # Store as pending changes, mark status as "changes_pending"
                req.pending_changes     = {
                    "job_title":      new_job_title,
                    "description":    new_desc,
                    "qualifications": new_quals,
                }
                req.modified_by_user_id = user_id
                req.current_status      = "changes_pending"
                req.save()

                # Notify manager
                try:
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
                            message=f"{get_user_fullname(user_id)} proposed changes to '{req.job_title}'.",
                            is_read=False,
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
            req.is_deleted = True
            req.save()
            return JsonResponse({"message": "Deleted"})

    except JobRequirement.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Profile
# --------------------------------------------------------------------------------------------------------------------
@csrf_exempt
def update_bio(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")
        data    = json.loads(request.body)
        bio     = data.get("bio", "").strip()

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
            "company_name":      company.company_name or "",
            "owner_email":       company.owner_email or "",
            "subscription_plan": company.subscription_plan or "",
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

        if status not in ["active", "on_break", "on_leave"]:
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
    
# Notifications
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

@csrf_exempt
def get_notifications(request):
    try:
        payload = decode_token(request)
        user_id = payload.get("user_id")

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
                "created_at": n.created_at.strftime("%m/%d/%Y %I:%M %p"),
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
        payload = decode_token(request)
        user_id = payload.get("user_id")

        Notification.objects.filter(
            recipient_user_id=user_id,
            is_read=False
        ).update(is_read=True)

        return JsonResponse({"message": "Notifications marked as read"})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
#Admin
#--------------------------------------------------------------------------------------------------------------------
#--------------------------------------------------------------------------------------------------------------------

@csrf_exempt
@require_POST
def login_admin(request):
    try:
        data     = json.loads(request.body)
        username = data.get("username", "").strip()
        email    = data.get("email", "").strip()
        password = data.get("password", "").strip()

        from .models import Admin
        admin = Admin.objects.get(admin_username=username, admin_email=email)

        if admin.admin_password != password:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        token = make_token({
            "role":     "admin",
            "admin_id": str(admin.admin_id),
            "email":    email,
        })

        return JsonResponse({
            "token":    token,
            "role":     "admin",
            "admin_id": str(admin.admin_id),
        })

    except Exception as e:
        return JsonResponse({"error": "Invalid credentials"}, status=401)