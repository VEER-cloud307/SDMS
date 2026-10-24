const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/reports/sales - Sales report with date filter
router.get('/sales', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateCondition = '';
        const params = [];

        if (start_date && end_date) {
            dateCondition = ' AND DATE(o.created_at) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        } else if (start_date) {
            dateCondition = ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        } else if (end_date) {
            dateCondition = ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }

        // Summary metrics (excluding Cancelled orders from revenue)
        const summary = await db.get(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_amount ELSE 0 END), 0) as total_revenue,
                COALESCE(AVG(CASE WHEN status != 'Cancelled' THEN total_amount ELSE NULL END), 0) as average_order_value,
                COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
                COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count
            FROM orders o
            WHERE 1=1 ${dateCondition}
        `, params);

        // Daily breakdown
        const dailyBreakdown = await db.all(`
            SELECT 
                DATE(created_at) as sale_date,
                COUNT(*) as orders_count,
                SUM(CASE WHEN status != 'Cancelled' THEN total_amount ELSE 0 END) as daily_revenue
            FROM orders o
            WHERE 1=1 ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY sale_date DESC
            LIMIT 30
        `, params);

        // Top selling products
        const topProducts = await db.all(`
            SELECT 
                oi.product_id,
                oi.product_name,
                SUM(oi.quantity) as total_units_sold,
                SUM(oi.subtotal) as total_sales_volume
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'Cancelled' ${dateCondition}
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sales_volume DESC
            LIMIT 10
        `, params);

        res.json({
            success: true,
            filter: {
                start_date: start_date || 'All Time',
                end_date: end_date || 'All Time'
            },
            summary: {
                total_orders: summary.total_orders,
                total_revenue: parseFloat(Number(summary.total_revenue).toFixed(2)),
                average_order_value: parseFloat(Number(summary.average_order_value).toFixed(2)),
                delivered_count: summary.delivered_count,
                confirmed_count: summary.confirmed_count,
                pending_count: summary.pending_count,
                cancelled_count: summary.cancelled_count
            },
            daily_breakdown: dailyBreakdown,
            top_products: topProducts
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/reports/stock - Stock valuation & category health report
router.get('/stock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const categoryBreakdown = await db.all(`
            SELECT 
                c.id, c.name as category_name,
                COUNT(p.id) as total_products,
                COALESCE(SUM(p.current_stock), 0) as total_units,
                COALESCE(SUM(p.current_stock * p.price), 0) as inventory_value,
                SUM(CASE WHEN p.current_stock <= p.minimum_stock THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN p.current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY inventory_value DESC
        `);

        const overall = await db.get(`
            SELECT 
                COUNT(*) as total_products,
                COALESCE(SUM(current_stock), 0) as total_units,
                COALESCE(SUM(current_stock * price), 0) as total_valuation,
                SUM(CASE WHEN current_stock <= minimum_stock THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
            FROM products
        `);

        res.json({
            success: true,
            summary: {
                total_products: overall.total_products,
                total_units: overall.total_units,
                total_valuation: parseFloat(Number(overall.total_valuation).toFixed(2)),
                low_stock_count: overall.low_stock_count,
                out_of_stock_count: overall.out_of_stock_count
            },
            categories: categoryBreakdown
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
