-- Revision #7 — HR ↔ company ACCESS (which companies an HR user can enter).
-- This is NOT a subscription. The company's plan (free/standard/enterprise) is
-- separate and unchanged; an HR's features always follow the company they're in.
-- One row per (email, company). An invite can exist by email BEFORE the person
-- has an account (user_id filled once they sign up). Schema unfrozen post-defense.
-- Django reads/writes via its direct Postgres connection (bypasses RLS).
create table if not exists public."Company_Access" (
  access_id   uuid primary key default gen_random_uuid(),
  email       varchar(255) not null,            -- invitee / member email (lowercased)
  user_id     uuid,                              -- the HR user, once their account exists
  company_id  uuid not null,
  role        varchar(30) default 'HRStaff',    -- HRStaff | HRManager, within this company
  status      varchar(20) default 'invited',    -- invited | active
  invited_by  uuid,
  created_at  timestamptz default now(),
  unique (email, company_id)
);

create index if not exists idx_company_access_email   on public."Company_Access" (email);
create index if not exists idx_company_access_user    on public."Company_Access" (user_id);
create index if not exists idx_company_access_company on public."Company_Access" (company_id);
