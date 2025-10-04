-- /*
--           # [Fix RLS Policy on Projects]
--           This operation corrects a faulty Row Level Security (RLS) policy on the 'projects' table that was preventing users from seeing projects shared with them.

--           ## Query Description: [This operation will drop the old, incorrect security policy and recreate it with the correct logic. It references the 'project_ids' array in the 'collaborators' table instead of a non-existent 'role' column. This is a safe and necessary fix to restore project visibility for all users.]
          
--           ## Metadata:
--           - Schema-Category: ["Structural"]
--           - Impact-Level: ["Low"]
--           - Requires-Backup: [false]
--           - Reversible: [true]
          
--           ## Structure Details:
--           - Affects RLS policy: "Users can see their own or shared projects" on table "public.projects"
          
--           ## Security Implications:
--           - RLS Status: [Enabled]
--           - Policy Changes: [Yes]
--           - Auth Requirements: [Applies to authenticated users]
          
--           ## Performance Impact:
--           - Indexes: [No change]
--           - Triggers: [No change]
--           - Estimated Impact: [Negligible. Improves query performance by fixing a faulty policy.]
--           */

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can see their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Recreate the policy with the correct logic
CREATE POLICY "Users can see their own or shared projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id
  OR id IN (
    SELECT unnest(project_ids)
    FROM public.collaborators
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);
