"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.run = run;
exports.all = all;
exports.get = get;
exports.transaction = transaction;
exports.nowIso = nowIso;
exports.generateId = generateId;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbFile = process.env.SQLITE_DB_PATH || path_1.default.resolve(process.cwd(), 'backend', 'data', 'app.db');
const dir = path_1.default.dirname(dbFile);
if (!fs_1.default.existsSync(dir)) {
    fs_1.default.mkdirSync(dir, { recursive: true });
}
exports.db = new better_sqlite3_1.default(dbFile, { fileMustExist: false });
exports.db.pragma('journal_mode = WAL');
exports.db.pragma('foreign_keys = ON');
function run(sql, params) {
    const stmt = exports.db.prepare(sql);
    return params ? stmt.run(params) : stmt.run();
}
function all(sql, params) {
    const stmt = exports.db.prepare(sql);
    return params ? stmt.all(params) : stmt.all();
}
function get(sql, params) {
    const stmt = exports.db.prepare(sql);
    const row = params ? stmt.get(params) : stmt.get();
    return row;
}
function transaction(fn) {
    const trx = exports.db.transaction(fn);
    return trx();
}
function nowIso() {
    return new Date().toISOString();
}
function generateId(prefix = '') {
    const { randomUUID } = require('crypto');
    return prefix ? `${prefix}_${randomUUID()}` : randomUUID();
}
//# sourceMappingURL=db.js.map