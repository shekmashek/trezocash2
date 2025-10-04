/*
          # [Composite RLS Policy Fix]
          This script resolves an infinite recursion error in the Row Level Security (RLS) policies for the 'projects' table. This error was preventing projects from being loaded correctly. The script works by dropping all existing policies on the 'projects' and 'collaborators' tables to remove dependencies, then recreating them using a secure helper function ('is_project_member') to break the recursive loop.

          ## Query Description:
          - Drops all potentially conflicting RLS policies on 'projects' and 'collaborators'.
          - Drops and recreates the 'is_project_member' helper function with the SECURITY DEFINER option to run with the permissions of the function owner, which is essential for breaking RLS recursion loops.
          - Recreates the necessary policies for viewing and managing projects in a safe, non-recursive way.
          - This operation is safe and will not result in data loss. It only restructures security rules.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables affected: public.projects, public.collaborators
          - Functions affected: public.is_project_member
          
          ## Security Implications:
          - RLS Status: Policies are dropped and recreated.
          - Policy Changes: Yes. This is the primary purpose of the script.
          - Auth Requirements: Must be run by a user with permissions to alter policies and functions (e.g., postgres role).
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. This is a metadata change. Query performance for projects may improve slightly as the recursion is resolved.
          */

-- Step 1: Drop all existing policies on 'projects' and 'collaborators' to remove dependencies.
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for project members" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project owners" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own collaborations" ON public.collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON public.collaborators;

-- Step 2: Drop the helper function now that no policies depend on it.
DROP FUNCTION IF EXISTS public.is_project_member(uuid);

-- Step 3: Recreate the helper function with SECURITY DEFINER to break the recursive loop.
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
    (SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid())
    UNION ALL
    -- User is an accepted collaborator
    (SELECT 1 FROM public.collaborators WHERE user_id = auth.uid() AND status = 'accepted' AND p_project_id = ANY(project_ids))
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- Step 4: Grant execute permission on the function to authenticated users.
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Step 5: Re-enable RLS on the tables (this is safe even if it's already enabled).
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Step 6: Recreate the policies for 'projects' using the new secure function.
CREATE POLICY "Enable read access for project members"
ON public.projects
FOR SELECT
USING (public.is_project_member(id));

CREATE POLICY "Enable all access for project owners"
ON public.projects
FOR ALL
USING (user_id = auth.uid());

-- Step 7: Recreate the policies for 'collaborators'.
CREATE POLICY "Users can manage their own collaborations"
ON public.collaborators
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own collaborations"
ON public.collaborators
FOR SELECT
USING (auth.uid() = user_id);
