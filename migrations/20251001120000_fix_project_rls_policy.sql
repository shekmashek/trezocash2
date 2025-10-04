--
-- # [Fix Project RLS Policy]
-- This migration corrects the Row Level Security (RLS) policy on the `projects` table.
-- The previous policy was referencing a `role` column on the `collaborators` table that no longer exists,
-- causing errors when fetching projects. This script drops the old policy and recreates it with
-- the correct logic, checking for project ownership or collaboration status without using the obsolete `role` column.
--
-- ## Query Description:
-- - **DROP POLICY**: Safely removes the old, incorrect policy named "Users can manage their own or shared projects".
-- - **CREATE POLICY**: Re-creates the policy with the correct rules:
--   1. A user can see a project if they are the owner (`auth.uid() = user_id`).
--   2. A user can see a project if their `user_id` is in the `collaborators` table and the project's ID is in that collaborator's `project_ids` array.
-- This ensures that project visibility is correctly handled for both owners and collaborators.
--
-- ## Metadata:
-- - Schema-Category: "Structural"
-- - Impact-Level: "Medium"
-- - Requires-Backup: false
-- - Reversible: true (by restoring the old policy definition)
--
-- ## Structure Details:
-- - Affects RLS policy on `public.projects` table.
--
-- ## Security Implications:
-- - RLS Status: Enabled
-- - Policy Changes: Yes
-- - Auth Requirements: This policy relies on `auth.uid()` to identify the current user.
--
-- ## Performance Impact:
-- - Indexes: No change.
-- - Triggers: No change.
-- - Estimated Impact: Low. The query uses indexed columns and is efficient.
--
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators
    WHERE
      collaborators.user_id = auth.uid() AND
      projects.id = ANY(collaborators.project_ids)
  ))
);
