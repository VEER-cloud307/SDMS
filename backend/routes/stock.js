const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/stock - Overview of stock and low stock alerts
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const products = await db.all(`
            SELECT 
                p.id, p.name, p.category_id, p.price, p.current_stock, p.minimum_stock,
                p.max_order_quantity, p.online_ordering, p.image_url,
                c.name as category_name, s.name as supplier_name,
                CASE 
                    WHEN p.current_stock = 0 THEN 'Out of Stock'
                    WHEN p.current_stock <= p.minimum_stock THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY 
                CASE 
                    WHEN p.current_stock = 0 THEN 1
                    WHEN p.current_stock <= p.minimum_stock THEN 2
                    ELSE 3
                END ASC,
                p.current_stock ASC
        `);

        const lowStockItems = products.filter(p => p.current_stock <= p.minimum_stock);
        const outOfStockItems = products.filter(p => p.current_stock === 0);
        const totalItemsCount = products.length;
        const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
        const totalStockValue = products.reduce((acc, p) => acc + (p.current_stock * p.price), 0);

        res.json({
            success: true,
            summary: {
                total_products: totalItemsCount,
                total_units: totalStockUnits,
                total_inventory_value: parseFloat(totalStockValue.toFixed(2)),
                low_stock_count: lowStockItems.length,
                out_of_stock_count: outOfStockItems.length
            },
            low_stock_alerts: lowStockItems,
            products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stock/low - Quick low stock alerts
router.get('/low', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const items = await db.all(`
            SELECT 
                p.id, p.name, p.current_stock, p.minimum_stock, p.price, p.image_url,
                c.name as category_name, s.name as supplier_name, s.phone as supplier_phone
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.current_stock <= p.minimum_stock
            ORDER BY p.current_stock ASC
        `);

        res.json({
            success: true,
            count: items.length,
            alerts: items
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stock/incoming - List incoming stock shipments
router.get('/incoming', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const shipments = await db.all(`
            SELECT 
                si.*,
                p.name as product_name, p.image_url as product_image, p.current_stock,
                s.name as supplier_name, s.phone as supplier_phone
            FROM stock_incoming si
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN suppliers s ON si.supplier_id = s.id
            ORDER BY 
                CASE WHEN si.status = 'Expected' THEN 1 ELSE 2 END ASC,
                si.expected_date ASC
        `);

        res.json({ success: true, count: shipments.length, shipments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/stock/incoming - Add new incoming stock batch
router.post('/incoming', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, supplier_id, quantity, expected_date, notes } = req.body;
        if (!product_id || !quantity) {
            return res.status(400).json({ success: false, message: 'Product and quantity are required.' });
        }

        const qty = parseInt(quantity, 10);
        if (qty <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be greater than zero.' });
        }

        const product = await db.get('SELECT * FROM products WHERE id = ?', [product_id]);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        const supplierIdToUse = supplier_id || product.supplier_id || null;

        const result = await db.run(`
            INSERT INTO stock_incoming (
                product_id, supplier_id, quantity, expected_date, status, notes
            ) VALUES (?, ?, ?, ?, 'Expected', ?)
        `, [
            product_id,
            supplierIdToUse,
            qty,
            expected_date || new Date().toISOString().split('T')[0],
            notes || null
        ]);

        const newId = result.insertId || result.lastInsertRowid;
        const incoming = await db.get(`
            SELECT si.*, p.name as product_name, s.name as supplier_name
            FROM stock_incoming si
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN suppliers s ON si.supplier_id = s.id
            WHERE si.id = ?
        `, [newId]);

        res.status(201).json({
            success: true,
            message: `Incoming stock of ${qty} units for "${product.name}" scheduled.`,
            shipment: incoming
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/stock/incoming/:id/receive - Mark incoming stock as received & increment product stock
router.patch('/incoming/:id/receive', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const shipment = await db.get('SELECT * FROM stock_incoming WHERE id = ?', [id]);
        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Incoming stock record not found.' });
        }

        if (shipment.status === 'Received') {
            return res.status(400).json({ success: false, message: 'This shipment has already been marked as received.' });
        }

        // Add quantity to product's current stock
        await db.run(
            'UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [shipment.quantity, shipment.product_id]
        );

        // Update shipment status
        await db.run(
            'UPDATE stock_incoming SET status = "Received" WHERE id = ?',
            [id]
        );

        const updatedProduct = await db.get('SELECT id, name, current_stock FROM products WHERE id = ?', [shipment.product_id]);

        res.json({
            success: true,
            message: `Shipment received! Added ${shipment.quantity} units to "${updatedProduct.name}". New stock: ${updatedProduct.current_stock}`,
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
