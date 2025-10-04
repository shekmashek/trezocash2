/*
          # Add Currency Fields to Projects
          Adds currency code and symbol columns to the projects table to support multi-currency features.

          ## Query Description: This operation adds two new columns, `currency` (for ISO code, e.g., 'USD') and `currency_symbol` (e.g., '$'), to the `projects` table. This is a non-destructive change and is required for enabling multi-currency functionalities.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table Modified: `projects`
          - Columns Added: `currency` (TEXT), `currency_symbol` (TEXT)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact.
          */

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS currency_symbol TEXT;
