from django.db import models

class Company(models.Model):
    company_id        = models.UUIDField(primary_key=True)
    admin_id          = models.UUIDField(null=True, blank=True)
    document_id       = models.UUIDField(null=True, blank=True)
    company_name      = models.CharField(max_length=255)
    owner_email       = models.CharField(max_length=255, unique=True)
    owner_password    = models.CharField(max_length=255)
    staff_password    = models.CharField(max_length=255, null=True, blank=True)
    subscription_plan = models.CharField(max_length=255, null=True, blank=True)
    date_created      = models.DateTimeField(auto_now_add=True)
    date_modified     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '"Companies"'
        managed  = False

class Roles(models.Model):
    role_id     = models.AutoField(primary_key=True)
    role_name   = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = '"Roles"'
        managed  = False

class HRUser(models.Model):
    user_id         = models.AutoField(primary_key=True)
    role_id         = models.IntegerField(null=True, blank=True)
    company_id      = models.IntegerField(null=True, blank=True)
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