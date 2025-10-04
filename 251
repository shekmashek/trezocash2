/*
          # [Function] invite_collaborator
          Crée une fonction RPC sécurisée pour gérer l'invitation de collaborateurs.

          ## Query Description: Cette fonction permet d'inviter un utilisateur à collaborer sur des projets. Elle vérifie si l'utilisateur invité existe, s'il n'est pas déjà collaborateur, et s'il n'est pas le propriétaire du projet. Elle insère ensuite un nouvel enregistrement dans la table des collaborateurs avec un statut 'accepted' pour un accès immédiat. Cette opération est sécurisée et ne présente pas de risque de perte de données.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Fonction: public.invite_collaborator
          
          ## Security Implications:
          - RLS Status: La fonction utilise `SECURITY DEFINER` pour accéder à la table `auth.users` et vérifier l'existence d'un utilisateur par e-mail, ce qui n'est pas possible avec les permissions de l'utilisateur standard.
          - Policy Changes: No
          - Auth Requirements: L'utilisateur qui appelle la fonction doit être authentifié.
          
          ## Performance Impact:
          - Indexes: Pas d'impact direct sur les index.
          - Triggers: Pas de triggers ajoutés ou modifiés.
          - Estimated Impact: Faible. La fonction effectue des requêtes simples et rapides.
          */

CREATE OR REPLACE FUNCTION public.invite_collaborator(
    invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitee_id uuid;
    inviter_id uuid;
    new_collaborator_record public.collaborators;
BEGIN
    -- Get the ID of the user calling this function
    inviter_id := auth.uid();

    -- Find the user to invite by email
    SELECT id INTO invitee_id FROM auth.users WHERE email = invitee_email;

    -- If user does not exist, return an error
    IF invitee_id IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;

    -- Prevent inviting self
    IF invitee_id = inviter_id THEN
        RAISE EXCEPTION 'CANNOT_INVITE_SELF';
    END IF;

    -- Check if already a collaborator for this project
    IF EXISTS (
        SELECT 1 FROM public.collaborators
        WHERE user_id = invitee_id AND project_ids && p_project_ids
    ) THEN
        RAISE EXCEPTION 'ALREADY_COLLABORATOR';
    END IF;

    -- Insert the new collaborator record
    INSERT INTO public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status)
    VALUES (inviter_id, invitee_id, invitee_email, p_role, p_permission_scope, p_project_ids, 'accepted')
    RETURNING * INTO new_collaborator_record;

    -- Return the new record as JSON
    RETURN json_build_object(
        'id', new_collaborator_record.id,
        'owner_id', new_collaborator_record.owner_id,
        'user_id', new_collaborator_record.user_id,
        'email', new_collaborator_record.email,
        'role', new_collaborator_record.role,
        'status', new_collaborator_record.status,
        'project_ids', new_collaborator_record.project_ids,
        'permission_scope', new_collaborator_record.permission_scope
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;
