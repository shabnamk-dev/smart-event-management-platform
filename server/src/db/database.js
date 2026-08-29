import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function getDatabase(customPath = null) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || config.DATABASE_PATH;

  // If file-based, ensure directory exists
  if (dbPath !== ':memory:') {
    const fullPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(__dirname, '../../', dbPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath === ':memory:' ? ':memory:' : (path.isAbsolute(dbPath) ? dbPath : path.resolve(__dirname, '../../', dbPath)));

  // Enable foreign keys constraint enforcement
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for high concurrency in non-memory databases
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  // Initialize schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default getDatabase;
