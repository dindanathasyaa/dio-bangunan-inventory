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

// Branches Route
app.get('/api/branches', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM branches');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inventory Routes
app.get('/api/inventory', async (req, res) => {
    const branch_id = req.query.branch_id;
    let query = `
        SELECT i.id, p.name, p.sku, c.name as category, p.unit, i.stock, i.min_stock, i.max_stock, i.branch_id, b.name as branch_name 
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN branches b ON i.branch_id = b.id
    `;
    const params = [];
    if (branch_id && branch_id !== 'all') {
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
    const { sku, name, category_id, unit, price, base_price, stock, branch_id, min_stock, max_stock } = req.body;
    try {
        // 1. Check if product exists by SKU, if not, insert into products
        let product_id;
        const [existingProducts] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
        
        if (existingProducts.length > 0) {
            product_id = existingProducts[0].id;
        } else {
            const [result] = await pool.query(
                'INSERT INTO products (sku, name, category_id, unit, price, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                [sku, name, category_id, unit, price || 0, base_price || 0]
            );
            product_id = result.insertId;
        }

        // 2. Insert or update inventory for the specific branch
        await pool.query(
            `INSERT INTO inventory (product_id, branch_id, stock, min_stock, max_stock) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE stock = stock + ?`,
            [product_id, branch_id, stock, min_stock, max_stock, stock]
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

// Update Inventory Item
app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params; // this is the inventory.id
    const { name, stock, min_stock, max_stock } = req.body;
    try {
        // Find product_id for this inventory
        const [inv] = await pool.query('SELECT product_id FROM inventory WHERE id = ?', [id]);
        if (inv.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
        
        // Update product name
        await pool.query('UPDATE products SET name = ? WHERE id = ?', [name, inv[0].product_id]);
        
        // Update inventory numbers
        await pool.query(
            'UPDATE inventory SET stock = ?, min_stock = ?, max_stock = ? WHERE id = ?',
            [stock, min_stock, max_stock, id]
        );

        res.json({ message: 'Data berhasil diupdate' });
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
    const { name, min_stock, max_stock } = req.body;
    try {
        await pool.query(
            'INSERT INTO categories (name, min_stock, max_stock) VALUES (?, ?, ?)',
            [name, min_stock || 5, max_stock || 50]
        );
        res.status(201).json({ message: 'Kategori berhasil ditambahkan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, min_stock, max_stock } = req.body;
    try {
        await pool.query(
            'UPDATE categories SET name = ?, min_stock = ?, max_stock = ? WHERE id = ?',
            [name, min_stock, max_stock, id]
        );
        res.json({ message: 'Kategori berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DSS Routes
app.get('/api/dss/recommendations', async (req, res) => {
    const branch_id = req.query.branch_id;
    try {
        let query = `
            SELECT i.product_id, i.branch_id, p.name, i.stock, i.min_stock, i.max_stock, b.name as branch_name, p.sku
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN branches b ON i.branch_id = b.id
        `;
        const params = [];
        if (branch_id && branch_id !== 'all') {
            query += ' WHERE i.branch_id = ?';
            params.push(branch_id);
        }
        
        const [inventoryRows] = await pool.query(query, params);
        
        let ropAlerts = []; // We will reuse the variable name to keep frontend compatible, but it represents "Low Stock Alerts"
        let transferSuggestions = []; // Represents "Overstock Alerts" now
        
        for (let item of inventoryRows) {
            item.rop = item.min_stock; // For frontend compatibility
            
            // Check minimum stock
            if (item.stock <= item.min_stock) {
                ropAlerts.push({
                    product_id: item.product_id,
                    product_name: item.name,
                    sku: item.sku,
                    branch_id: item.branch_id,
                    branch_name: item.branch_name,
                    current_stock: item.stock,
                    rop: item.min_stock,
                    message: `Stok mau habis! Tersisa ${item.stock}, batas minimum adalah ${item.min_stock}. Segera pesan lagi.`
                });
            }

            // Check maximum stock (Overstock)
            if (item.stock >= item.max_stock) {
                transferSuggestions.push({
                    product_id: item.product_id,
                    product_name: item.name,
                    sku: item.sku,
                    from_branch: item.branch_id,
                    from_branch_name: item.branch_name,
                    suggested_qty: item.stock - item.max_stock,
                    message: `Gudang kepenuhan! Terdapat ${item.stock} stok, melampaui batas maksimal (${item.max_stock}). Kurangi order atau adakan promo.`
                });
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

// Import ERP Routes
require('./erp_routes')(app, pool);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
