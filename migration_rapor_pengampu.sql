-- Jalankan sekali di Supabase SQL Editor.
-- Aturan: satu halaqoh hanya boleh memiliki satu guru pengampu.
--
-- 1) Jalankan pemeriksaan ini terlebih dahulu:
-- select h.nama, count(*) as jumlah_guru
-- from public.teacher_halaqoh th
-- join public.halaqoh h on h.id = th.halaqoh_id
-- group by h.nama
-- having count(*) > 1;
--
-- Jika ada hasil, buka menu Data Guru & Persetujuan dan rapikan
-- penugasan agar setiap halaqoh hanya tersambung ke satu guru.
-- Setelah itu jalankan seluruh migration ini.

alter table public.profiles
  add column if not exists nipy text;

do $$
begin
  if exists (
    select 1
    from public.teacher_halaqoh
    group by halaqoh_id
    having count(*) > 1
  ) then
    raise exception
      'Migrasi dibatalkan: masih ada halaqoh yang memiliki lebih dari satu guru. Rapikan penugasan terlebih dahulu.';
  end if;
end
$$;

create unique index if not exists teacher_halaqoh_one_teacher_per_halaqoh
  on public.teacher_halaqoh (halaqoh_id);
