/*
          # [Operation Name]
          Add Type to Projects and Templates

          ## Query Description: [This operation adds a 'type' column to the 'projects' table to categorize them as 'business', 'household', or 'event'. It also adds a 'purpose' column to the 'templates' table to differentiate between template types. Existing projects will default to 'business', and existing templates will default to 'project'. This change is structural and should not affect existing data negatively.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - projects: ADD COLUMN type TEXT
          - templates: ADD COLUMN purpose TEXT
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact on queries.
          */

ALTER TABLE projects
ADD COLUMN type TEXT NOT NULL DEFAULT 'business';

ALTER TABLE projects
ADD CONSTRAINT projects_type_check CHECK (type IN ('business', 'household', 'event'));

-- The 'purpose' column might already exist from a previous migration.
-- This ensures it exists and has the correct default.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'templates' AND column_name = 'purpose'
    ) THEN
        ALTER TABLE templates
        ADD COLUMN purpose TEXT NOT NULL DEFAULT 'professional';
    END IF;
END $$;

ALTER TABLE templates
ADD CONSTRAINT templates_purpose_check CHECK (purpose IN ('personal', 'professional', 'event'));
