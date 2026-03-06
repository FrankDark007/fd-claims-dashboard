ALTER TABLE projects ADD COLUMN next_follow_up_date TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_next_follow_up_date ON projects(next_follow_up_date);
