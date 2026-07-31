const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan'
    });

    try {
        console.log("Creating product_variants table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_variants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(50) UNIQUE,
                price DECIMAL(10,2),
                base_price DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        console.log("Adding variant_id to inventory...");
        try {
            await connection.query(`ALTER TABLE inventory ADD COLUMN variant_id INT NULL`);
            await connection.query(`ALTER TABLE inventory ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE`);
        } catch (e) {
            console.log("Column variant_id already exists in inventory or error:", e.message);
        }

        console.log("Adding variant_id to sale_items...");
        try {
            await connection.query(`ALTER TABLE sale_items ADD COLUMN variant_id INT NULL`);
            await connection.query(`ALTER TABLE sale_items ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL`);
        } catch (e) {
            console.log("Column variant_id already exists in sale_items or error:", e.message);
        }

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await connection.end();
    }
}

migrate();
