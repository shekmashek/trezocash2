/*
# [Fix] Definitive RLS Policy Update for Projects
[This script definitively fixes the Row-Level Security (RLS) policy on the 'projects' table to ensure it no longer depends on the deleted 'role' column. It drops the old policy and recreates it using a safe existence check on the 'collaborators' table. This is critical to allow users to see projects shared with them.]

## Query Description: [This operation is a safe, structural change to a security policy. It is essential for fixing a critical bug preventing users from accessing their projects. It does not modify or delete any user data.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Policy: "Users can manage their own or shared projects" on table "public.projects"

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [authenticated]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. The query is optimized.]
*/

-- Drop the old policy that might still depend on the 'role' column
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Recreate the policy using a safe existence check that does not depend on 'role'
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid() AND c.status = 'accepted' AND c.project_ids @> ARRAY[projects.id]
  ))
);
