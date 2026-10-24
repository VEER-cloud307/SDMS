require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('../database/init-db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const frontendDir = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/business', require('./routes/business'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'Saptashrungi Disposables Management System (SDMS)',
        db_type: process.env.DB_TYPE || 'sqlite',
        time: new Date().toISOString()
    });
});

// Admin dashboard shortcut route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendDir, 'admin', 'index.html'));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error: ' + (err.message || 'Unknown error')
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('⚡ Starting Saptashrungi Disposables Management System (SDMS)...');
        await initializeDatabase(false);

        const server = app.listen(PORT, () => {
            console.log('================================================================');
            console.log(`🚀 SDMS Server successfully running on: http://localhost:${PORT}`);
            console.log(`🛍️ Customer Storefront:             http://localhost:${PORT}/`);
            console.log(`📊 Admin Portal:                   http://localhost:${PORT}/admin/`);
            console.log(`🔑 Admin Login:                    admin@sdms.com / Admin@123`);
            console.log(`👤 Customer Login:                 customer@sdms.com / Customer@123`);
            console.log(`💾 Database Mode:                  ${(process.env.DB_TYPE || 'sqlite').toUpperCase()}`);
            console.log('================================================================');
        });

        return server;
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
