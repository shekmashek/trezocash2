/*
          # [Operation Name]
          Upgrade Collaborators Permissions

          ## Query Description: [This operation modifies the 'collaborators' table to support granular, category-based permissions. It replaces the simple 'role', 'permission_scope', and 'budget_limit' columns with a single 'permissions' JSONB column. This change is essential for the new fine-grained access control feature but will require existing collaboration data to be migrated or re-established. No data loss will occur on other tables, but existing collaborator roles will be reset.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Table 'collaborators':
            - DROP column 'role'
            - DROP column 'permission_scope'
            - DROP column 'budget_limit'
            - ADD column 'permissions' (jsonb)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: This migration should be run by a database administrator.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. The operation will be fast on tables with a reasonable number of collaborators.
          */

-- Drop old permission columns if they exist
ALTER TABLE public.collaborators
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS permission_scope,
DROP COLUMN IF EXISTS budget_limit;

-- Add the new JSONB column for granular permissions
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS permissions jsonb;
