-- Migration to fix collaboration system and project access
-- This script ensures the database schema is aligned with the latest application code.

-- Step 1: Ensure the 'collaborators' table has the correct structure.
-- Safely drop the old 'role' column if it exists.
ALTER TABLE public.collaborators DROP COLUMN IF EXISTS role;

-- Add the 'permissions' column if it doesn't exist. It should be jsonb.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'collaborators'
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE public.collaborators ADD COLUMN permissions jsonb;
    END IF;
END
$$;

-- Step 2: Fix the Row Level Security (RLS) policy on the 'projects' table.
-- This is the most critical step to fix the "c.role does not exist" error.
-- The old policy was referencing a 'role' column that no longer exists.

-- Drop the old policy to avoid conflicts.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Recreate the policy with the corrected logic that does not reference 'role'.
-- It now checks for a valid collaboration record for the current user and project.
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR ALL
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid()
      AND c.status = 'accepted'
      AND c.project_ids @> ARRAY[projects.id]
  )
)
WITH CHECK (auth.uid() = user_id);
