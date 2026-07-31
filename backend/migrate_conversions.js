const mysql = require('mysql2/promise');

async function migrate() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Creating product_conversions table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_conversions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                multiplier DECIMAL(10,4) NOT NULL,
                price DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log("Created product_conversions table.");

        console.log("Adding multiplier and unit_name to sale_items...");
        try {
            await pool.query('ALTER TABLE sale_items ADD COLUMN multiplier DECIMAL(10,4) DEFAULT 1.0000 AFTER qty');
        } catch(e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log(e);
        }
        
        try {
            await pool.query('ALTER TABLE sale_items ADD COLUMN unit_name VARCHAR(100) DEFAULT NULL AFTER multiplier');
        } catch(e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log(e);
        }
        console.log("sale_items updated.");

        console.log("Migration finished.");
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        pool.end();
    }
}

migrate();
