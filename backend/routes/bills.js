const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// GET /api/bills - List bills (Admin or user's own)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'admin';
        const { search, payment_status } = req.query;

        let sql = `
            SELECT 
                b.*,
                o.order_number, o.status as order_status, o.customer_email
            FROM bills b
            JOIN orders o ON b.order_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (!isAdmin) {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Please log in to view invoices.' });
            }
            sql += ' AND (o.user_id = ? OR LOWER(o.customer_email) = LOWER(?))';
            params.push(req.user.id, req.user.email);
        }

        if (payment_status && payment_status !== 'all') {
            sql += ' AND b.payment_status = ?';
            params.push(payment_status);
        }

        if (search && search.trim()) {
            sql += ' AND (b.bill_number LIKE ? OR b.customer_name LIKE ? OR o.order_number LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        sql += ' ORDER BY b.id DESC';

        const bills = await db.all(sql, params);
        res.json({ success: true, count: bills.length, bills });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/bills/:id - Complete printable bill with business info & items
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const billId = req.params.id;
        const bill = await db.get(`
            SELECT b.*, o.order_number, o.status as order_status, o.user_id, o.notes as order_notes
            FROM bills b
            JOIN orders o ON b.order_id = o.id
            WHERE b.id = ? OR b.bill_number = ?
        `, [billId, billId]);

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found.' });
        }

        // Authorization check
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin && req.user && bill.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const items = await db.all(`
            SELECT oi.*, p.specifications
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [bill.order_id]);

        const business = await db.get('SELECT * FROM business_info WHERE id = 1');

        res.json({
            success: true,
            bill: {
                ...bill,
                items,
                business: business || {
                    shop_name: 'Saptashrungi Disposables',
                    owner_name: 'Mr. Chetan Jadav',
                    address: '3/1477, Daxini maholla, Ambawadi, Salabatpura, Surat - 395002',
                    phone: '+91 9082545483',
                    email: 'saptashrungidisposables@gmail.com'
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/bills - Generate bill for an order (Server calculates total)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { order_id, payment_method, payment_status, notes } = req.body;
        if (!order_id) {
            return res.status(400).json({ success: false, message: 'Order ID is required to generate a bill.' });
        }

        const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Check if bill already exists for this order
        const existingBill = await db.get('SELECT * FROM bills WHERE order_id = ?', [order_id]);
        if (existingBill) {
            return res.status(400).json({
                success: false,
                message: `Bill #${existingBill.bill_number} already exists for this order.`,
                bill: existingBill
            });
        }

        // Fetch order items and calculate total accurately on the server
        const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order_id]);
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order has no items to bill.' });
        }

        const serverCalculatedTotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const finalTotal = parseFloat(serverCalculatedTotal.toFixed(2));

        const year = new Date().getFullYear();
        const randId = Math.floor(100 + Math.random() * 900);
        const billNumber = `BILL-${year}-${Date.now().toString().slice(-3)}${randId}`;
        const billDate = new Date().toISOString().split('T')[0];

        const result = await db.run(`
            INSERT INTO bills (
                bill_number, order_id, bill_date, customer_name,
                customer_phone, customer_address, total_amount,
                payment_method, payment_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            billNumber,
            order.id,
            billDate,
            order.customer_name,
            order.customer_phone,
            order.shipping_address,
            finalTotal,
            payment_method || 'Cash',
            payment_status || 'Paid',
            notes || `Generated for Order #${order.order_number}`
        ]);

        const newBillId = result.insertId || result.lastInsertRowid;
        const newBill = await db.get('SELECT * FROM bills WHERE id = ?', [newBillId]);

        res.status(201).json({
            success: true,
            message: `Bill #${billNumber} generated successfully. Total: ₹${finalTotal}`,
            bill: newBill
        });
    } catch (err) {
        console.error('Error generating bill:', err);
        res.status(500).json({ success: false, message: 'Failed to generate bill: ' + err.message });
    }
});

// PATCH /api/bills/:id/payment - Update payment status
router.patch('/:id/payment', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { payment_status, payment_method } = req.body;

        await db.run(
            'UPDATE bills SET payment_status = ?, payment_method = COALESCE(?, payment_method) WHERE id = ?',
            [payment_status, payment_method || null, id]
        );

        res.json({ success: true, message: 'Payment status updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
