from django.urls import path
from . import views

urlpatterns = [
    path("auth/register-company/", views.register_company),
    path("auth/login-owner/", views.login_owner),
]