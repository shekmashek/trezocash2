/*
# [CRITICAL FIX] Correct RLS Policies for Project & Collaborator Access
[Description of what this operation does]
This migration provides a definitive fix for the "column c.role does not exist" error that occurs on login, which prevents users from seeing their projects. The error is caused by outdated Row Level Security (RLS) policies on the `projects` and `collaborators` tables that still reference the old `role` column, which has been removed. This script will safely drop the old, faulty policies and recreate them using the correct, current database structure. This ensures that data loading on login will succeed.

## Query Description:
This operation is critical for restoring application functionality. It will drop and recreate security policies on core tables.
1.  **Impact on Data:** No data will be lost. This only affects access rules.
2.  **Risks:** If applied incorrectly, it could affect user access to projects. However, the new policies are designed to restore the intended access logic.
3.  **Precautions:** A database backup is always recommended before applying structural or security changes.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Table:** `projects`
  - **Policy:** Drops and recreates the SELECT policy to remove dependency on `collaborators.role`.
- **Table:** `collaborators`
  - **Policy:** Drops and recreates the SELECT policy to remove dependency on `collaborators.role`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Policies on `projects` and `collaborators` are replaced with corrected versions.
- Auth Requirements: Admin privileges required.
*/

-- Step 1: Drop potentially faulty policies on the 'projects' table.
-- Using `IF EXISTS` makes this safe to run even if the policy name is different or absent.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Step 2: Recreate the 'projects' policy correctly, without referencing the 'role' column.
-- A user can see a project if they are the owner OR if they are an accepted collaborator on it.
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE
      c.user_id = auth.uid() AND
      c.project_ids @> ARRAY[projects.id] AND
      c.status = 'accepted'
  )
);

-- Step 3: Drop potentially faulty policies on the 'collaborators' table.
DROP POLICY IF EXISTS "Users can view collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can view collaborators on their projects" ON public.collaborators;

-- Step 4: Recreate the 'collaborators' policy correctly.
-- A user can see their own collaboration records, or records for projects they own.
CREATE POLICY "Users can view collaborators on their projects"
ON public.collaborators
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE
      p.user_id = auth.uid() AND
      collaborators.project_ids @> ARRAY[p.id]
  )
);
