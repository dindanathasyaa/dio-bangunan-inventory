const mysql = require('mysql2/promise');

async function migrate() {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'dio_bangunan' });
    try {
        console.log("Creating customers table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                balance DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating customer_deposits_history table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS customer_deposits_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                type ENUM('in', 'out') NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        console.log("Adding customer_id to sales...");
        try {
            await conn.query("ALTER TABLE sales ADD COLUMN customer_id INT DEFAULT NULL");
            await conn.query("ALTER TABLE sales ADD CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id)");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
        }

        console.log("Updating payment_method ENUM in sales...");
        try {
            await conn.query("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('Cash', 'Kredit', 'Potong Saldo') DEFAULT 'Cash'");
        } catch (e) {
            console.error(e.message);
        }

        console.log("Migration successful.");
    } catch(err) {
        console.error("Migration failed:", err);
    }
    
    // Also update update_db.js
    const fs = require('fs');
    let content = fs.readFileSync('update_db.js', 'utf8');
    content = content.replace(
        "payment_method ENUM('Cash', 'Kredit') DEFAULT 'Cash',",
        "payment_method ENUM('Cash', 'Kredit', 'Potong Saldo') DEFAULT 'Cash',\n    customer_id INT DEFAULT NULL,"
    );
    
    if (!content.includes('CREATE TABLE IF NOT EXISTS customers')) {
        const customerTables = `
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_deposits_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
`;
        content = content.replace('const additions = `', 'const additions = `' + customerTables);
    }
    fs.writeFileSync('update_db.js', content);
    console.log("update_db.js updated.");

    await conn.end();
}
migrate();
