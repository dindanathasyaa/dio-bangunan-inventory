const mysql = require('mysql2/promise');
async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dio_bangunan'
    });
    
    const [products] = await connection.query('DESCRIBE products');
    console.log("PRODUCTS TABLE");
    console.table(products);

    const [inventory] = await connection.query('DESCRIBE inventory');
    console.log("INVENTORY TABLE");
    console.table(inventory);

    await connection.end();
}
checkSchema().catch(console.error);
