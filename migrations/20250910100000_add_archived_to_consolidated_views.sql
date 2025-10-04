/*
  # Add Archived Flag to Consolidated Views
  This migration adds an `is_archived` column to the `consolidated_views` table to allow users to archive and restore consolidated views instead of permanently deleting them.

  ## Query Description:
  - This operation adds a new `is_archived` column of type `boolean` to the `public.consolidated_views` table.
  - The column will have a default value of `false`, ensuring that existing views are not archived by default.
  - This is a non-destructive operation and should not impact existing data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (The column can be dropped)

  ## Structure Details:
  - Table: `public.consolidated_views`
  - Column Added: `is_archived` (boolean, default: false)

  ## Security Implications:
  - RLS Status: Unchanged. Existing policies are not affected.
  - Policy Changes: No.
  - Auth Requirements: None.

  ## Performance Impact:
  - Indexes: None added.
  - Triggers: None added.
  - Estimated Impact: Negligible. Adding a column with a default value to a small table has minimal performance impact.
*/

ALTER TABLE public.consolidated_views
ADD COLUMN is_archived BOOLEAN DEFAULT false;
