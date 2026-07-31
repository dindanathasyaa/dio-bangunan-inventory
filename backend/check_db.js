const mysql = require('mysql2/promise');

async function checkDb() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan'
    });

    console.log("--- Sales ---");
    const [sales] = await connection.query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
    console.table(sales);

    await connection.end();
}

checkDb().catch(console.error);
