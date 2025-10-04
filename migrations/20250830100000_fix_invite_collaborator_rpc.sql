/*
# [Function] invite_collaborator
Creates or updates a collaboration invitation. This replaces the previous Edge Function for better reliability.

## Query Description: 
This function allows an authenticated user to invite another user (by email) to collaborate on one or more projects.
- If the invited user exists, they are granted access immediately.
- If the user does not exist, a 'pending' invitation is created, which will be activated upon their signup.
- It prevents inviting oneself or re-inviting an existing collaborator.
- This is a non-destructive operation and is safe to run.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the function)

## Structure Details:
- Function: public.invite_collaborator(p_invitee_email text, p_project_ids uuid[], p_role text, p_permission_scope text, p_budget_limit numeric)
- Tables Accessed: auth.users (read-only), public.collaborators (read/write)

## Security Implications:
- RLS Status: Not directly applicable to the function, but it operates on the 'collaborators' table which should have RLS.
- Policy Changes: No
- Auth Requirements: The function can only be called by an authenticated user. It uses `auth.uid()` to identify the inviter. It is defined with `SECURITY DEFINER` to look up users in `auth.users`.

## Performance Impact:
- Indexes: Relies on indexes on `auth.users(email)` and `public.collaborators(user_id, email)`.
- Triggers: None.
- Estimated Impact: Low. The function performs a few lookups and a single insert.
*/

create or replace function public.invite_collaborator(
    p_invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric
)
returns public.collaborators
language plpgsql
security definer
set search_path = public
as $$
declare
  invitee_id uuid;
  inviter_id uuid := auth.uid();
  existing_collaboration_id uuid;
  new_collaborator public.collaborators;
begin
  -- Find the user to invite by email
  select id into invitee_id from auth.users where email = p_invitee_email;

  -- Prevent inviting self
  if invitee_id is not null and invitee_id = inviter_id then
    raise exception 'Vous ne pouvez pas vous inviter vous-même.';
  end if;
  
  -- Check for existing collaboration on any of the provided projects
  if invitee_id is not null then
      select id into existing_collaboration_id
      from public.collaborators
      where user_id = invitee_id and project_ids &amp;&amp; p_project_ids;
  else
      select id into existing_collaboration_id
      from public.collaborators
      where email = p_invitee_email and status = 'pending' and project_ids &amp;&amp; p_project_ids;
  end if;

  if existing_collaboration_id is not null then
    raise exception 'Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour un de ces projets.';
  end if;

  -- Create the collaboration record
  insert into public.collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
  values (
    inviter_id,
    invitee_id, -- will be null if user doesn't exist
    p_invitee_email,
    p_role,
    p_permission_scope,
    p_project_ids,
    case when invitee_id is not null then 'accepted' else 'pending' end,
    p_budget_limit
  )
  returning * into new_collaborator;

  return new_collaborator;
end;
$$;

grant execute on function public.invite_collaborator(text, uuid[], text, text, numeric) to authenticated;
