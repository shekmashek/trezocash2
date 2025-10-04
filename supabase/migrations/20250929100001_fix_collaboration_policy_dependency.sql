/*
# [FIX] Resolve Policy Dependency on Collaborators Table
This migration fixes a dependency issue that prevented the 'role' column from being dropped from the 'collaborators' table. It does so by temporarily dropping the dependent policy, removing the columns, and then recreating a simplified, more robust policy.

## Query Description:
- **DROP POLICY**: Temporarily removes the security policy on the `projects` table that was blocking changes.
- **ALTER TABLE**: Removes the now-obsolete `role` and `permission_scope` columns from the `collaborators` table.
- **CREATE POLICY**: Re-establishes a simplified security policy that grants access to projects if a user is the owner or is listed as a collaborator, without checking the old 'role' column.

This ensures the database schema is updated correctly to support the new granular permissions system while maintaining row-level security.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- **Dropped Columns**: `role`, `permission_scope` from `public.collaborators`
- **Modified Policy**: `Users can manage their own or shared projects` on `public.projects`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. The policy on the `projects` table is updated. The new policy is simpler but still correctly restricts access to a user's own projects or projects they are a collaborator on. Finer-grained permissions are now managed within the application logic using the `permissions` JSONB column.
- Auth Requirements: `authenticated` users.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The policy change is lightweight.
*/

-- Step 1: Drop the old policy that depends on the 'role' column.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Step 2: Drop the obsolete columns from the collaborators table.
ALTER TABLE public.collaborators
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS permission_scope;

-- Step 3: Recreate a simplified and more robust policy on the projects table.
-- This policy grants access if the user is the owner OR is listed as a collaborator on the project.
-- The fine-grained permissions (read/write, budget limits) are now stored in the `permissions` JSONB column
-- and should be enforced by the application logic or more specific RLS policies on other tables (e.g., budget_entries).
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators
    WHERE
      collaborators.user_id = auth.uid() AND
      projects.id = ANY(collaborators.project_ids) AND
      collaborators.status = 'accepted'
  ))
)
WITH CHECK (
  (auth.uid() = user_id)
);
