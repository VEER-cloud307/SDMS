const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/suppliers - List all suppliers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const suppliers = await db.all(`
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) as product_count
            FROM suppliers s
            ORDER BY s.id ASC
        `);
        res.json({ success: true, count: suppliers.length, suppliers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/suppliers/:id - Single supplier
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });

        const products = await db.all('SELECT id, name, price, current_stock FROM products WHERE supplier_id = ?', [supplier.id]);
        res.json({ success: true, supplier: { ...supplier, products } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/suppliers - Add supplier
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, contact_person, phone, email, address, products_supplied } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Supplier name and phone number are required.' });
        }

        const result = await db.run(`
            INSERT INTO suppliers (name, contact_person, phone, email, address, products_supplied)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            name.trim(),
            contact_person || '',
            phone.trim(),
            email || null,
            address || null,
            products_supplied || null
        ]);

        const newId = result.insertId || result.lastInsertRowid;
        const newSupplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [newId]);

        res.status(201).json({
            success: true,
            message: 'Supplier added successfully.',
            supplier: newSupplier
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found.' });

        const { name, contact_person, phone, email, address, products_supplied } = req.body;

        await db.run(`
            UPDATE suppliers SET
                name = ?,
                contact_person = ?,
                phone = ?,
                email = ?,
                address = ?,
                products_supplied = ?
            WHERE id = ?
        `, [
            name ? name.trim() : existing.name,
            contact_person !== undefined ? contact_person : existing.contact_person,
            phone ? phone.trim() : existing.phone,
            email !== undefined ? email : existing.email,
            address !== undefined ? address : existing.address,
            products_supplied !== undefined ? products_supplied : existing.products_supplied,
            id
        ]);

        const updated = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Supplier updated successfully.', supplier: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found.' });

        // Unlink products first
        await db.run('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?', [id]);
        await db.run('DELETE FROM suppliers WHERE id = ?', [id]);

        res.json({ success: true, message: `Supplier "${existing.name}" deleted successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
