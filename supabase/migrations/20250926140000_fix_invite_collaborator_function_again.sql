/*
          # [Operation Name]
          Fix Invite Collaborator Function

          ## Query Description: [This operation corrects a syntax error in the `invite_collaborator` function. The previous version had a mismatched parenthesis in the `WHERE` clause when checking for existing collaborations. This fix ensures the query is syntactically correct and can execute without errors.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Function: `invite_collaborator`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [Invoker must be authenticated.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low]
          */
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text,numeric);

CREATE OR REPLACE FUNCTION public.invite_collaborator(
    p_invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitee_id uuid;
    inviter_id uuid := auth.uid();
    existing_collaboration_id uuid;
    new_collaborator_record json;
BEGIN
    -- Find the user to invite by email in the auth schema
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- Prevent inviting self
    IF invitee_id IS NOT NULL AND invitee_id = inviter_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
    END IF;

    -- Check if already a collaborator for any of the selected projects
    SELECT id INTO existing_collaboration_id
    FROM collaborators
    WHERE 
        (user_id = invitee_id OR (user_id IS NULL AND email = p_invitee_email AND status = 'pending'))
        AND project_ids && p_project_ids
    LIMIT 1;

    IF existing_collaboration_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour un de ces projets.';
    END IF;

    -- Create the collaboration record
    INSERT INTO collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    VALUES (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, CASE WHEN invitee_id IS NULL THEN 'pending' ELSE 'accepted' END, p_budget_limit)
    RETURNING json_build_object(
        'id', id,
        'owner_id', owner_id,
        'user_id', user_id,
        'email', email,
        'role', role,
        'status', status,
        'project_ids', project_ids,
        'permission_scope', permission_scope,
        'budget_limit', budget_limit
    ) INTO new_collaborator_record;

    RETURN new_collaborator_record;
END;
$$;
