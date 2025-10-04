/*
# [FEATURE] Add Referral Tracking Column to Profiles
This migration adds a new column to the `profiles` table to track which user referred a new signup.

## Query Description:
This operation adds a `referred_by_code` column to the `public.profiles` table. This column will store the referral code of the user who invited a new person to sign up. It is a non-disruptive change and will not affect existing data; the column will be `NULL` for all current users.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table `public.profiles`:
  - Adds column `referred_by_code` (type: `text`, nullable)

## Security Implications:
- RLS Status: Unchanged. Existing policies on `profiles` will continue to apply.
- Policy Changes: No.
- Auth Requirements: No direct auth changes. This column will be populated by the sign-up process.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata-only change.
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
