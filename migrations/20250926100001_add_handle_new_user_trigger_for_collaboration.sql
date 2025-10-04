/*
          # [Operation Name]
          Create Trigger to Handle New User Signup for Collaborations

          ## Query Description: [This operation creates a trigger that automatically activates pending collaboration invitations when a new user signs up. When a user is created in `auth.users`, this trigger checks the `collaborators` table for any pending invitations matching the new user's email, updates the `user_id`, and sets the status to 'accepted'.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Trigger: `on_auth_user_created_activate_collaboration`
          - Function: `public.handle_new_user_collaboration`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None, runs as a trigger.]
          
          ## Performance Impact:
          - Indexes: [An index on `collaborators(email, status)` is recommended for large tables.]
          - Triggers: [Adds a trigger to `auth.users` table.]
          - Estimated Impact: [Low, as it only runs on new user creation.]
          */
CREATE OR REPLACE FUNCTION public.handle_new_user_collaboration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.collaborators
    SET
        user_id = NEW.id,
        status = 'accepted'
    WHERE
        email = NEW.email AND status = 'pending';
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_activate_collaboration
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_collaboration();
