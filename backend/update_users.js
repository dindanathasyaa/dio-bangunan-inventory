const mysql = require('mysql2/promise'); 
async function updateDB() { 
    const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'dio_bangunan'}); 
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('OWNER', 'MANAGER', 'ADMIN')");
    await pool.query("UPDATE users SET username='owner', password='owner123' WHERE id=1"); 
    await pool.query("UPDATE users SET username='admin', password='admin123', role='ADMIN' WHERE id=2"); 
    await pool.query("DELETE FROM users WHERE id=3"); 
    console.log('DB Updated'); 
    process.exit(0); 
} 
updateDB();
