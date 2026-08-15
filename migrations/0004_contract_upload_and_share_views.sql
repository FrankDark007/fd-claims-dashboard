-- Add client contact fields for contract-to-project extraction
ALTER TABLE projects ADD COLUMN client_email TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN client_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN client_address TEXT NOT NULL DEFAULT '';

-- Share link view logging
CREATE TABLE IF NOT EXISTS share_link_views (
  id TEXT PRIMARY KEY,
  share_token TEXT NOT NULL,
  project_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  viewed_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_share_link_views_token ON share_link_views(share_token);
CREATE INDEX IF NOT EXISTS idx_share_link_views_project_id ON share_link_views(project_id);
CREATE INDEX IF NOT EXISTS idx_share_link_views_viewed_at ON share_link_views(viewed_at DESC);
