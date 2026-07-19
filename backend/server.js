require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Default Laragon user
    password: '', // Default Laragon password
    database: 'dio_bangunan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auth Routes (Dummy for now)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            const user = rows[0];
            res.json({ id: user.id, username: user.username, email: user.email, role: user.role, branch_id: user.branch_id });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inventory Routes
app.get('/api/inventory', async (req, res) => {
    const branch_id = req.query.branch_id;
    let query = `
        SELECT i.id, p.name, p.sku, c.name as category, p.unit, i.stock, i.lead_time_days, i.safety_stock, i.branch_id, b.name as branch_name 
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN branches b ON i.branch_id = b.id
    `;
    const params = [];
    if (branch_id) {
        query += ' WHERE i.branch_id = ?';
        params.push(branch_id);
    }
    try {
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add New Inventory Item
app.post('/api/inventory', async (req, res) => {
    const { sku, name, category_id, unit, price, stock, branch_id, lead_time_days, safety_stock } = req.body;
    try {
        // 1. Check if product exists by SKU, if not, insert into products
        let product_id;
        const [existingProducts] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
        
        if (existingProducts.length > 0) {
            product_id = existingProducts[0].id;
        } else {
            const [result] = await pool.query(
                'INSERT INTO products (sku, name, category_id, unit, price) VALUES (?, ?, ?, ?, ?)',
                [sku, name, category_id, unit, price || 0]
            );
            product_id = result.insertId;
        }

        // 2. Insert or update inventory for the specific branch
        await pool.query(
            `INSERT INTO inventory (product_id, branch_id, stock, lead_time_days, safety_stock) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE stock = stock + ?`,
            [product_id, branch_id, stock, lead_time_days, safety_stock, stock]
        );

        // 3. Log transaction
        await pool.query(
            'INSERT INTO transactions (product_id, branch_id, type, quantity) VALUES (?, ?, ?, ?)',
            [product_id, branch_id, 'IN', stock]
        );

        res.status(201).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Categories Routes
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, default_lead_time, default_safety_stock } = req.body;
    try {
        await pool.query(
            'INSERT INTO categories (name, default_lead_time, default_safety_stock) VALUES (?, ?, ?)',
            [name, default_lead_time || 3, default_safety_stock || 5]
        );
        res.status(201).json({ message: 'Kategori berhasil ditambahkan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, default_lead_time, default_safety_stock } = req.body;
    try {
        await pool.query(
            'UPDATE categories SET name = ?, default_lead_time = ?, default_safety_stock = ? WHERE id = ?',
            [name, default_lead_time, default_safety_stock, id]
        );
        res.json({ message: 'Kategori berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DSS Routes
app.get('/api/dss/recommendations', async (req, res) => {
    // 1. ROP (Reorder Point) calculation
    // ROP = (Average Daily Sales * Lead Time) + Safety Stock
    // Since we don't have historical daily sales in the dummy data, let's assume Average Daily Sales = 5 for demo purposes.
    const avgDailySales = 5; 
    
    try {
        const [inventoryRows] = await pool.query(`
            SELECT i.product_id, i.branch_id, p.name, i.stock, i.lead_time_days, i.safety_stock, b.name as branch_name, p.sku
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN branches b ON i.branch_id = b.id
        `);
        
        let ropAlerts = [];
        let transferSuggestions = [];

        for (let item of inventoryRows) {
            const rop = (avgDailySales * item.lead_time_days) + item.safety_stock;
            item.rop = rop;
            
            if (item.stock <= rop) {
                ropAlerts.push({
                    product_id: item.product_id,
                    product_name: item.name,
                    sku: item.sku,
                    branch_id: item.branch_id,
                    branch_name: item.branch_name,
                    current_stock: item.stock,
                    rop: rop,
                    message: `Stok kritis! Sisa ${item.stock} di bawah batas ROP (${rop}).`
                });

                // Check other branches for excess stock (Smart Transfer)
                const [otherBranches] = await pool.query(`
                    SELECT i.stock, i.branch_id, b.name as branch_name, i.safety_stock, i.lead_time_days
                    FROM inventory i
                    JOIN branches b ON i.branch_id = b.id
                    WHERE i.product_id = ? AND i.branch_id != ?
                `, [item.product_id, item.branch_id]);

                for (let other of otherBranches) {
                    const otherRop = (avgDailySales * other.lead_time_days) + other.safety_stock;
                    // If the other branch has more than its ROP + the needed amount
                    const needed = rop - item.stock;
                    if (other.stock > (otherRop + needed)) {
                        transferSuggestions.push({
                            product_id: item.product_id,
                            product_name: item.name,
                            sku: item.sku,
                            from_branch: other.branch_id,
                            from_branch_name: other.branch_name,
                            to_branch: item.branch_id,
                            to_branch_name: item.branch_name,
                            suggested_qty: needed,
                            message: `Transfer ${needed} ${item.name} dari ${other.branch_name} ke ${item.branch_name} disarankan (stok ${other.branch_name} melimpah).`
                        });
                    }
                }
            }
        }

        res.json({
            ropAlerts,
            transferSuggestions
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
