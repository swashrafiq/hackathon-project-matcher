CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin')),
  main_project_id TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  member_count INTEGER NOT NULL CHECK (member_count >= 0 AND member_count <= 5),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  created_by_user_id TEXT NOT NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);
