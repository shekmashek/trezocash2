/*
# [Feature] Referral Payments Tracking
Adds a table to track commission payments made to ambassadors.

## Query Description:
This operation creates a new table `referral_payments` to log each commission payout. This allows administrators to manage and record payments made to users as part of the referral program. It includes the user ID, amount paid, payment date, and the period for which the commission is being paid.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.referral_payments`
  - Columns: `id`, `user_id`, `amount`, `payment_date`, `period_start`, `period_end`, `notes`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies will be added to restrict access to superadmins.

## Performance Impact:
- Indexes: Primary key index on `id` and a foreign key index on `user_id`.
- Triggers: None
- Estimated Impact: Low, as this is a new table for logging purposes.
*/

-- Create the referral_payments table
CREATE TABLE public.referral_payments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_date timestamptz NOT NULL DEFAULT now(),
    period_start date NOT NULL,
    period_end date NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT referral_payments_pkey PRIMARY KEY (id),
    CONSTRAINT referral_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.referral_payments ENABLE ROW LEVEL SECURITY;

-- Add policies for superadmin access
CREATE POLICY "Superadmins can manage referral payments"
ON public.referral_payments
FOR ALL
TO supabase_user
USING (
  (SELECT auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
)
WITH CHECK (
  (SELECT auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
);
