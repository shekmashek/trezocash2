--
-- /*
          # [Composite RLS Policy Fix]
          [This script drops all existing, potentially faulty, Row Level Security (RLS) policies on the 'projects' and 'collaborators' tables and recreates them using the correct syntax and a secure helper function. This is a critical fix to resolve both a SQL syntax error in previous migrations and an "infinite recursion" error that was preventing users from loading their projects.]

          ## Query Description: [This operation will reset and correctly re-apply all access control rules for projects and collaborators. It is designed to be safe and non-destructive to your data, but it fundamentally changes how data access is checked. It ensures that project owners have full control and collaborators can only see projects they are explicitly invited to, fixing the critical login/data loading issue.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables affected: 'public.projects', 'public.collaborators'
          - Functions created: 'public.is_member_of(uuid)'
          - Policies affected: All RLS policies on the affected tables.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low. The use of a helper function is efficient and should resolve a performance-blocking recursion issue.]
          */
--

-- Step 1: Drop all potentially conflicting old policies on both tables.
DROP POLICY IF EXISTS "Enable all for owner" ON public.projects;
DROP POLICY IF EXISTS "Enable read for collaborators" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

DROP POLICY IF EXISTS "Enable all for owner" ON public.collaborators;
DROP POLICY IF EXISTS "Enable read for collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can manage their own collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.collaborators;

-- Step 2: Create a secure helper function to check project membership and break recursion.
-- This function checks if the currently authenticated user is either the owner of a project
-- or an accepted collaborator on it.
CREATE OR REPLACE FUNCTION public.is_member_of(project_id_to_check uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_id_to_check
      AND p.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.project_ids @> ARRAY[project_id_to_check]
      AND c.user_id = auth.uid()
      AND c.status = 'accepted'
  );
END;
$$;

-- Step 3: Re-enable RLS and create the corrected policies for the 'projects' table.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy for project owners: They can do anything with their own projects.
CREATE POLICY "Enable all for owner"
ON public.projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for collaborators: They can only read projects they are a member of.
CREATE POLICY "Enable read for collaborators"
ON public.projects
FOR SELECT
TO authenticated
USING (public.is_member_of(id));

-- Step 4: Re-enable RLS and create the corrected policies for the 'collaborators' table.
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Policy for owners: They can manage collaborators for their own projects.
CREATE POLICY "Enable all for owner"
ON public.collaborators
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy for collaborators: They can see other collaborators on projects they are also a member of.
CREATE POLICY "Enable read for collaborators"
ON public.collaborators
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM unnest(project_ids) AS pid
  WHERE public.is_member_of(pid)
));
