/*
# [Trigger] handle_new_user_collaborations
Automatically activates pending invitations when a new user signs up.

## Query Description:
This migration creates a trigger that fires after a new user is inserted into `auth.users`.
The associated function `public.handle_new_user()` checks the `collaborators` table for any 'pending' invitations matching the new user's email.
If found, it updates the `user_id` and sets the status to 'accepted', effectively granting them access to the shared projects.
This automates the collaboration flow for users who are invited before they have an account.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the trigger and function)

## Structure Details:
- Function: public.handle_new_user()
- Trigger: on_auth_user_created on auth.users

## Security Implications:
- RLS Status: The function is defined with `SECURITY DEFINER` to have the necessary permissions to update the `collaborators` table.
- Policy Changes: No
- Auth Requirements: The trigger is fired by the `auth` system.

## Performance Impact:
- Indexes: Relies on an index on `public.collaborators(email, status)`.
- Triggers: Adds a new trigger to `auth.users`.
- Estimated Impact: Low. This only runs once per user signup.
*/

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check for pending collaborations and update them
  update public.collaborators
  set
    user_id = new.id,
    status = 'accepted'
  where
    email = new.email and status = 'pending';
  
  return new;
end;
$$;

-- Drop trigger if it exists to ensure idempotency
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
