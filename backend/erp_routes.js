module.exports = function(app, pool) {

    // --- CUSTOMERS ---
    app.get('/api/customers', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/customers', async (req, res) => {
        const { name, phone } = req.body;
        try {
            const [result] = await pool.query('INSERT INTO customers (name, phone) VALUES (?, ?)', [name, phone]);
            res.json({ id: result.insertId, name, phone, balance: 0 });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- SALES ---
    app.post('/api/sales', async (req, res) => {
        const { branch_id, customer_name, customer_id, payment_method, items, transaction_date, delivery_status = 'Langsung', amount_paid, save_as_deposit } = req.body;
        // items: [{ product_id, qty, price, base_price }]
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let total_amount = 0;
            let total_profit = 0;

            for (let item of items) {
                total_amount += (item.qty * item.price);
                total_profit += (item.qty * (item.price - item.base_price));
            }

            if (payment_method === 'Potong Saldo') {
                if (!customer_id) throw new Error('Pelanggan harus dipilih untuk memotong saldo');
                const [custs] = await connection.query('SELECT balance FROM customers WHERE id = ? FOR UPDATE', [customer_id]);
                if (custs.length === 0) throw new Error('Pelanggan tidak ditemukan');
                if (custs[0].balance < total_amount) throw new Error(`Saldo tidak mencukupi. Saldo tersisa: Rp ${Number(custs[0].balance).toLocaleString('id-ID')}`);
            }

            let saleRes;
            if (transaction_date) {
                [saleRes] = await connection.query(
                    `INSERT INTO sales (branch_id, customer_name, customer_id, total_amount, profit, payment_method, created_at, delivery_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [branch_id, customer_name, customer_id || null, total_amount, total_profit, payment_method, transaction_date, delivery_status]
                );
            } else {
                [saleRes] = await connection.query(
                    `INSERT INTO sales (branch_id, customer_name, customer_id, total_amount, profit, payment_method, delivery_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [branch_id, customer_name, customer_id || null, total_amount, total_profit, payment_method, delivery_status]
                );
            }
            const sale_id = saleRes.insertId;

            for (let item of items) {
                const multiplier = item.multiplier || 1;
                const deductQty = item.qty * multiplier;

                await connection.query(
                    `INSERT INTO sale_items (sale_id, product_id, variant_id, qty, price, base_price, multiplier, unit_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [sale_id, item.product_id, item.variant_id || null, item.qty, item.price, item.base_price, multiplier, item.unit_name || null]
                );
                // Deduct stock only if it's taken immediately
                if (delivery_status === 'Langsung') {
                    if (item.variant_id) {
                        await connection.query(
                            `UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND variant_id = ? AND branch_id = ?`,
                            [deductQty, item.product_id, item.variant_id, branch_id]
                        );
                    } else {
                        await connection.query(
                            `UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND variant_id IS NULL AND branch_id = ?`,
                            [deductQty, item.product_id, branch_id]
                        );
                    }
                }
            }

            if (payment_method === 'Cash') {
                let flowAmount = total_amount;
                let cashDesc = `Penjualan Tunai: ${customer_name || 'Umum'}`;
                
                if (amount_paid && amount_paid > total_amount && save_as_deposit && customer_id) {
                    const depositAmount = amount_paid - total_amount;
                    flowAmount = amount_paid;
                    
                    await connection.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [depositAmount, customer_id]);
                    await connection.query(
                        'INSERT INTO customer_deposits_history (customer_id, amount, type, description) VALUES (?, ?, ?, ?)',
                        [customer_id, depositAmount, 'in', `Kembalian dititipkan dari Penjualan ID: ${sale_id}`]
                    );
                    cashDesc = `Penjualan Tunai & Titip Saldo: ${customer_name || 'Umum'}`;
                }

                if (transaction_date) {
                    await connection.query(
                        `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id, created_at) VALUES (?, 'Masuk', ?, ?, ?, ?)`,
                        [branch_id, flowAmount, cashDesc, sale_id, transaction_date]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Masuk', ?, ?, ?)`,
                        [branch_id, flowAmount, cashDesc, sale_id]
                    );
                }
            } else if (payment_method === 'Kredit') {
                if (transaction_date) {
                    await connection.query(
                        `INSERT INTO receivables (sale_id, customer_name, total_debt, status, created_at) VALUES (?, ?, ?, 'Belum Lunas', ?)`,
                        [sale_id, customer_name, total_amount, transaction_date]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO receivables (sale_id, customer_name, total_debt, status) VALUES (?, ?, ?, 'Belum Lunas')`,
                        [sale_id, customer_name, total_amount]
                    );
                }
            } else if (payment_method === 'Potong Saldo') {
                await connection.query('UPDATE customers SET balance = balance - ? WHERE id = ?', [total_amount, customer_id]);
                await connection.query(
                    'INSERT INTO customer_deposits_history (customer_id, amount, type, description) VALUES (?, ?, ?, ?)',
                    [customer_id, total_amount, 'out', `Pembayaran Saldo Penjualan ID: ${sale_id}`]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Penjualan berhasil', sale_id });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/sales/recap', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            let query = `
                SELECT 
                    DATE(created_at) as date, 
                    SUM(total_amount) as total_sales, 
                    SUM(profit) as total_profit, 
                    COUNT(id) as total_transactions 
                FROM sales 
            `;
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += `WHERE branch_id = ? `;
                params.push(branch_id);
            }
            query += `GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`;
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/sales/:id/items', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT IF(v.name IS NOT NULL, CONCAT(p.name, " - ", v.name), p.name) as name, IFNULL(si.unit_name, p.unit) as unit, si.qty, si.price, si.multiplier FROM sale_items si JOIN products p ON si.product_id = p.id LEFT JOIN product_variants v ON si.variant_id = v.id WHERE si.sale_id = ?', [req.params.id]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/sales/:id/delivery-status', async (req, res) => {
        const { id } = req.params;
        const { delivery_status } = req.body;
        
        if (delivery_status !== 'Sudah Diambil') {
            return res.status(400).json({ error: 'Status tidak valid' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // Check current status
            const [sales] = await connection.query('SELECT branch_id, delivery_status FROM sales WHERE id = ?', [id]);
            if (sales.length === 0) throw new Error('Penjualan tidak ditemukan');
            const sale = sales[0];
            
            if (sale.delivery_status === 'Sudah Diambil') {
                throw new Error('Barang sudah diambil sebelumnya');
            }

            // Update status
            await connection.query('UPDATE sales SET delivery_status = ? WHERE id = ?', [delivery_status, id]);
            
            // Deduct stock for all items in this sale
            const [items] = await connection.query('SELECT product_id, variant_id, qty, multiplier FROM sale_items WHERE sale_id = ?', [id]);
            for (let item of items) {
                const deductQty = item.qty * (item.multiplier || 1);
                if (item.variant_id) {
                    await connection.query(
                        'UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND variant_id = ? AND branch_id = ?',
                        [deductQty, item.product_id, item.variant_id, sale.branch_id]
                    );
                } else {
                    await connection.query(
                        'UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND variant_id IS NULL AND branch_id = ?',
                        [deductQty, item.product_id, sale.branch_id]
                    );
                }
            }
            
            await connection.commit();
            res.json({ message: 'Status berhasil diupdate dan stok dipotong' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/sales/delivery-orders', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            let query = `
                SELECT s.*, 
                    (
                        SELECT JSON_ARRAYAGG(JSON_OBJECT('name', IF(v.name IS NOT NULL, CONCAT(p.name, ' - ', v.name), p.name), 'unit', IFNULL(si.unit_name, p.unit), 'qty', si.qty, 'price', si.price, 'multiplier', si.multiplier))
                        FROM sale_items si
                        JOIN products p ON si.product_id = p.id
                        LEFT JOIN product_variants v ON si.variant_id = v.id
                        WHERE si.sale_id = s.id
                    ) AS items
                FROM sales s 
                WHERE s.delivery_status = 'DO'
            `;
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' AND s.branch_id = ?';
                params.push(branch_id);
            }
            query += ' ORDER BY s.created_at DESC';
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/sales', async (req, res) => {
        const branch_id = req.query.branch_id;
        const date = req.query.date;
        try {
            let query = `
                SELECT s.*, 
                    (
                        SELECT JSON_ARRAYAGG(JSON_OBJECT('name', IF(v.name IS NOT NULL, CONCAT(p.name, ' - ', v.name), p.name), 'unit', p.unit, 'qty', si.qty, 'price', si.price))
                        FROM sale_items si
                        JOIN products p ON si.product_id = p.id
                        LEFT JOIN product_variants v ON si.variant_id = v.id
                        WHERE si.sale_id = s.id
                    ) AS items
                FROM sales s 
                WHERE 1=1
            `;
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' AND s.branch_id = ?';
                params.push(branch_id);
            }
            if (date) {
                query += ' AND DATE(s.created_at) = ?';
                params.push(date);
            }
            query += ' ORDER BY s.created_at DESC LIMIT 50';
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- PURCHASES ---
    app.post('/api/purchases', async (req, res) => {
        const { branch_id, supplier_name, payment_method, items } = req.body;
        // items: [{ product_id, qty, buy_price }]
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let total_amount = 0;
            for (let item of items) {
                total_amount += (item.qty * item.buy_price);
            }

            const [purchRes] = await connection.query(
                `INSERT INTO purchases (branch_id, supplier_name, total_amount, payment_method) VALUES (?, ?, ?, ?)`,
                [branch_id, supplier_name, total_amount, payment_method]
            );
            const purchase_id = purchRes.insertId;

            for (let item of items) {
                let currentProductId = null;
                
                // Always look up by SKU because the frontend might send the inventory ID by mistake
                const [existing] = await connection.query('SELECT id FROM products WHERE sku = ?', [item.sku]);
                if (existing.length > 0) {
                    currentProductId = existing[0].id;
                } else {
                    // Insert new product
                    const [insertRes] = await connection.query(
                        'INSERT INTO products (sku, name, category_id, unit, price, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                        [item.sku, item.name, item.category_id || 1, item.unit || 'Buah', item.price || item.buy_price || 0, item.buy_price || 0]
                    );
                    currentProductId = insertRes.insertId;
                }

                await connection.query(
                    `INSERT INTO purchase_items (purchase_id, product_id, qty, buy_price) VALUES (?, ?, ?, ?)`,
                    [purchase_id, currentProductId, item.qty, item.buy_price]
                );
                // Add stock using INSERT ... ON DUPLICATE KEY UPDATE to handle new items and branches safely
                await connection.query(
                    `INSERT INTO inventory (product_id, branch_id, stock, min_stock, max_stock) 
                     VALUES (?, ?, ?, 5, 50) 
                     ON DUPLICATE KEY UPDATE stock = stock + ?`,
                    [currentProductId, branch_id, item.qty, item.qty]
                );
            }

            if (payment_method === 'Cash') {
                await connection.query(
                    `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Keluar', ?, ?, ?)`,
                    [branch_id, total_amount, `Pembelian dari: ${supplier_name}`, purchase_id]
                );
            } else if (payment_method === 'Kredit') {
                await connection.query(
                    `INSERT INTO payables (purchase_id, supplier_name, total_debt, status) VALUES (?, ?, ?, 'Belum Lunas')`,
                    [purchase_id, supplier_name, total_amount]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Pembelian berhasil', purchase_id });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    // --- ORDERS (Phone Orders) ---
    app.post('/api/orders/simple', async (req, res) => {
        const { branch_id, customer_name, phone, address, total_amount } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [orderRes] = await connection.query(
                `INSERT INTO orders (branch_id, customer_name, phone, address, total_amount) VALUES (?, ?, ?, ?, ?)`,
                [branch_id, customer_name, phone, address, total_amount]
            );
            const order_id = orderRes.insertId;

            await connection.query(
                `INSERT INTO deliveries (order_id) VALUES (?)`,
                [order_id]
            );

            await connection.commit();
            res.status(201).json({ message: 'Order berhasil', order_id });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.post('/api/orders', async (req, res) => {
        const { branch_id, customer_name, phone, address, items } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let total_amount = 0;
            for (let item of items) {
                total_amount += (item.qty * item.price);
            }

            const [orderRes] = await connection.query(
                `INSERT INTO orders (branch_id, customer_name, phone, address, total_amount) VALUES (?, ?, ?, ?, ?)`,
                [branch_id, customer_name, phone, address, total_amount]
            );
            const order_id = orderRes.insertId;

            for (let item of items) {
                await connection.query(
                    `INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)`,
                    [order_id, item.product_id, item.qty, item.price]
                );
                // Note: Phone orders might reserve stock or deduct directly. Let's deduct stock to be safe.
                await connection.query(
                    `UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND branch_id = ?`,
                    [item.qty, item.product_id, branch_id]
                );
            }

            // Create delivery entry
            await connection.query(
                `INSERT INTO deliveries (order_id) VALUES (?)`,
                [order_id]
            );

            await connection.commit();
            res.status(201).json({ message: 'Order berhasil', order_id });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/orders', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            let query = 'SELECT * FROM orders';
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' WHERE branch_id = ?';
                params.push(branch_id);
            }
            query += ' ORDER BY created_at DESC';
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- DELIVERIES ---
    app.get('/api/deliveries', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            let query = `
                SELECT d.*, o.customer_name, o.address, o.phone, o.total_amount, o.branch_id 
                FROM deliveries d 
                JOIN orders o ON d.order_id = o.id 
            `;
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' WHERE o.branch_id = ?';
                params.push(branch_id);
            }
            query += ' ORDER BY d.created_at DESC';
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/deliveries/:id', async (req, res) => {
        const { driver_name, status } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.query(
                'UPDATE deliveries SET driver_name = ?, status = ? WHERE id = ?',
                [driver_name, status, req.params.id]
            );
            
            if (status === 'Terkirim') {
                const [dels] = await connection.query('SELECT order_id FROM deliveries WHERE id = ?', [req.params.id]);
                if (dels.length > 0) {
                    await connection.query("UPDATE orders SET status = 'Selesai' WHERE id = ?", [dels[0].order_id]);
                    // When order is finished, we get the cash
                    const [ord] = await connection.query('SELECT * FROM orders WHERE id = ?', [dels[0].order_id]);
                    if (ord.length > 0) {
                         await connection.query(
                            `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Masuk', ?, ?, ?)`,
                            [ord[0].branch_id, ord[0].total_amount, `Pelunasan Order (Kirim): ${ord[0].customer_name}`, ord[0].id]
                        );
                    }
                }
            } else if (status === 'Di Perjalanan') {
                const [dels] = await connection.query('SELECT order_id FROM deliveries WHERE id = ?', [req.params.id]);
                if (dels.length > 0) {
                    await connection.query("UPDATE orders SET status = 'Proses Pengantaran' WHERE id = ?", [dels[0].order_id]);
                }
            }

            await connection.commit();
            res.json({ message: 'Jadwal pengantaran diupdate' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    // --- DEBT (Hutang Piutang) ---
    app.post('/api/payables/new', async (req, res) => {
        const { branch_id, supplier_name, total_debt } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.query(
                `INSERT INTO payables (purchase_id, supplier_name, total_debt, status) VALUES (0, ?, ?, 'Belum Lunas')`,
                [supplier_name, total_debt]
            );
            res.status(201).json({ message: 'Hutang berhasil dicatat' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/receivables/:id/history', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT amount, created_at, description FROM cash_flow WHERE reference_id = ? AND description = \'Pembayaran Piutang Pembeli\' ORDER BY created_at DESC', [req.params.id]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/receivables', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM receivables ORDER BY created_at DESC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/receivables/:id/add-items', async (req, res) => {
        const { id } = req.params;
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Tidak ada barang yang ditambahkan' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [recvRows] = await connection.query(`SELECT sale_id, total_debt, amount_paid FROM receivables WHERE id = ?`, [id]);
            if (recvRows.length === 0) throw new Error("Piutang tidak ditemukan");
            const receivable = recvRows[0];
            
            if (receivable.sale_id <= 0) {
                throw new Error("Tidak dapat mengedit nota Piutang Lama");
            }

            const [saleRows] = await connection.query(`SELECT branch_id FROM sales WHERE id = ?`, [receivable.sale_id]);
            if (saleRows.length === 0) throw new Error("Data nota penjualan asli tidak ditemukan");
            const branch_id = saleRows[0].branch_id;

            let addAmount = 0;
            let addProfit = 0;

            for (let item of items) {
                addAmount += (item.qty * item.price);
                addProfit += (item.qty * (item.price - item.base_price));

                await connection.query(
                    `INSERT INTO sale_items (sale_id, product_id, qty, price, base_price) VALUES (?, ?, ?, ?, ?)`,
                    [receivable.sale_id, item.product_id, item.qty, item.price, item.base_price]
                );

                await connection.query(
                    `UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND branch_id = ?`,
                    [item.qty, item.product_id, branch_id]
                );
            }

            await connection.query(
                `UPDATE sales SET total_amount = total_amount + ?, profit = profit + ? WHERE id = ?`,
                [addAmount, addProfit, receivable.sale_id]
            );

            const newTotalDebt = parseFloat(receivable.total_debt) + addAmount;
            const status = parseFloat(receivable.amount_paid) >= newTotalDebt ? 'Lunas' : 'Belum Lunas';

            await connection.query(
                `UPDATE receivables SET total_debt = ?, status = ? WHERE id = ?`,
                [newTotalDebt, status, id]
            );

            await connection.commit();
            res.json({ message: 'Berhasil menambahkan barang ke nota hutang' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/payables/:id/history', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT amount, created_at, description FROM cash_flow WHERE reference_id = ? AND description = \'Pembayaran Hutang Toko\' ORDER BY created_at DESC', [req.params.id]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/payables', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM payables ORDER BY created_at DESC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/receivables/pay', async (req, res) => {
        const { receivable_id, amount, branch_id } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.query(
                'UPDATE receivables SET amount_paid = amount_paid + ?, status = CASE WHEN (amount_paid + ?) >= total_debt THEN "Lunas" ELSE "Belum Lunas" END WHERE id = ?',
                [amount, amount, receivable_id]
            );

            await connection.query(
                `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Masuk', ?, 'Pembayaran Piutang Pembeli', ?)`,
                [branch_id, amount, receivable_id]
            );

            await connection.commit();
            res.json({ message: 'Pembayaran piutang berhasil dicatat' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.post('/api/payables/pay', async (req, res) => {
        const { payable_id, amount, branch_id } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.query(
                'UPDATE payables SET amount_paid = amount_paid + ?, status = CASE WHEN (amount_paid + ?) >= total_debt THEN "Lunas" ELSE "Belum Lunas" END WHERE id = ?',
                [amount, amount, payable_id]
            );

            await connection.query(
                `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Keluar', ?, 'Pembayaran Hutang Supplier', ?)`,
                [branch_id, amount, payable_id]
            );

            await connection.commit();
            res.json({ message: 'Pembayaran hutang berhasil dicatat' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    });

    app.get('/api/cash_flow/detail/:id', async (req, res) => {
        try {
            const [cf] = await pool.query('SELECT * FROM cash_flow WHERE id = ?', [req.params.id]);
            if (cf.length === 0) return res.status(404).json({ error: 'Cash flow not found' });
            
            const cashFlow = cf[0];
            const refId = cashFlow.reference_id;
            let items = [];
            let headerInfo = {};

            if (!refId) return res.json({ cashFlow, items, headerInfo });

            if (cashFlow.description.includes('Penjualan') || cashFlow.description.includes('Pesanan')) {
                const [sales] = await pool.query('SELECT * FROM sales WHERE id = ?', [refId]);
                if (sales.length > 0) headerInfo = sales[0];
                const [saleItems] = await pool.query(`
                    SELECT si.*, p.name as product_name, p.unit 
                    FROM sale_items si 
                    JOIN products p ON si.product_id = p.id 
                    WHERE si.sale_id = ?
                `, [refId]);
                items = saleItems;
            } 
            else if (cashFlow.description.includes('Pembelian')) {
                const [purch] = await pool.query('SELECT * FROM purchases WHERE id = ?', [refId]);
                if (purch.length > 0) headerInfo = purch[0];
                const [purchItems] = await pool.query(`
                    SELECT pi.*, p.name as product_name, p.unit 
                    FROM purchase_items pi 
                    JOIN products p ON pi.product_id = p.id 
                    WHERE pi.purchase_id = ?
                `, [refId]);
                items = purchItems;
            }
            else if (cashFlow.description.includes('Pembayaran Piutang')) {
                const [recv] = await pool.query('SELECT * FROM receivables WHERE id = ?', [refId]);
                if (recv.length > 0) {
                    headerInfo = recv[0];
                    const saleId = headerInfo.sale_id;
                    const [saleItems] = await pool.query(`
                        SELECT si.*, p.name as product_name, p.unit 
                        FROM sale_items si 
                        JOIN products p ON si.product_id = p.id 
                        WHERE si.sale_id = ?
                    `, [saleId]);
                    items = saleItems;
                }
            }
            else if (cashFlow.description.includes('Pembayaran Hutang')) {
                const [pay] = await pool.query('SELECT * FROM payables WHERE id = ?', [refId]);
                if (pay.length > 0) {
                    headerInfo = pay[0];
                    const purchId = headerInfo.purchase_id;
                    const [purchItems] = await pool.query(`
                        SELECT pi.*, p.name as product_name, p.unit 
                        FROM purchase_items pi 
                        JOIN products p ON pi.product_id = p.id 
                        WHERE pi.purchase_id = ?
                    `, [purchId]);
                    items = purchItems;
                }
            }

            res.json({ cashFlow, headerInfo, items });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });


    // --- CASH & PROFIT ---
    app.get('/api/cash', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            let query = 'SELECT * FROM cash_flow';
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' WHERE branch_id = ?';
                params.push(branch_id);
            }
            query += ' ORDER BY created_at DESC LIMIT 100';
            const [rows] = await pool.query(query, params);

            let summaryQuery = `
                SELECT 
                    SUM(CASE WHEN type = 'Masuk' THEN amount ELSE 0 END) as total_in,
                    SUM(CASE WHEN type = 'Keluar' THEN amount ELSE 0 END) as total_out
                FROM cash_flow
            `;
            if (branch_id && branch_id !== 'all') summaryQuery += ' WHERE branch_id = ?';
            const [summary] = await pool.query(summaryQuery, params);
            const totalCash = (summary[0].total_in || 0) - (summary[0].total_out || 0);

            let profitQuery = `SELECT SUM(profit) as total_profit FROM sales`;
            if (branch_id && branch_id !== 'all') profitQuery += ' WHERE branch_id = ?';
            const [profitSummary] = await pool.query(profitQuery, params);
            const totalProfit = profitSummary[0].total_profit || 0;

            res.json({ transactions: rows, totalCash, totalProfit });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // --- DASHBOARD WIDGETS ---
    app.get('/api/dashboard/summary', async (req, res) => {
        const branch_id = req.query.branch_id;
        try {
            // Min/Max stock counts
            let invQuery = 'SELECT stock, min_stock, max_stock FROM inventory';
            const params = [];
            if (branch_id && branch_id !== 'all') {
                invQuery += ' WHERE branch_id = ?';
                params.push(branch_id);
            }
            const [inv] = await pool.query(invQuery, params);
            let lowStockCount = 0;
            let overStockCount = 0;
            for(let i of inv) {
                if (i.stock <= i.min_stock) lowStockCount++;
                if (i.stock >= i.max_stock) overStockCount++;
            }

            // Pending deliveries
            let delivQuery = "SELECT COUNT(*) as c FROM deliveries d JOIN orders o ON d.order_id = o.id WHERE d.status IN ('Menunggu', 'Di Perjalanan')";
            if (branch_id && branch_id !== 'all') delivQuery += " AND o.branch_id = ?";
            const [delivs] = await pool.query(delivQuery, params);
            const pendingDeliveries = delivs[0].c;

            // Unpaid receivables (Hutang Pembeli)
            // Wait, receivables doesn't have branch_id, we need to join sales
            let recQuery = "SELECT SUM(r.total_debt - r.amount_paid) as t FROM receivables r JOIN sales s ON r.sale_id = s.id WHERE r.status = 'Belum Lunas'";
            if (branch_id && branch_id !== 'all') recQuery += " AND s.branch_id = ?";
            const [rec] = await pool.query(recQuery, params);
            const totalReceivables = rec[0].t || 0;

            // Unpaid payables (Hutang Owner)
            // payables doesn't have branch_id directly, join purchases
            // But some payables might have purchase_id = 0 (created directly). We should add branch_id to payables or just leave it for now.
            // Wait, earlier we added `/api/payables/new` which takes branch_id but we didn't insert branch_id into payables. Let's just ignore branch_id for payables for now or check if it exists.
            let payQuery = "SELECT SUM(total_debt - amount_paid) as t FROM payables WHERE status = 'Belum Lunas'";
            const [pay] = await pool.query(payQuery);
            const totalPayables = pay[0].t || 0;

            // Cash and Profit
            let cashInQuery = "SELECT SUM(amount) as c FROM cash_flow WHERE type='Masuk'";
            let cashOutQuery = "SELECT SUM(amount) as c FROM cash_flow WHERE type='Keluar'";
            let profitQuery = "SELECT SUM(profit) as p FROM sales";
            
            if (branch_id && branch_id !== 'all') {
                cashInQuery += " AND branch_id = ?";
                cashOutQuery += " AND branch_id = ?";
                profitQuery += " WHERE branch_id = ?";
            }
            
            const [cashIn] = await pool.query(cashInQuery, params);
            const [cashOut] = await pool.query(cashOutQuery, params);
            const totalCash = (cashIn[0].c || 0) - (cashOut[0].c || 0);
            
            const [prof] = await pool.query(profitQuery, params);
            const profit = prof[0].p || 0;

            // Apriori Low Stock (Top 10 best selling items that are low in stock)
            let aprioriQuery = `
                SELECT i.id, p.name, i.stock, i.min_stock, COALESCE(SUM(si.qty), 0) as total_sold 
                FROM inventory i 
                JOIN products p ON i.product_id = p.id
                LEFT JOIN sale_items si ON i.product_id = si.product_id 
                WHERE i.stock <= i.min_stock 
            `;
            if (branch_id && branch_id !== 'all') {
                aprioriQuery += ` AND i.branch_id = ? `;
            }
            aprioriQuery += ` GROUP BY i.id, p.name, i.stock, i.min_stock ORDER BY total_sold DESC LIMIT 10`;
            
            const [aprioriLowStock] = await pool.query(aprioriQuery, params);

            // Over Stock List (Top 10 highest surplus items)
            let overStockQuery = `
                SELECT i.id, p.name, i.stock, i.max_stock, (i.stock - i.max_stock) as surplus 
                FROM inventory i 
                JOIN products p ON i.product_id = p.id
                WHERE i.stock > i.max_stock
            `;
            if (branch_id && branch_id !== 'all') {
                overStockQuery += ` AND i.branch_id = ? `;
            }
            overStockQuery += ` ORDER BY surplus DESC LIMIT 10`;
            
            const [overStockList] = await pool.query(overStockQuery, params);

            res.json({
                lowStockCount,
                overStockCount,
                pendingDeliveries,
                totalReceivables,
                totalPayables,
                totalCash: (cashIn[0].c || 0) - (cashOut[0].c || 0),
                totalProfit: profit,
                aprioriLowStock,
                overStockList
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

};
