-- Extend user profiles with optional contact fields for firm employee management.
alter table public.users
  add column if not exists display_name text,
  add column if not exists phone_number text;
