/*
          # Function: invite_collaborator
          Corrige la fonction d'invitation de collaborateur pour la rendre robuste et idempotente, et pour gérer correctement les utilisateurs existants et non existants.

          ## Query Description: Cette opération remplace la fonction `invite_collaborator` existante. Elle est conçue pour être sûre et n'entraîne aucune perte de données. Elle corrige les erreurs de syntaxe et les conflits de type des migrations précédentes.
          
          ## Metadata:
          - Schema-Category: "Safe"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Affecte la fonction `public.invite_collaborator`.
          
          ## Security Implications:
          - RLS Status: N/A
          - Policy Changes: No
          - Auth Requirements: L'appelant doit être authentifié.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Aucun impact sur les performances.
          */

-- Drop the old function signatures if they exist to avoid conflicts
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text);
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
    inviter_id uuid;
    existing_collaboration_id uuid;
    new_collaborator_record public.collaborators;
    profile_data json;
BEGIN
    -- Get the ID of the user calling the function (the inviter)
    inviter_id := auth.uid();

    -- Find the user to invite by email in the auth schema
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- If the user exists, check for existing collaboration
    IF invitee_id IS NOT NULL THEN
        -- Prevent inviting self
        IF invitee_id = inviter_id THEN
            RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
        END IF;

        -- Check if already a collaborator for any of the selected projects
        SELECT id INTO existing_collaboration_id
        FROM public.collaborators
        WHERE user_id = invitee_id AND project_ids && p_project_ids;

        IF existing_collaboration_id IS NOT NULL THEN
            RAISE EXCEPTION 'Cet utilisateur est déjà un collaborateur sur au moins un des projets sélectionnés.';
        END IF;
    ELSE
        -- If user does not exist, check for pending invites by email
        SELECT id INTO existing_collaboration_id
        FROM public.collaborators
        WHERE email = p_invitee_email AND status = 'pending' AND project_ids && p_project_ids;

        IF existing_collaboration_id IS NOT NULL THEN
            RAISE EXCEPTION 'Une invitation est déjà en attente pour cet e-mail sur au moins un des projets sélectionnés.';
        END IF;
    END IF;

    -- Create the collaboration record
    INSERT INTO public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    VALUES (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, CASE WHEN invitee_id IS NULL THEN 'pending' ELSE 'accepted' END, p_budget_limit)
    RETURNING * INTO new_collaborator_record;

    -- Fetch the profile of the new collaborator if they exist
    IF new_collaborator_record.user_id IS NOT NULL THEN
        SELECT json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email)
        INTO profile_data
        FROM public.profiles p
        WHERE p.id = new_collaborator_record.user_id;
    END IF;

    -- Return the new collaborator record and profile as JSON
    RETURN json_build_object(
        'newCollaborator', row_to_json(new_collaborator_record),
        'newProfile', profile_data
    );
END;
$$;
