/*
# [Fix] RLS Infinite Recursion on Projects Table
[This migration provides a definitive fix for the "infinite recursion" error that prevents projects from loading. It completely revamps the Row-Level Security (RLS) policies on the 'projects' table to remove the recursive function call that was causing the issue. This ensures that project data can be loaded reliably and securely.]

## Query Description: [This operation resets and corrects the security policies for accessing project data. It drops all existing policies on the 'projects' table and replaces them with a non-recursive, safer set of rules. This is a critical fix to restore core application functionality.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops all policies on `public.projects`.
- Drops the function `is_project_member(uuid)`.
- Creates new, non-recursive policies for SELECT, INSERT, UPDATE, and DELETE on `public.projects`.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- This change corrects a faulty security implementation and restores the intended access control, making the application more secure and stable.

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Positive. Resolves an infinite loop that was likely causing performance degradation and timeouts.]
*/

-- Step 1: Drop all existing policies on the projects table to ensure a clean slate.
-- This is necessary because the old policies depend on the function we are removing.
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update/delete for project owners" ON public.projects;
DROP POLICY IF EXISTS "Enable update for project owners" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for project owners" ON public.projects;


-- Step 2: Drop the problematic function that causes recursion.
DROP FUNCTION IF EXISTS is_project_member(uuid);

-- Step 3: Recreate the policies with a secure, non-recursive logic.

-- Policy for SELECT: Users can see projects they own OR are a collaborator on.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1
    FROM collaborators
    WHERE collaborators.user_id = auth.uid()
      AND projects.id = ANY(collaborators.project_ids)
      AND collaborators.status = 'accepted'
  ))
);

-- Policy for INSERT: Any authenticated user can create a project for themselves.
CREATE POLICY "Enable insert for authenticated users"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Only the project owner can update it.
-- More granular updates (e.g., by collaborators) should be handled by RPC functions.
CREATE POLICY "Enable update for project owners"
ON public.projects
FOR UPDATE
USING (user_id = auth.uid());

-- Policy for DELETE: Only the project owner can delete it.
CREATE POLICY "Enable delete for project owners"
ON public.projects
FOR DELETE
USING (user_id = auth.uid());
