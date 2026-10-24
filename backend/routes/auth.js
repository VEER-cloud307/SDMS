const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
        }

        const user = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'An error occurred during login. ' + err.message });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password, phone, role, address) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hashedPassword, phone || null, 'customer', address || null]
        );

        const newUserId = result.insertId || result.lastInsertRowid;
        const token = jwt.sign(
            { id: newUserId, email: email.trim().toLowerCase(), name: name.trim(), role: 'customer' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: newUserId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role: 'customer',
                phone: phone || '',
                address: address || ''
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Error registering account: ' + err.message });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, name, email, phone, role, address, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone, address, current_password, new_password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        let passwordToSet = user.password;
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
            }
            const isMatch = await bcrypt.compare(current_password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            }
            if (new_password.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
            }
            passwordToSet = await bcrypt.hash(new_password, 10);
        }

        await db.run(
            'UPDATE users SET name = ?, phone = ?, address = ?, password = ? WHERE id = ?',
            [name || user.name, phone !== undefined ? phone : user.phone, address !== undefined ? address : user.address, passwordToSet, user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: {
                id: user.id,
                name: name || user.name,
                email: user.email,
                role: user.role,
                phone: phone !== undefined ? phone : user.phone,
                address: address !== undefined ? address : user.address
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
