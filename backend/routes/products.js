const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// GET /api/products - list all products with optional filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category_id, search, in_stock, online_only, min_price, max_price, sort } = req.query;
        const isAdmin = req.user && req.user.role === 'admin';

        let sql = `
            SELECT 
                p.id, p.category_id, p.supplier_id, p.name, p.description, p.specifications,
                p.price, p.current_stock, p.minimum_stock, p.max_order_quantity, p.online_ordering,
                p.image_url, p.created_at, p.updated_at,
                c.name as category_name, c.icon as category_icon,
                s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE 1=1
        `;
        const params = [];

        // If not admin, only show products where online_ordering is enabled unless explicitly requested
        if (!isAdmin && online_only !== 'false') {
            sql += ' AND p.online_ordering = 1';
        }

        if (category_id && category_id !== 'all') {
            sql += ' AND p.category_id = ?';
            params.push(Number(category_id));
        }

        if (search && search.trim()) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        if (in_stock === 'true') {
            sql += ' AND p.current_stock > 0';
        } else if (in_stock === 'false') {
            sql += ' AND p.current_stock <= 0';
        }

        if (min_price) {
            sql += ' AND p.price >= ?';
            params.push(Number(min_price));
        }
        if (max_price) {
            sql += ' AND p.price <= ?';
            params.push(Number(max_price));
        }

        // Sorting
        if (sort === 'price_asc') {
            sql += ' ORDER BY p.price ASC';
        } else if (sort === 'price_desc') {
            sql += ' ORDER BY p.price DESC';
        } else if (sort === 'stock_asc') {
            sql += ' ORDER BY p.current_stock ASC';
        } else if (sort === 'name_asc') {
            sql += ' ORDER BY p.name ASC';
        } else {
            sql += ' ORDER BY p.id ASC';
        }

        const products = await db.all(sql, params);
        res.json({ success: true, count: products.length, products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products: ' + err.message });
    }
});

// GET /api/products/:id - single product
router.get('/:id', async (req, res) => {
    try {
        const product = await db.get(`
            SELECT 
                p.*, 
                c.name as category_name, c.icon as category_icon,
                s.name as supplier_name, s.phone as supplier_phone
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/products - Admin add new product
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            category_id,
            supplier_id,
            name,
            description,
            specifications,
            price,
            current_stock,
            minimum_stock,
            max_order_quantity,
            online_ordering,
            image_url
        } = req.body;

        if (!name || !category_id || price === undefined) {
            return res.status(400).json({ success: false, message: 'Product name, category, and price are required.' });
        }

        const result = await db.run(`
            INSERT INTO products (
                category_id, supplier_id, name, description, specifications,
                price, current_stock, minimum_stock, max_order_quantity,
                online_ordering, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            Number(category_id),
            supplier_id ? Number(supplier_id) : null,
            name.trim(),
            description || '',
            specifications || '',
            Number(price),
            current_stock !== undefined ? Number(current_stock) : 0,
            minimum_stock !== undefined ? Number(minimum_stock) : 15,
            max_order_quantity !== undefined ? Number(max_order_quantity) : 100,
            online_ordering !== undefined ? (online_ordering ? 1 : 0) : 1,
            image_url || '/images/products/ripple-cups.svg'
        ]);

        const newId = result.insertId || result.lastInsertRowid;
        const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [newId]);

        res.status(201).json({
            success: true,
            message: 'Product added successfully!',
            product: newProduct
        });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ success: false, message: 'Failed to create product: ' + err.message });
    }
});

// PUT /api/products/:id - Admin update product
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const {
            category_id,
            supplier_id,
            name,
            description,
            specifications,
            price,
            current_stock,
            minimum_stock,
            max_order_quantity,
            online_ordering,
            image_url
        } = req.body;

        await db.run(`
            UPDATE products SET
                category_id = ?,
                supplier_id = ?,
                name = ?,
                description = ?,
                specifications = ?,
                price = ?,
                current_stock = ?,
                minimum_stock = ?,
                max_order_quantity = ?,
                online_ordering = ?,
                image_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            category_id !== undefined ? Number(category_id) : existing.category_id,
            supplier_id !== undefined ? (supplier_id ? Number(supplier_id) : null) : existing.supplier_id,
            name !== undefined ? name.trim() : existing.name,
            description !== undefined ? description : existing.description,
            specifications !== undefined ? specifications : existing.specifications,
            price !== undefined ? Number(price) : existing.price,
            current_stock !== undefined ? Number(current_stock) : existing.current_stock,
            minimum_stock !== undefined ? Number(minimum_stock) : existing.minimum_stock,
            max_order_quantity !== undefined ? Number(max_order_quantity) : existing.max_order_quantity,
            online_ordering !== undefined ? (online_ordering ? 1 : 0) : existing.online_ordering,
            image_url !== undefined ? image_url : existing.image_url,
            id
        ]);

        const updated = await db.get(`
            SELECT p.*, c.name as category_name, s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Product updated successfully!',
            product: updated
        });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ success: false, message: 'Failed to update product: ' + err.message });
    }
});

// PATCH /api/products/:id/stock - Admin quick adjust stock
router.patch('/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { current_stock, adjustment } = req.body;

        const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        let newStock = product.current_stock;
        if (current_stock !== undefined) {
            newStock = Math.max(0, Number(current_stock));
        } else if (adjustment !== undefined) {
            newStock = Math.max(0, product.current_stock + Number(adjustment));
        }

        await db.run('UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);
        res.json({
            success: true,
            message: `Stock updated for "${product.name}" to ${newStock} units.`,
            product_id: id,
            current_stock: newStock
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/products/:id - Admin delete product
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // Check if there are active order items
        const orderItem = await db.get('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);
        if (orderItem) {
            // Soft-deactivate by setting online_ordering to 0 and current_stock to 0 if orders exist
            await db.run('UPDATE products SET online_ordering = 0, current_stock = 0 WHERE id = ?', [id]);
            return res.json({
                success: true,
                message: 'Product has historical orders. Deactivated and hidden from catalog instead of deleting.'
            });
        }

        await db.run('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: `Product "${existing.name}" deleted successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete product: ' + err.message });
    }
});

module.exports = router;
