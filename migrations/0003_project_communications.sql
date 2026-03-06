CREATE TABLE IF NOT EXISTS project_communications (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  direction TEXT NOT NULL DEFAULT 'outbound',
  counterpart_name TEXT NOT NULL DEFAULT '',
  counterpart_role TEXT NOT NULL DEFAULT '',
  counterpart_address TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  follow_up_date TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_communications_project_id
  ON project_communications(project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_communications_follow_up_date
  ON project_communications(follow_up_date);
