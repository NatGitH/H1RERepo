from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json, datetime, jwt
from django.conf import settings
from .models import Company, HRUser, Roles
import uuid
import argon2
from argon2 import PasswordHasher
from .models import JobRequirement, ApprovalRequirement


ph = PasswordHasher()

def make_token(payload: dict) -> str:
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_token(request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])



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

        hashed       = ph.hash(password)
        hashed_staff = ph.hash(staff_password) if staff_password else None

        Company.objects.create(
            company_name=company_name,
            owner_email=email,
            owner_password=hashed,
            staff_password=hashed_staff,
            subscription_plan=plan,
        )

        return JsonResponse({"message": "Company registered successfully"})

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


# HR Account Management
# --------------------------------------------------------------------------------------------------------------------
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

        HRUser.objects.create(
            user_id=uuid.uuid4(),
            role_id=role.role_id,
            company_id=company_id,
            username=username,
            email=email,
            password=hashed,
            account_status="active",
        )

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

# Requirement 
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

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

            if not all([job_title, description, qualifications]):
                return JsonResponse({"error": "All fields are required"}, status=400)

            req = JobRequirement.objects.create(
                requirement_id=uuid.uuid4(),
                company_id=company_id,
                created_by_user_id=user_id,
                job_title=job_title,
                description=description,
                qualifications=qualifications,
                current_status="pending",
                is_deleted=False,
            )

            return JsonResponse({
                "id":             str(req.requirement_id),
                "job_title":      req.job_title,
                "description":    req.description,
                "qualifications": req.qualifications,
                "status":         req.current_status,
                "date_created":   req.date_created.strftime("%m/%d/%Y"),
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
            if role != "HRManager":
                return JsonResponse({"error": "Forbidden"}, status=403)

            data          = json.loads(request.body)
            action_status = data.get("status", "").strip()

            if action_status not in ["approved", "rejected"]:
                return JsonResponse({"error": "Invalid status"}, status=400)

            # Update Job_Requirements
            req.current_status = action_status
            req.save()

            # Log into Approval_Requirements
            ApprovalRequirement.objects.create(
                ap_requirement_id=uuid.uuid4(),
                requirement_id=req.requirement_id,
                reviewed_by_user_id=user_id,
                action_status=action_status,
            )

            return JsonResponse({
                "id":     str(req.requirement_id),
                "status": req.current_status,
            })

    except JobRequirement.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    # Profile
# --------------------------------------------------------------------------------------------------------------------
# --------------------------------------------------------------------------------------------------------------------

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