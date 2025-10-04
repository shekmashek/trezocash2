/*
# [Fix] Correct `invite_collaborator` Function
This migration corrects the `invite_collaborator` function to handle new collaborations, pending invitations, and updates to existing collaborations correctly. It resolves a syntax error and ensures the function is robust.

## Query Description:
This operation drops the old, faulty version of the `invite_collaborator` function and replaces it with a corrected version. There is no risk to existing data as this only affects the function definition.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (but the old function was broken)

## Structure Details:
- Drops function: `public.invite_collaborator(text, uuid[], text, text, numeric)`
- Creates/Replaces function: `public.invite_collaborator(text, uuid[], text, text, numeric)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: The function is defined with `SECURITY DEFINER` to perform privileged operations, which is the intended and necessary behavior for this feature. The logic within the function is secure.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a DDL change.
*/

-- Drop the specific function signature that was causing issues.
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text,numeric);

-- Recreate the function with corrected syntax and logic.
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
    inviter_id uuid;
    invitee_id uuid;
    existing_collaboration_id uuid;
    new_collaborator_record collaborators;
    profile_data json;
BEGIN
    -- Get the ID of the user calling the function
    inviter_id := auth.uid();

    -- Find the user to invite by email
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- If the user doesn't exist, create a pending invitation
    IF invitee_id IS NULL THEN
        -- Check if a pending invitation for this email already exists for any of these projects
        SELECT id INTO existing_collaboration_id
        FROM public.collaborators
        WHERE email = p_invitee_email
          AND status = 'pending'
          AND project_ids &amp;&amp; p_project_ids; -- Use &amp;&amp; for array overlap

        IF existing_collaboration_id IS NOT NULL THEN
            RAISE EXCEPTION 'Une invitation est déjà en attente pour cet e-mail sur l''un de ces projets.';
        END IF;

        -- Insert a pending collaboration
        INSERT INTO public.collaborators (owner_id, email, role, permission_scope, project_ids, status, budget_limit)
        VALUES (inviter_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, 'pending', p_budget_limit)
        RETURNING * INTO new_collaborator_record;

        RETURN json_build_object('status', 'pending', 'collaborator', row_to_json(new_collaborator_record));
    END IF;

    -- Prevent inviting self
    IF invitee_id = inviter_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
    END IF;

    -- Check if the user is already a collaborator on any of the selected projects
    SELECT id INTO existing_collaboration_id
    FROM public.collaborators
    WHERE user_id = invitee_id
      AND project_ids &amp;&amp; p_project_ids; -- Use &amp;&amp; for array overlap

    IF existing_collaboration_id IS NOT NULL THEN
        -- The user is already a collaborator on at least one of the projects.
        -- We can either throw an error or update their access. Let's update.
        UPDATE public.collaborators
        SET project_ids = (SELECT array_agg(DISTINCT e) FROM unnest(project_ids || p_project_ids) e)
        WHERE id = existing_collaboration_id
        RETURNING * INTO new_collaborator_record;

        -- Fetch profile data for the response
        SELECT json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email)
        INTO profile_data
        FROM public.profiles p
        WHERE p.id = invitee_id;

        RETURN json_build_object('status', 'updated', 'collaborator', row_to_json(new_collaborator_record), 'profile', profile_data);
    ELSE
        -- Insert a new 'accepted' collaboration
        INSERT INTO public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
        VALUES (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, 'accepted', p_budget_limit)
        RETURNING * INTO new_collaborator_record;

        -- Fetch profile data for the response
        SELECT json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email)
        INTO profile_data
        FROM public.profiles p
        WHERE p.id = invitee_id;
        
        RETURN json_build_object('status', 'accepted', 'collaborator', row_to_json(new_collaborator_record), 'profile', profile_data);
    END IF;
END;
$$;
