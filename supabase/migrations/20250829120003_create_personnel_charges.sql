/*
  # Create personnel_charges table
  This migration creates the table to store personnel-related social charges for each project.

  ## Query Description: 
  This operation creates a new table `personnel_charges` to store social charge configurations per project. It is a non-destructive operation and will not affect existing data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: `public.personnel_charges`
  - Columns: `id`, `project_id`, `user_id`, `name`, `rate`, `base`, `created_at`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
  - Auth Requirements: Users can only manage charges for projects they own.
*/

-- 1. Create Table
CREATE TABLE public.personnel_charges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    rate numeric(5, 2) NOT NULL DEFAULT 0.00,
    base text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT personnel_charges_pkey PRIMARY KEY (id),
    CONSTRAINT personnel_charges_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT personnel_charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable RLS
ALTER TABLE public.personnel_charges ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Allow ALL for project owners"
ON public.personnel_charges
FOR ALL
USING (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = personnel_charges.project_id AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Allow READ for project collaborators"
ON public.personnel_charges
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaborators
        WHERE collaborators.user_id = auth.uid() AND personnel_charges.project_id = ANY(collaborators.project_ids)
    )
);
