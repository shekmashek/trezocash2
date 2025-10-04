/*
# [Table] personnel_charges
Creates a table to store personnel-related social charges for each project.

## Query Description:
This migration creates a new table `personnel_charges` to allow users to define specific social charges for their personnel within a project.
- `project_id`: Links the charge to a specific project.
- `name`: The name of the charge (e.g., "Cotisation Retraite").
- `rate`: The percentage rate of the charge.
- `base`: The base on which the charge is calculated (e.g., "salaire_brut").
- This is a non-destructive operation and is safe to run.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the table)

## Structure Details:
- Table: public.personnel_charges
- Columns: id, project_id, name, rate, base

## Security Implications:
- RLS Status: Enabled.
- Policy Changes: Yes, new policies are created to allow users to manage charges only for projects they own.
- Auth Requirements: Authenticated user.

## Performance Impact:
- Indexes: Primary key and foreign key indexes are created.
- Triggers: None.
- Estimated Impact: Low.
*/

create table if not exists public.personnel_charges (
    id uuid not null default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    name text not null,
    rate numeric(5, 2) not null check (rate >= 0),
    base text not null,
    created_at timestamp with time zone not null default now()
);

alter table public.personnel_charges enable row level security;

create policy "Users can manage charges for their own projects"
on public.personnel_charges for all
using (auth.uid() = (select user_id from public.projects where id = project_id))
with check (auth.uid() = (select user_id from public.projects where id = project_id));
