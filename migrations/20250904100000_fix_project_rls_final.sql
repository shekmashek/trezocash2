/*
  # [RLS Final Fix]
  This script provides a definitive fix for the project visibility issue by correctly rebuilding the Row Level Security (RLS) policies on the 'projects' table. It resolves the "infinite recursion" and syntax errors from previous attempts.

  ## Query Description:
  This operation will first remove all existing security policies on the 'projects' table to clean up any faulty rules. It then creates a secure helper function to check user permissions and re-applies new, correct policies. This will restore access to your projects without any data loss.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false (but recreates necessary policies)

  ## Structure Details:
  - Drops all policies on 'public.projects'.
  - Creates a new function 'public.is_project_member(uuid)'.
  - Creates new 'SELECT', 'INSERT', 'UPDATE', 'DELETE' policies on 'public.projects'.

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
  - Auth Requirements: Applies to authenticated users.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low. The new function is optimized for permission checks.
*/

-- Step 1: Clean up any existing, potentially faulty policies on the projects table.
-- This is a safe operation as we will recreate them immediately.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project owners" ON public.projects;


-- Step 2: Create a secure helper function to check if a user is a member of a project (either owner or collaborator).
-- Using SECURITY DEFINER is crucial to break the recursive loop that caused the "infinite recursion" error.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    -- Check if the user is the owner of the project
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE id = p_project_id AND user_id = auth.uid()
    )
    OR
    -- Check if the user is an accepted collaborator on the project
    EXISTS (
      SELECT 1
      FROM public.collaborators
      WHERE user_id = auth.uid() AND p_project_id = ANY(project_ids) AND status = 'accepted'
    )
  );
END;
$$;

-- Step 3: Re-create the policies using the new helper function.

-- Policy for SELECT: Users can see projects they own or are a collaborator on.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (public.is_project_member(id));

-- Policy for INSERT: Users can create new projects for themselves.
CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update projects they own.
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete projects they own.
CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);
