/*
  # [Feature] Handle Pending Invitations on Signup
  This migration adds a trigger to automatically convert pending invitations into active collaborations when a new user signs up. It also updates the invitation function to support this new flow.

  ## Query Description:
  1.  **`handle_new_user_invitation` function**: This function is designed to run after a new user is created in `auth.users`. It checks the `collaborators` table for any pending invitations matching the new user's email address and activates them.
  2.  **Trigger `on_new_user_check_invitations`**: This trigger is attached to the `auth.users` table and executes the `handle_new_user_invitation` function after every new user insertion.

  This ensures that if a user is invited before they have an account, their access is automatically granted as soon as they complete their registration.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the trigger and function)

  ## Structure Details:
  - Adds function: `public.handle_new_user_invitation()`
  - Adds trigger: `on_new_user_check_invitations` on `auth.users`

  ## Security Implications:
  - RLS Status: Not applicable to triggers on `auth.users`.
  - Policy Changes: No
  - Auth Requirements: The function runs with definer rights to update the `public.collaborators` table.

  ## Performance Impact:
  - Indexes: None
  - Triggers: Adds one `AFTER INSERT` trigger on `auth.users`. The impact is negligible as it only runs once per user signup.
  - Estimated Impact: Low.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update pending collaborations for the new user
    UPDATE collaborators
    SET
        user_id = NEW.id,
        status = 'accepted'
    WHERE
        email = NEW.email
        AND status = 'pending';

    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists to ensure idempotency
DROP TRIGGER IF EXISTS on_new_user_check_invitations ON auth.users;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_new_user_check_invitations
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_invitation();
