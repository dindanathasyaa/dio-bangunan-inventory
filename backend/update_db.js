const fs = require('fs');
const mysql = require('mysql2/promise');

const additions = `
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    customer_name VARCHAR(100),
    total_amount DECIMAL(15,2) NOT NULL,
    profit DECIMAL(15,2) NOT NULL,
    payment_method ENUM('Cash', 'Kredit') DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    base_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status ENUM('Pending', 'Proses Pengantaran', 'Selesai') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    driver_name VARCHAR(100),
    delivery_date DATE,
    status ENUM('Menunggu', 'Di Perjalanan', 'Terkirim') DEFAULT 'Menunggu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('Cash', 'Kredit') DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    buy_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS receivables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    total_debt DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    status ENUM('Belum Lunas', 'Lunas') DEFAULT 'Belum Lunas',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    total_debt DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    status ENUM('Belum Lunas', 'Lunas') DEFAULT 'Belum Lunas',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cash_flow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    type ENUM('Masuk', 'Keluar') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);
`;

async function updateDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan',
        multipleStatements: true
    });
    
    fs.appendFileSync('../schema.sql', '\n' + additions);
    await connection.query(additions);
    console.log('Database schema updated successfully.');
    
    const [rows] = await connection.query('SELECT COUNT(*) as c FROM cash_flow');
    if (rows[0].c === 0) {
        await connection.query("INSERT INTO cash_flow (branch_id, type, amount, description) VALUES (1, 'Masuk', 10000000, 'Saldo Awal Toko')");
        console.log('Inserted initial cash balance.');
    }
    
    await connection.end();
}

updateDB().catch(console.error);
