module.exports = function(app, pool) {

    // --- SALES ---
    app.post('/api/sales', async (req, res) => {
        const { branch_id, customer_name, payment_method, items, transaction_date } = req.body;
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

            let saleRes;
            if (transaction_date) {
                [saleRes] = await connection.query(
                    `INSERT INTO sales (branch_id, customer_name, total_amount, profit, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                    [branch_id, customer_name, total_amount, total_profit, payment_method, transaction_date]
                );
            } else {
                [saleRes] = await connection.query(
                    `INSERT INTO sales (branch_id, customer_name, total_amount, profit, payment_method) VALUES (?, ?, ?, ?, ?)`,
                    [branch_id, customer_name, total_amount, total_profit, payment_method]
                );
            }
            const sale_id = saleRes.insertId;

            for (let item of items) {
                await connection.query(
                    `INSERT INTO sale_items (sale_id, product_id, qty, price, base_price) VALUES (?, ?, ?, ?, ?)`,
                    [sale_id, item.product_id, item.qty, item.price, item.base_price]
                );
                // Deduct stock
                await connection.query(
                    `UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND branch_id = ?`,
                    [item.qty, item.product_id, branch_id]
                );
            }

            if (payment_method === 'Cash') {
                if (transaction_date) {
                    await connection.query(
                        `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id, created_at) VALUES (?, 'Masuk', ?, ?, ?, ?)`,
                        [branch_id, total_amount, `Penjualan Tunai: ${customer_name || 'Umum'}`, sale_id, transaction_date]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO cash_flow (branch_id, type, amount, description, reference_id) VALUES (?, 'Masuk', ?, ?, ?)`,
                        [branch_id, total_amount, `Penjualan Tunai: ${customer_name || 'Umum'}`, sale_id]
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

    app.get('/api/sales', async (req, res) => {
        const branch_id = req.query.branch_id;
        const date = req.query.date;
        try {
            let query = 'SELECT * FROM sales WHERE 1=1';
            const params = [];
            if (branch_id && branch_id !== 'all') {
                query += ' AND branch_id = ?';
                params.push(branch_id);
            }
            if (date) {
                query += ' AND DATE(created_at) = ?';
                params.push(date);
            }
            query += ' ORDER BY created_at DESC LIMIT 50';
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
                await connection.query(
                    `INSERT INTO purchase_items (purchase_id, product_id, qty, buy_price) VALUES (?, ?, ?, ?)`,
                    [purchase_id, item.product_id, item.qty, item.buy_price]
                );
                // Add stock
                await connection.query(
                    `UPDATE inventory SET stock = stock + ? WHERE product_id = ? AND branch_id = ?`,
                    [item.qty, item.product_id, branch_id]
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

    app.get('/api/receivables', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM receivables ORDER BY created_at DESC');
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
            const totalProfit = prof[0].p || 0;

            res.json({
                lowStockCount,
                overStockCount,
                pendingDeliveries,
                totalReceivables,
                totalPayables,
                totalCash,
                totalProfit
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

};
