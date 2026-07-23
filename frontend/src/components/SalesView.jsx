import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesView = ({ user, activeBranch, setActiveBranch, branches }) => {
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
    const [recapDate, setRecapDate] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState([]);
    const [detailDate, setDetailDate] = useState('');
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

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
            const d = new Date(date);
            const pad = n => n.toString().padStart(2, '0');
            const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
                    
                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                        {user.role === 'OWNER' && (
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <span style={{fontWeight: 'bold', color: 'white', marginRight: '8px', background: 'var(--secondary-color)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.9rem'}}>Pilih Toko:</span>
                                <div className="custom-dropdown-container" style={{position: 'relative', zIndex: 50}}>
                                    <div 
                                        className={`custom-select-3d ${isBranchDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', color: 'var(--secondary-color)', border: '2px solid var(--secondary-color)', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem'}}
                                    >
                                        <span style={{fontWeight: 'bold'}}>{activeBranch === 'all' ? 'Semua Toko' : branches?.find(b => b.id.toString() === activeBranch.toString())?.name}</span>
                                        <span style={{fontSize: '0.8rem', marginLeft: '12px'}}>▼</span>
                                    </div>
                                    {isBranchDropdownOpen && (
                                        <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--secondary-color)', zIndex: 1000, position: 'absolute', background: 'var(--panel-bg)', borderRadius: '6px', overflow: 'hidden'}}>
                                            <div 
                                                className={`custom-dropdown-item branch-dropdown-item ${activeBranch === 'all' ? 'selected' : ''}`}
                                                onClick={() => { setActiveBranch('all'); setIsBranchDropdownOpen(false); }}
                                                style={{padding: '8px 12px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'}}
                                            >
                                                Semua Toko
                                            </div>
                                            {branches?.map(b => (
                                                <div 
                                                    key={b.id} 
                                                    className={`custom-dropdown-item branch-dropdown-item ${activeBranch.toString() === b.id.toString() ? 'selected' : ''}`}
                                                    onClick={() => { setActiveBranch(b.id); setIsBranchDropdownOpen(false); }}
                                                    style={{padding: '8px 12px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'}}
                                                >
                                                    {b.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {user.role === 'OWNER' && (
                            <button className="btn btn-secondary" style={{padding: '8px 16px', fontSize: '0.9rem'}} onClick={fetchRecap}>
                                📊 Rekap Harian
                            </button>
                        )}
                    </div>
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
                    <div className="form-group" style={{position: 'relative'}}>
                        <label>Metode Pembayaran</label>
                        <div 
                            className={`input-field custom-select-3d ${isPaymentDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--panel-bg)', color: 'var(--text-primary)'}}
                        >
                            <span>{paymentMethod === 'Cash' ? 'Cash (Lunas)' : 'Kredit (Hutang)'}</span>
                            <span style={{fontSize: '0.8rem'}}>▼</span>
                        </div>
                        {isPaymentDropdownOpen && (
                            <div className="custom-dropdown-menu" style={{position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 1000, overflow: 'hidden'}}>
                                <div 
                                    className={`custom-dropdown-item ${paymentMethod === 'Cash' ? 'selected' : ''}`}
                                    onClick={() => { setPaymentMethod('Cash'); setIsPaymentDropdownOpen(false); }}
                                    style={{padding: '10px 12px', cursor: 'pointer'}}
                                >
                                    Cash (Lunas)
                                </div>
                                <div 
                                    className={`custom-dropdown-item ${paymentMethod === 'Kredit' ? 'selected' : ''}`}
                                    onClick={() => { setPaymentMethod('Kredit'); setIsPaymentDropdownOpen(false); }}
                                    style={{padding: '10px 12px', cursor: 'pointer'}}
                                >
                                    Kredit (Hutang)
                                </div>
                            </div>
                        )}
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
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                            <label style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Pilih Tanggal:</label>
                            <input type="date" className="input-field" value={recapDate} onChange={e => setRecapDate(e.target.value)} />
                            {recapDate && <button className="btn btn-secondary" onClick={() => setRecapDate('')}>Tampilkan Semua</button>}
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
                                    {recapData.filter(row => {
                                        if (!recapDate) return true;
                                        const d = new Date(row.date);
                                        const pad = n => n.toString().padStart(2, '0');
                                        const rowDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                        return rowDateStr === recapDate;
                                    }).length > 0 ? recapData.filter(row => {
                                        if (!recapDate) return true;
                                        const d = new Date(row.date);
                                        const pad = n => n.toString().padStart(2, '0');
                                        const rowDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                        return rowDateStr === recapDate;
                                    }).map((row, idx) => (
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
                                        <tr><td colSpan="5" style={{textAlign: 'center'}}>Tidak ada data penjualan pada tanggal ini</td></tr>
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
                    <div className="modal-content" style={{maxWidth: '1100px', width: '90%'}} onClick={e => e.stopPropagation()}>
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
                                        <th>Nama Barang</th>
                                        <th>Jumlah</th>
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
                                            <td>
                                                {row.items ? (
                                                    (typeof row.items === 'string' ? JSON.parse(row.items) : row.items).map((item, i) => (
                                                        <div key={i} style={{fontSize: '0.85rem', marginBottom: '4px'}}>
                                                            • {item.name}
                                                        </div>
                                                    ))
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {row.items ? (
                                                    (typeof row.items === 'string' ? JSON.parse(row.items) : row.items).map((item, i) => {
                                                        let displayQty = `${Number(item.qty)} ${item.unit}`;
                                                        if (item.unit && item.unit.toLowerCase() === 'kodi') {
                                                            displayQty = `${Number(item.qty)} kodi (${Number(item.qty) * 20} pcs)`;
                                                        }
                                                        return (
                                                            <div key={i} style={{fontSize: '0.85rem', marginBottom: '4px'}}>
                                                                <b>{displayQty}</b>
                                                            </div>
                                                        )
                                                    })
                                                ) : '-'}
                                            </td>
                                            <td>{row.payment_method}</td>
                                            <td style={{textAlign: 'right'}}>Rp {Number(row.total_amount).toLocaleString()}</td>
                                            <td style={{textAlign: 'right', color: '#10b981'}}>Rp {Number(row.profit).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" style={{textAlign: 'center'}}>Belum ada data penjualan</td></tr>
                                    )}
                                </tbody>
                                {detailData.length > 0 && (
                                    <tfoot style={{position: 'sticky', bottom: 0, background: 'var(--panel-bg)', zIndex: 1, borderTop: '2px solid var(--border-color)'}}>
                                        <tr>
                                            <td colSpan="5" style={{textAlign: 'right', fontWeight: 'bold'}}>Total Keseluruhan:</td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                                Rp {detailData.reduce((acc, row) => acc + Number(row.total_amount), 0).toLocaleString()}
                                            </td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold', color: '#10b981'}}>
                                                Rp {detailData.reduce((acc, row) => acc + Number(row.profit), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesView;
