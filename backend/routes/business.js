const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/business - Get shop & business info
router.get('/', async (req, res) => {
    try {
        let business = await db.get('SELECT * FROM business_info WHERE id = 1');
        if (!business) {
            business = {
                shop_name: 'Saptashrungi Disposables',
                owner_name: 'Mr. Chetan Jadav',
                address: '3/1477, Daxini maholla, Ambawadi, Salabatpura, Reshamwad, Behind Saptashrungi Mandir, Surat - 395002',
                phone: '+91 9082545483',
                whatsapp_number: '+919082545483',
                email: 'saptashrungidisposables@gmail.com',
                tagline: 'Premium Eco-Friendly Disposables & Food Packaging Wholesale'
            };
        }
        res.json({ success: true, business });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/business - Update shop & business info (Admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            shop_name,
            owner_name,
            address,
            phone,
            whatsapp_number,
            email,
            tagline
        } = req.body;

        const existing = await db.get('SELECT id FROM business_info WHERE id = 1');
        if (existing) {
            await db.run(`
                UPDATE business_info SET
                    shop_name = ?,
                    owner_name = ?,
                    address = ?,
                    phone = ?,
                    whatsapp_number = ?,
                    email = ?,
                    tagline = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `, [
                shop_name || 'Saptashrungi Disposables',
                owner_name || '',
                address || '',
                phone || '',
                whatsapp_number || '',
                email || '',
                tagline || ''
            ]);
        } else {
            await db.run(`
                INSERT INTO business_info (id, shop_name, owner_name, address, phone, whatsapp_number, email, tagline)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            `, [
                shop_name || 'Saptashrungi Disposables',
                owner_name || '',
                address || '',
                phone || '',
                whatsapp_number || '',
                email || '',
                tagline || ''
            ]);
        }

        const updated = await db.get('SELECT * FROM business_info WHERE id = 1');
        res.json({ success: true, message: 'Business information updated successfully.', business: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
