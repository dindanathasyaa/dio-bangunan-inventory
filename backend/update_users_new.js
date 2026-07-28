const mysql = require('mysql2/promise');

async function updateDB() {
    const pool = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'dio_bangunan'});
    
    // Clear old users
    await pool.query('TRUNCATE TABLE users');
    
    // Insert new users
    const users = [
        ['owner', 'owner123', 'OWNER', null],
        ['owner_pusat', 'ownerpusat123', 'OWNER', 1],
        ['owner_cabang', 'ownercabang123', 'OWNER', 2],
        ['admin_pusat', 'adminpusat123', 'ADMIN', 1],
        ['admin_cabang', 'admincabang123', 'ADMIN', 2]
    ];
    
    for (const u of users) {
        await pool.query('INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)', u);
    }
    
    console.log('Users updated successfully');
    process.exit(0);
}
updateDB().catch(console.error);
