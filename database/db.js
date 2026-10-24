require('dotenv').config();
const path = require('path');
const fs = require('fs');

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let dbInstance = null;

if (DB_TYPE === 'mysql') {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sdms_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    dbInstance = {
        type: 'mysql',
        async query(sql, params = []) {
            const [results] = await pool.query(sql, params);
            return results;
        },
        async get(sql, params = []) {
            const [rows] = await pool.query(sql, params);
            return rows && rows.length > 0 ? rows[0] : null;
        },
        async all(sql, params = []) {
            const [rows] = await pool.query(sql, params);
            return rows || [];
        },
        async run(sql, params = []) {
            const [result] = await pool.query(sql, params);
            return {
                insertId: result.insertId,
                lastInsertRowid: result.insertId,
                affectedRows: result.affectedRows,
                changes: result.affectedRows
            };
        },
        async transaction(fn) {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const txDb = {
                    async query(sql, params = []) {
                        const [results] = await connection.query(sql, params);
                        return results;
                    },
                    async get(sql, params = []) {
                        const [rows] = await connection.query(sql, params);
                        return rows && rows.length > 0 ? rows[0] : null;
                    },
                    async all(sql, params = []) {
                        const [rows] = await connection.query(sql, params);
                        return rows || [];
                    },
                    async run(sql, params = []) {
                        const [result] = await connection.query(sql, params);
                        return {
                            insertId: result.insertId,
                            lastInsertRowid: result.insertId,
                            affectedRows: result.affectedRows,
                            changes: result.affectedRows
                        };
                    }
                };
                const result = await fn(txDb);
                await connection.commit();
                return result;
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        }
    };
} else {
    // SQLite Mode (No setup demo mode)
    const Database = require('better-sqlite3');
    const dbPath = path.resolve(__dirname, 'sdms.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    dbInstance = {
        type: 'sqlite',
        rawDb: sqlite,
        async query(sql, params = []) {
            const trimmed = sql.trim().toUpperCase();
            if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
                return sqlite.prepare(sql).all(params);
            }
            const stmt = sqlite.prepare(sql);
            const info = stmt.run(params);
            return {
                insertId: info.lastInsertRowid,
                lastInsertRowid: info.lastInsertRowid,
                affectedRows: info.changes,
                changes: info.changes
            };
        },
        async get(sql, params = []) {
            const stmt = sqlite.prepare(sql);
            const row = stmt.get(params);
            return row || null;
        },
        async all(sql, params = []) {
            const stmt = sqlite.prepare(sql);
            return stmt.all(params) || [];
        },
        async run(sql, params = []) {
            const stmt = sqlite.prepare(sql);
            const info = stmt.run(params);
            return {
                insertId: info.lastInsertRowid,
                lastInsertRowid: info.lastInsertRowid,
                affectedRows: info.changes,
                changes: info.changes
            };
        },
        async transaction(fn) {
            const tx = sqlite.transaction((txFn) => txFn(dbInstance));
            return tx(fn);
        }
    };
}

module.exports = dbInstance;
