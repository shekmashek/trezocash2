/*
  # [Function] invite_collaborator
  [This function handles inviting a collaborator to one or more projects. It grants access immediately if the user exists, or creates a pending invitation if they do not.]

  ## Query Description: [This operation replaces the existing `invite_collaborator` function to fix a syntax error and align with the new collaboration workflow. It ensures that invitations are handled correctly whether the invited user has an account or not.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Drops the existing `invite_collaborator` function.
  - Recreates the `invite_collaborator` function with corrected logic.
  
  ## Security Implications:
  - RLS Status: Not applicable to function definition.
  - Policy Changes: No
  - Auth Requirements: The function uses `auth.uid()` to identify the inviter and performs checks against `auth.users`. It should be called by an authenticated user.
  
  ## Performance Impact:
  - Indexes: Not applicable.
  - Triggers: Not applicable.
  - Estimated Impact: Low. Affects only the collaborator invitation process.
*/

-- Drop the function first to avoid conflicts with return types or parameters
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text,numeric);

CREATE OR REPLACE FUNCTION public.invite_collaborator(
    p_invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric
)
RETURNS collaborators AS $$
DECLARE
    inviter_id uuid;
    invitee_id uuid;
    existing_collaboration_id uuid;
    new_collaborator_record collaborators;
BEGIN
    -- 1. Get the ID of the user calling the function (the inviter)
    inviter_id := auth.uid();

    -- 2. Find the user to invite by email in the auth schema
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- 3. Prevent inviting oneself
    IF invitee_id IS NOT NULL AND invitee_id = inviter_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
    END IF;

    -- 4. Check for existing collaboration or pending invite
    IF invitee_id IS NOT NULL THEN
        -- User exists, check for active collaboration on any of the selected projects
        SELECT id INTO existing_collaboration_id
        FROM collaborators
        WHERE user_id = invitee_id AND project_ids && p_project_ids
        LIMIT 1;
    ELSE
        -- User does not exist, check for a pending invite with the same email for any of the selected projects
        SELECT id INTO existing_collaboration_id
        FROM collaborators
        WHERE email = p_invitee_email AND status = 'pending' AND project_ids && p_project_ids
        LIMIT 1;
    END IF;

    IF existing_collaboration_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour un de ces projets.';
    END IF;

    -- 5. Create the collaboration record
    INSERT INTO collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    VALUES (
        inviter_id,
        invitee_id, -- This will be NULL if the user doesn't exist
        p_invitee_email,
        p_role,
        p_permission_scope,
        p_project_ids,
        CASE WHEN invitee_id IS NOT NULL THEN 'accepted' ELSE 'pending' END,
        p_budget_limit
    )
    RETURNING * INTO new_collaborator_record;

    RETURN new_collaborator_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_collaborator(text,uuid[],text,text,numeric) TO authenticated;
