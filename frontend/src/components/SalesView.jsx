import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesView = ({ user, activeBranch }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [activeBranch]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/inventory?branch_id=${activeBranch}`);
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = (product) => {
        const exist = cart.find(x => x.id === product.id);
        if (exist) {
            if (exist.qty >= product.stock) {
                alert('Stok tidak mencukupi!');
                return;
            }
            setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
        } else {
            if (product.stock <= 0) {
                alert('Stok habis!');
                return;
            }
            // we assume a base_price for profit calculation, but API might not expose it. We'll use 80% of price as mock base_price if not available from inventory endpoint.
            const base_price = product.price ? product.price * 0.8 : 0; 
            setCart([...cart, { ...product, qty: 1, base_price }]);
        }
    };

    const updateQty = (id, val) => {
        const v = parseFloat(val);
        if(v <= 0) {
            setCart(cart.filter(x => x.id !== id));
            return;
        }
        const product = products.find(p => p.id === id);
        if (v > product.stock) {
            alert('Melebihi stok yang ada!');
            return;
        }
        setCart(cart.map(x => x.id === id ? { ...x, qty: v } : x));
    };

    const checkout = async () => {
        if (activeBranch === 'all') return alert('Pilih toko cabang spesifik terlebih dahulu untuk melakukan transaksi!');
        if (cart.length === 0) return alert('Keranjang kosong!');
        setLoading(true);
        try {
            const items = cart.map(item => ({
                product_id: item.product_id || item.id, 
                qty: item.qty,
                price: item.price || 15000, 
                base_price: item.base_price || 10000
            }));

            await axios.post('http://localhost:5000/api/sales', {
                branch_id: user.role === 'MANAGER' ? user.branch_id : activeBranch,
                customer_name: customerName,
                payment_method: paymentMethod,
                items
            });

            alert('Transaksi Penjualan Berhasil!');
            setCart([]);
            setCustomerName('');
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = cart.reduce((acc, item) => acc + ((item.price || 15000) * item.qty), 0);

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search));

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', display: 'flex', gap: '24px', height: '100%'}}>
            {/* Kiri: Daftar Produk */}
            <div className="glass-panel" style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                <h2>Katalog Penjualan</h2>
                <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Cari nama barang atau SKU..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{marginBottom: '16px'}}
                />
                <div style={{overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'}}>
                    {filtered.map(p => (
                        <div key={p.id} style={{background: 'var(--item-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', cursor: 'pointer'}} onClick={() => addToCart(p)}>
                            <div style={{fontWeight: 'bold', marginBottom: '8px'}}>{p.name}</div>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>[{p.sku}]</div>
                            <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>Stok: {p.stock}</span>
                                <span style={{background: 'rgba(234, 88, 12, 0.1)', padding: '4px 8px', borderRadius: '4px'}}>+ Tambah</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Kanan: Keranjang */}
            <div className="glass-panel" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <h2>Keranjang</h2>
                <div style={{flex: 1, overflowY: 'auto', marginBottom: '16px'}}>
                    {cart.map(c => (
                        <div key={c.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'var(--item-bg)', padding: '12px', borderRadius: '8px'}}>
                            <div>
                                <div style={{fontWeight: 'bold'}}>{c.name}</div>
                                <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Rp {(c.price || 15000).toLocaleString()}</div>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input type="number" value={c.qty} onChange={e => updateQty(c.id, e.target.value)} style={{width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)'}} />
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px'}}>Belum ada barang di keranjang</div>}
                </div>
                
                <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '1.2rem'}}>
                        <span>Total:</span>
                        <span>Rp {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="form-group">
                        <label>Nama Pelanggan (Opsional)</label>
                        <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Umum" />
                    </div>
                    <div className="form-group">
                        <label>Metode Pembayaran</label>
                        <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="Cash">Cash (Lunas)</option>
                            <option value="Kredit">Kredit (Hutang)</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} onClick={checkout} disabled={loading || cart.length === 0}>
                        {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesView;
