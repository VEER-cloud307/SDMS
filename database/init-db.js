require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('./db');

async function initializeDatabase(force = false) {
    if (db.type === 'sqlite') {
        const sqlite = db.rawDb;

        // Check if tables already exist
        const checkTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
        if (checkTable && !force) {
            console.log('✅ SQLite database already initialized with products.');
            return;
        }

        console.log('📦 Initializing SQLite database schema and seed data...');

        if (force) {
            sqlite.exec(`
                DROP TABLE IF EXISTS enquiries;
                DROP TABLE IF EXISTS bills;
                DROP TABLE IF EXISTS order_items;
                DROP TABLE IF EXISTS orders;
                DROP TABLE IF EXISTS stock_incoming;
                DROP TABLE IF EXISTS products;
                DROP TABLE IF EXISTS suppliers;
                DROP TABLE IF EXISTS categories;
                DROP TABLE IF EXISTS users;
                DROP TABLE IF EXISTS business_info;
            `);
        }

        // Create tables
        sqlite.exec(`
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS business_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shop_name TEXT NOT NULL,
                owner_name TEXT NOT NULL,
                address TEXT NOT NULL,
                phone TEXT NOT NULL,
                whatsapp_number TEXT NOT NULL,
                email TEXT NOT NULL,
                tagline TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                phone TEXT,
                role TEXT NOT NULL DEFAULT 'customer',
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                icon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT,
                products_supplied TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                supplier_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                specifications TEXT,
                price REAL NOT NULL,
                current_stock INTEGER NOT NULL DEFAULT 0,
                minimum_stock INTEGER NOT NULL DEFAULT 15,
                max_order_quantity INTEGER NOT NULL DEFAULT 100,
                online_ordering INTEGER NOT NULL DEFAULT 1,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS stock_incoming (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                supplier_id INTEGER,
                quantity INTEGER NOT NULL,
                expected_date TEXT,
                status TEXT NOT NULL DEFAULT 'Expected',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT NOT NULL UNIQUE,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                shipping_address TEXT NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                stock_deducted INTEGER NOT NULL DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_number TEXT NOT NULL UNIQUE,
                order_id INTEGER NOT NULL,
                bill_date TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT,
                customer_address TEXT,
                total_amount REAL NOT NULL,
                payment_method TEXT NOT NULL DEFAULT 'Cash',
                payment_status TEXT NOT NULL DEFAULT 'Paid',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'New',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL
            );
        `);

        // Read seed data statements
        const seedSql = fs.readFileSync(path.resolve(__dirname, 'seed.sql'), 'utf-8');
        // Filter out MySQL-specific comments or run in transaction
        sqlite.exec(seedSql);

        console.log('✅ SQLite database initialized and seeded successfully!');
    } else {
        console.log('📦 Initializing MySQL database...');
        const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
        const seedSql = fs.readFileSync(path.resolve(__dirname, 'seed.sql'), 'utf-8');

        // Execute queries separated by semicolon
        const runStatements = async (sqlText) => {
            const statements = sqlText
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            for (const stmt of statements) {
                await db.query(stmt);
            }
        };

        await runStatements(schemaSql);
        await runStatements(seedSql);
        console.log('✅ MySQL database initialized and seeded successfully!');
    }
}

if (require.main === module) {
    initializeDatabase(true)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Error initializing database:', err);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
