/*
# [Critical RLS Fix] RLS Policy Reconstruction for Projects

## Query Description: This operation completely rebuilds the Row-Level Security (RLS) policies for the `projects` table to resolve persistent "infinite recursion" and syntax errors. It introduces a `SECURITY DEFINER` function to safely check project access, which is the standard and most secure way to break policy recursion loops. This change is critical to restore access to your projects.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false (old policies are dropped)

## Structure Details:
- Drops all existing policies on `public.projects`.
- Creates a new SQL function `public.can_access_project(uuid)`.
- Creates two new policies on `public.projects`: one for `SELECT` and one for `INSERT, UPDATE, DELETE`.

## Security Implications:
- RLS Status: Remains enabled.
- Policy Changes: Yes. Old policies are replaced with a more secure and correct implementation. This will properly enforce that users can only see their own projects or projects shared with them.
- Auth Requirements: All access is checked against `auth.uid()`.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: The new function-based check might have a slight performance overhead compared to a direct policy, but it is necessary to prevent recursion errors and is generally very fast.
*/

-- Step 1: Create a helper function to check project access.
-- Using a SECURITY DEFINER function is the standard way to break RLS recursion loops.
CREATE OR REPLACE FUNCTION public.can_access_project(project_id_to_check uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- Set a secure search_path to prevent hijacking
SET search_path = public
AS $$
    SELECT EXISTS (
        -- 1. User is the owner of the project
        SELECT 1 FROM public.projects WHERE id = project_id_to_check AND user_id = auth.uid()
    ) OR EXISTS (
        -- 2. User is a collaborator on the project
        SELECT 1 FROM public.collaborators WHERE user_id = auth.uid() AND project_id_to_check = ANY(project_ids)
    );
$$;

-- Step 2: Drop all old policies on the projects table to ensure a clean slate.
-- This is necessary to remove any faulty or recursive policies.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can access their projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects; -- Dropping this just in case it exists from a very old state

-- Step 3: Recreate policies using the new, safe helper function.

-- Policy for SELECT: Users can see projects they own OR are a collaborator on.
CREATE POLICY "Users can access their projects"
ON public.projects
FOR SELECT
USING (
  public.can_access_project(id)
);

-- Policy for INSERT, UPDATE, DELETE: Only the project owner can modify or delete it.
-- This is a stricter and safer rule for modification operations.
CREATE POLICY "Owners can manage their projects"
ON public.projects
FOR INSERT, UPDATE, DELETE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);
