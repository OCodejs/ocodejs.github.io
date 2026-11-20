PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS autorun_jobs (
  job_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  repository TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_sha TEXT NOT NULL CHECK (length(commit_sha) = 40),
  command_ids_json TEXT NOT NULL,
  requested_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','leased','running','succeeded','failed','cancelled','timed_out')),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  available_at TEXT NOT NULL,
  lease_owner TEXT,
  lease_token_hash TEXT,
  lease_expires_at TEXT,
  heartbeat_at TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancel_requested IN (0,1)),
  result_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_autorun_jobs_claim
  ON autorun_jobs(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_autorun_jobs_lease
  ON autorun_jobs(status, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_autorun_jobs_updated
  ON autorun_jobs(updated_at DESC);

CREATE TABLE IF NOT EXISTS autorun_job_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL REFERENCES autorun_jobs(job_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  runner_id TEXT NOT NULL DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_autorun_job_events_job
  ON autorun_job_events(job_id, event_id DESC);

CREATE TRIGGER IF NOT EXISTS trg_autorun_jobs_insert_event
AFTER INSERT ON autorun_jobs
BEGIN
  INSERT INTO autorun_job_events(job_id,event_type,status,details_json,created_at)
  VALUES(NEW.job_id,'queued',NEW.status,'{}',NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS trg_autorun_jobs_status_event
AFTER UPDATE OF status ON autorun_jobs
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO autorun_job_events(job_id,event_type,status,runner_id,details_json,created_at)
  VALUES(NEW.job_id,'status_changed',NEW.status,COALESCE(NEW.lease_owner,''),json_object('from',OLD.status,'attempt',NEW.attempt),NEW.updated_at);
END;
