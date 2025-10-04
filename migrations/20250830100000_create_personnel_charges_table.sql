/*
# [Feature] Create Personnel Charges Table
This migration creates a new table `personnel_charges` to store social security charges related to personnel for each project.

## Query Description:
This operation is safe and adds a new table to your database schema. It does not affect any existing data. It is designed to enable a new feature for managing personnel-related social charges within project settings.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the table can be dropped)

## Structure Details:
- Creates table `public.personnel_charges` with columns:
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key to projects)
  - `name` (text)
  - `rate` (numeric)
  - `base` (text)
  - `created_at` (timestamp with time zone)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies are created to restrict access to project owners and collaborators.

## Performance Impact:
- Indexes: A primary key index is created on the `id` column. A foreign key relationship is established with the `projects` table.
- Triggers: None
- Estimated Impact: Negligible performance impact. This is a new, unpopulated table.
*/

-- Create the table for personnel charges
CREATE TABLE public.personnel_charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    rate numeric(5, 2) NOT NULL,
    base text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add Primary Key Constraint
ALTER TABLE public.personnel_charges
    ADD CONSTRAINT personnel_charges_pkey PRIMARY KEY (id);

-- Add Foreign Key to projects table
ALTER TABLE public.personnel_charges
    ADD CONSTRAINT personnel_charges_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.personnel_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for project owners and collaborators"
ON public.personnel_charges
FOR SELECT
USING (
    (project_id IN ( SELECT projects.id FROM projects WHERE (projects.user_id = auth.uid()) )) OR 
    (project_id IN ( SELECT unnest(collaborators.project_ids) AS unnest FROM collaborators WHERE (collaborators.user_id = auth.uid()) ))
);

CREATE POLICY "Enable insert for project owners"
ON public.personnel_charges
FOR INSERT
WITH CHECK (
    project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable update for project owners"
ON public.personnel_charges
FOR UPDATE
USING (
    project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete for project owners"
ON public.personnel_charges
FOR DELETE
USING (
    project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
    )
);
