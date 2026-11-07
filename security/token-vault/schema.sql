PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS identities (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner','security_admin','developer','ai_agent','auditor')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS vault_tokens (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  provider TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'ocodejs-core',
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  rotated_at TEXT,
  FOREIGN KEY(created_by) REFERENCES identities(subject)
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS login_attempts (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  outcome TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO identities (id, subject, role)
VALUES ('bootstrap-token-admin', 'TOKEN', 'owner');

CREATE TABLE IF NOT EXISTS agent_credentials (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER,
  last_used_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(subject) REFERENCES identities(subject),
  FOREIGN KEY(created_by) REFERENCES identities(subject)
);

CREATE TABLE IF NOT EXISTS agent_project_grants (
  agent_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('metadata','reveal')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(agent_id, project_id),
  FOREIGN KEY(agent_id) REFERENCES agent_credentials(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES identities(subject)
);

CREATE INDEX IF NOT EXISTS idx_vault_tokens_project ON vault_tokens(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_credentials_key_hash ON agent_credentials(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_grants_project ON agent_project_grants(project_id, permission);
