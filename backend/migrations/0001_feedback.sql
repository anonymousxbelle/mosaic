CREATE TABLE IF NOT EXISTS feedback (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 submission_id TEXT NOT NULL UNIQUE,
 item_id TEXT NOT NULL,title TEXT NOT NULL,media_type TEXT NOT NULL,
 kind TEXT NOT NULL,reason TEXT NOT NULL,seed_id TEXT NOT NULL,seed_title TEXT NOT NULL,
 created_at TEXT NOT NULL,review_status TEXT NOT NULL DEFAULT 'new',
 evaluation_approved INTEGER NOT NULL DEFAULT 0,review_note TEXT NOT NULL DEFAULT '',reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS feedback_reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,feedback_id INTEGER NOT NULL REFERENCES feedback(id),
 status TEXT NOT NULL,evaluation_approved INTEGER NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL
);

