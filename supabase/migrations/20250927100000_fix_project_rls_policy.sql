-- This script fixes the security policy on the 'projects' table.
-- It ensures that you can see both your own projects and projects shared with you.
-- We are dropping the policy and recreating it to ensure the correct version is applied.

-- First, we drop the old policy if it exists. This is safe.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Then, we create the new, corrected policy.
-- This version no longer references the old 'role' column, which was causing the error.
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  -- You can see projects you own
  (auth.uid() = user_id) OR
  -- You can see projects where you are an accepted collaborator
  (EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid()
      AND c.status = 'accepted'
      AND projects.id = ANY(c.project_ids)
  ))
);
