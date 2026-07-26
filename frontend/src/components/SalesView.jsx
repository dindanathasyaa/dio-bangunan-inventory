import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesView = ({ user, activeBranch, setActiveBranch, branches }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [qtys, setQtys] = useState({});
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showZeroStockWarning, setShowZeroStockWarning] = useState(false);
    const [transactionSuccessData, setTransactionSuccessData] = useState(null);
    const [printMode, setPrintMode] = useState('menu'); // menu, struk, invoice, surat_jalan
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

    const addToCart = (product, qtyToAdd = 1) => {
        qtyToAdd = parseInt(qtyToAdd) || 1;
        const exist = cart.find(x => x.id === product.id);
        if (exist) {
            if (exist.qty + qtyToAdd > product.stock) {
                alert('Stok tidak mencukupi!');
                return;
            }
            setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + qtyToAdd } : x));
        } else {
            if (product.stock < qtyToAdd) {
                alert('Stok tidak mencukupi!');
                return;
            }
            if (product.stock <= 0) {
                setShowZeroStockWarning(true);
                return;
            }
            const base_price = product.base_price || (product.price ? product.price * 0.8 : 0); 
            setCart([...cart, { ...product, qty: qtyToAdd, base_price }]);
        }
        setQtys(prev => ({...prev, [product.id]: 1}));
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

            const res = await axios.post('http://localhost:5000/api/sales', {
                branch_id: user.role === 'ADMIN' ? user.branch_id : activeBranch,
                customer_name: customerName,
                payment_method: paymentMethod,
                items,
                transaction_date: isIndirectSale && transactionDate ? transactionDate : null
            });

            setTransactionSuccessData({
                sale_id: res.data.sale_id,
                customer_name: customerName,
                payment_method: paymentMethod,
                items: [...cart],
                total_amount: totalAmount,
                transaction_date: isIndirectSale && transactionDate ? transactionDate : new Date().toISOString()
            });
            setPrintMode('menu');

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
        <div style={{animation: 'fadeIn 0.5s ease-out', display: 'flex', gap: '24px', height: '100%', overflowX: 'hidden'}}>
            {/* Kiri: Daftar Produk */}
            <div className="glass-panel" style={{flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
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
                <div style={{overflowY: 'auto', overflowX: 'hidden', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'}}>
                    {filtered.map(p => (
                        <div key={p.id} style={{background: 'var(--item-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'}}>
                            <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{p.name}</div>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>[{p.sku}]</div>
                            <div style={{fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.1rem', marginBottom: '16px'}}>
                                Rp {parseFloat(p.price || 0).toLocaleString()}
                            </div>
                            <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                <span style={{color: 'var(--text-secondary)', fontWeight: 'bold'}}>Stok: {Math.max(0, Number(p.stock))}</span>
                                <div style={{display: 'flex', alignItems: 'stretch', gap: '8px', height: '36px', width: '100%'}}>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={qtys[p.id] !== undefined ? qtys[p.id] : 1} 
                                        onChange={e => setQtys({...qtys, [p.id]: e.target.value})}
                                        style={{width: '70px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', textAlign: 'center', boxSizing: 'border-box', height: '100%', outline: 'none'}}
                                    />
                                    <button 
                                        style={{background: 'var(--primary-color)', color: '#ffffff', padding: '0 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box', whiteSpace: 'nowrap', flex: 1}} 
                                        onClick={() => addToCart(p, qtys[p.id] || 1)}
                                    >
                                        + Tambah
                                    </button>
                                </div>
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
                        <div className="form-group" style={{marginTop: '16px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)'}}>
                                <input type="checkbox" checked={isIndirectSale} onChange={e => setIsIndirectSale(e.target.checked)} />
                                Penjualan Terdahulu (Tanggal Lalu)
                            </label>
                            {isIndirectSale && (
                                <input type="datetime-local" className="input-field" style={{marginTop: '8px'}} value={transactionDate} onChange={e => setTransactionDate(e.target.value)} required={isIndirectSale} />
                            )}
                        </div>
                    )}
                    <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '24px'}} onClick={checkout} disabled={loading || cart.length === 0}>
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

                 {/* Modal Aksi Transaksi Sukses */}
            {transactionSuccessData && (
                <div                      className={`modal-overlay ${printMode === 'struk' ? 'print-thermal' : (printMode === 'invoice' || printMode === 'surat_jalan' ? 'print-a4' : '')}`} 
                      style={printMode === 'menu' ? { gap: '24px', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '40px' } : {}}
                      onClick={() => { if (printMode === 'menu') setTransactionSuccessData(null); }}
                >
                    
                    {/* Layout Struk Thermal (Detail & Cetak) */}
                    {(printMode === 'struk' || printMode === 'menu') && (
                        <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '24px', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                            <style>{`@media print { @page { margin: 0; } body { background: white; } }`}</style>
                            <div className="invoice-container">
                                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                                    <img src="/logo-transparent.png" alt="Dio Bangunan Logo" style={{maxWidth: '140px', width: '100%', mixBlendMode: 'multiply'}} />
                                </div>
                                
                                <div style={{fontSize: '0.85rem', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>No. Faktur:</span> <span style={{fontWeight: 'bold'}}>#{transactionSuccessData.sale_id}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Tanggal:</span> <span>{new Date(transactionSuccessData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Kasir:</span> <span>{user.username}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Pelanggan:</span> <span>{transactionSuccessData.customer_name || 'Umum'}</span></div>
                                </div>
                                
                                <div style={{marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px'}}>
                                    {transactionSuccessData.items.map((item, idx) => (
                                        <div key={idx} style={{marginBottom: '8px', fontSize: '0.85rem'}}>
                                            <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{item.name}</div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)'}}>
                                                <span>{item.qty} x {item.price.toLocaleString()}</span>
                                                <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{(item.qty * item.price).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{fontSize: '0.9rem', marginBottom: '24px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px'}}>
                                        <span>TOTAL</span>
                                        <span>Rp {transactionSuccessData.total_amount.toLocaleString()}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)'}}>
                                        <span>Pembayaran</span>
                                        <span>{transactionSuccessData.payment_method === 'Cash' ? 'TUNAI' : 'KREDIT'}</span>
                                    </div>
                                </div>
                                
                                <div style={{textAlign: 'center', fontSize: '0.85rem'}}>
                                    <p style={{margin: 0, fontStyle: 'italic'}}>Terima kasih atas kunjungan Anda!</p>
                                </div>
                            </div>
                            
                            {printMode === 'struk' && (
                                <div className="no-print" style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                                    <button className="btn btn-secondary" style={{flex: 1, padding: '12px'}} onClick={() => setPrintMode('menu')}>
                                        Kembali
                                    </button>
                                    <button className="btn btn-primary" style={{flex: 1, padding: '12px'}} onClick={() => window.print()}>
                                        🖨️ Cetak
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Menu Pilihan Aksi */}
                    {printMode === 'menu' && (
                        <div className="modal-content no-print" style={{maxWidth: '300px', width: '100%', padding: 0, borderRadius: '12px', overflow: 'hidden', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                            <div style={{background: 'var(--primary-color)', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem'}}>Transaksi Berhasil!</div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => setPrintMode('struk')}>Detail</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('struk'); setTimeout(() => window.print(), 300); }}>Cetak</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('invoice'); setTimeout(() => window.print(), 300); }}>Invoice</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('surat_jalan'); setTimeout(() => window.print(), 300); }}>Surat Jalan</button>
                                <button style={{padding: '16px', border: 'none', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => setTransactionSuccessData(null)}>Close</button>
                            </div>
                        </div>
                    )}

                    {/* Layout A4 (Invoice & Surat Jalan) */}
                    {(printMode === 'invoice' || printMode === 'surat_jalan') && (
                        <div className="modal-content a4-container print-a4" style={{position: 'relative', width: '210mm', padding: '40px', background: 'white', color: 'black', margin: '20px auto', fontFamily: 'sans-serif'}} onClick={e => e.stopPropagation()}>
                            <style>{`@media print { @page { size: A4 portrait; margin: 0; } body { background: white; } }`}</style>
                            
                            <div className="no-print" style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                                <button className="btn btn-secondary" onClick={() => setPrintMode('menu')}>
                                    Kembali
                                </button>
                                <button className="btn btn-primary" onClick={() => window.print()}>
                                    🖨️ Cetak
                                </button>
                            </div>

                            <div className="invoice-container">
                                <div style={{textAlign: 'center', marginBottom: '40px'}}>
                                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                                        <img src="/logo-transparent.png" alt="Dio Bangunan Logo" style={{maxWidth: '250px', width: '100%', mixBlendMode: 'multiply'}} />
                                    </div>
                                    <div style={{fontSize: '12px', lineHeight: '1.5'}}>
                                        <div>MENJUAL ALAT BANGUNAN & LISTRIK</div>
                                        <div>ALAMAT : PASAR TARAM</div>
                                        <div>HP/WA : 0812 7786 7616</div>
                                        <div>0853 1407 8967</div>
                                    </div>
                                </div>

                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '13px'}}>
                                    <div>
                                        <table style={{borderCollapse: 'collapse'}}>
                                            <tbody>
                                                <tr><td style={{paddingRight: '16px'}}>Pembayaran</td><td>: {transactionSuccessData.payment_method === 'Cash' ? 'Lunas' : 'Belum Bayar'}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Tanggal</td><td>: {new Date(transactionSuccessData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Nomor</td><td>: SR{transactionSuccessData.sale_id}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Kasir</td><td>: {user.username}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <table style={{borderCollapse: 'collapse'}}>
                                            <tbody>
                                                <tr><td style={{paddingRight: '16px'}}>Pembeli</td><td>: {transactionSuccessData.customer_name || 'Umum'}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '24px'}}>
                                    <thead>
                                        <tr style={{borderTop: '2px solid black', borderBottom: '1px solid black'}}>
                                            <th style={{padding: '8px 4px', textAlign: 'left', width: '5%'}}>No</th>
                                            <th style={{padding: '8px 4px', textAlign: 'left', width: '45%'}}>Produk</th>
                                            {printMode === 'invoice' && <th style={{padding: '8px 4px', textAlign: 'right', width: '20%'}}>Harga</th>}
                                            <th style={{padding: '8px 4px', textAlign: 'center', width: '10%'}}>Jumlah</th>
                                            {printMode === 'invoice' && <th style={{padding: '8px 4px', textAlign: 'right', width: '20%'}}>Total</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionSuccessData.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{padding: '6px 4px'}}>{idx + 1}</td>
                                                <td style={{padding: '6px 4px'}}>{item.name}</td>
                                                {printMode === 'invoice' && <td style={{padding: '6px 4px', textAlign: 'right'}}>{item.price.toLocaleString()}</td>}
                                                <td style={{padding: '6px 4px', textAlign: 'center'}}>{item.qty}</td>
                                                {printMode === 'invoice' && <td style={{padding: '6px 4px', textAlign: 'right'}}>{(item.qty * item.price).toLocaleString()}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{borderTop: '1px solid black'}}>
                                            <td colSpan="5" style={{padding: '4px'}}></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {printMode === 'invoice' && (
                                    <div style={{display: 'flex', justifyContent: 'flex-end', fontSize: '13px', marginBottom: '48px'}}>
                                        <table style={{width: '300px', borderCollapse: 'collapse'}}>
                                            <tbody>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>TOTAL {transactionSuccessData.items.reduce((sum, i) => sum + Number(i.qty), 0)} QTY</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{transactionSuccessData.total_amount.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Bayar</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{transactionSuccessData.payment_method === 'Cash' ? transactionSuccessData.total_amount.toLocaleString() : '0'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Kurang</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{transactionSuccessData.payment_method === 'Cash' ? '0' : transactionSuccessData.total_amount.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: printMode === 'surat_jalan' ? '64px' : '0'}}>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{marginBottom: '80px'}}>Hormat Kami</div>
                                        <div>{user.username}</div>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{marginBottom: '80px'}}>Pembeli</div>
                                        <div>{transactionSuccessData.customer_name || '....................'}</div>
                                    </div>
                                </div>

                                <div style={{marginTop: '64px', fontSize: '12px'}}>
                                    <div>TERIMA KASIH</div>
                                    <div>KAMI SIAP MENYEDIAKAN KEBUTUHAN ANDA</div>
                                </div>
                            </div>
                        </div>
                    )}
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
