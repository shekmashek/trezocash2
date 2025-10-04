/*
# [Function] Fix `invite_collaborator` Function

This script corrects a syntax error in the `invite_collaborator` function that was introduced in a previous migration. The `&amp;&amp;` operator was incorrectly encoded, causing the migration to fail. This script drops the faulty function and recreates it with the correct `&&` operator for array overlap checks.

## Query Description:
This operation is safe to run. It replaces a non-functional database function with its corrected version. It does not alter any user data. The function is used to handle collaborator invitations.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by reapplying the previous, faulty migration if needed, though not recommended)

## Structure Details:
- Drops function: `public.invite_collaborator(text,uuid[],text,text,numeric)`
- Creates function: `public.invite_collaborator(text,uuid[],text,text,numeric)`

## Security Implications:
- RLS Status: Not applicable to functions in this manner.
- Policy Changes: No
- Auth Requirements: The function is defined with `SECURITY DEFINER` to perform privileged operations, which is the intended and necessary behavior. Access to execute the function is granted to the `authenticated` role.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a function definition change.
*/

-- Drop the existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text,numeric);

-- Recreate the function with the corrected syntax
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
    new_collaborator_record collaborators;
    new_profile_record profiles;
BEGIN
    -- Find the user to invite by email in the auth schema
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- Prevent inviting self
    IF invitee_id IS NOT NULL AND invitee_id = inviter_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
    END IF;

    -- Check for existing collaboration (pending or accepted)
    IF invitee_id IS NOT NULL THEN
        -- User exists, check by user_id
        SELECT id INTO existing_collaboration_id
        FROM public.collaborators
        WHERE user_id = invitee_id AND project_ids && p_project_ids
        LIMIT 1;
    ELSE
        -- User does not exist, check for pending invite by email
        SELECT id INTO existing_collaboration_id
        FROM public.collaborators
        WHERE email = p_invitee_email AND status = 'pending' AND project_ids && p_project_ids
        LIMIT 1;
    END IF;

    IF existing_collaboration_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour un de ces projets.';
    END IF;

    -- Create the collaboration record
    INSERT INTO public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    VALUES (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, CASE WHEN invitee_id IS NULL THEN 'pending' ELSE 'accepted' END, p_budget_limit)
    RETURNING * INTO new_collaborator_record;

    -- Get the profile of the new collaborator (even if they don't exist yet, we need to return something for the UI)
    IF invitee_id IS NOT NULL THEN
        SELECT * INTO new_profile_record FROM public.profiles WHERE id = invitee_id;
    ELSE
        -- Create a dummy profile object for pending invites
        new_profile_record := ROW(null, p_invitee_email, p_invitee_email, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    END IF;

    -- Return both records as a JSON object
    RETURN json_build_object(
        'newCollaborator', row_to_json(new_collaborator_record),
        'newProfile', row_to_json(new_profile_record)
    );
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_collaborator(text,uuid[],text,text,numeric) TO authenticated;
