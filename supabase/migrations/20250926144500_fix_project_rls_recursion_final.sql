-- =============================================
-- Composite RLS Policy Fix for projects and collaborators
--
-- Description:
-- This script completely resets the Row Level Security (RLS) policies
-- on the `projects` and `collaborators` tables to fix an infinite
-- recursion loop. It drops the old, problematic policies and functions,
-- and recreates them using a secure and non-recursive pattern.
--
-- This is a safe operation and will not result in data loss.
-- It is critical to apply this migration to restore access to projects.
-- =============================================

-- Drop existing policies to break dependencies
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own collaboration records" ON public.collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.collaborators;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_project_member(uuid);

-- Recreate the function with a more robust and secure definition
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM collaborators
    WHERE
      auth.uid() = collaborators.user_id AND
      p_project_id = ANY(collaborators.project_ids) AND
      collaborators.status = 'accepted'
  );
$$;

-- Recreate policies for the 'projects' table
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id OR
  is_project_member(id)
);

CREATE POLICY "Users can manage their own projects"
ON public.projects
FOR ALL
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Recreate policies for the 'collaborators' table
CREATE POLICY "Users can view their own collaboration records"
ON public.collaborators
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Project owners can manage collaborators"
ON public.collaborators
FOR ALL
USING (
  auth.uid() = owner_id
)
WITH CHECK (
  auth.uid() = owner_id
);

-- Ensure RLS is enabled on both tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
