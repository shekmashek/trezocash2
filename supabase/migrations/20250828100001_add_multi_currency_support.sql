/*
  # [Feature] Multi-Currency Support
  Adds columns to budget and actual transaction tables to support multiple currencies.

  ## Query Description: 
  This operation adds `currency` and `original_amount` columns to the `budget_entries` and `actual_transactions` tables. This is a non-destructive structural change. Existing entries will have NULL values for these new columns, which is expected.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the columns)

  ## Structure Details:
  - `budget_entries`: Adds `currency` (TEXT) and `original_amount` (NUMERIC).
  - `actual_transactions`: Adds `currency` (TEXT) and `original_amount` (NUMERIC).

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None added.
  - Triggers: None added.
  - Estimated Impact: Negligible impact on performance for existing queries.
*/

ALTER TABLE public.budget_entries
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS original_amount NUMERIC;

ALTER TABLE public.actual_transactions
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS original_amount NUMERIC;
