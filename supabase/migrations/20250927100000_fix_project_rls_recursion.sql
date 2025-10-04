/*
  # [Fix Infinite Recursion on Projects RLS]
  This migration fixes a critical issue causing an "infinite recursion" error when accessing or creating projects. The error was due to a faulty Row Level Security (RLS) policy that called a function which in turn queried the same table, creating a loop.

  ## Query Description:
  This script completely overhauls the security policies for the `projects` table to be more direct and efficient, eliminating the recursive loop.

  1.  **DROP FUNCTION `is_project_member`**: The function causing the recursion is removed.
  2.  **DROP POLICIES**: All existing policies on the `projects` table are dropped to ensure a clean state.
  3.  **CREATE `SELECT` POLICY**: A new policy is created that allows users to see projects they own OR projects they are a collaborator on. This logic is now written directly into the policy, avoiding the recursive function call.
  4.  **CREATE `INSERT`, `UPDATE`, `DELETE` POLICIES**: These policies are recreated to ensure users can only manage projects they own directly.

  This change is safe and essential for the application to function correctly. It will restore access to your projects.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: false (but can be replaced with new policies)

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (Complete overhaul of `projects` policies)
  - Auth Requirements: Policies rely on `auth.uid()`.
*/

-- Step 1: Drop the recursive function
DROP FUNCTION IF EXISTS public.is_project_member(uuid);

-- Step 2: Drop all existing policies on the projects table for a clean slate
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Step 3: Recreate policies with non-recursive logic
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (user_id = auth.uid()) -- User is the owner
  OR
  (
    EXISTS (
      SELECT 1
      FROM collaborators
      WHERE
        collaborators.user_id = auth.uid() AND
        collaborators.status = 'accepted' AND
        projects.id = ANY(collaborators.project_ids)
    )
  )
);

CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (user_id = auth.uid());
