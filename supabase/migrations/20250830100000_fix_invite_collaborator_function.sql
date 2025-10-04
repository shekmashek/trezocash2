/*
# [Function] Fix invite_collaborator function
[This migration corrects the syntax and logic of the invite_collaborator function to properly handle collaborator invitations with budget limits.]

## Query Description: [This operation replaces the existing 'invite_collaborator' function with a corrected version. It fixes a syntax error that prevented the previous migration from running and ensures the function parameters match the client-side call. This change is safe and will not affect existing data. It only impacts the process of inviting new collaborators.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: public.invite_collaborator

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Caller must be authenticated]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/
create or replace function public.invite_collaborator(
    p_invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitee_id uuid;
  inviter_id uuid := auth.uid();
  existing_collaboration_id uuid;
  new_collaboration_id uuid;
begin
  -- Find the user to invite by email in auth.users
  select id into invitee_id from auth.users where email = p_invitee_email;

  -- If user does not exist, do nothing and return null
  if invitee_id is null then
    return null;
  end if;

  -- Prevent inviting self
  if invitee_id = inviter_id then
    raise exception 'Vous ne pouvez pas vous inviter vous-même.';
  end if;

  -- Check if already a collaborator for any of the given projects
  select id into existing_collaboration_id
  from public.collaborators
  where collaborators.user_id = invitee_id and collaborators.project_ids && p_project_ids
  limit 1;

  if existing_collaboration_id is not null then
    raise exception 'L''utilisateur est déjà un collaborateur sur un ou plusieurs des projets sélectionnés.';
  end if;

  -- Create the collaboration record
  insert into public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
  values (inviter_id, invitee_id, p_invitee_email, p_role, p_permission_scope, p_project_ids, 'accepted', p_budget_limit)
  returning id into new_collaboration_id;

  return new_collaboration_id;
end;
$$;
