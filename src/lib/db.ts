import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'crosspecas.db');

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = OFF');
  }
  return db;
}

export function getWriteDb() {
  const d = new Database(dbPath);
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  return d;
}

export function initDb() {
  const d = getWriteDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      year_start INTEGER NOT NULL,
      year_end INTEGER,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      UNIQUE(brand_id, slug)
    );

    CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      ref_number TEXT,
      avg_price REAL,
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS compatibilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      compatible_model_id INTEGER NOT NULL,
      ref_number TEXT,
      avg_price REAL,
      savings_percent REAL,
      source TEXT,
      FOREIGN KEY (part_id) REFERENCES parts(id),
      FOREIGN KEY (compatible_model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS adaptations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      donor_model TEXT NOT NULL,
      donor_brand TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Média',
      votes INTEGER DEFAULT 0,
      FOREIGN KEY (part_id) REFERENCES parts(id)
    );
  `);
  d.close();
}
