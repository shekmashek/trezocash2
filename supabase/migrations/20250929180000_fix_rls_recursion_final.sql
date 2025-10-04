-- This script provides a definitive fix for the RLS recursion issue by rebuilding
-- the policies for projects and collaborators from a clean slate.

-- Step 1: Ensure the 'permissions' column exists and the old 'role' column is removed.
-- This makes the migration robust against partially failed previous migrations.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='permissions') THEN
    ALTER TABLE public.collaborators ADD COLUMN permissions jsonb;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='role') THEN
    -- Drop any policy that might depend on the 'role' column before dropping it.
    DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
    ALTER TABLE public.collaborators DROP COLUMN role;
  END IF;
END;
$$;


-- Step 2: Drop all potentially conflicting policies to ensure a clean start.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can manage their own collaboration invites" ON public.collaborators;
DROP POLICY IF EXISTS "Users can see collaborators of their projects" ON public.collaborators;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.collaborators;


-- Step 3: Recreate a simple, non-recursive policy for the 'collaborators' table.
-- A user can see/manage a collaboration record if they are the owner (inviter) or the user (invitee).
CREATE POLICY "Users can manage their own collaboration invites"
ON public.collaborators
FOR ALL
USING (
  auth.uid() = owner_id OR auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = owner_id
);


-- Step 4: Recreate policies for the 'projects' table. This breaks the recursion loop.
-- This SELECT policy allows collaborators to view projects they are a part of.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.user_id = auth.uid() AND c.status = 'accepted' AND projects.id = ANY(c.project_ids)
  )
);

-- This policy restricts modification/deletion to only the project owner.
CREATE POLICY "Users can manage their own projects"
ON public.projects
FOR (INSERT, UPDATE, DELETE)
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Step 5: Re-enable RLS on both tables to ensure security is active.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
