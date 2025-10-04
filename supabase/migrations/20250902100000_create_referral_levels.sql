/*
# [Referral System] Create and Populate Referral Levels Table
This migration creates the `referral_levels` table and populates it with the different ambassador tiers.

## Query Description:
This operation creates a new table `referral_levels` to store the different tiers of the ambassador program (Bronze, Silver, etc.), their requirements, and commission rates. It also inserts the initial data for these levels. This is a non-destructive operation and is essential for the referral system to function correctly.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The table can be dropped)

## Structure Details:
- Table created: `public.referral_levels`
- Columns: `id`, `name`, `min_referrals`, `commission_rate`, `created_at`
- Data inserted: 6 rows for Bronze to Legendary levels.

## Security Implications:
- RLS Status: Enabled on the new table.
- Policy Changes: Yes, a new read-only policy is added for authenticated users.
- Auth Requirements: None for this migration.

## Performance Impact:
- Indexes: A primary key index is created on `id` and a unique index on `name`.
- Triggers: None.
- Estimated Impact: Negligible.
*/

-- Create the referral_levels table
CREATE TABLE IF NOT EXISTS public.referral_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    min_referrals INT NOT NULL,
    commission_rate NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referral_levels ENABLE ROW LEVEL SECURITY;

-- Policies for referral_levels
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON public.referral_levels
FOR SELECT
TO authenticated
USING (true);

-- Populate the referral_levels table
INSERT INTO public.referral_levels (name, min_referrals, commission_rate)
VALUES
    ('Bronze', 1, 0.00),
    ('Argent', 10, 0.10),
    ('Or', 25, 0.15),
    ('Platinum', 50, 0.20),
    ('Diamant', 100, 0.25),
    ('Legendaire', 200, 0.30)
ON CONFLICT (name) DO UPDATE SET
    min_referrals = EXCLUDED.min_referrals,
    commission_rate = EXCLUDED.commission_rate;
