ALTER TABLE projects
ADD COLUMN onboarding_step TEXT NOT NULL DEFAULT 'details';

UPDATE projects
SET onboarding_step = 'completed'
WHERE onboarding_step = 'details';
