/*
          # [Operation Name]
          Add Icon and Color to Projects

          ## Query Description: [This operation adds 'icon' and 'color' columns to the 'projects' table to allow for UI customization of project cards.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.projects
            - Column Added: icon (TEXT)
            - Column Added: color (TEXT)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. Adding nullable columns to an existing table is a fast metadata-only change.
          */
ALTER TABLE public.projects
ADD COLUMN icon TEXT,
ADD COLUMN color TEXT;
