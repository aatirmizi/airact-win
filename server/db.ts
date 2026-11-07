import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class ActivityDatabase {
  private db: DatabaseType;
  private dbPath: string;

  constructor(filePath?: string) {
    this.dbPath = filePath || path.join(DATA_DIR, 'current_activity.db');
    this.db = new Database(this.dbPath);
    this.init();
  }

  private init() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('application_id = 1094931542'); // "ACTV"

    this.runMigrations();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roster (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pin TEXT NOT NULL
      );
    `);
  }

  private runMigrations() {
    // Check user_version
    const versionRow = this.db.pragma('user_version', { simple: true }) as number;

    if (versionRow === 0) {
      this.db.transaction(() => {
        // Migration 0001
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS meta (
            key TEXT NOT NULL PRIMARY KEY,
            value TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS presentations (
            id TEXT PRIMARY KEY,
            activity_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            join_code TEXT NOT NULL,
            join_mode TEXT NOT NULL,
            participant_limit INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active'
          );

          CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            presentation_id TEXT NOT NULL,
            participant_number INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            display_name TEXT,
            joined_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            is_removed INTEGER NOT NULL DEFAULT 0,
            is_name_hidden INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS responses (
            id TEXT PRIMARY KEY,
            presentation_id TEXT NOT NULL,
            slide_id TEXT NOT NULL,
            step TEXT NOT NULL,
            participant_id TEXT NOT NULL,
            submission_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_correct INTEGER DEFAULT NULL,
            score INTEGER DEFAULT 0,
            speed_bonus INTEGER DEFAULT 0,
            response_time_ms INTEGER DEFAULT 0,
            FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
            UNIQUE(presentation_id, slide_id, participant_id, submission_id)
          );

          CREATE INDEX IF NOT EXISTS idx_responses_slide ON responses(presentation_id, slide_id);
          CREATE INDEX IF NOT EXISTS idx_responses_participant ON responses(presentation_id, participant_id);

          CREATE TABLE IF NOT EXISTS qa_questions (
            id TEXT PRIMARY KEY,
            presentation_id TEXT NOT NULL,
            slide_id TEXT NOT NULL,
            participant_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            question TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'approved',
            created_at TEXT NOT NULL,
            upvotes INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS qa_upvotes (
            question_id TEXT NOT NULL,
            participant_id TEXT NOT NULL,
            PRIMARY KEY (question_id, participant_id),
            FOREIGN KEY (question_id) REFERENCES qa_questions(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS events_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            presentation_id TEXT,
            event_type TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL
          );

          PRAGMA user_version = 1;
        `);
      })();
    }
  }

  // Meta methods
  setMeta(key: string, value: string) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  }

  getMeta(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM meta WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  // Presentation methods
  createPresentation(
    id: string,
    activityId: string,
    joinCode: string,
    joinMode: string,
    limit: number
  ) {
    const stmt = this.db.prepare(`
      INSERT INTO presentations (id, activity_id, started_at, join_code, join_mode, participant_limit, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);
    const now = new Date().toISOString();
    stmt.run(id, activityId, now, joinCode, joinMode, limit);
    this.logEvent(id, 'presentation_started', JSON.stringify({ joinCode, joinMode, limit }));
  }

  endPresentation(id: string) {
    const stmt = this.db.prepare(`
      UPDATE presentations SET status = 'ended', ended_at = ? WHERE id = ?
    `);
    const now = new Date().toISOString();
    stmt.run(now, id);
    this.logEvent(id, 'presentation_ended', JSON.stringify({ ended_at: now }));
  }

  // Participant methods
  upsertParticipant(
    id: string,
    presentationId: string,
    participantNumber: number,
    token: string,
    displayName: string | null
  ) {
    const stmt = this.db.prepare(`
      INSERT INTO participants (id, presentation_id, participant_number, token, display_name, joined_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        last_seen_at = excluded.last_seen_at,
        display_name = COALESCE(excluded.display_name, participants.display_name)
    `);
    const now = new Date().toISOString();
    stmt.run(id, presentationId, participantNumber, token, displayName, now, now);
  }

  getParticipantByToken(token: string) {
    const stmt = this.db.prepare('SELECT * FROM participants WHERE token = ? AND is_removed = 0');
    return stmt.get(token) as any;
  }

  getParticipantById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM participants WHERE id = ?');
    return stmt.get(id) as any;
  }

  getParticipants(presentationId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM participants 
      WHERE presentation_id = ? AND is_removed = 0 
      ORDER BY participant_number ASC
    `);
    return stmt.all(presentationId) as any[];
  }

  updateParticipantName(token: string, newName: string) {
    const stmt = this.db.prepare('UPDATE participants SET display_name = ? WHERE token = ?');
    stmt.run(newName, token);
  }

  hideParticipantName(participantId: string, hide: boolean) {
    const stmt = this.db.prepare('UPDATE participants SET is_name_hidden = ? WHERE id = ?');
    stmt.run(hide ? 1 : 0, participantId);
  }

  removeParticipant(participantId: string) {
    const stmt = this.db.prepare('UPDATE participants SET is_removed = 1 WHERE id = ?');
    stmt.run(participantId);
    this.logEvent(null, 'participant_removed', JSON.stringify({ participantId }));
  }

  // Response storage & idempotency lookup
  findExistingSubmission(presentationId: string, participantId: string, submissionId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM responses 
      WHERE presentation_id = ? AND participant_id = ? AND submission_id = ?
    `);
    return stmt.get(presentationId, participantId, submissionId) as any;
  }

  findParticipantResponseForSlide(presentationId: string, participantId: string, slideId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM responses 
      WHERE presentation_id = ? AND participant_id = ? AND slide_id = ?
    `);
    return stmt.get(presentationId, participantId, slideId) as any;
  }

  saveResponse(
    id: string,
    presentationId: string,
    slideId: string,
    step: string,
    participantId: string,
    submissionId: string,
    payload: any,
    isCorrect: boolean | null = null,
    score: number = 0,
    speedBonus: number = 0,
    responseTimeMs: number = 0
  ) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO responses 
      (id, presentation_id, slide_id, step, participant_id, submission_id, payload, created_at, is_correct, score, speed_bonus, response_time_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      id,
      presentationId,
      slideId,
      step,
      participantId,
      submissionId,
      JSON.stringify(payload),
      now,
      isCorrect === null ? null : isCorrect ? 1 : 0,
      score,
      speedBonus,
      responseTimeMs
    );
  }

  getResponsesForSlide(presentationId: string, slideId: string) {
    const stmt = this.db.prepare(`
      SELECT r.*, p.display_name as participant_name, p.participant_number, p.is_name_hidden
      FROM responses r
      JOIN participants p ON r.participant_id = p.id
      WHERE r.presentation_id = ? AND r.slide_id = ?
      ORDER BY r.created_at ASC
    `);
    return stmt.all(presentationId, slideId) as any[];
  }

  getAllResponsesForSlideAllPresentations(slideId: string) {
    const stmt = this.db.prepare(`
      SELECT r.*, p.display_name as participant_name, p.participant_number, p.is_name_hidden
      FROM responses r
      JOIN participants p ON r.participant_id = p.id
      WHERE r.slide_id = ?
      ORDER BY r.created_at ASC
    `);
    return stmt.all(slideId) as any[];
  }

  // Quiz Leaderboard computation
  getLeaderboard(presentationId: string) {
    const stmt = this.db.prepare(`
      SELECT 
        p.id as participant_id,
        p.participant_number,
        p.display_name,
        p.is_name_hidden,
        COALESCE(SUM(r.score + r.speed_bonus), 0) as total_score,
        COALESCE(SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END), 0) as correct_count
      FROM participants p
      LEFT JOIN responses r ON p.id = r.participant_id AND r.presentation_id = ?
      WHERE p.presentation_id = ? AND p.is_removed = 0
      GROUP BY p.id
      ORDER BY total_score DESC, correct_count DESC, p.joined_at ASC
    `);
    const rows = stmt.all(presentationId, presentationId) as any[];
    return rows.map((r, index) => ({
      participant_id: r.participant_id,
      participant_number: r.participant_number,
      name: r.is_name_hidden ? `Participant ${r.participant_number}` : (r.display_name || `Participant ${r.participant_number}`),
      total_score: Number(r.total_score),
      correct_count: Number(r.correct_count),
      rank: index + 1
    }));
  }

  // Q&A
  addQAQuestion(
    id: string,
    presentationId: string,
    slideId: string,
    participantId: string,
    authorName: string,
    question: string
  ) {
    const stmt = this.db.prepare(`
      INSERT INTO qa_questions (id, presentation_id, slide_id, participant_id, author_name, question, status, created_at, upvotes)
      VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, 0)
    `);
    const now = new Date().toISOString();
    stmt.run(id, presentationId, slideId, participantId, authorName, question, now);
  }

  upvoteQAQuestion(questionId: string, participantId: string): boolean {
    const checkStmt = this.db.prepare('SELECT * FROM qa_upvotes WHERE question_id = ? AND participant_id = ?');
    if (checkStmt.get(questionId, participantId)) {
      // Toggle off upvote
      this.db.prepare('DELETE FROM qa_upvotes WHERE question_id = ? AND participant_id = ?').run(questionId, participantId);
      this.db.prepare('UPDATE qa_questions SET upvotes = MAX(0, upvotes - 1) WHERE id = ?').run(questionId);
      return false;
    } else {
      // Add upvote
      this.db.prepare('INSERT INTO qa_upvotes (question_id, participant_id) VALUES (?, ?)').run(questionId, participantId);
      this.db.prepare('UPDATE qa_questions SET upvotes = upvotes + 1 WHERE id = ?').run(questionId);
      return true;
    }
  }

  getQAQuestions(presentationId: string, slideId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM qa_questions 
      WHERE presentation_id = ? AND slide_id = ? AND status != 'hidden'
      ORDER BY upvotes DESC, created_at ASC
    `);
    return stmt.all(presentationId, slideId) as any[];
  }

  updateQAStatus(questionId: string, status: string) {
    const stmt = this.db.prepare('UPDATE qa_questions SET status = ? WHERE id = ?');
    stmt.run(status, questionId);
  }

  // Resets
  resetSlideData(presentationId: string | null, slideId: string) {
    this.db.transaction(() => {
      if (presentationId) {
        this.db.prepare('DELETE FROM responses WHERE presentation_id = ? AND slide_id = ?').run(presentationId, slideId);
        this.db.prepare('DELETE FROM qa_questions WHERE presentation_id = ? AND slide_id = ?').run(presentationId, slideId);
      } else {
        this.db.prepare('DELETE FROM responses WHERE slide_id = ?').run(slideId);
        this.db.prepare('DELETE FROM qa_questions WHERE slide_id = ?').run(slideId);
      }
      this.logEvent(presentationId, 'slide_reset', JSON.stringify({ slideId }));
    })();
  }

  resetAllData() {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM responses').run();
      this.db.prepare('DELETE FROM qa_upvotes').run();
      this.db.prepare('DELETE FROM qa_questions').run();
      this.db.prepare('DELETE FROM participants').run();
      this.db.prepare('DELETE FROM presentations').run();
      this.logEvent(null, 'activity_reset_all', 'All responses and participants cleared');
    })();
  }

  logEvent(presentationId: string | null, eventType: string, details: string) {
    try {
      const stmt = this.db.prepare('INSERT INTO events_log (presentation_id, event_type, details, created_at) VALUES (?, ?, ?, ?)');
      stmt.run(presentationId, eventType, details, new Date().toISOString());
    } catch {
      // Ignore log error
    }
  }

  // Returns raw SQLite database buffer for saving into .actvty file
  getDatabaseBuffer(): Buffer {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
    return fs.readFileSync(this.dbPath);
  }

  // Roster methods
  setRoster(entries: Array<{ id: string; name: string; pin: string }>) {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM roster').run();
      const stmt = this.db.prepare('INSERT INTO roster (id, name, pin) VALUES (?, ?, ?)');
      for (const entry of entries) {
        stmt.run(entry.id.trim(), entry.name.trim(), entry.pin.trim().toUpperCase());
      }
    })();
  }

  getRoster(): Array<{ id: string; name: string; pin: string }> {
    const stmt = this.db.prepare('SELECT * FROM roster ORDER BY name ASC');
    return stmt.all() as any[];
  }

  findRosterMember(id: string, pin: string) {
    const stmt = this.db.prepare('SELECT * FROM roster WHERE UPPER(id) = UPPER(?) AND UPPER(pin) = UPPER(?)');
    return stmt.get(id.trim(), pin.trim()) as any;
  }

  close() {
    this.db.close();
  }
}

export const defaultDb = new ActivityDatabase();
