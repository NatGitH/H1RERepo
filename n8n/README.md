# H!RE — n8n Workflows

Versioned copies of the n8n automation workflows for H!RE, plus the wiring
checklist that keeps them working after the move to Render.

## Workflow inventory

| Workflow | Trigger | Required? | Notes |
|---|---|---|---|
| **Evaluate Resume** | Webhook `/evaluate-resume` | ✅ Core | PDF/OCR → SBERT score → Groq summary → writes Applicant/Resume/Evaluation/Pros/Cons. Responds to the webhook once from the **Evaluations** node; Pros/Cons inserts are a terminal side branch. Depends on Groq model `llama-3.3-70b-versatile` staying active. |
| **H!RE - Account Registration Email** | Webhook `/register-confirmation` | ✅ | Welcome email |
| **H!RE - Password Reset Email** | Webhook `/password-reset` | ✅ | Reset link, 30-min expiry |
| **H!RE - Interview Invitation Email** | Webhook `/interview-invitation` | ✅ | Fired by Django on `interview_sent` |
| **H!RE - Reject Email & Cleanup** | Schedule (every 15 min) | ✅ | Replaces the old "Evaluation Clean Up". After the grace period + email it now **hard-deletes** the applicant's data (see below) instead of archiving. |
| **H!RE - Interview Reminder** | Schedule (daily) | ✅ | NEW — emails applicants ~1 day before their interview |
| **H!RE - Interview Cleanup** | Schedule (daily) | ✅ | NEW — hard-deletes an applicant's data once their interview date is >12h in the past ("interview done"). Writes an `INTERVIEW_COMPLETED` audit entry. Ships inactive. |
| **H!RE - Subscription Expiry Reminder** | Schedule (daily) | ✅ | NEW — emails owners ~7 days before their plan expires |
| **H!RE - Company Approval Email** | Webhook `/company-approval` | ✅ | NEW — emails owner on admin approve/reject (fired by `admin_approve_reject_company`) |
| **H!RE - Password Reset Code** | Webhook `/password-reset-code` | ✅ | NEW — emails the 6-digit code for the in-profile Change Password flow (fired by `send_reset_code`) |
| **H!RE - Employer Deleted Email** | Webhook `/employer-deleted` | ✅ | NEW — emails a removed employee (fired by `delete_employer`) |
| **H!RE - Admin New Company Email** | Webhook `/admin-new-company` | ✅ | NEW — emails all admins when a company signs up (fired by `register_company`) |
| **H!RE - Admin Plan Change Email** | Webhook `/admin-plan-change` | ✅ | NEW — emails all admins when an owner requests a plan change (fired by `request_plan_change`) |
| _Employer account-request email_ | Webhook | ⬜ Low priority | Managers already get in-app notifications |
| _Fairness monitor_ | Schedule | ❌ Not feasible | Needs protected-attribute data the frozen schema doesn't have — document as thesis future work |

## ✅ Deploy checklist (verified 2026-07-01)

**Webhook paths — Django ↔ n8n all match (6/6):** register-confirmation, password-reset,
password-reset-code, interview-invitation, company-approval, evaluate-resume.

**Activate these n8n workflows (they ship inactive):**
- H!RE - Company Approval Email (webhook)
- H!RE - Password Reset Code (webhook)
- H!RE - Reject Email & Cleanup (schedule) — and **deactivate the old "Evaluation Clean Up"** in the n8n instance
- H!RE - Interview Reminder (schedule)
- H!RE - Interview Cleanup (schedule) — needs `SUPABASE_SERVICE_KEY`
- H!RE - Subscription Expiry Reminder (schedule)

Already active: Account Registration, Evaluate Resume, Interview Invitation, Password Reset.

**n8n instance env vars (only Evaluate Resume needs these):** `HF_API_KEY`,
`OCR_SPACE_API_KEY`, `SUPABASE_SERVICE_KEY`. All other workflows use the stored
Supabase + Gmail credentials.

**Render (Django) env vars:** `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DB_NAME/USER/PASSWORD/HOST/PORT`,
`CORS_ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY`,
`N8N_BASE_URL` (base only, no `/webhook`), `N8N_EVALUATE_WEBHOOK_URL` (`<N8N_BASE_URL>/webhook/evaluate-resume`),
`FRONTEND_URL`.

**Render (frontend) env var:** `VITE_API_URL` = the deployed backend origin.

**Redeploy order:** backend (Django) → frontend → then activate/import the n8n workflows.

> Note: `/auth/forgot-password/` (JWT link flow) + the "Password Reset Email" workflow are
> now redundant — the public reset uses the code flow. Harmless to leave; nothing calls them.

## Reject → Email & Cleanup (how it works) — HARD DELETE after the grace period

> **DB is frozen** — no columns may be added/removed/changed. The *scheduling* still
> rides on the existing `application_status` varchar (`'rejected'`), but once the grace
> window passes the applicant's rows are now **physically deleted** (product decision,
> 2026-07-07), not archived to `'removed'`.

1. Runs every 15 min.
2. Finds `Evaluations` where `application_status = 'rejected'` **and** `rejected_at`
   is older than 1 hour (the cancelable grace window).
