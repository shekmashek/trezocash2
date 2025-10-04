/*
          # [Correctif] Fonction d'invitation de collaborateur
          Ce script corrige la fonction `invite_collaborator` en résolvant une erreur de syntaxe et en améliorant sa robustesse. Il assure que les invitations sont gérées correctement, que l'utilisateur invité existe déjà ou non.

          ## Query Description: [Ce script remplace la fonction de base de données existante pour les invitations. Il n'y a aucun risque de perte de données. Il est conçu pour corriger les erreurs d'invitation précédentes et stabiliser la fonctionnalité de collaboration.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Affecte la fonction `public.invite_collaborator`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: L'appelant doit être authentifié.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Faible. Améliore la fiabilité d'une fonctionnalité clé.
          */

-- Drop old versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text,numeric);
DROP FUNCTION IF EXISTS public.invite_collaborator(text,uuid[],text,text);

-- Create the corrected and robust function
CREATE OR REPLACE FUNCTION public.invite_collaborator(
    p_invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitee_id uuid;
    inviter_id uuid;
    new_collaborator_id uuid;
    existing_collaboration_id uuid;
    new_profile json;
    new_collaborator_record json;
BEGIN
    -- Get the ID of the user calling the function
    inviter_id := auth.uid();

    -- Find the user to invite by email
    SELECT id INTO invitee_id FROM auth.users WHERE email = p_invitee_email;

    -- Prevent inviting self
    IF invitee_id IS NOT NULL AND invitee_id = inviter_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
    END IF;

    -- Check if a collaboration already exists for this user/email and projects
    SELECT id INTO existing_collaboration_id
    FROM public.collaborators
    WHERE 
        (user_id = invitee_id OR (user_id IS NULL AND email = p_invitee_email))
        AND project_ids && p_project_ids;

    IF existing_collaboration_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour un de ces projets.';
    END IF;

    -- Insert the new collaboration record
    INSERT INTO public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    VALUES (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, CASE WHEN invitee_id IS NULL THEN 'pending' ELSE 'accepted' END, p_budget_limit)
    RETURNING id INTO new_collaborator_id;

    -- Fetch the new collaborator record to return
    SELECT json_build_object(
        'id', c.id,
        'owner_id', c.owner_id,
        'user_id', c.user_id,
        'email', c.email,
        'role', c.role,
        'status', c.status,
        'project_ids', c.project_ids,
        'permission_scope', c.permission_scope,
        'budget_limit', c.budget_limit
    )
    INTO new_collaborator_record
    FROM public.collaborators c
    WHERE c.id = new_collaborator_id;

    -- Fetch the profile of the invited user if they exist
    IF invitee_id IS NOT NULL THEN
        SELECT json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email
        )
        INTO new_profile
        FROM public.profiles p
        WHERE p.id = invitee_id;
    END IF;

    -- Return both the collaborator record and the profile if it exists
    RETURN json_build_object(
        'newCollaborator', new_collaborator_record,
        'newProfile', new_profile
    );
END;
$$;
