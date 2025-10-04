/*
# [FEATURE] Add Phone Number to User Profiles
This migration adds a 'phone' column to the user profiles table and updates the user creation trigger to populate this new field from the authentication metadata.

## Query Description: 
- Adds a `phone` column of type TEXT to the `public.profiles` table. This change is non-destructive and will not affect existing data.
- Replaces the `handle_new_user` function to include the logic for populating the new `phone` column upon user creation. This ensures that new sign-ups will have their phone number correctly saved in their profile.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped and the function can be reverted to its previous state).

## Structure Details:
- **Table Affected:** `public.profiles`
  - **Column Added:** `phone` (TEXT)
- **Function Affected:** `public.handle_new_user()`
  - **Change:** Modified to insert the `phone` value from `new.raw_user_meta_data`.

## Security Implications:
- RLS Status: Unchanged. Existing RLS policies on `public.profiles` will apply to the new column.
- Policy Changes: No.
- Auth Requirements: None for this migration.

## Performance Impact:
- Indexes: None added.
- Triggers: The `on_auth_user_created` trigger is effectively updated by replacing its function. The performance impact is negligible.
- Estimated Impact: Low. The change is minor and will not impact query performance.
*/

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update the handle_new_user function to include the phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;
