/*
  # [Structural] Add Currency to Cash Accounts
  This migration adds a `currency` column to the `cash_accounts` table to support multi-currency accounts within a single project.

  ## Query Description:
  - Adds a `currency` column of type `TEXT` to the `public.cash_accounts` table.
  - Sets a `DEFAULT` value of 'EUR' for existing rows to prevent data integrity issues.
  - The column is marked as `NOT NULL`.
  - This change is non-destructive but adds a new requirement for account creation.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the column)

  ## Structure Details:
  - Table Modified: `public.cash_accounts`
  - Column Added: `currency` (TEXT, NOT NULL, DEFAULT 'EUR')

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None added
  - Triggers: None added
  - Estimated Impact: Negligible. A default value is set, which may cause a brief table lock on very large tables.
*/

ALTER TABLE public.cash_accounts
ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';

COMMENT ON COLUMN public.cash_accounts.currency IS 'The currency of the cash account, e.g., EUR, USD.';
