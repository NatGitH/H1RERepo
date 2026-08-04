-- Retire the obsolete Companies.staff_password column.
--
-- Background: Revision #7 (registration rework) removed the shared "staff
-- password" from signup and login. The column was left NOT NULL, so creating a
-- company failed with:
--   null value in column "staff_password" of relation "Companies"
--   violates not-null constraint
--
-- The backend + frontend code that referenced staff_password has been removed
-- (Company model field, register_company, find_company, update_company_password,
-- and the ChangeCompanyPasswordModal UI).
--
-- ============================================================================
-- OPTION A — immediate unblock, NO redeploy required.
-- Safe to run against the currently-deployed (old) code: it just lets the
-- existing NULL insert succeed. Run this if you need signup working right now.
-- ============================================================================
ALTER TABLE public."Companies" ALTER COLUMN staff_password DROP NOT NULL;

-- ============================================================================
-- OPTION B — the clean drop. RUN ONLY AFTER the cleaned backend is deployed.
-- WARNING: if you drop this column while the OLD code (which still lists
-- staff_password in the Company model) is running, EVERY Company query breaks
-- with "column Companies.staff_password does not exist". Deploy first, then run.
-- ============================================================================
ALTER TABLE public."Companies" DROP COLUMN IF EXISTS staff_password;
