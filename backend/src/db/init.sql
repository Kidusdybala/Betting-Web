-- SQLite schema for betting backend
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  balance REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT NOT NULL,
  start_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('upcoming','live','finished')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  current_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS odds (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  home_odds REAL NOT NULL,
  draw_odds REAL NOT NULL,
  away_odds REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_odds_match_updated ON odds(match_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS bets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home','draw','away')),
  odds REAL NOT NULL,
  stake REAL NOT NULL,
  potential_win REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','won','lost','cancelled')),
  placed_at TEXT NOT NULL,
  settled_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id, placed_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdrawal','bet_stake','bet_win')),
  amount REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  reference TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);