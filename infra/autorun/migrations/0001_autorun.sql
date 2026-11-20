PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS autorun_runs (
  run_id TEXT NOT NULL,
  run_attempt INTEGER NOT NULL DEFAULT 1,
  repository TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT '',
  head_sha TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('queued', 'in_progress', 'completed')),
  conclusion TEXT,
  html_url TEXT NOT NULL DEFAULT '',
  created_at TEXT,
  started_at TEXT,
  updated_at TEXT NOT NULL,
  last_action TEXT NOT NULL CHECK (last_action IN ('requested', 'in_progress', 'completed')),
  synced_at TEXT NOT NULL,
  PRIMARY KEY (run_id, run_attempt)
);

CREATE INDEX IF NOT EXISTS idx_autorun_runs_updated ON autorun_runs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_autorun_runs_status ON autorun_runs(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS autorun_events (
  event_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  run_attempt INTEGER NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT '',
  workflow_ref TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id, run_attempt) REFERENCES autorun_runs(run_id, run_attempt) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_autorun_events_run ON autorun_events(run_id, run_attempt, created_at DESC);
