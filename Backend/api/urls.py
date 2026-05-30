from django.urls import path
from . import views

urlpatterns = [
    path("auth/register-company/", views.register_company),
    path("auth/login-owner/", views.login_owner),
    path("auth/find-company/", views.find_company),
    path("auth/login-hr/",     views.login_hr),
    path("auth/create-hr-account/", views.create_hr_account),
]