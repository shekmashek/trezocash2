/*
          # [Composite RLS Policy Fix]
          [This operation completely rebuilds the Row-Level Security (RLS) policies for the 'projects' table to resolve a critical 'infinite recursion' error that was preventing users from seeing their projects. It ensures data access is both secure and functional.]

          ## Query Description: ["This operation will temporarily drop and then correctly recreate security policies on your projects table. There is no risk of data loss, but it is a critical security fix to restore access to your projects. No backup is required, but the operation is essential for the application to function."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          [Affects RLS policies on the 'projects' table and the 'is_project_member' function.]
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low performance impact. This is a structural change to security rules.]
          */

-- Drop existing policies on the 'projects' table to break dependencies.
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Drop the function now that it has no dependents.
DROP FUNCTION IF EXISTS public.is_project_member(uuid);

-- Create a new, secure function to check project membership.
-- This function uses SECURITY DEFINER to avoid recursion issues with RLS.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_member boolean;
BEGIN
  SELECT EXISTS (
    -- User is the owner
    SELECT 1 FROM public.projects p WHERE p.id = p_project_id AND p.user_id = auth.uid()
    UNION ALL
    -- User is a collaborator
    SELECT 1 FROM public.collaborators c WHERE c.project_ids @> ARRAY[p_project_id] AND c.user_id = auth.uid() AND c.status = 'accepted'
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- Re-enable RLS just in case it was disabled.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- Create the new, correct RLS policies for the 'projects' table.

-- 1. SELECT Policy: Users can see projects they own or are a collaborator on.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  public.is_project_member(id)
);

-- 2. INSERT Policy: Users can only insert projects for themselves.
CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- 3. UPDATE Policy: Users can only update projects they own.
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (
  auth.uid() = user_id
);

-- 4. DELETE Policy: Users can only delete projects they own.
CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (
  auth.uid() = user_id
);
