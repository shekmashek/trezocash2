/*
          # [Operation Name]
          Add budget_limit to collaborators

          ## Query Description: [This operation adds a new column `budget_limit` to the `collaborators` table. This column will store the budget ceiling for collaborators with an editor role. A NULL value indicates an unlimited budget. This change is non-destructive and fully reversible.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table Modified: public.collaborators
          - Column Added: budget_limit (NUMERIC)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. The new column is nullable and will not impact existing queries until it is actively used.
          */

ALTER TABLE public.collaborators
ADD COLUMN budget_limit NUMERIC;

COMMENT ON COLUMN public.collaborators.budget_limit IS 'Budget ceiling for collaborators with editor role. NULL means unlimited.';
