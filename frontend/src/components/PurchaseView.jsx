import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PurchaseView = ({ user }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [supplierName, setSupplierName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const branchQuery = user.role === 'MANAGER' ? `?branch_id=${user.branch_id}` : '';
            const res = await axios.get(`http://localhost:5000/api/inventory${branchQuery}`);
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = (product) => {
        const exist = cart.find(x => x.id === product.id);
        if (exist) {
            setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
        } else {
            const buy_price = product.price ? product.price * 0.7 : 10000; // Mock buy price
            setCart([...cart, { ...product, qty: 1, buy_price }]);
        }
    };

    const updateQty = (id, val) => {
        const v = parseFloat(val);
        if(v <= 0) {
            setCart(cart.filter(x => x.id !== id));
            return;
        }
        setCart(cart.map(x => x.id === id ? { ...x, qty: v } : x));
    };

    const updatePrice = (id, val) => {
        setCart(cart.map(x => x.id === id ? { ...x, buy_price: parseFloat(val) || 0 } : x));
    };

    const checkout = async () => {
        if (cart.length === 0) return alert('Keranjang kosong!');
        if (!supplierName) return alert('Nama Supplier harus diisi!');
        setLoading(true);
        try {
            const items = cart.map(item => ({
                product_id: item.product_id || item.id,
                qty: item.qty,
                buy_price: item.buy_price
            }));

            await axios.post('http://localhost:5000/api/purchases', {
                branch_id: user.role === 'MANAGER' ? user.branch_id : 1,
                supplier_name: supplierName,
                payment_method: paymentMethod,
                items
            });

            alert('Transaksi Pembelian Berhasil!');
            setCart([]);
            setSupplierName('');
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = cart.reduce((acc, item) => acc + (item.buy_price * item.qty), 0);
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search));

    if (user.role !== 'OWNER') {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--danger-color)'}}>Akses Ditolak. Modul ini khusus Owner.</div>;
    }

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', display: 'flex', gap: '24px', height: '100%'}}>
            <div className="glass-panel" style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                <h2>Katalog Pembelian (Kulakan)</h2>
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
                                <span style={{background: 'rgba(56, 189, 248, 0.1)', color: 'var(--secondary-color)', padding: '4px 8px', borderRadius: '4px'}}>+ Kulakan</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <h2>Keranjang Kulakan</h2>
                <div style={{flex: 1, overflowY: 'auto', marginBottom: '16px'}}>
                    {cart.map(c => (
                        <div key={c.id} style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', background: 'var(--item-bg)', padding: '12px', borderRadius: '8px'}}>
                            <div style={{fontWeight: 'bold'}}>{c.name}</div>
                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                <span>Qty:</span>
                                <input type="number" value={c.qty} onChange={e => updateQty(c.id, e.target.value)} style={{width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)'}} />
                            </div>
                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                <span>Harga Beli/pcs:</span>
                                <input type="number" value={c.buy_price} onChange={e => updatePrice(c.id, e.target.value)} style={{flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)'}} />
                            </div>
                            <div style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                                Sub: Rp {(c.buy_price * c.qty).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px'}}>Belum ada barang di keranjang</div>}
                </div>
                
                <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '1.2rem'}}>
                        <span>Total Tagihan:</span>
                        <span>Rp {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="form-group">
                        <label>Nama Supplier / Pabrik</label>
                        <input type="text" className="input-field" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Contoh: PT Semen Indonesia" required />
                    </div>
                    <div className="form-group">
                        <label>Metode Pembayaran (Ke Supplier)</label>
                        <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="Cash">Cash (Langsung Lunas)</option>
                            <option value="Kredit">Kredit (Masuk Hutang Toko)</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} onClick={checkout} disabled={loading || cart.length === 0}>
                        {loading ? 'Memproses...' : 'Selesaikan Kulakan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseView;
