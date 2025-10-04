/*
  # [Schema-Update] Add Currency Symbol to Projects
  [This migration adds a `currency_symbol` column to the `projects` table to allow for custom currency symbols while retaining the ISO code for API calls. It also backfills the symbol for existing common currencies.]

  ## Query Description: [This is a safe, non-destructive structural change. It adds a new column to store currency symbols and populates it for existing projects based on their ISO codes. No data is at risk.]
  
  ## Metadata:
  - Schema-Category: ["Structural", "Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table 'projects': ADD COLUMN 'currency_symbol' (TEXT)
  
  ## Security Implications:
  - RLS Status: [No change]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible. A one-time update on a small table.]
*/

-- Add the currency_symbol column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS currency_symbol TEXT;

-- Update existing projects with common currency symbols
UPDATE public.projects
SET currency_symbol = '€'
WHERE currency = 'EUR' AND currency_symbol IS NULL;

UPDATE public.projects
SET currency_symbol = '$'
WHERE currency = 'USD' AND currency_symbol IS NULL;

UPDATE public.projects
SET currency_symbol = '£'
WHERE currency = 'GBP' AND currency_symbol IS NULL;

UPDATE public.projects
SET currency_symbol = 'CHF'
WHERE currency = 'CHF' AND currency_symbol IS NULL;

UPDATE public.projects
SET currency_symbol = 'C$'
WHERE currency = 'CAD' AND currency_symbol IS NULL;

UPDATE public.projects
SET currency_symbol = 'Ar'
WHERE currency = 'MGA' AND currency_symbol IS NULL;

-- Set a default for any other existing projects
UPDATE public.projects
SET currency_symbol = currency
WHERE currency_symbol IS NULL;
