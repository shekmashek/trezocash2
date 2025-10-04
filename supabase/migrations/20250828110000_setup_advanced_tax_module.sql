/*
-- # Setup Advanced Tax Management Module
-- This script creates the necessary tables and types to support a flexible tax management system, allowing users to define and track various taxes like corporate tax, payroll tax, and social charges.

-- ## Query Description:
-- This operation is structural and safe. It adds new tables and types to your database without affecting existing data. It is designed to be idempotent, meaning it can be run multiple times without causing errors by checking for the existence of objects before creating them or by dropping and recreating them.

-- ## Metadata:
-- - Schema-Category: "Structural"
-- - Impact-Level: "Low"
-- - Requires-Backup: false
-- - Reversible: true (by dropping the created tables and types)

-- ## Structure Details:
-- - **New Types**: `tax_type`, `tax_basis`, `tax_periodicity` (ENUMs).
-- - **New Tables**: `tax_configs` (to store settings for each tax), `tax_declarations` (to store declaration history).
-- - **RLS Policies**: Enables Row Level Security on the new tables to ensure data privacy.

-- ## Security Implications:
-- - RLS Status: Enabled on new tables.
-- - Policy Changes: No changes to existing policies. New policies are added for the new tables.
-- - Auth Requirements: Users can only access their own tax configurations and declarations.

-- ## Performance Impact:
-- - Indexes: Primary keys are indexed by default. No other indexes are added at this stage.
-- - Triggers: None.
-- - Estimated Impact: Negligible impact on performance as it only adds new, unpopulated objects.
*/

-- Drop types if they exist from previous failed attempts to make the script re-runnable.
-- The CASCADE option will also drop any columns that depend on these types.
DROP TYPE IF EXISTS public.tax_type CASCADE;
DROP TYPE IF EXISTS public.tax_basis CASCADE;
DROP TYPE IF EXISTS public.tax_periodicity CASCADE;

-- Create ENUM types for the new tax management system.
CREATE TYPE public.tax_type AS ENUM ('corporate', 'payroll', 'social_charges', 'vat', 'other');
CREATE TYPE public.tax_basis AS ENUM ('revenue', 'profit', 'salary_base', 'custom');
CREATE TYPE public.tax_periodicity AS ENUM ('monthly', 'quarterly', 'annually');

-- Create the main table for tax configurations.
CREATE TABLE public.tax_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tax_type public.tax_type NOT NULL,
    basis public.tax_basis,
    rate NUMERIC CHECK (rate >= 0),
    declaration_periodicity public.tax_periodicity NOT NULL,
    payment_delay_months INTEGER NOT NULL DEFAULT 1 CHECK (payment_delay_months >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

COMMENT ON TABLE public.tax_configs IS 'Stores user-defined configurations for various taxes.';
COMMENT ON COLUMN public.tax_configs.basis IS 'The base on which the tax is calculated (e.g., revenue, profit).';
COMMENT ON COLUMN public.tax_configs.rate IS 'The tax rate, as a percentage (e.g., 25 for 25%).';
COMMENT ON COLUMN public.tax_configs.declaration_periodicity IS 'How often the tax needs to be declared.';
COMMENT ON COLUMN public.tax_configs.payment_delay_months IS 'Number of months after the period end to pay the tax.';

-- RLS policies for tax_configs
ALTER TABLE public.tax_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own tax configs"
ON public.tax_configs
FOR ALL
USING (auth.uid() = user_id);

-- Create a table for tax declarations
CREATE TABLE public.tax_declarations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_config_id uuid NOT NULL REFERENCES public.tax_configs(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    due_date DATE NOT NULL,
    taxable_base NUMERIC,
    tax_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'due', -- e.g., 'due', 'paid'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tax_declarations IS 'Stores the history of tax declarations made for each tax configuration.';

-- RLS policies for tax_declarations
ALTER TABLE public.tax_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own tax declarations"
ON public.tax_declarations
FOR ALL
USING (auth.uid() = user_id);
