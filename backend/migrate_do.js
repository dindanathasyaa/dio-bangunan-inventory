const mysql = require('mysql2/promise');
async function migrate() {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'dio_bangunan' });
    try {
        await conn.query("ALTER TABLE sales ADD COLUMN delivery_status ENUM('Langsung', 'DO', 'Sudah Diambil') DEFAULT 'Langsung'");
        console.log('Migration success: delivery_status added.');
    } catch(err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error(err);
        }
    }
    
    // Also update update_db.js
    const fs = require('fs');
    let content = fs.readFileSync('update_db.js', 'utf8');
    content = content.replace("payment_method ENUM('Cash', 'Kredit') DEFAULT 'Cash',", "payment_method ENUM('Cash', 'Kredit') DEFAULT 'Cash',\n    delivery_status ENUM('Langsung', 'DO', 'Sudah Diambil') DEFAULT 'Langsung',");
    fs.writeFileSync('update_db.js', content);
    console.log('update_db.js updated.');
    
    await conn.end();
}
migrate();
