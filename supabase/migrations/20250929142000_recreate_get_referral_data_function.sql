-- Dropping the function is necessary before recreating it with a different return type or signature.
DROP FUNCTION IF EXISTS public.get_referral_data();

/*
# [Recreate get_referral_data Function]
This operation safely drops and recreates the `get_referral_data` function to fix a migration error related to changing function return types. It ensures the function is up-to-date with the latest secure definition.

## Query Description: [This operation first removes the old version of the `get_referral_data` function if it exists, preventing conflicts. It then creates a new, secure version of the function. This is a safe procedure as it replaces a function definition without altering table data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function: public.get_referral_data()

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [The function is defined with `SECURITY DEFINER` to access data securely on behalf of the user.]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Negligible. This is a function definition update.]
*/
CREATE OR REPLACE FUNCTION public.get_referral_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_referral_code TEXT;
    v_invited_count INT;
    v_validated_count INT;
    v_conversion_rate NUMERIC;
    v_generated_revenue NUMERIC;
    v_referees JSON;
    v_levels JSON;
    v_current_level JSON;
    v_next_level JSON;
BEGIN
    -- Get user's referral code
    SELECT referral_code INTO v_referral_code FROM profiles WHERE id = v_user_id;

    -- Get referral stats
    SELECT
        COUNT(*) INTO v_invited_count
    FROM profiles WHERE referred_by_code = v_referral_code;

    SELECT
        COUNT(*) INTO v_validated_count
    FROM profiles
    WHERE referred_by_code = v_referral_code
      AND (subscription_status = 'active' OR subscription_status = 'lifetime');

    v_conversion_rate := CASE WHEN v_invited_count > 0 THEN (v_validated_count::NUMERIC / v_invited_count) * 100 ELSE 0 END;
    
    -- Simplified revenue calculation: 12€/month for 12 months per validated user
    v_generated_revenue := v_validated_count * 12 * 12;

    -- Get list of active referees
    SELECT json_agg(json_build_object('id', id, 'full_name', full_name, 'email', email, 'subscription_status', subscription_status))
    INTO v_referees
    FROM profiles
    WHERE referred_by_code = v_referral_code
      AND (subscription_status = 'active' OR subscription_status = 'lifetime');

    -- Get all referral levels
    SELECT json_agg(l) INTO v_levels FROM referral_levels l;

    -- Determine current and next level
    SELECT row_to_json(l) INTO v_current_level
    FROM referral_levels l
    WHERE v_validated_count >= l.min_referrals
    ORDER BY l.min_referrals DESC
    LIMIT 1;

    SELECT row_to_json(l) INTO v_next_level
    FROM referral_levels l
    WHERE v_validated_count < l.min_referrals
    ORDER BY l.min_referrals ASC
    LIMIT 1;

    -- Return all data as a single JSON object
    RETURN json_build_object(
        'referralCode', v_referral_code,
        'invitedCount', v_invited_count,
        'validatedCount', v_validated_count,
        'conversionRate', v_conversion_rate,
        'generatedRevenue', v_generated_revenue,
        'referees', COALESCE(v_referees, '[]'::json),
        'levels', COALESCE(v_levels, '[]'::json),
        'currentLevel', v_current_level,
        'nextLevel', v_next_level
    );
END;
$$;
