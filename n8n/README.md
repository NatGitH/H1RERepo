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
| **H!RE - Reject Email & Cleanup** | Schedule (every 15 min) | ✅ | NEW — replaces the old "Evaluation Clean Up" |
| _Fairness monitor_ | Schedule | ⬜ Planned | Paper NFR (selection-rate / adverse-impact) |
| _Interview reminder_ | Schedule | ⬜ Planned | Reminder before interview date |
| _Employer account-request email_ | Webhook | ⬜ Planned | |
| _Company approval email_ | Webhook | ⬜ Planned | |
| _Subscription expiry reminder_ | Schedule | ⬜ Planned | |

## Reject → Email & Cleanup (how it works) — SOFT DELETE, no schema change

> **DB is frozen** — no columns may be added/removed/changed. This flow therefore
> soft-deletes by writing a new *value* into the existing `application_status` varchar
> (`'removed'`), not a new column.

1. Runs every 15 min.
2. Finds `Evaluations` where `application_status = 'rejected'` **and** `rejected_at`
   is older than 1 hour (the cancelable grace window). (Rows already archived are
   `application_status = 'removed'`, so they no longer match.)
3. Looks up the resume + applicant, builds a branded rejection email that includes
   the applicant's **H!RE Score** and **AI summary**, and sends it via Gmail.
4. Writes an `Email_Logs` row (audit record of the rejection notice).
5. Sets `application_status = 'removed'` on the evaluation.

Nothing is physically deleted — the evaluation, resume, pros/cons, and email log all
stay in the database for the paper's **audit-trail requirement**. Django's
`get_evaluations` skips any row with `application_status = 'removed'`, so the applicant
disappears from the Applicants UI as intended.

**Cancel Rejection** flips the status back to `pending` before the hour is up, so the
row never matches the query — no email, no removal. ✔️

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
