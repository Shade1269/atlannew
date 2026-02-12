create extension if not exists "uuid-ossp";

create table if not exists public.change_requests (
  id uuid primary key default uuid_generate_v4(),
  source text not null check (source in ('chatgpt')),
  message text not null,
  proposed_sql text,
  proposed_files jsonb default '[]'::jsonb,
  risk_level text check (risk_level in ('low','medium','high')),
  summary text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','applied','failed')),
  pr_url text,
  pr_number integer,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);
