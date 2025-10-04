/*
  # [SECURITY] Secure Project Membership Function
  [This migration updates the helper function used by Row Level Security on the 'projects' table to make it more secure. It explicitly sets the search_path to prevent potential hijacking attacks, addressing a security advisory.]

  ## Query Description: [This operation modifies an existing function to enhance security. It is a safe, non-destructive change that has no impact on data or application functionality but improves the overall security posture of the database.]
  
  ## Metadata:
  - Schema-Category: ["Security", "Safe"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function: public.is_project_member(uuid)
  
  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [No Change]
  
  ## Performance Impact:
  - Indexes: [No Change]
  - Triggers: [No Change]
  - Estimated Impact: [None. This is a metadata change to the function definition.]
*/
CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborators
    WHERE auth.uid() = collaborators.user_id AND project_id = ANY(collaborators.project_ids)
  );
$$;
