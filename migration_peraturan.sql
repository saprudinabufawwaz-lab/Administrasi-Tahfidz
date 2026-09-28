-- Jalankan SQL ini SEKALI di Supabase > SQL Editor.
-- Fitur: menu Peraturan, nama lembaga, logo, tema, dan master data.

create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  institution_name text not null default 'Administrasi Tahfidz',
  logo_url text not null default '',
  theme text not null default 'emerald' check (theme in ('emerald','blue','purple','amber','rose')),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "approved users read app settings" on public.app_settings;
drop policy if exists "coordinator manage app settings" on public.app_settings;

create policy "approved users read app settings" on public.app_settings
for select using (public.is_approved_teacher());

create policy "coordinator manage app settings" on public.app_settings
for all using (public.is_coordinator()) with check (public.is_coordinator());

insert into public.app_settings (id, institution_name, logo_url, theme)
values (1, 'Administrasi Tahfidz', '', 'emerald')
on conflict (id) do nothing;
