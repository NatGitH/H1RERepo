from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json, datetime, jwt
from django.conf import settings
from .models import Company, HRUser
import argon2
from argon2 import PasswordHasher

ph = PasswordHasher()

def make_token(payload: dict) -> str:
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


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
        company_name    = request.POST.get("company_name", "").strip()
        email           = request.POST.get("email", "").strip()
        password        = request.POST.get("password", "").strip()
        plan            = request.POST.get("plan", "free").strip()

        if not all([company_name, email, password]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if Company.objects.filter(owner_email=email).exists():
            return JsonResponse({"error": "Email already registered"}, status=400)

        hashed = ph.hash(password)

        Company.objects.create(
            company_name=company_name,
            owner_email=email,
            owner_password=hashed,
            subscription_plan=plan,
        )

        return JsonResponse({"message": "Company registered successfully"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)