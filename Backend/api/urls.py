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

    path("profile/hr/",    views.get_hr_profile),
    path("profile/owner/", views.get_owner_profile),
]