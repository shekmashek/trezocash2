/*
          # [Operation Name]
          Add Currency to Cash Accounts

          ## Query Description: [This operation adds a `currency` column to the `cash_accounts` table to allow each cash account to have its own currency, independent of the project's main currency. It defaults to 'EUR' for existing accounts.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Table: `cash_accounts`
          - Columns Added: `currency` (TEXT, default 'EUR')
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [No Change]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low. May require a brief table lock on large tables during migration.]
          */
ALTER TABLE public.cash_accounts
ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';
