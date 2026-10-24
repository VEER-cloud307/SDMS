const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// POST /api/enquiries - Submit enquiry
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { name, email, phone, message, product_id } = req.body;
        if (!name || !phone || !message) {
            return res.status(400).json({ success: false, message: 'Name, phone, and message are required.' });
        }

        const userId = req.user ? req.user.id : null;
        const userEmail = email || (req.user ? req.user.email : '');

        const result = await db.run(`
            INSERT INTO enquiries (user_id, product_id, name, email, phone, message, status)
            VALUES (?, ?, ?, ?, ?, ?, 'New')
        `, [
            userId,
            product_id ? Number(product_id) : null,
            name.trim(),
            userEmail.trim(),
            phone.trim(),
            message.trim()
        ]);

        const newId = result.insertId || result.lastInsertRowid;
        res.status(201).json({
            success: true,
            message: 'Your enquiry has been received. Our team will contact you shortly on WhatsApp / Phone.',
            enquiry_id: newId
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/enquiries - Admin list enquiries
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT 
                e.*,
                p.name as product_name, p.image_url as product_image
            FROM enquiries e
            LEFT JOIN products p ON e.product_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            sql += ' AND e.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY e.id DESC';

        const enquiries = await db.all(sql, params);
        res.json({ success: true, count: enquiries.length, enquiries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/enquiries/:id/status - Admin update status
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await db.run('UPDATE enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Enquiry status updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
