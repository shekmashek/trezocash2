-- Drop all potentially conflicting RLS policies on projects and collaborators
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for project owners" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for collaborators" ON public.projects;

DROP POLICY IF EXISTS "Users can view their own collaboration records" ON public.collaborators;
DROP POLICY IF EXISTS "Users can manage collaborations they own" ON public.collaborators;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.collaborators;

-- Recreate a single, correct RLS policy for the 'projects' table
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects FOR ALL
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators
    WHERE
      collaborators.user_id = auth.uid() AND
      collaborators.project_ids @> ARRAY[projects.id] AND
      collaborators.status = 'accepted'
  ))
);

-- Recreate correct RLS policies for the 'collaborators' table
CREATE POLICY "Users can view their own collaboration records"
ON public.collaborators FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can manage collaborations they own"
ON public.collaborators FOR ALL
USING (auth.uid() = owner_id);
