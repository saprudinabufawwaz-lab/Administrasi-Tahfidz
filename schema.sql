-- Sistem Manajemen Tahfidz v3
-- Supabase PostgreSQL + Auth + RLS

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('koordinator','guru');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text unique not null,
  role public.user_role not null default 'guru',
  status public.account_status not null default 'pending',
  requested_halaqoh text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.halaqoh (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.examiners (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_halaqoh (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  halaqoh_id uuid not null references public.halaqoh(id) on delete cascade,
  primary key (teacher_id, halaqoh_id)
);

create table if not exists public.teacher_class (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  is_partner_wali boolean not null default false,
  primary key (teacher_id, class_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  class_id uuid not null references public.classes(id),
  halaqoh_id uuid references public.halaqoh(id),
  nis text unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_journals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  halaqoh_id uuid not null references public.halaqoh(id),
  teacher_id uuid not null references public.profiles(id),
  month_start date not null,
  hafalan text not null,
  catatan text,
  created_at timestamptz not null default now(),
  unique(student_id, month_start)
);

create table if not exists public.quarterly_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id),
  teacher_id uuid not null references public.profiles(id),
  period_start date not null,
  month1_journal_id uuid references public.monthly_journals(id) on delete set null,
  month2_journal_id uuid references public.monthly_journals(id) on delete set null,
  month3_journal_id uuid references public.monthly_journals(id) on delete set null,
  persentase numeric(5,2) default 0,
  catatan text,
  created_at timestamptz not null default now(),
  unique(student_id, period_start)
);

create table if not exists public.exam_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  halaqoh_id uuid references public.halaqoh(id),
  juz text not null,
  tanggal date not null,
  status text not null default 'Menunggu Verifikasi',
  predikat text,
  examiner_id uuid references public.examiners(id),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_coordinator()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='koordinator' and p.status='approved');
$$;

create or replace function public.is_approved_teacher()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='approved');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,nama,email,role,status)
  values(new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)), new.email, 'guru', 'pending', new.raw_user_meta_data->>'halaqoh')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.halaqoh enable row level security;
alter table public.examiners enable row level security;
alter table public.teacher_halaqoh enable row level security;
alter table public.teacher_class enable row level security;
alter table public.students enable row level security;
alter table public.monthly_journals enable row level security;
alter table public.quarterly_reports enable row level security;
alter table public.exam_requests enable row level security;

-- Profiles
create policy "profiles own or coordinator select" on public.profiles for select using (id=auth.uid() or public.is_coordinator());
create policy "coordinator manage profiles" on public.profiles for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Master data
create policy "approved users read classes" on public.classes for select using (public.is_approved_teacher());
create policy "coordinator manage classes" on public.classes for all using (public.is_coordinator()) with check (public.is_coordinator());
create policy "approved users read halaqoh" on public.halaqoh for select using (public.is_approved_teacher());
create policy "coordinator manage halaqoh" on public.halaqoh for all using (public.is_coordinator()) with check (public.is_coordinator());
create policy "approved users read examiners" on public.examiners for select using (public.is_approved_teacher());
create policy "coordinator manage examiners" on public.examiners for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Assignments
create policy "users read own teacher halaqoh" on public.teacher_halaqoh for select using (teacher_id=auth.uid() or public.is_coordinator());
create policy "coordinator manage teacher halaqoh" on public.teacher_halaqoh for all using (public.is_coordinator()) with check (public.is_coordinator());
create policy "users read own teacher class" on public.teacher_class for select using (teacher_id=auth.uid() or public.is_coordinator());
create policy "coordinator manage teacher class" on public.teacher_class for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Students: approved users read; coordinator manages. Teachers may insert/update only students in their assigned class/halaqoh via app workflows.
create policy "approved users read students" on public.students for select using (public.is_approved_teacher());
create policy "coordinator manage students" on public.students for all using (public.is_coordinator()) with check (public.is_coordinator());
create policy "teachers manage assigned students" on public.students for insert with check (
  public.is_approved_teacher() and (exists(select 1 from public.teacher_class tc where tc.teacher_id=auth.uid() and tc.class_id=class_id) or exists(select 1 from public.teacher_halaqoh th where th.teacher_id=auth.uid() and th.halaqoh_id=halaqoh_id))
);
create policy "teachers update assigned students" on public.students for update using (
  exists(select 1 from public.teacher_class tc where tc.teacher_id=auth.uid() and tc.class_id=class_id) or exists(select 1 from public.teacher_halaqoh th where th.teacher_id=auth.uid() and th.halaqoh_id=halaqoh_id)
) with check (true);

-- Journal
create policy "approved users read journals" on public.monthly_journals for select using (public.is_approved_teacher());
create policy "teachers insert own journals" on public.monthly_journals for insert with check (teacher_id=auth.uid() and exists(select 1 from public.teacher_halaqoh th where th.teacher_id=auth.uid() and th.halaqoh_id=monthly_journals.halaqoh_id));
create policy "teachers update own journals" on public.monthly_journals for update using (teacher_id=auth.uid()) with check (teacher_id=auth.uid());
create policy "coordinator manage journals" on public.monthly_journals for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Quarterly reports
create policy "approved users read reports" on public.quarterly_reports for select using (public.is_approved_teacher());
create policy "class teachers insert reports" on public.quarterly_reports for insert with check (teacher_id=auth.uid() and exists(select 1 from public.teacher_class tc where tc.teacher_id=auth.uid() and tc.class_id=quarterly_reports.class_id));
create policy "class teachers update reports" on public.quarterly_reports for update using (teacher_id=auth.uid()) with check (teacher_id=auth.uid());
create policy "coordinator manage reports" on public.quarterly_reports for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Exams
create policy "approved users read exams" on public.exam_requests for select using (public.is_approved_teacher());
create policy "teachers insert exams" on public.exam_requests for insert with check (teacher_id=auth.uid());
create policy "teachers update own exams" on public.exam_requests for update using (teacher_id=auth.uid()) with check (teacher_id=auth.uid());
create policy "coordinator manage exams" on public.exam_requests for all using (public.is_coordinator()) with check (public.is_coordinator());

-- Application settings / Peraturan
create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  institution_name text not null default 'Administrasi Tahfidz',
  logo_url text not null default '',
  theme text not null default 'emerald' check (theme in ('emerald','blue','purple','amber','rose')),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "approved users read app settings" on public.app_settings
for select using (public.is_approved_teacher());

create policy "coordinator manage app settings" on public.app_settings
for all using (public.is_coordinator()) with check (public.is_coordinator());

insert into public.app_settings (id, institution_name, logo_url, theme)
values (1, 'Administrasi Tahfidz', '', 'emerald')
on conflict (id) do nothing;
