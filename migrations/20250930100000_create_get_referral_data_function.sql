/*
# [Function] get_referral_data
Creates a function to securely fetch all referral-related data for the currently authenticated user.

## Query Description:
This function is designed to be called via RPC from the client-side. It aggregates data from multiple tables (`profiles`, `referral_levels`) to provide a comprehensive overview for the referral dashboard. It calculates statistics like conversion rates and determines the user's current and next referral level. This is a safe, read-only operation.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the function can be dropped)

## Structure Details:
- Function: `public.get_referral_data()`
- Returns: `jsonb`

## Security Implications:
- RLS Status: The function uses `auth.uid()` to ensure it only returns data for the calling user.
- Policy Changes: No
- Auth Requirements: Authenticated user
*/

create or replace function public.get_referral_data()
returns jsonb
language plpgsql
security definer
as $$
declare
    current_user_id uuid := auth.uid();
    user_referral_code text;
    invited_count int;
    validated_count int;
    conversion_rate float;
    generated_revenue numeric;
    referees_data jsonb;
    all_levels jsonb;
    current_level_data jsonb;
    next_level_data jsonb;
    result jsonb;
begin
    -- 1. Get current user's referral code
    select referral_code into user_referral_code from public.profiles where id = current_user_id;

    if user_referral_code is null then
        -- Return a default empty state if user has no referral code
        return jsonb_build_object(
            'referralCode', null,
            'invitedCount', 0,
            'validatedCount', 0,
            'conversionRate', 0,
            'generatedRevenue', 0,
            'referees', '[]'::jsonb,
            'levels', '[]'::jsonb,
            'currentLevel', null,
            'nextLevel', null
        );
    end if;

    -- 2. Get referees and their status
    select
        coalesce(jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'full_name', p.full_name,
                'email', p.email,
                'subscription_status', p.subscription_status
            )
        ), '[]'::jsonb)
    into referees_data
    from public.profiles p
    where p.referred_by_code = user_referral_code;

    -- 3. Calculate counts
    invited_count := jsonb_array_length(referees_data);

    select count(*)
    into validated_count
    from public.profiles
    where referred_by_code = user_referral_code
    and subscription_status in ('active', 'lifetime');

    -- 4. Calculate conversion rate
    if invited_count > 0 then
        conversion_rate := (validated_count::float / invited_count::float) * 100;
    else
        conversion_rate := 0;
    end if;

    -- 5. Get all referral levels
    select coalesce(jsonb_agg(l order by l.min_referrals asc), '[]'::jsonb)
    into all_levels
    from public.referral_levels l;

    -- 6. Determine current and next level
    select row_to_json(l)
    into current_level_data
    from public.referral_levels l
    where validated_count >= l.min_referrals
    order by l.min_referrals desc
    limit 1;

    select row_to_json(l)
    into next_level_data
    from public.referral_levels l
    where validated_count < l.min_referrals
    order by l.min_referrals asc
    limit 1;

    -- 7. Calculate generated revenue (simplified example: 12€/month plan per validated user)
    generated_revenue := validated_count * 12 * 12;

    -- 8. Build the final result
    result := jsonb_build_object(
        'referralCode', user_referral_code,
        'invitedCount', invited_count,
        'validatedCount', validated_count,
        'conversionRate', conversion_rate,
        'generatedRevenue', generated_revenue,
        'referees', referees_data,
        'levels', all_levels,
        'currentLevel', current_level_data,
        'nextLevel', next_level_data
    );

    return result;
end;
$$;
