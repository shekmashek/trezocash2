/*
# [Fix] Recreate get_referral_data function
[This migration fixes an issue where the get_referral_data function could not be updated. It safely drops the existing function and recreates it with the latest secure definition.]

## Query Description: [This operation first drops the existing `get_referral_data` function to resolve a modification conflict. It then immediately recreates the function with the correct logic and security settings (`SECURITY DEFINER`). This ensures the referral dashboard works correctly and securely without data loss.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function: public.get_referral_data()

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [User must be authenticated]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None]
*/

-- Drop the existing function to allow for recreation with new properties
DROP FUNCTION IF EXISTS public.get_referral_data();

-- Recreate the function with the correct and secure definition
CREATE OR REPLACE FUNCTION public.get_referral_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    user_referral_code text;
    invited_count int;
    validated_count int;
    conversion_rate float;
    generated_revenue float;
    referees_list json;
    all_levels json;
    current_level_record record;
    next_level_record record;
BEGIN
    -- 1. Get current user's referral code
    SELECT referral_code INTO user_referral_code FROM public.profiles WHERE id = current_user_id;

    IF user_referral_code IS NULL THEN
        -- Handle case where user has no referral code
        RETURN json_build_object(
            'referralCode', null,
            'invitedCount', 0,
            'validatedCount', 0,
            'conversionRate', 0,
            'generatedRevenue', 0,
            'referees', '[]'::json,
            'levels', '[]'::json,
            'currentLevel', null,
            'nextLevel', null
        );
    END IF;

    -- 2. Get all referral levels
    SELECT json_agg(l.*) INTO all_levels FROM (SELECT * FROM public.referral_levels ORDER BY min_referrals ASC) l;

    -- 3. Get referees and calculate stats
    SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE p.subscription_status IN ('active', 'lifetime')) AS validated,
        COALESCE(json_agg(json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'subscription_status', p.subscription_status)) FILTER (WHERE p.subscription_status IN ('active', 'lifetime')), '[]'::json) AS list
    INTO invited_count, validated_count, referees_list
    FROM public.profiles p
    WHERE p.referred_by_code = user_referral_code;

    -- 4. Calculate conversion rate
    IF invited_count > 0 THEN
        conversion_rate := (validated_count::float / invited_count::float) * 100;
    ELSE
        conversion_rate := 0;
    END IF;

    -- 5. Determine current and next level
    SELECT * INTO current_level_record FROM public.referral_levels WHERE validated_count >= min_referrals ORDER BY min_referrals DESC LIMIT 1;
    SELECT * INTO next_level_record FROM public.referral_levels WHERE validated_count < min_referrals ORDER BY min_referrals ASC LIMIT 1;

    -- 6. Calculate generated revenue (simplified example: 12€/month for 1 year)
    generated_revenue := validated_count * 12 * 12;

    -- 7. Return all data
    RETURN json_build_object(
        'referralCode', user_referral_code,
        'invitedCount', invited_count,
        'validatedCount', validated_count,
        'conversionRate', conversion_rate,
        'generatedRevenue', generated_revenue,
        'referees', referees_list,
        'levels', all_levels,
        'currentLevel', row_to_json(current_level_record),
        'nextLevel', row_to_json(next_level_record)
    );
END;
$$;
