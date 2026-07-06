-- Audit_Logs stays (panel-mandated) but now records non-applicant events too
-- (role changes, company/plan approvals, company creation). Those have no
-- applicant, so applicant_id must allow NULL. Company scope is carried in
-- action_details as a "[c:<company_id>] " prefix (no schema change for that).
alter table "Audit_Logs" alter column applicant_id drop not null;
alter table "Audit_Logs" alter column performed_by_user_id drop not null;
alter table "Audit_Logs" alter column requirement_id drop not null;
