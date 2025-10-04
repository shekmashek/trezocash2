/*
          # [Composite RLS Policy and Function Fix]
          This script provides a definitive fix for the project access issues, including the "infinite recursion" error and function signature errors encountered in previous migrations. It drops all related old policies and functions and recreates them with a secure and non-recursive pattern.

          ## Query Description: [This operation resets and rebuilds the security policies for projects and collaborators. It ensures that users can see their own projects and projects shared with them, without causing database errors. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops and recreates the `is_project_member` function.
          - Drops all existing policies on `projects` and `collaborators` tables.
          - Creates new, safe RLS policies for `projects` and `collaborators`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This script defines the core authentication rules for data access.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. This will improve query performance by resolving the recursion issue.
          */

-- Step 1: Drop the problematic function to allow for recreation with a new signature.
DROP FUNCTION IF EXISTS public.is_project_member(uuid);

-- Step 2: Recreate the function with a stable signature and secure definition.
CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- SET search_path = '' prevents search path hijacking
SET search_path = ''
AS $$
    SELECT EXISTS (
        -- User is the owner of the project
        SELECT 1
        FROM public.projects
        WHERE id = project_id AND user_id = auth.uid()
    ) OR EXISTS (
        -- User is an accepted collaborator on the project
        SELECT 1
        FROM public.collaborators
        WHERE user_id = auth.uid() AND status = 'accepted' AND project_ids @> ARRAY[project_id]
    );
$$;

-- Step 3: Clean up all old policies on the affected tables to prevent conflicts.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for project members" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project owners" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own collaborations" ON public.collaborators;
DROP POLICY IF EXISTS "Enable read access for collaborators" ON public.collaborators;

-- Step 4: Create a single, definitive policy for the 'projects' table.
CREATE POLICY "Enable access for project members"
ON public.projects
FOR ALL
USING (public.is_project_member(id))
WITH CHECK (public.is_project_member(id));

-- Step 5: Create a safe, non-recursive policy for the 'collaborators' table.
CREATE POLICY "Users can manage their own collaborations"
ON public.collaborators
FOR ALL
USING (auth.uid() = owner_id OR auth.uid() = user_id)
WITH CHECK (auth.uid() = owner_id);
