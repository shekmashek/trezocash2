/*
# [FEATURE] Add Personnel Social Charges Table
This migration introduces a new table `personnel_social_charges` to allow users to define and manage social security contributions for their personnel within each project.

## Query Description:
This operation creates a new table `personnel_social_charges` and enables Row Level Security (RLS) on it. It also defines policies to ensure that users can only interact with charges related to projects they own or collaborate on. This change is non-destructive and adds new functionality without affecting existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **New Table:** `public.personnel_social_charges`
  - `id`: UUID, Primary Key
  - `project_id`: UUID, Foreign Key to `public.projects`
  - `name`: TEXT, Not Null
  - `rate`: NUMERIC(5, 2), Not Null
  - `base`: TEXT, Not Null (e.g., 'Salaire Brut')
  - `notes`: TEXT
  - `created_at`: TIMESTAMPTZ

## Security Implications:
- RLS Status: Enabled on `personnel_social_charges`.
- Policy Changes: Yes, new policies are added for SELECT, INSERT, UPDATE, DELETE on the new table.
- Auth Requirements: Users must be authenticated. Access is restricted based on project ownership or collaboration.

## Performance Impact:
- Indexes: Primary key index on `id` and a foreign key index on `project_id` will be created.
- Triggers: None.
- Estimated Impact: Negligible performance impact on existing operations.
*/

-- 1. Create the table
CREATE TABLE public.personnel_social_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC(5, 2) NOT NULL CHECK (rate >= 0),
    base TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.personnel_social_charges ENABLE ROW LEVEL SECURITY;

-- 3. Add comments to the table and columns
COMMENT ON TABLE public.personnel_social_charges IS 'Stores personnel social charges definitions for each project.';
COMMENT ON COLUMN public.personnel_social_charges.name IS 'Name of the social charge (e.g., Cotisation Retraite).';
COMMENT ON COLUMN public.personnel_social_charges.rate IS 'The rate of the charge as a percentage.';
COMMENT ON COLUMN public.personnel_social_charges.base IS 'The calculation base for the charge (e.g., Salaire Brut).';

-- 4. Create RLS policies
CREATE POLICY "Allow full access to project owners"
ON public.personnel_social_charges
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM public.projects WHERE id = personnel_social_charges.project_id
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.projects WHERE id = personnel_social_charges.project_id
    )
);

CREATE POLICY "Allow access to collaborators"
ON public.personnel_social_charges
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.collaborators
        WHERE 
            user_id = auth.uid() 
            AND status = 'accepted'
            AND personnel_social_charges.project_id = ANY(project_ids)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.collaborators
        WHERE 
            user_id = auth.uid() 
            AND status = 'accepted'
            AND personnel_social_charges.project_id = ANY(project_ids)
    )
);
