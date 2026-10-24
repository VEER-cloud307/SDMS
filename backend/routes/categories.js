const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/categories - list categories with product counts
router.get('/', async (req, res) => {
    try {
        const categories = await db.all(`
            SELECT 
                c.id, c.name, c.description, c.icon, c.created_at,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.online_ordering = 1
            GROUP BY c.id
            ORDER BY c.id ASC
        `);
        res.json({ success: true, count: categories.length, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/categories - Admin add category
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }

        const result = await db.run(
            'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
            [name.trim(), description || '', icon || 'box']
        );

        const newId = result.insertId || result.lastInsertRowid;
        const category = await db.get('SELECT * FROM categories WHERE id = ?', [newId]);

        res.status(201).json({ success: true, message: 'Category created successfully.', category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/categories/:id - Admin update category
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        const id = req.params.id;

        await db.run(
            'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?',
            [name.trim(), description, icon, id]
        );

        const updated = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Category updated.', category: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/categories/:id - Admin delete category
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const productsCount = await db.get('SELECT COUNT(*) as cnt FROM products WHERE category_id = ?', [id]);
        if (productsCount && productsCount.cnt > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category because it contains ${productsCount.cnt} products. Reassign or remove them first.`
            });
        }

        await db.run('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
