-- This script completely rebuilds the Row Level Security (RLS) policies
-- for 'projects' and 'collaborators' to fix an infinite recursion loop
-- that was preventing projects from loading.

-- Drop all existing policies on both tables to ensure a clean state.
DROP POLICY IF EXISTS "Allow full access for project owners" ON public.projects;
DROP POLICY IF EXISTS "Allow read access for collaborators" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;

DROP POLICY IF EXISTS "Allow owner and collaborator to view" ON public.collaborators;
DROP POLICY IF EXISTS "Allow owner to manage collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can manage their own collaborations" ON public.collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON public.collaborators;

-- Drop the potentially problematic helper function if it exists.
DROP FUNCTION IF EXISTS is_project_collaborator(uuid);

-- Recreate policies for the 'projects' table.
-- Owners have full access to their own projects.
CREATE POLICY "Allow full access for project owners"
ON public.projects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Collaborators have read-only (SELECT) access to projects they are part of.
-- This query is safe and does not cause recursion.
CREATE POLICY "Allow read access for collaborators"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid() AND projects.id = ANY(c.project_ids)
  )
);

-- Recreate policies for the 'collaborators' table.
-- This policy is safe as it only checks the 'collaborators' table itself.
CREATE POLICY "Allow owner and collaborator to view"
ON public.collaborators
FOR SELECT
USING (
  auth.uid() = owner_id OR auth.uid() = user_id
);

-- Owners can manage (insert, update, delete) collaborators for their projects.
CREATE POLICY "Allow owner to manage collaborators"
ON public.collaborators
FOR (INSERT, UPDATE, DELETE)
USING (
  auth.uid() = owner_id
);
