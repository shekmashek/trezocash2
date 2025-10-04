/*
# [Composite RLS Policy Fix]
[This migration fixes an infinite recursion error in the Row-Level Security policies by correctly dropping and recreating dependent objects.]

## Query Description: [This operation resets and rebuilds the security policies for the 'projects' table to resolve a critical access issue. It first removes the policies that are causing a recursive loop, then drops the function they depend on, and finally recreates both the function and the policies with a corrected, safe logic. This is a safe operation designed to restore access to your projects.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops policies: "Users can view their own or shared projects", "Enable all access for project members" on table "projects".
- Drops function: "is_project_member(uuid)".
- Recreates function: "is_project_member(uuid)".
- Recreates policies on table "projects" with corrected logic.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. This is a metadata change and should be very fast.]
*/

-- Drop dependent policies first
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project members" ON public.projects;

-- Now, drop the function
DROP FUNCTION IF EXISTS public.is_project_member(p_project_id uuid);

-- Recreate the function with the correct logic
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE
      auth.uid() = collaborators.user_id AND
      collaborators.project_ids @> ARRAY[p_project_id] AND
      collaborators.status = 'accepted'
  );
END;
$$;

-- Recreate policies with the correct logic
-- Policy 1: Users can view their own projects or projects shared with them.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id OR
  is_project_member(id)
);

-- Policy 2: Project owners can manage the project.
CREATE POLICY "Enable all access for project owners"
ON public.projects
FOR ALL
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);
