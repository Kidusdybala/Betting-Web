import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Resolve DB file path from env or default
const dbFile = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'backend', 'data', 'app.db');

// Ensure parent directory exists
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open database with reasonable defaults
export const db = new Database(dbFile, { fileMustExist: false });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

type Params = any[] | Record<string, any>;

export function run(sql: string, params?: Params) {
  const stmt = db.prepare(sql);
  return params ? stmt.run(params as any) : stmt.run();
}

export function all<T = any>(sql: string, params?: Params): T[] {
  const stmt = db.prepare(sql);
  return params ? (stmt.all(params as any) as T[]) : (stmt.all() as T[]);
}

export function get<T = any>(sql: string, params?: Params): T | undefined {
  const stmt = db.prepare(sql);
  const row = params ? (stmt.get(params as any) as T | undefined) : (stmt.get() as T | undefined);
  return row;
}

export function transaction<T>(fn: () => T): T {
  const trx = db.transaction(fn);
  return trx();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function generateId(prefix = ''): string {
  // Simple RFC4122 v4 id generator using crypto
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomUUID } = require('crypto');
  return prefix ? `${prefix}_${randomUUID()}` : randomUUID();
}