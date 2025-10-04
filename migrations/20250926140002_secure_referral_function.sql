/*
# [Function] `get_referral_data` (Update)
This migration updates the `get_referral_data` function to improve security by setting a fixed `search_path`.

## Query Description: [This operation modifies an existing function to prevent potential `search_path` hijacking attacks. It ensures the function only looks for tables and other objects in the `public` schema, which is a recommended security practice. There is no impact on data.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies the `get_referral_data` function.

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Authenticated user]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.get_referral_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    user_profile RECORD;
    invited_count INT;
    validated_count INT;
    conversion_rate_val REAL;
    generated_revenue_val REAL;
    referees_list JSON;
    all_levels JSON;
    current_level_data JSON;
    next_level_data JSON;
BEGIN
    -- Get current user's profile and referral code
    SELECT id, referral_code INTO user_profile FROM public.profiles WHERE id = current_user_id;

    -- Count invited users (those who signed up with the code)
    SELECT count(*) INTO invited_count FROM public.profiles WHERE referred_by_code = user_profile.referral_code;

    -- Count validated users (those with an active subscription)
    SELECT count(*) INTO validated_count
    FROM public.profiles p
    WHERE p.referred_by_code = user_profile.referral_code
    AND p.subscription_status IN ('active', 'lifetime');

    -- Calculate conversion rate
    IF invited_count > 0 THEN
        conversion_rate_val := (validated_count::REAL / invited_count::REAL) * 100;
    ELSE
        conversion_rate_val := 0;
    END IF;

    -- Calculate generated revenue (simplified: 12€/month * 12 months)
    generated_revenue_val := validated_count * 144;

    -- Get list of referred users
    SELECT json_agg(json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'subscription_status', p.subscription_status))
    INTO referees_list
    FROM public.profiles p
    WHERE p.referred_by_code = user_profile.referral_code;

    -- Get all referral levels
    SELECT json_agg(l.*) INTO all_levels FROM public.referral_levels l;

    -- Determine current and next level
    SELECT row_to_json(l.*) INTO current_level_data
    FROM public.referral_levels l
    WHERE validated_count >= l.min_referrals
    ORDER BY l.min_referrals DESC
    LIMIT 1;

    SELECT row_to_json(l.*) INTO next_level_data
    FROM public.referral_levels l
    WHERE validated_count < l.min_referrals
    ORDER BY l.min_referrals ASC
    LIMIT 1;
    
    -- Return all data as a single JSON object
    RETURN json_build_object(
        'referralCode', user_profile.referral_code,
        'invitedCount', invited_count,
        'validatedCount', validated_count,
        'conversionRate', conversion_rate_val,
        'generatedRevenue', generated_revenue_val,
        'referees', COALESCE(referees_list, '[]'::json),
        'levels', COALESCE(all_levels, '[]'::json),
        'currentLevel', current_level_data,
        'nextLevel', next_level_data
    );
END;
$$;
