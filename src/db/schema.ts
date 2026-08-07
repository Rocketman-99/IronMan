export const CREATE_USER_PROFILE = `
CREATE TABLE IF NOT EXISTS user_profile (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  birth_date      TEXT,
  gender          TEXT,
  height_cm       REAL,
  weight_kg       REAL,
  fitness_level   TEXT NOT NULL DEFAULT 'beginner',
  primary_goal    TEXT,
  target_race_date TEXT,
  weekly_hours    REAL DEFAULT 5,
  resting_hr      INTEGER,
  max_hr          INTEGER,
  plan_focus_sports TEXT,
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
`;

export const CREATE_WORKOUTS = `
CREATE TABLE IF NOT EXISTS workouts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_type      TEXT NOT NULL,
  workout_date    TEXT NOT NULL,
  duration_sec    INTEGER NOT NULL,
  distance_m      REAL NOT NULL,
  calories        INTEGER,
  avg_hr          INTEGER,
  max_hr          INTEGER,
  feeling         INTEGER,
  notes           TEXT,
  temp_celsius    REAL,
  humidity_pct    INTEGER,
  ai_analysis     TEXT,
  created_at      TEXT NOT NULL
);
`;

export const CREATE_WORKOUTS_DATE_INDEX = `
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(workout_date DESC);
`;

export const CREATE_WORKOUTS_SPORT_INDEX = `
CREATE INDEX IF NOT EXISTS idx_workouts_sport ON workouts(sport_type);
`;

export const CREATE_RUNNING_DETAILS = `
CREATE TABLE IF NOT EXISTS running_details (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id          INTEGER NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE,
  avg_pace_sec_km     INTEGER,
  best_pace_sec_km    INTEGER,
  cadence_spm         INTEGER,
  elevation_gain_m    REAL,
  surface             TEXT
);
`;

export const CREATE_SWIMMING_DETAILS = `
CREATE TABLE IF NOT EXISTS swimming_details (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id          INTEGER NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE,
  pool_length_m       INTEGER DEFAULT 25,
  total_laps          INTEGER,
  avg_pace_sec_100m   INTEGER,
  stroke_type         TEXT,
  stroke_rate         INTEGER,
  swolf               INTEGER
);
`;

export const CREATE_CYCLING_DETAILS = `
CREATE TABLE IF NOT EXISTS cycling_details (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id          INTEGER NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE,
  avg_speed_kmh       REAL,
  max_speed_kmh       REAL,
  avg_power_w         INTEGER,
  max_power_w         INTEGER,
  avg_cadence_rpm     INTEGER,
  elevation_gain_m    REAL,
  bike_type           TEXT
);
`;

export const CREATE_GOALS = `
CREATE TABLE IF NOT EXISTS goals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_type      TEXT NOT NULL,
  goal_type       TEXT NOT NULL,
  title           TEXT NOT NULL,
  target_value    REAL NOT NULL,
  current_value   REAL NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL,
  period          TEXT,
  target_date     TEXT,
  race_type       TEXT,
  race_date       TEXT,
  is_completed    INTEGER NOT NULL DEFAULT 0,
  completed_at    TEXT,
  created_at      TEXT NOT NULL
);
`;

export const CREATE_AI_CONVERSATIONS = `
CREATE TABLE IF NOT EXISTS ai_conversations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conv_type       TEXT NOT NULL,
  workout_id      INTEGER,
  messages        TEXT NOT NULL,
  context_json    TEXT,
  model_used      TEXT,
  created_at      TEXT NOT NULL
);
`;

/**
 * 생성한 훈련 계획을 보관한다.
 *
 * 예전에는 계획이 메모리(zustand)에만 있어 앱을 다시 켜면 사라졌다. 사용자가
 * 직접 지울 때까지 남아야 하므로 테이블로 옮겼다. 여러 개를 쌓아 두고 지난
 * 계획과 비교할 수 있다.
 */
export const CREATE_TRAINING_PLANS = `
CREATE TABLE IF NOT EXISTS training_plans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  total_weeks     INTEGER NOT NULL,
  plan_json       TEXT NOT NULL,
  focus_sports    TEXT,
  context_json    TEXT,
  created_at      TEXT NOT NULL
);
`;

export const CREATE_APP_SETTINGS = `
CREATE TABLE IF NOT EXISTS app_settings (
  key     TEXT PRIMARY KEY,
  value   TEXT NOT NULL
);
`;

export const ALL_TABLES = [
  CREATE_USER_PROFILE,
  CREATE_WORKOUTS,
  CREATE_WORKOUTS_DATE_INDEX,
  CREATE_WORKOUTS_SPORT_INDEX,
  CREATE_RUNNING_DETAILS,
  CREATE_SWIMMING_DETAILS,
  CREATE_CYCLING_DETAILS,
  CREATE_GOALS,
  CREATE_AI_CONVERSATIONS,
  CREATE_TRAINING_PLANS,
  CREATE_APP_SETTINGS,
];
