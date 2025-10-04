-- =================================================================
-- FIX: Rebuild RLS policies for 'projects' table
--
-- ## Query Description:
-- This script completely rebuilds the Row Level Security (RLS) policies for the 'projects' table.
-- It first DROPS all existing policies on the table to remove any lingering dependencies on old,
-- deleted columns like 'role'. It then re-creates the necessary policies (SELECT, INSERT, UPDATE, DELETE)
-- using the correct, current schema that relies on the 'collaborators' table without referencing 'role'.
-- This is a safe operation that only affects security rules, not your data.
--
-- ## Metadata:
-- - Schema-Category: "Structural"
-- - Impact-Level: "Low"
-- - Requires-Backup: false
-- - Reversible: true (by manually recreating old policies if needed)
--
-- ## Security Implications:
-- - RLS Status: Enabled
-- - Policy Changes: Yes (Complete rebuild of policies on 'projects' table)
-- - Auth Requirements: Policies correctly reference auth.uid()
-- =================================================================

-- Step 1: Drop all potentially problematic RLS policies on the 'projects' table.
DROP POLICY IF EXISTS "Users can see own and collaborated projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for own and collaborated projects" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for owners" ON public.projects;
DROP POLICY IF EXISTS "Enable update for own and collaborated projects" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.projects;

-- Step 2: Recreate the policies with the correct logic.

-- POLICY: Users can SELECT projects they own OR are a collaborator on.
CREATE POLICY "Enable read access for own and collaborated projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE
      collaborators.user_id = auth.uid() AND
      collaborators.status = 'accepted' AND
      collaborators.project_ids @> ARRAY[projects.id]
  )
);

-- POLICY: Authenticated users can INSERT new projects for themselves.
CREATE POLICY "Enable insert for authenticated users"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- POLICY: Users can UPDATE projects they own. Collaborators cannot update project-level details.
CREATE POLICY "Enable update for owners"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLICY: Users can DELETE projects they own.
CREATE POLICY "Enable delete for owners"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);
