/*
  # [Feature] Add Tax Configuration System
  [Description] This migration introduces a new table `tax_configs` to store user-defined tax settings for each project. It allows for flexible management of various taxes like corporate tax, payroll tax, etc.

  ## Query Description: 
  - Creates a new table `tax_configs` to hold tax parameters.
  - Adds columns for name, rate, base description, periodicity, and payment delay.
  - Establishes foreign key relationships to `projects` and `auth.users`.
  - Enables Row Level Security (RLS) on the new table.
  - Creates RLS policies to ensure users can only access their own tax configurations.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table and policies)

  ## Structure Details:
  - Table created: `public.tax_configs`
  - Columns added: `id`, `project_id`, `user_id`, `name`, `tax_rate`, `tax_base_description`, `declaration_periodicity`, `payment_delay_months`, `is_deletable`, `created_at`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (new policies for `tax_configs`)
  - Auth Requirements: User must be authenticated.

  ## Performance Impact:
  - Indexes: Primary key and foreign key indexes will be created.
  - Triggers: None.
  - Estimated Impact: Low.
*/

-- Create the tax_configs table
CREATE TABLE IF NOT EXISTS public.tax_configs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    tax_rate numeric DEFAULT 0,
    tax_base_description text,
    declaration_periodicity public.vat_collection_periodicity DEFAULT 'annually'::public.vat_collection_periodicity,
    payment_delay_months integer DEFAULT 1,
    is_deletable boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tax_configs_pkey PRIMARY KEY (id),
    CONSTRAINT tax_configs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT tax_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT tax_configs_project_id_name_key UNIQUE (project_id, name)
);

-- Enable RLS
ALTER TABLE public.tax_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow ALL for project owners"
ON public.tax_configs
FOR ALL
USING (
  auth.uid() = (
    SELECT p.user_id FROM public.projects p WHERE p.id = tax_configs.project_id
  )
);

CREATE POLICY "Allow READ for project collaborators"
ON public.tax_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = tax_configs.project_id AND pc.user_id = auth.uid()
  )
);
