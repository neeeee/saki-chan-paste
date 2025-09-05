import Database from 'better-sqlite3';
import path from 'path';

export interface Paste {
  id: string;
  content: string;
  created_at: string;
  expires_at?: string;
  view_count: number;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // Create database in a data directory
    const dbPath = path.join(process.cwd(), 'data', 'hastebin.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create pastes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        view_count INTEGER DEFAULT 0
      )
    `);

    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON pastes(created_at);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON pastes(expires_at);
    `);

    console.log('Database initialized successfully');
  }

  createPaste(id: string, content: string, expiresInHours?: number): Paste {
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const stmt = this.db.prepare(`
      INSERT INTO pastes (id, content, expires_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(id, content, expiresAt);

    return this.getPaste(id)!;
  }

  getPaste(id: string): Paste | null {
    const stmt = this.db.prepare(`
      SELECT * FROM pastes 
      WHERE id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);

    const paste = stmt.get(id) as Paste | undefined;
    
    if (paste) {
      // Increment view count
      const updateStmt = this.db.prepare(`
        UPDATE pastes SET view_count = view_count + 1 WHERE id = ?
      `);
      updateStmt.run(id);
      paste.view_count += 1;
    }

    return paste || null;
  }

  deletePaste(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM pastes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getRecentPastes(limit: number = 10): Paste[] {
    const stmt = this.db.prepare(`
      SELECT id, created_at, view_count, 
             substr(content, 1, 100) as content_preview
      FROM pastes 
      WHERE expires_at IS NULL OR expires_at > datetime('now')
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    return stmt.all(limit) as Paste[];
  }

  getStats() {
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as total FROM pastes 
      WHERE expires_at IS NULL OR expires_at > datetime('now')
    `);
    
    const viewsStmt = this.db.prepare(`
      SELECT SUM(view_count) as total_views FROM pastes
      WHERE expires_at IS NULL OR expires_at > datetime('now')
    `);

    const total = totalStmt.get() as { total: number };
    const views = viewsStmt.get() as { total_views: number };

    return {
      totalPastes: total.total,
      totalViews: views.total_views || 0
    };
  }

  cleanupExpiredPastes(): number {
    const stmt = this.db.prepare(`
      DELETE FROM pastes 
      WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
    `);
    
    const result = stmt.run();
    return result.changes;
  }

  close() {
    this.db.close();
  }
}

export default DatabaseManager;
