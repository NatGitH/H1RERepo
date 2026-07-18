-- Revision #4 (metrics): AI-procedure logging/versioning + efficiency timestamps.
-- Schema unfrozen post-defense (2026-07-16). Safe to re-run (IF NOT EXISTS).

-- 1) Per-evaluation AI-procedure log: captures the model + weights version and the
--    sub-scores behind each H!RE Score, so AI behaviour can be reviewed over time.
create table if not exists public."AI_Evaluation_Logs" (
  ai_log_id       uuid primary key default gen_random_uuid(),
  evaluation_id   uuid,
  company_id      uuid,
  requirement_id  uuid,
  model_name      varchar(120),
  weights_version varchar(160),
  semantic_score  numeric,
  skills_match    numeric,
  role_relevance  numeric,
  impact          numeric,
  soft_signals    numeric,
  llm_score       numeric,
  hire_score      numeric,
  created_at      timestamptz default now()
);

-- Django writes/reads this via its direct Postgres connection (bypasses RLS),
-- matching how Audit_Logs / Email_Logs are handled. No anon policy needed.

-- 2) Efficiency timestamps on Evaluations for time-to-shortlist / time-to-fill.
alter table public."Evaluations" add column if not exists shortlisted_at timestamptz;
alter table public."Evaluations" add column if not exists hired_at       timestamptz;
