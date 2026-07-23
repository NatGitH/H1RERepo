import uuid
from django.db import models

class Company(models.Model):
    company_id           = models.UUIDField(primary_key=True, default=uuid.uuid4)
    company_name         = models.CharField(max_length=255)
    owner_email          = models.CharField(max_length=255, unique=True)
    owner_password       = models.CharField(max_length=255)
    staff_password       = models.CharField(max_length=255, null=True, blank=True)
    subscription_plan    = models.CharField(max_length=255, null=True, blank=True)
    company_logo         = models.CharField(max_length=255, null=True, blank=True)
    subscription_start   = models.DateTimeField(null=True, blank=True)
    subscription_expiry  = models.DateTimeField(null=True, blank=True)
    company_description  = models.TextField(null=True, blank=True)
    date_created         = models.DateTimeField(auto_now_add=True)
    date_modified        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '"Companies"'
        managed  = False

class ApprovalCompany(models.Model):
    ap_companies_id        = models.UUIDField(primary_key=True, default=uuid.uuid4)
    reviewed_by_admin_id   = models.UUIDField(null=True, blank=True)
    subscribing_company_id = models.UUIDField()
    action_status          = models.CharField(max_length=50, default="pending")
    time_of_action         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Approval_Companies"'
        managed  = False

class Roles(models.Model):
    role_id     = models.UUIDField(primary_key=True, default=uuid.uuid4)
    role_name   = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = '"Roles"'
        managed  = False

