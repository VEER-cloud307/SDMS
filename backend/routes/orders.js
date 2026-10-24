const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// POST /api/orders - Place a new order
router.post('/', optionalAuth, async (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            items,
            notes
        } = req.body;

        // Basic validations
        if (!customer_name || !customer_phone || !shipping_address) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone number, and delivery address are required.'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty. Please add items before placing an order.'
            });
        }

        const email = customer_email || (req.user ? req.user.email : 'guest@sdms.com');
        const userId = req.user ? req.user.id : null;

        // Verify all products, availability, stock, and max_order_limit
        const processedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const product = await db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.product_id} was not found.`
                });
            }

            if (!product.online_ordering) {
                return res.status(400).json({
                    success: false,
                    message: `"${product.name}" is not currently available for online orders.`
                });
            }

            const requestedQty = parseInt(item.quantity, 10);
            if (isNaN(requestedQty) || requestedQty <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity specified for "${product.name}".`
                });
            }

            // Check out of stock
            if (product.current_stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `"${product.name}" is currently OUT OF STOCK. Please remove it from cart or request an enquiry.`
                });
            }

            // Check exceeds stock
            if (requestedQty > product.current_stock) {
                return res.status(400).json({
                    success: false,
                    message: `Requested quantity (${requestedQty}) for "${product.name}" exceeds available stock (${product.current_stock} left).`
                });
            }

            // Check max order limit
            if (requestedQty > product.max_order_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Requested quantity (${requestedQty}) for "${product.name}" exceeds the maximum order limit of ${product.max_order_quantity} units per order.`
                });
            }

            const itemSubtotal = parseFloat((product.price * requestedQty).toFixed(2));
            calculatedTotal += itemSubtotal;

            processedItems.push({
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: requestedQty,
                subtotal: itemSubtotal
            });
        }

        calculatedTotal = parseFloat(calculatedTotal.toFixed(2));

        // Generate unique order number: ORD-YYYY-XXXXX
        const currentYear = new Date().getFullYear();
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${currentYear}-${Date.now().toString().slice(-4)}${randSuffix.toString().slice(-2)}`;

        // Insert order and items
        const orderResult = await db.run(`
            INSERT INTO orders (
                order_number, user_id, customer_name, customer_email,
                customer_phone, shipping_address, total_amount, status,
                stock_deducted, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 0, ?)
        `, [
            orderNumber,
            userId,
            customer_name.trim(),
            email.trim().toLowerCase(),
            customer_phone.trim(),
            shipping_address.trim(),
            calculatedTotal,
            notes || null
        ]);

        const orderId = orderResult.insertId || orderResult.lastInsertRowid;

        for (const it of processedItems) {
            await db.run(`
                INSERT INTO order_items (
                    order_id, product_id, product_name, price, quantity, subtotal
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                orderId,
                it.product_id,
                it.product_name,
                it.price,
                it.quantity,
                it.subtotal
            ]);
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully! Awaiting confirmation from Saptashrungi Disposables.',
            order: {
                id: orderId,
                order_number: orderNumber,
                customer_name,
                total_amount: calculatedTotal,
                status: 'Pending',
                items: processedItems
            }
        });
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ success: false, message: 'Failed to place order: ' + err.message });
    }
});

// GET /api/orders - List orders (admin gets all, customer gets own)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'admin';
        const { status, search, limit, email, phone } = req.query;

        let sql = `
            SELECT 
                o.*,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
                b.id as bill_id, b.bill_number
            FROM orders o
            LEFT JOIN bills b ON o.id = b.order_id
            WHERE 1=1
        `;
        const params = [];

        if (!isAdmin) {
            if (req.user) {
                sql += ' AND (o.user_id = ? OR LOWER(o.customer_email) = LOWER(?))';
                params.push(req.user.id, req.user.email);
            } else if (email || phone) {
                sql += ' AND (LOWER(o.customer_email) = LOWER(?) OR o.customer_phone = ?)';
                params.push((email || '').toLowerCase(), phone || '');
            } else {
                return res.status(401).json({ success: false, message: 'Please log in to view orders.' });
            }
        }

        if (status && status !== 'all') {
            sql += ' AND o.status = ?';
            params.push(status);
        }

        if (search && search.trim()) {
            sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        sql += ' ORDER BY o.id DESC';

        if (limit) {
            sql += ' LIMIT ?';
            params.push(Number(limit));
        }

        const orders = await db.all(sql, params);
        res.json({ success: true, count: orders.length, orders });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/orders/:id - Get single order details with items
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await db.get(`
            SELECT o.*, b.id as bill_id, b.bill_number, b.payment_status as bill_payment_status
            FROM orders o
            LEFT JOIN bills b ON o.id = b.order_id
            WHERE o.id = ? OR o.order_number = ?
        `, [orderId, orderId]);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Access check
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin) {
            if (req.user && order.user_id !== req.user.id && order.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' });
            }
        }

        const items = await db.all(`
            SELECT oi.*, p.image_url, p.specifications
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [order.id]);

        res.json({
            success: true,
            order: {
                ...order,
                items
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH /api/orders/:id/status - Admin update order status with stock deduction/restoration rule
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`
            });
        }

        const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const oldStatus = order.status;
        const currentStockDeducted = Number(order.stock_deducted);
        const orderItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

        // RULE: Confirming reduces stock, Cancelling restores it
        const shouldDeductStock = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'].includes(status);
        const shouldRestoreStock = status === 'Cancelled' || status === 'Pending';

        let newStockDeducted = currentStockDeducted;

        // Transition: Not deducted -> Needs deduction (e.g. Pending -> Confirmed)
        if (shouldDeductStock && currentStockDeducted === 0) {
            // Check stock availability first
            for (const it of orderItems) {
                if (it.product_id) {
                    const product = await db.get('SELECT current_stock, name FROM products WHERE id = ?', [it.product_id]);
                    if (product && product.current_stock < it.quantity) {
                        return res.status(400).json({
                            success: false,
                            message: `Cannot confirm order: Insufficient stock for "${product.name}" (Required: ${it.quantity}, Available: ${product.current_stock}).`
                        });
                    }
                }
            }

            // Perform stock deduction
            for (const it of orderItems) {
                if (it.product_id) {
                    await db.run(
                        'UPDATE products SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [it.quantity, it.product_id]
                    );
                }
            }
            newStockDeducted = 1;
        }

        // Transition: Deducted -> Needs restoration (e.g. Confirmed -> Cancelled)
        else if (shouldRestoreStock && currentStockDeducted === 1) {
            for (const it of orderItems) {
                if (it.product_id) {
                    await db.run(
                        'UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [it.quantity, it.product_id]
                    );
                }
            }
            newStockDeducted = 0;
        }

        await db.run(`
            UPDATE orders SET 
                status = ?,
                stock_deducted = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, newStockDeducted, orderId]);

        res.json({
            success: true,
            message: `Order #${order.order_number} status updated from "${oldStatus}" to "${status}". ${newStockDeducted !== currentStockDeducted ? (newStockDeducted ? 'Stock successfully deducted.' : 'Stock successfully restored.') : ''}`,
            order: {
                id: order.id,
                order_number: order.order_number,
                old_status: oldStatus,
                new_status: status,
                stock_deducted: newStockDeducted
            }
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status: ' + err.message });
    }
});

module.exports = router;
