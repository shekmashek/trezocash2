/*
          # [Operation Name]
          Create Personnel Charges Table

          ## Query Description: [This operation creates a new table `personnel_charges` to store social security contribution rates and other personnel-related charges for each project. It includes columns for the charge name, rate, calculation base, and links to the project.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: `personnel_charges`
          - Columns: `id`, `project_id`, `name`, `rate`, `base`, `created_at`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Users can only access charges related to their own projects.]
          
          ## Performance Impact:
          - Indexes: [Primary key on `id`, foreign key on `project_id`]
          - Triggers: [None]
          - Estimated Impact: [Low, as it's a new table with standard indexing.]
          */
CREATE TABLE public.personnel_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC(5, 2) NOT NULL,
    base TEXT NOT NULL, -- e.g., 'salaire_brut', 'salaire_net'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personnel_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable access for project members"
ON public.personnel_charges
FOR ALL
USING (
    (get_my_claim('role'::text) = '"superadmin"'::jsonb) OR
    (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_id)) OR
    (auth.uid() IN (SELECT user_id FROM collaborators WHERE project_id = ANY(project_ids)))
);
