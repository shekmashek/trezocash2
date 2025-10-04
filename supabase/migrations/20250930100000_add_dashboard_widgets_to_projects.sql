/*
  # [Structural] Add Dashboard Widget Configuration
  [This migration adds a new 'dashboard_widgets' column to the 'projects' table to store user preferences for widget visibility on the dashboard.]

  ## Query Description: [This operation adds a new JSONB column to the 'projects' table. It will have a default value containing the visibility status for all dashboard widgets. Existing rows will have this column populated with the default value, which shows all widgets by default. There is no risk of data loss.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: public.projects
  - Column Added: dashboard_widgets (jsonb)
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: No
  - Auth Requirements: None
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS dashboard_widgets jsonb
DEFAULT '{
  "kpi_cards": true,
  "alerts": true,
  "trezo_score": true,
  "30_day_forecast": true,
  "monthly_budget": true,
  "loans": true,
  "actions": true,
  "tutorials": true,
  "priorities": true
}'::jsonb;
