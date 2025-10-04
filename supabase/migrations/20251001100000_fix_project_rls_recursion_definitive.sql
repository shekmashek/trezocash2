/*
# [Definitive RLS Fix for Projects]
This migration completely rebuilds the Row Level Security (RLS) policies for the `projects` table to resolve a critical "infinite recursion" error. This error prevented users from seeing their projects.

## Query Description:
- **DROP POLICIES**: It first removes all old, potentially conflicting policies on the `projects` table.
- **DROP FUNCTION**: It removes the `is_project_member` function, which was a source of recursion.
- **CREATE POLICIES**: It then creates a new, safe set of policies:
  - **SELECT**: Allows users to see projects they own OR are an accepted collaborator on. This is done via a direct, non-recursive subquery.
  - **INSERT**: Allows any authenticated user to create a project for themselves.
  - **UPDATE/DELETE**: Restricts modifications and deletions to the project owner only.
- **ENABLE RLS**: Finally, it ensures RLS is enabled.

This change is safe and essential for the application to function correctly. It restores access to projects for all users.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false (but the new state is the correct one)

## Structure Details:
- Table: `public.projects` (Policies)
- Function: `public.is_project_member` (Dropped)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (Complete rebuild of policies for `projects`)
- Auth Requirements: Policies rely on `auth.uid()`.

## Performance Impact:
- Indexes: The subquery in the SELECT policy will benefit from an index on `collaborators(user_id)`.
- Triggers: None.
- Estimated Impact: Performance should be good and, most importantly, the query will no longer fail.
*/

-- Step 1: Drop all existing policies on the projects table to avoid conflicts.
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project owners" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;


-- Step 2: Drop the problematic function that was causing the recursion.
-- This is now safe because the policies depending on it have been dropped.
DROP FUNCTION IF EXISTS public.is_project_member(p_project_id uuid);
DROP FUNCTION IF EXISTS public.is_project_member(uuid);


-- Step 3: Recreate the policies with a non-recursive and secure logic.

-- Policy for SELECT: Users can see projects they own OR are a collaborator in.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (id IN (
    SELECT unnest(project_ids)
    FROM public.collaborators
    WHERE
      user_id = auth.uid() AND status = 'accepted'
  ))
);

-- Policy for INSERT: Any authenticated user can create a project for themselves.
CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Only the owner of the project can update it.
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Only the owner of the project can delete it.
CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);


-- Step 4: Ensure RLS is enabled on the table. This is idempotent.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
