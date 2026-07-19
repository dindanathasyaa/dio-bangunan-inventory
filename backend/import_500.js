const fs = require('fs');
const mysql = require('mysql2/promise');

async function importData() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    const csvData = fs.readFileSync('../Data Master Dio Bangunan.csv', 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    // limit to 500 records (plus header)
    const dataLines = lines.slice(1, 501);

    const categoriesMap = new Map(); // name -> id

    for (let i = 0; i < dataLines.length; i++) {
        // Simple CSV parser ignoring commas inside quotes
        const line = dataLines[i];
        let parts = [];
        let inQuotes = false;
        let current = '';
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);

        if (parts.length < 15) continue;

        let categoryName = parts[1].trim();
        let sku = parts[2].trim() || `SKU-AUTO-${i+1}`;
        let productName = parts[3].trim();
        let sellPrice = parseFloat(parts[7]) || 0;
        let stockQty = parseFloat(parts[11]) || 0;
        let unit = parts[15] ? parts[15].trim() : 'Pcs';
        if (unit.startsWith('@')) unit = unit.substring(1);
        if (!unit) unit = 'Pcs';
        
        if (!categoryName) categoryName = 'Lainnya';

        try {
            // Get or create category
            let categoryId = categoriesMap.get(categoryName);
            if (!categoryId) {
                const [existingCat] = await pool.query('SELECT id FROM categories WHERE name = ?', [categoryName]);
                if (existingCat.length > 0) {
                    categoryId = existingCat[0].id;
                } else {
                    const [res] = await pool.query('INSERT INTO categories (name, min_stock, max_stock) VALUES (?, ?, ?)', [categoryName, 5, 50]);
                    categoryId = res.insertId;
                }
                categoriesMap.set(categoryName, categoryId);
            }

            // Insert Product
            let productId;
            const [existingProd] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
            if (existingProd.length > 0) {
                productId = existingProd[0].id;
            } else {
                const [res] = await pool.query(
                    'INSERT INTO products (sku, name, category_id, unit, price) VALUES (?, ?, ?, ?, ?)',
                    [sku, productName, categoryId, unit, sellPrice]
                );
                productId = res.insertId;
            }

            // Insert Inventory
            await pool.query(
                `INSERT INTO inventory (product_id, branch_id, stock, min_stock, max_stock) 
                 VALUES (?, 1, ?, 5, 50) 
                 ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
                [productId, stockQty]
            );

        } catch (err) {
            console.error(`Error processing line ${i+1}: ${err.message}`);
        }
    }

    console.log(`Berhasil mengimpor ${dataLines.length} data ke database!`);
    pool.end();
}

importData().catch(console.error);
