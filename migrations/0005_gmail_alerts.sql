CREATE TABLE IF NOT EXISTS gmail_alerts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  communication_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  urgency INTEGER NOT NULL DEFAULT 1,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_role TEXT NOT NULL DEFAULT 'unknown',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gmail_alerts_unread ON gmail_alerts(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_alerts_project ON gmail_alerts(project_id, created_at DESC);
