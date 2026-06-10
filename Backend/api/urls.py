from django.urls import path
from . import views

urlpatterns = [
    path("auth/register-company/", views.register_company),
    path("auth/login-owner/", views.login_owner),
    path("auth/find-company/", views.find_company),
    path("auth/login-hr/",     views.login_hr),
    path("auth/create-hr-account/", views.create_hr_account),
    path("auth/update-hr-profile/", views.update_hr_profile),

    path("requirements/",                    views.requirements_list),
    path("requirements/<uuid:req_id>/",      views.requirement_detail),
    path("requirements/<uuid:req_id>/edit/",   views.requirement_edit),
    path("requirements/<uuid:req_id>/delete/", views.requirement_delete),

    path("profile/hr/",    views.get_hr_profile),
    path("profile/owner/", views.get_owner_profile),
    path("profile/update-status/", views.update_hr_status),
    path("profile/update-picture/", views.update_profile_picture),

    path("auth/send-reset-code/",   views.send_reset_code),
    path("auth/verify-reset-code/", views.verify_reset_code),
    path("auth/reset-password/",    views.reset_password),
]