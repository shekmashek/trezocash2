ALTER TABLE projects
ADD COLUMN timezone_offset INT DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN timezone_offset INT DEFAULT 0;
