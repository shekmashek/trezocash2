/*
# [Definitive RLS Policy Fix for Projects Table]
This migration provides a comprehensive fix for all Row-Level Security (RLS) policies on the `projects` table. It addresses a persistent bug where projects were not loading for users after login due to outdated policies referencing a deleted 'role' column.

## Query Description:
- **Action**: This script first DROPS all potentially problematic policies on the `projects` table to ensure a clean state. It then RECREATES the essential policies (SELECT, INSERT, UPDATE, DELETE) using the correct, current database schema which relies on the `collaborators.permissions` structure instead of the old `role` column.
- **Safety**: This is a safe, non-destructive operation. It only modifies security policies and does not touch or alter any user data.
- **Impact**: After this change, the application will correctly load projects for both owners and collaborators without error, finally resolving the "disappearing projects" issue.
- **Reversibility**: This change is reversible by reapplying old policy definitions, but doing so would reintroduce the critical bug.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects RLS policies on table `public.projects`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Replaces all existing policies on the `projects` table with corrected versions to restore correct access control and fix application-breaking errors.
- Auth Requirements: `auth.uid()`

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The new policy checks are efficient.
*/

-- Drop all old policies to ensure a clean state.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;

-- 1. Recreate SELECT Policy: Allows users to see their own projects or projects shared with them.
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid()
      AND c.status = 'accepted'
      AND c.project_ids @> ARRAY[projects.id]
  ))
);

-- 2. Recreate INSERT Policy: Allows users to create new projects for themselves.
CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Recreate UPDATE Policy: Allows only the owner of a project to update it.
CREATE POLICY "Owners can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Recreate DELETE Policy: Allows only the owner of a project to delete it.
CREATE POLICY "Owners can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);
