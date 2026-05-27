from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin',     'Admin'),
        ('hr_staff',  'HR Staff'),
        ('employer',  'Employer'),
        ('applicant', 'Applicant'),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


# ── Matches your Supabase Admin table ──────────────────────────────
class Admin(models.Model):
    admin_id       = models.AutoField(primary_key=True)
    user           = models.OneToOneField(
                         CustomUser,
                         on_delete=models.CASCADE,
                         null=True, blank=True
                     )
    admin_username = models.CharField(max_length=255)
    admin_email    = models.CharField(max_length=255)

    class Meta:
        db_table = 'Admin'   # maps to your existing Supabase table name

    def __str__(self):
        return self.admin_username


# ── Matches your Supabase Applicants table ─────────────────────────
class Applicant(models.Model):
    applicant_id = models.AutoField(primary_key=True)
    user         = models.OneToOneField(
                       CustomUser,
                       on_delete=models.CASCADE,
                       null=True, blank=True
                   )
    full_name    = models.CharField(max_length=255)
    email        = models.CharField(max_length=255)
    phone        = models.CharField(max_length=50, null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Applicants'

    def __str__(self):
        return self.full_name


# ── Matches your Supabase Companies table ──────────────────────────
class Company(models.Model):
    company_id        = models.AutoField(primary_key=True)
    admin             = models.ForeignKey(
                            Admin,
                            on_delete=models.SET_NULL,
                            null=True, blank=True
                        )
    owner_user        = models.OneToOneField(
                            CustomUser,
                            on_delete=models.CASCADE,
                            null=True, blank=True,
                            related_name='owned_company'
                        )
    company_name      = models.CharField(max_length=255)
    owner_email       = models.CharField(max_length=255)
    subscription_plan = models.CharField(max_length=255, null=True, blank=True)
    date_created      = models.DateTimeField(auto_now_add=True)
    date_modified     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Companies'

    def __str__(self):
        return self.company_name


# ── Matches your Supabase Job_Requirements table ───────────────────
class JobRequirement(models.Model):
    requirement_id  = models.AutoField(primary_key=True)
    company         = models.ForeignKey(
                          Company,
                          on_delete=models.CASCADE,
                          null=True, blank=True
                      )
    created_by_user = models.ForeignKey(
                          CustomUser,
                          on_delete=models.SET_NULL,
                          null=True, blank=True
                      )
    job_title       = models.CharField(max_length=255)
    description     = models.TextField(null=True, blank=True)
    qualifications  = models.TextField(null=True, blank=True)
    date_created    = models.DateTimeField(auto_now_add=True)
    date_updated    = models.DateTimeField(auto_now=True)
    is_deleted      = models.BooleanField(default=False)
    current_status  = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'Job_Requirements'

    def __str__(self):
        return self.job_title


# ── Matches your Supabase Resumes table ───────────────────────────
class Resume(models.Model):
    resume_id      = models.AutoField(primary_key=True)
    applicant      = models.ForeignKey(
                         Applicant,
                         on_delete=models.CASCADE,
                         null=True, blank=True
                     )
    uploaded_by    = models.ForeignKey(
                         CustomUser,
                         on_delete=models.SET_NULL,
                         null=True, blank=True
                     )
    file_name      = models.CharField(max_length=255)
    file_type      = models.CharField(max_length=50, null=True, blank=True)
    file_path      = models.CharField(max_length=255, null=True, blank=True)
    extracted_text = models.TextField(null=True, blank=True)
    date_uploaded  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Resumes'

    def __str__(self):
        return self.file_name


# ── Matches your Supabase Evaluations table ───────────────────────
class Evaluation(models.Model):
    evaluation_id      = models.AutoField(primary_key=True)
    requirement        = models.ForeignKey(
                             JobRequirement,
                             on_delete=models.CASCADE,
                             null=True, blank=True
                         )
    resume             = models.ForeignKey(
                             Resume,
                             on_delete=models.CASCADE,
                             null=True, blank=True
                         )
    hire_score         = models.DecimalField(
                             max_digits=5, decimal_places=2,
                             null=True, blank=True
                         )
    ai_summary         = models.TextField(null=True, blank=True)
    application_status = models.CharField(max_length=255, null=True, blank=True)
    data_evaluated     = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'Evaluations'


# ── Matches your Supabase Evaluation_Cons table ───────────────────
class EvaluationCon(models.Model):
    cons_id    = models.AutoField(primary_key=True)
    evaluation = models.ForeignKey(
                     Evaluation,
                     on_delete=models.CASCADE,
                     null=True, blank=True
                 )
    cons_text  = models.TextField()

    class Meta:
        db_table = 'Evaluation_Cons'


# ── Matches your Supabase Documents table ─────────────────────────
class Document(models.Model):
    document_id   = models.AutoField(primary_key=True)
    company       = models.ForeignKey(
                        Company,
                        on_delete=models.CASCADE,
                        null=True, blank=True
                    )
    document_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'Documents'

    def __str__(self):
        return self.document_name


# ── Matches your Supabase Approval_Requirements table ─────────────
class ApprovalRequirement(models.Model):
    ap_requirement_id  = models.AutoField(primary_key=True)
    requirement        = models.ForeignKey(
                             JobRequirement,
                             on_delete=models.CASCADE,
                             null=True, blank=True
                         )
    reviewed_by_user   = models.ForeignKey(
                             CustomUser,
                             on_delete=models.SET_NULL,
                             null=True, blank=True
                         )
    action_status      = models.CharField(max_length=255, null=True, blank=True)
    time_of_action     = models.DateTimeField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Approval_Requirements'


# ── Matches your Supabase Approval_Companies table ────────────────
class ApprovalCompany(models.Model):
    ap_companies_id    = models.AutoField(primary_key=True)
    reviewed_by_admin  = models.ForeignKey(
                             CustomUser,
                             on_delete=models.SET_NULL,
                             null=True, blank=True,
                             related_name='reviewed_companies'
                         )
    subscribing_company = models.ForeignKey(
                             Company,
                             on_delete=models.CASCADE,
                             null=True, blank=True
                          )
    action_status      = models.CharField(max_length=255, null=True, blank=True)
    time_of_action     = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Approval_Companies'


# ── Matches your Supabase Email_Logs table ────────────────────────
class EmailLog(models.Model):
    email_log_id  = models.AutoField(primary_key=True)
    applicant     = models.ForeignKey(
                        Applicant,
                        on_delete=models.CASCADE,
                        null=True, blank=True
                    )
    evaluation    = models.ForeignKey(
                        Evaluation,
                        on_delete=models.CASCADE,
                        null=True, blank=True
                    )
    sent_by_user  = models.ForeignKey(
                        CustomUser,
                        on_delete=models.SET_NULL,
                        null=True, blank=True
                    )

    class Meta:
        db_table = 'Email_Logs'