class HRUser(models.Model):
    user_id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    role_id         = models.UUIDField(null=True, blank=True)
    company_id      = models.UUIDField(null=True, blank=True)
    firstname       = models.CharField(max_length=255, null=True, blank=True)
    lastname        = models.CharField(max_length=255, null=True, blank=True)
    username        = models.CharField(max_length=255, null=True, blank=True)
    email           = models.CharField(max_length=255, null=True, blank=True)
    password        = models.CharField(max_length=255, null=True, blank=True)
    birthdate       = models.DateField(null=True, blank=True)
    bio             = models.TextField(null=True, blank=True)
    profile_picture = models.CharField(max_length=255, null=True, blank=True)
    account_status  = models.CharField(max_length=255, null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '"Users"'
        managed  = False

class JobRequirement(models.Model):
    requirement_id   = models.UUIDField(primary_key=True, default=uuid.uuid4)
    company_id       = models.UUIDField()
    created_by_user_id = models.UUIDField(null=True, blank=True)
    job_title        = models.CharField(max_length=255)
    description      = models.TextField()
    qualifications   = models.TextField()
    current_status   = models.CharField(max_length=50, default="pending")
    is_deleted       = models.BooleanField(default=False)
    date_created     = models.DateTimeField(auto_now_add=True)
    date_updated     = models.DateTimeField(auto_now=True)
    modified_by_user_id = models.UUIDField(null=True, blank=True)
    pending_changes     = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = '"Job_Requirements"'
        managed  = False

class ApprovalRequirement(models.Model):
    ap_requirement_id  = models.UUIDField(primary_key=True, default=uuid.uuid4)
    requirement_id     = models.UUIDField()
    reviewed_by_user_id    = models.UUIDField(null=True, blank=True)
    reviewed_by_company_id = models.UUIDField(null=True, blank=True)
    action_status      = models.CharField(max_length=50)
    time_of_action     = models.DateTimeField(auto_now_add=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Approval_Requirements"'
        managed  = False

class Admin(models.Model):
    admin_id       = models.UUIDField(primary_key=True, default=uuid.uuid4)
    admin_username = models.CharField(max_length=255)
    admin_email    = models.CharField(max_length=255)
    admin_password = models.CharField(max_length=255)

    class Meta:
        db_table = '"Admin"'
        managed  = False

class EmployerAccountRequest(models.Model):
    request_id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    requested_user_id  = models.UUIDField()
    company_id         = models.UUIDField()
    reviewed_by_user_id = models.UUIDField(null=True, blank=True)
    requested_email    = models.CharField(max_length=255)
    request_status     = models.CharField(max_length=50, default="pending")
    requested_at       = models.DateTimeField(auto_now_add=True)
    reviewed_at        = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = '"Employer_Account_Requests"'
        managed  = False

class Notification(models.Model):
    notification_id      = models.UUIDField(primary_key=True, default=uuid.uuid4)
    recipient_user_id    = models.UUIDField(null=True, blank=True)
    recipient_company_id = models.UUIDField(null=True, blank=True)
    notification_type    = models.CharField(max_length=100)
    title                 = models.CharField(max_length=255)
    message               = models.TextField()
    is_read               = models.BooleanField(default=False)
    created_at            = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Notifications"'
        managed  = False

class ApprovalNotification(models.Model):
    ap_notification_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    requirement_id     = models.UUIDField()
    notification_id    = models.UUIDField()
    action_status      = models.CharField(max_length=50)
    status_update_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Approval_Notifications"'
        managed  = False

class Document(models.Model):
    document_id   = models.UUIDField(primary_key=True, default=uuid.uuid4)
    company_id    = models.UUIDField()
    document_name = models.CharField(max_length=255, null=True, blank=True)
    document_type = models.CharField(max_length=255, null=True, blank=True)
    document_url  = models.TextField(null=True, blank=True)
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Documents"'
        managed  = False

class Interview(models.Model):
    interview_id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    evaluation_id        = models.UUIDField()
    scheduled_by_user_id = models.UUIDField(null=True, blank=True)
    interview_date       = models.DateTimeField(null=True, blank=True)
    message              = models.TextField(null=True, blank=True)
    interview_status     = models.CharField(max_length=50, null=True, blank=True, default="scheduled")
    sent_date            = models.DateTimeField()
    date_created         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Interviews"'
        managed  = False

class AuditLog(models.Model):
    audit_log_id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    # Nullable so non-applicant audits (role change, company/plan approvals, etc.)
    # can be recorded. Company scoping is carried in action_details ([c:<uuid>])
    # because the table has no company_id column (schema is frozen).
    applicant_id         = models.UUIDField(null=True, blank=True)
    performed_by_user_id = models.UUIDField(null=True, blank=True)
    requirement_id       = models.UUIDField(null=True, blank=True)
    action_type          = models.CharField(max_length=255)
    action_details       = models.TextField(null=True, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Audit_Logs"'
        managed  = False

class EmailLog(models.Model):
    # Written via the ORM (bypasses RLS) so Django can log applicant emails it
    # sends directly — e.g. interview invitations. Rejection emails are logged
    # by the n8n "Reject Email & Cleanup" workflow with the service key.
    email_log_id     = models.UUIDField(primary_key=True, default=uuid.uuid4)
    applicant_id     = models.UUIDField()
    evaluation_id    = models.UUIDField()
    sent_by_user_id  = models.UUIDField(null=True, blank=True)
    recipient_email  = models.CharField(max_length=255)
    message          = models.TextField()
    sent_date        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Email_Logs"'
        managed  = False

class AIEvaluationLog(models.Model):
    # AI-procedure log (revision #4): one row per evaluation capturing the model +
    # weights version and the sub-scores behind the H!RE Score, for internal review
    # of AI behaviour over time. Written/read via the ORM (bypasses RLS).
    ai_log_id       = models.UUIDField(primary_key=True, default=uuid.uuid4)
    evaluation_id   = models.UUIDField(null=True, blank=True)
    company_id      = models.UUIDField(null=True, blank=True)
    requirement_id  = models.UUIDField(null=True, blank=True)
    model_name      = models.CharField(max_length=120, null=True, blank=True)
    weights_version = models.CharField(max_length=160, null=True, blank=True)
    semantic_score  = models.FloatField(null=True, blank=True)
    skills_match    = models.FloatField(null=True, blank=True)
    role_relevance  = models.FloatField(null=True, blank=True)
    impact          = models.FloatField(null=True, blank=True)
    soft_signals    = models.FloatField(null=True, blank=True)
    llm_score       = models.FloatField(null=True, blank=True)
    hire_score      = models.FloatField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"AI_Evaluation_Logs"'
        managed  = False

class SubscriptionPayment(models.Model):
    # Subscription payment history (revision #10): one row per subscription event.
    payment_id  = models.UUIDField(primary_key=True, default=uuid.uuid4)
    company_id  = models.UUIDField(null=True, blank=True)
    plan        = models.CharField(max_length=40, null=True, blank=True)
    amount      = models.FloatField(null=True, blank=True)
    status      = models.CharField(max_length=40, null=True, blank=True)
    note        = models.CharField(max_length=255, null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Subscription_Payments"'
        managed  = False

class CompanyAccess(models.Model):
    # Revision #7 — the HR<->company ACCESS link (which companies an HR can enter).
    # NOT a subscription: the company's plan is separate. One HR can have many rows
    # (one per company); this powers the login dropdown + in-app company switching.
    access_id   = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email       = models.CharField(max_length=255)
    user_id     = models.UUIDField(null=True, blank=True)               # filled once account exists
    company_id  = models.UUIDField()
    role        = models.CharField(max_length=30, default="HRStaff")   # within this company
    status      = models.CharField(max_length=20, default="invited")   # invited | active
    invited_by  = models.UUIDField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"Company_Access"'
        managed  = False