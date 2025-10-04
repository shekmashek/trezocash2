-- Drop dependent views if they exist
DROP VIEW IF EXISTS public.monthly_vat_summary;

-- Drop the existing table
DROP TABLE IF EXISTS public.vat_regimes;

-- Recreate the table with the correct schema
CREATE TABLE public.vat_regimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    regime_type TEXT NOT NULL DEFAULT 'reel_normal',
    collection_periodicity TEXT NOT NULL DEFAULT 'monthly',
    payment_delay_months INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_vat_regime_per_project UNIQUE (project_id)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.vat_regimes IS 'Stores the VAT regime settings for each project.';
COMMENT ON COLUMN public.vat_regimes.regime_type IS 'Type of VAT regime (e.g., reel_normal, reel_simplifie).';
COMMENT ON COLUMN public.vat_regimes.collection_periodicity IS 'How often VAT is declared (monthly, quarterly, annually).';
COMMENT ON COLUMN public.vat_regimes.payment_delay_months IS 'Delay in months for payment after the declaration period.';

-- Enable Row Level Security
ALTER TABLE public.vat_regimes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable all for users based on project_id"
ON public.vat_regimes
FOR ALL
USING (
  (get_my_claim('role'::text) = '"superadmin"'::jsonb) OR
  (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_id)) OR
  (auth.uid() IN (SELECT user_id FROM collaborators WHERE project_id = ANY(project_ids)))
)
WITH CHECK (
  (get_my_claim('role'::text) = '"superadmin"'::jsonb) OR
  (auth.uid() IN (SELECT user_id FROM projects WHERE id = project_id)) OR
  (auth.uid() IN (SELECT user_id FROM collaborators WHERE project_id = ANY(project_ids)))
);
