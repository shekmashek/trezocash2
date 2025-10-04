/*
  # [Final RLS Policy Overhaul for Projects and Collaborators]
  This migration script performs a complete and final overhaul of the Row Level Security (RLS) policies for the `projects` and `collaborators` tables. It is designed to definitively fix an "infinite recursion" error that prevents data from loading, which was caused by circular dependencies between the policies on these two tables.

  ## Query Description:
  - **Drops all old policies and helper functions:** This ensures a clean slate and removes any conflicting or outdated rules.
  - **Creates a new, safe helper function `is_project_member`:** This function checks for project ownership or collaboration without querying the `projects` table itself, which is the key to breaking the recursion loop.
  - **Re-creates policies for `projects`:** It sets up clear, non-recursive rules for who can view, create, update, and delete projects.
  - **Re-creates policies for `collaborators`:** It defines who can manage collaborator records, accept invitations, and view other collaborators on shared projects, also in a non-recursive way.

  This is a critical structural fix. Please ensure you have a backup before applying if you have made manual changes to your RLS policies.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false
*/

-- Step 1: Drop all potentially conflicting policies and functions.
-- The CASCADE option is crucial here as it automatically drops dependent policies.
DROP FUNCTION IF EXISTS public.is_project_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_project_member(uuid, uuid) CASCADE;

-- It's safe to run DROP IF EXISTS even if policies were already dropped by CASCADE.
DROP POLICY IF EXISTS "Enable read access for members" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for owners" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.projects;
DROP POLICY IF EXISTS "Owners can manage their own collaboration records" ON public.collaborators;
DROP POLICY IF EXISTS "Users can see and act on their invites" ON public.collaborators;
DROP POLICY IF EXISTS "Collaborators can view fellow collaborators" ON public.collaborators;

-- Step 2: Create a new, safe helper function for checking project membership.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid, p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    p_owner_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.collaborators
      WHERE collaborators.user_id = auth.uid()
        AND collaborators.status = 'accepted'
        AND collaborators.project_ids @> ARRAY[p_project_id]
    )
  );
END;
$$;

-- Step 3: Re-create and enable RLS policies for the 'projects' table.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for members" ON public.projects
  FOR SELECT
  USING (public.is_project_member(id, user_id));

CREATE POLICY "Enable insert for authenticated users" ON public.projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for owners" ON public.projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for owners" ON public.projects
  FOR DELETE
  USING (user_id = auth.uid());

-- Step 4: Re-create and enable RLS policies for the 'collaborators' table.
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own collaboration records" ON public.collaborators
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can see and act on their invites" ON public.collaborators
  FOR ALL
  USING (email = auth.email() AND status = 'pending');

CREATE POLICY "Collaborators can view fellow collaborators" ON public.collaborators
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.collaborators c2
      WHERE c2.user_id = auth.uid()
        AND c2.status = 'accepted'
        AND c2.project_ids && collaborators.project_ids
    )
  );
