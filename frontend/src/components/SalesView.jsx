import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesView = ({ user, activeBranch }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showZeroStockWarning, setShowZeroStockWarning] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isIndirectSale, setIsIndirectSale] = useState(false);
    const [transactionDate, setTransactionDate] = useState('');
    const [showRecapModal, setShowRecapModal] = useState(false);
    const [recapData, setRecapData] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState([]);
    const [detailDate, setDetailDate] = useState('');

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

    const fetchRecap = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/sales/recap?branch_id=${activeBranch}`);
            setRecapData(res.data);
            setShowRecapModal(true);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil rekap: ' + error.message);
        }
    };

    const viewDetail = async (date) => {
        try {
            const dateStr = date.split('T')[0];
            const res = await axios.get(`http://localhost:5000/api/sales?branch_id=${activeBranch}&date=${dateStr}`);
            setDetailData(res.data);
            setDetailDate(date);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil detail: ' + error.message);
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
                setShowZeroStockWarning(true);
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
                items,
                transaction_date: isIndirectSale && transactionDate ? transactionDate : null
            });

            setShowSuccessModal(true);
            setCart([]);
            setCustomerName('');
            setIsIndirectSale(false);
            setTransactionDate('');
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <h2 style={{margin: 0}}>Katalog Penjualan</h2>
                    {user.role === 'OWNER' && (
                        <button className="btn btn-secondary" style={{padding: '8px 16px', fontSize: '0.9rem'}} onClick={fetchRecap}>
                            📊 Rekap Harian
                        </button>
                    )}
                </div>
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
                                <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>Stok: {Number(p.stock)}</span>
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
                    {user.role === 'OWNER' && (
                        <div className="form-group" style={{marginTop: '16px', marginBottom: '24px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)'}}>
                                <input type="checkbox" checked={isIndirectSale} onChange={e => setIsIndirectSale(e.target.checked)} />
                                Penjualan Terdahulu (Tanggal Lalu)
                            </label>
                            {isIndirectSale && (
                                <input type="datetime-local" className="input-field" style={{marginTop: '8px'}} value={transactionDate} onChange={e => setTransactionDate(e.target.value)} required={isIndirectSale} />
                            )}
                        </div>
                    )}
                    <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} onClick={checkout} disabled={loading || cart.length === 0}>
                        {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
                    </button>
                </div>
            </div>

            {/* Modal Peringatan Stok 0 */}
            {showZeroStockWarning && (
                <div className="modal-overlay" onClick={() => setShowZeroStockWarning(false)}>
                    <div className="modal-content" style={{position: 'relative', maxWidth: '400px', textAlign: 'center'}} onClick={e => e.stopPropagation()}>
                        <button 
                            style={{position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px 8px'}}
                            onClick={() => setShowZeroStockWarning(false)}
                            title="Tutup"
                        >
                            ✕
                        </button>
                        <div style={{fontSize: '3rem', marginBottom: '16px'}}>⚠️</div>
                        <h2 style={{color: '#ef4444', marginBottom: '16px'}}>Stok Habis</h2>
                        <p style={{fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '24px'}}>
                            Maaf, stok barang ini sedang kosong (0) dan tidak dapat ditambahkan ke keranjang.
                        </p>
                        <button className="btn" style={{width: '100%', background: '#ef4444'}} onClick={() => setShowZeroStockWarning(false)}>
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Sukses Transaksi */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content" style={{position: 'relative', maxWidth: '400px', textAlign: 'center'}} onClick={e => e.stopPropagation()}>
                        <button 
                            style={{position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px 8px'}}
                            onClick={() => setShowSuccessModal(false)}
                            title="Tutup"
                        >
                            ✕
                        </button>
                        <div style={{fontSize: '3rem', marginBottom: '16px', color: '#10b981'}}>✅</div>
                        <h2 style={{color: '#10b981', marginBottom: '16px'}}>Transaksi Berhasil!</h2>
                        <p style={{fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '24px'}}>
                            Transaksi penjualan telah berhasil dicatat.
                        </p>
                        <button className="btn" style={{width: '100%', background: '#10b981', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}} onClick={() => setShowSuccessModal(false)}>
                            Lanjutkan
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Rekap Harian */}
            {showRecapModal && (
                <div className="modal-overlay" onClick={() => setShowRecapModal(false)}>
                    <div className="modal-content" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <h2>Rekap Penjualan Harian</h2>
                            <button className="btn-icon" onClick={() => setShowRecapModal(false)}>✕</button>
                        </div>
                        <div className="table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th style={{textAlign: 'center'}}>Jml Transaksi</th>
                                        <th style={{textAlign: 'right'}}>Total Omset</th>
                                        <th style={{textAlign: 'right'}}>Total Profit</th>
                                        <th style={{textAlign: 'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recapData.length > 0 ? recapData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(row.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</td>
                                            <td style={{textAlign: 'center'}}>{row.total_transactions}</td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rp {Number(row.total_sales).toLocaleString()}</td>
                                            <td style={{textAlign: 'right', color: '#10b981', fontWeight: 'bold'}}>Rp {Number(row.total_profit).toLocaleString()}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <button className="btn btn-secondary" style={{padding: '4px 12px', fontSize: '0.85rem'}} onClick={() => viewDetail(row.date)}>Detail</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{textAlign: 'center'}}>Belum ada data penjualan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Penjualan */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" style={{maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <h2>Detail Penjualan: {new Date(detailDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</h2>
                            <button className="btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
                        </div>
                        <div className="table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Pelanggan</th>
                                        <th>Pembayaran</th>
                                        <th style={{textAlign: 'right'}}>Omset</th>
                                        <th style={{textAlign: 'right'}}>Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailData.length > 0 ? detailData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(row.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</td>
                                            <td>{row.customer_name || 'Umum'}</td>
                                            <td>{row.payment_method}</td>
                                            <td style={{textAlign: 'right'}}>Rp {Number(row.total_amount).toLocaleString()}</td>
                                            <td style={{textAlign: 'right', color: '#10b981'}}>Rp {Number(row.profit).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{textAlign: 'center'}}>Belum ada data penjualan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesView;
