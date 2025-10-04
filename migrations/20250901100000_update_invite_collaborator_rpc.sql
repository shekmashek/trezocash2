/*
# [Operation Name]
Update invite_collaborator RPC function

## Query Description: [This operation modifies the `invite_collaborator` database function to include a new `p_budget_limit` parameter. This allows setting a budget limit for collaborators with an 'editor' role directly during the invitation process. The change is non-destructive and backward-compatible for invitations where a budget limit is not specified.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies function: `public.invite_collaborator`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Requires authenticated user to call]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

create or replace function public.invite_collaborator(
    invitee_email text,
    p_project_ids uuid[],
    p_role text,
    p_permission_scope text,
    p_budget_limit numeric default null
)
returns uuid
language plpgsql
security definer
as $$
declare
    invitee_id uuid;
    inviter_id uuid := auth.uid();
    collaboration_id uuid;
begin
    -- Find the user to invite by email
    select id into invitee_id from auth.users where email = invitee_email;

    -- If user does not exist, do nothing
    if invitee_id is null then
        return null;
    end if;

    -- Prevent inviting self
    if invitee_id = inviter_id then
        raise exception 'Vous ne pouvez pas vous inviter vous-même.';
    end if;

    -- Check if already a collaborator for any of these projects
    if exists (
        select 1 from collaborators
        where user_id = invitee_id and project_ids &amp;&amp; p_project_ids
    ) then
        raise exception 'Cet utilisateur est déjà un collaborateur sur l''un des projets sélectionnés.';
    end if;
    
    -- Create the collaboration record
    insert into collaborators (owner_id, user_id, email, role, permission_scope, project_ids, status, budget_limit)
    values (inviter_id, invitee_id, invitee_email, p_role, p_permission_scope, p_project_ids, 'accepted', p_budget_limit)
    returning id into collaboration_id;

    return collaboration_id;
end;
$$;