3. Looks up the resume + applicant, builds a branded rejection email that includes
   the applicant's **H!RE Score** and **AI summary**, and sends it via Gmail.
4. Writes an `Email_Logs` row (the email is sent while the data still exists).
5. **Audit Removal** writes a permanent `APPLICANT_REMOVED` audit entry.
6. **Purge applicant** hard-deletes the data with the service key, children→parents:
   nulls `Audit_Logs.applicant_id` (the audit text keeps the name), then deletes
   `Email_Logs`, `Evaluation_Pros`, `Evaluation_Cons`, `Evaluations`, `Resumes`,
   and finally the `Applicants` row.

The **permanent record** now lives in `Audit_Logs` (the bell's Activity tab), not in
the retained applicant rows. Deleting the evaluation also means it no longer matches
the step-2 query, so it isn't re-processed. (Resume storage files are **not** deleted
by this flow — orphaned files are harmless; delete-on-purge can be added later.)

**Cancel Rejection** flips the status back to `pending` before the hour is up, so the
row never matches the query — no email, no deletion. ✔️

## Interview Cleanup (how it works) — HARD DELETE once the interview is over

Daily schedule. Finds `Interviews` whose `interview_date` is **>12h in the past**
(the interview has happened), then for each one resolves evaluation→resume→applicant,
writes an `INTERVIEW_COMPLETED` audit entry (company-scoped via the `[c:<id>]` marker),
and hard-deletes the same children→parents chain as the reject purge (plus the
`Interviews` row). Ships **inactive**; needs `SUPABASE_SERVICE_KEY`. All requests are
guarded (`try/catch`) so one bad row can't halt the run.

### Batch processing (all rejected rows per trigger)
- The **Get rejected > 1h** node has `returnAll: true`, so every trigger pulls the
  *entire* set of eligible rows (not the default 50-row page), and n8n fans out the
  downstream nodes across all of them in one run.
- The per-row nodes (**Get Resume, Get Applicant, Send rejection email, Log Email,
  Archive**) are set to **Continue On Error** (`onError: continueRegularOutput`). This
  is the important part: without it, a single applicant with a missing/placeholder
  email makes the Gmail node throw and **halts the whole run**, so each trigger only
  clears rows up to the first failure — which looks like "one at a time." With it, bad
  rows are skipped (still archived so they don't re-queue) and the rest of the batch
  completes. If a node shows blank after import, open its **Settings → On Error →
  Continue** to re-apply.

### No prerequisites — no SQL, no schema change
`'removed'` is just a new value in the existing `application_status` column (a plain
varchar with no CHECK constraint), so nothing needs to run in Supabase first.

### After importing, verify:
- The Supabase-node **credentials** resolve (they reference the existing
  "Supabase account" credential id) and the **Gmail** credential resolves.
- On the **Archive (status=removed)** node, the update field is `application_status`
  with value `removed`, and the filter is `evaluation_id = {{ ... }}` (n8n version
  differences can reset the update/filter UI — re-pick if blank).
- Activate the workflow (it ships `active: false`), and delete/deactivate the old
  **Evaluation Clean Up** so both don't run.

## Render / n8n wiring checklist (fixes the "broken after Render" workflows)

The email + evaluate workflows themselves are fine — what breaks is the **wiring**
between Render (Django) and the n8n instance. Check all of these:

### On Render (Django service → Environment)
| Var | Must be | Symptom if wrong |
|---|---|---|
| `N8N_BASE_URL` | Base URL of the live n8n instance (e.g. `https://<you>.app.n8n.cloud`) — **no** trailing `/webhook` | Register / reset / interview emails silently never send (calls are try/except) |
| `N8N_EVALUATE_WEBHOOK_URL` | `<N8N_BASE_URL>/webhook/evaluate-resume` | Resume evaluation returns an error / 500 |
| `SUPABASE_URL` | `https://kzszvpmwvvtfvcgdzgnj.supabase.co` | Status updates & evaluations fail |
| `SUPABASE_ANON_KEY` | Supabase anon key | Status updates & evaluations fail |
| `GROQ_API_KEY` | Groq key | (only if Django calls Groq directly) |
| `FRONTEND_URL` | Deployed frontend origin | Password-reset links point to the wrong host |
| `CORS_ALLOWED_ORIGINS` | Deployed frontend origin(s), comma-separated | Frontend calls blocked by CORS |
| `ALLOWED_HOSTS` | Render backend host(s), comma-separated | Django 400 DisallowedHost |

### On the n8n instance (Settings → Variables / env)
| Var | Used by | Symptom if missing |
|---|---|---|
| `HF_API_KEY` | Evaluate Resume → SBERT Score | H!RE Score comes back `0` |
| `OCR_SPACE_API_KEY` | Evaluate Resume → image OCR | Image resumes extract empty text |
| `SUPABASE_SERVICE_KEY` | Evaluate Resume upload + Reject cleanup file delete | Resume upload/delete 401s |

### Also confirm
- Each webhook workflow is **Active** in n8n (inactive = 404 on the webhook URL).
- The webhook **paths** match what Django posts to: `register-confirmation`,
  `password-reset`, `interview-invitation`, `evaluate-resume`.
- Gmail + Supabase credentials were **re-authorized** if the n8n instance moved
  (OAuth tokens don't transfer between instances).
