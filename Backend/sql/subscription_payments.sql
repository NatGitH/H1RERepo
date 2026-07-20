-- Revision #10 (subscription payment history / log). Schema unfrozen post-defense.
-- One row per subscription event (initial signup + approved plan changes/renewals).
-- Django reads/writes via its direct Postgres connection (bypasses RLS).
create table if not exists public."Subscription_Payments" (
  payment_id  uuid primary key default gen_random_uuid(),
  company_id  uuid,
  plan        varchar(40),
  amount      numeric,
  status      varchar(40),
  note        varchar(255),
  created_at  timestamptz default now()
);
