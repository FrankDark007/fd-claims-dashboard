PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  invoice_id INTEGER,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL DEFAULT '',
  project_type TEXT,
  project_status TEXT NOT NULL DEFAULT 'Active',
  invoice_status TEXT NOT NULL DEFAULT 'Draft',
  amount REAL,
  contract_status TEXT NOT NULL DEFAULT 'Missing',
  coc_status TEXT NOT NULL DEFAULT 'Missing',
  final_invoice_status TEXT NOT NULL DEFAULT 'Not Started',
  drylog_status TEXT NOT NULL DEFAULT 'Missing',
  rewrite_status TEXT NOT NULL DEFAULT 'Not Started',
  matterport_status TEXT NOT NULL DEFAULT 'N/A',
  company_cam_url TEXT NOT NULL DEFAULT '',
  drive_folder_url TEXT NOT NULL DEFAULT '',
  xactimate_number TEXT NOT NULL DEFAULT '',
  claim_number TEXT NOT NULL DEFAULT '',
  carrier TEXT NOT NULL DEFAULT '',
  project_manager_name TEXT NOT NULL DEFAULT '',
  pm_email TEXT NOT NULL DEFAULT '',
  pm_phone TEXT NOT NULL DEFAULT '',
  adjuster_name TEXT NOT NULL DEFAULT '',
  adjuster_email TEXT NOT NULL DEFAULT '',
  adjuster_phone TEXT NOT NULL DEFAULT '',
  invoice_sent_date TEXT,
  due_date TEXT,
  payment_received_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_invoice_status ON projects(invoice_status);
CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);

CREATE TABLE IF NOT EXISTS invoice_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  event_date TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_events_project_id ON invoice_events(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_event_date ON invoice_events(event_date DESC);

CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  assignee TEXT NOT NULL DEFAULT '',
  due_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_sort_order ON project_tasks(project_id, sort_order);

CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_pinned ON project_notes(project_id, pinned DESC, updated_at DESC);
