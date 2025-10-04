/*
# [Composite RLS Policy Fix]
This migration corrects a syntax error from a previous script and definitively resolves an infinite recursion issue with Row Level Security (RLS) policies.

## Query Description:
This script will:
1. Drop all existing RLS policies on the `projects` and `collaborators` tables to ensure a clean state.
2. Create a `SECURITY DEFINER` function named `is_project_member`. This function securely checks if the current user is an owner or a collaborator on a given project, breaking the recursion loop that was blocking data access.
3. Re-create the RLS policies on both tables using the correct syntax and leveraging the new secure function.

This is a safe and standard procedure to fix complex RLS issues. It will restore access to your projects.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by dropping new policies/function and restoring old ones)

## Structure Details:
- **Tables Affected**: `projects`, `collaborators`
- **Objects Created**: Function `is_project_member(uuid)`
- **Objects Modified**: RLS Policies for `projects` and `collaborators`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Policies are being replaced with a more secure and correct implementation.
- Auth Requirements: Policies are based on `auth.uid()`.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The function call within the policy is efficient.
*/

-- Step 1: Drop all potentially faulty policies on both tables.
-- The IF EXISTS clause prevents errors if the policies were not created due to previous errors.
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can manage collaborators for their projects" ON public.collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own records" ON public.collaborators;

-- Step 2: Create a secure function to check project membership.
-- SECURITY DEFINER breaks the recursive check that was causing the error.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  is_member boolean;
BEGIN
  SELECT EXISTS (
    -- Check if the user is the owner of the project
    SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid()
    UNION ALL
    -- Check if the user is an accepted collaborator for the project
    SELECT 1 FROM public.collaborators WHERE user_id = auth.uid() AND status = 'accepted' AND p_project_id = ANY(project_ids)
  ) INTO is_member;
  RETURN is_member;
END;
$$;

-- Step 3: Re-create policies for the 'projects' table using the secure function.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for project members"
ON public.projects
FOR ALL
USING (public.is_project_member(id))
WITH CHECK (public.is_project_member(id));

-- Step 4: Re-create policies for the 'collaborators' table.
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Owners can see and manage collaborators related to their projects.
CREATE POLICY "Owners can manage collaborators for their projects"
ON public.collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.user_id = auth.uid() AND collaborators.project_ids && ARRAY[p.id]
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.user_id = auth.uid() AND collaborators.project_ids && ARRAY[p.id]
  )
);

-- Collaborators can see their own collaboration record.
CREATE POLICY "Collaborators can view their own records"
ON public.collaborators
FOR SELECT
USING (user_id = auth.uid());
