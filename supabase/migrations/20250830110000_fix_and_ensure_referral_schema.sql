/*
# [Referral System] Fix and Ensure Schema
[This script creates and configures the complete database schema for the referral system. It fixes a "function does not exist" error by creating or replacing all necessary functions, triggers, and tables.]

## Query Description: [This operation sets up the full schema for the ambassador and referral program. It is designed to be safe to re-run. It creates tables for ambassador levels and referrals, adds referral-related columns to user profiles, and sets up automated functions to assign referral codes and track referrals upon user signup. No existing user data will be lost.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables: `ambassador_levels`, `referrals`
- Columns: Adds `referral_code`, `referred_by`, `ambassador_level_id` to `profiles` table.
- Functions: `generate_random_string`, `set_referral_code`, `handle_new_user_referral`
- Triggers: `on_profile_created_set_referral_code` on `public.profiles`, `on_auth_user_created_handle_referral` on `auth.users`.

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [The functions are triggered by user creation.]

## Performance Impact:
- Indexes: [Adds indexes for referral tracking.]
- Triggers: [Adds triggers to the user creation process. The impact is minimal.]
- Estimated Impact: [Low. The operations are lightweight and only run once per user creation.]
*/

-- 1. Create ambassador levels table
CREATE TABLE IF NOT EXISTS public.ambassador_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    min_referrals INT NOT NULL,
    commission_rate NUMERIC(4, 2) NOT NULL,
    rewards JSONB
);
ALTER TABLE public.ambassador_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.ambassador_levels FOR SELECT USING (true);

-- 2. Populate ambassador levels
INSERT INTO public.ambassador_levels (name, min_referrals, commission_rate, rewards)
VALUES
    ('Bronze', 0, 0.00, '{"1": "1 mois gratuit", "3": "3 mois gratuits", "5": "6 mois gratuits", "10": "-50% à vie"}'),
    ('Argent', 10, 0.10, null),
    ('Or', 25, 0.15, null),
    ('Platinum', 50, 0.20, null),
    ('Diamant', 100, 0.25, null),
    ('Légendaire', 200, 0.30, null)
ON CONFLICT (name) DO NOTHING;

-- 3. Add columns to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ambassador_level_id') THEN
    ALTER TABLE public.profiles ADD COLUMN ambassador_level_id UUID REFERENCES public.ambassador_levels(id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 4. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- 5. Helper function to generate a random string for referral codes
CREATE OR REPLACE FUNCTION public.generate_random_string(length integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
BEGIN
  IF length < 0 THEN
    RAISE EXCEPTION 'Given length cannot be less than 0';
  END IF;
  FOR i IN 1..length LOOP
    result := result || chars[1+floor(random()*(array_length(chars, 1)))::int];
  END LOOP;
  RETURN result;
END;
$$;

-- 6. Function to set a referral code for a new user
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  bronze_level_id UUID;
BEGIN
  -- Get the ID for the 'Bronze' level
  SELECT id INTO bronze_level_id FROM public.ambassador_levels WHERE name = 'Bronze';

  LOOP
    new_code := public.generate_random_string(8);
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  UPDATE public.profiles
  SET 
    referral_code = new_code,
    ambassador_level_id = bronze_level_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 7. Trigger on the PROFILES table to set referral code
DROP TRIGGER IF EXISTS on_profile_created_set_referral_code ON public.profiles;
CREATE TRIGGER on_profile_created_set_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_referral_code();

-- 8. Function to handle linking a new user to their referrer
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile RECORD;
  referral_code_used TEXT;
BEGIN
  -- Extract referral code from metadata if it exists
  referral_code_used := NEW.raw_user_meta_data->>'referral_code';

  IF referral_code_used IS NOT NULL THEN
    -- Find the referrer by their code
    SELECT id, email INTO referrer_profile FROM public.profiles WHERE referral_code = referral_code_used;

    IF referrer_profile.id IS NOT NULL THEN
      -- Update the new user's profile with the referrer's ID
      UPDATE public.profiles
      SET referred_by = referrer_profile.id
      WHERE id = NEW.id;

      -- Create a record of the referral
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_profile.id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 9. Trigger to handle the referral link on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_handle_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_handle_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral();

-- 10. Drop old, incorrectly named function if it exists
DROP FUNCTION IF EXISTS public.set_referral_code_on_signup();
