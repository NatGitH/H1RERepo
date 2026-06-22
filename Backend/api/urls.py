from django.urls import path
from . import views

urlpatterns = [
    path("auth/register-company/", views.register_company),
    path("auth/login-owner/", views.login_owner),
    path("auth/find-company/", views.find_company),
    path("auth/check-approval-status/", views.check_approval_status),
    path("auth/login-hr/",     views.login_hr),
    path("auth/create-hr-account/", views.create_hr_account),
    path("auth/update-hr-profile/", views.update_hr_profile),
    path("auth/check-company-name/", views.check_company_name),

    path("requirements/",                    views.requirements_list),
    path("requirements/<uuid:req_id>/",      views.requirement_detail),

    path("profile/hr/",    views.get_hr_profile),
    path("profile/owner/", views.get_owner_profile),
    path("profile/update-status/", views.update_hr_status),
    path("profile/update-bio/", views.update_bio),
    path("profile/update-picture/", views.update_profile_picture),

    path("profile/update-company-logo/",        views.update_company_logo),
    path("profile/update-company-name/",        views.update_company_name),
    path("profile/update-company-password/",    views.update_company_password),
    path("profile/update-company-description/", views.update_company_description),
    path("profile/delete-company/",             views.delete_company),
    path("auth/save-document/", views.save_document),
    
    path("auth/forgot-password/",   views.forgot_password),
    path("auth/reset-password/",    views.reset_password),

    path("employers/",                views.get_employers),
    path("employers/approve-reject/", views.approve_reject_account),
    path("employers/change-role/",    views.change_role),
    path("employers/delete/", views.delete_employer),

    path("auth/login-admin/", views.login_admin),
    path("admin/dashboard/",                views.admin_get_dashboard),
    path("admin/companies/",                views.admin_get_companies),
    path("admin/companies/pending/",        views.admin_get_pending_companies),
    path("admin/companies/approve-reject/", views.admin_approve_reject_company),
    path("admin/companies/revoke/",         views.admin_revoke_company),
    path("admin/companies/<str:company_id>/documents/", views.get_company_documents),
    path("admin/companies/restore/", views.admin_restore_company),

    path("evaluate/", views.evaluate_resume),
    path("evaluations/", views.get_evaluations),
    path("evaluations/<uuid:evaluation_id>/status/", views.update_evaluation_status),

    path("notifications/",           views.get_notifications),
    path("notifications/mark-read/", views.mark_notifications_read),
]