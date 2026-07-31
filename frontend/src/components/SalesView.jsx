import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencyInput from './CurrencyInput';

const SalesView = ({ user, activeBranch, setActiveBranch, branches }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [qtys, setQtys] = useState({});
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [saveAsDeposit, setSaveAsDeposit] = useState(false);
    
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
    const [deliveryStatus, setDeliveryStatus] = useState('Langsung'); // 'Langsung' or 'DO'
    
    // Add customer state
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Custom Toast Alert State
    const [toast, setToast] = useState({ show: false, message: '', type: 'info', onClose: null });

    const showToast = (message, type = 'info', onClose = null) => {
        setToast({ show: true, message, type, onClose });
        if (!onClose) {
            setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 4000);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, [activeBranch]);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

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
                showToast('Stok tidak mencukupi!', 'warning');
                return;
            }
            setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + qtyToAdd } : x));
        } else {
            if (product.stock < qtyToAdd) {
                showToast('Stok tidak mencukupi!', 'warning');
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
        if (val === '') {
            setCart(cart.map(x => x.id === id ? { ...x, qty: '' } : x));
            return;
        }
        const v = parseInt(val);
        if (isNaN(v) || v < 0) return;
        if(v === 0) {
            setCart(cart.filter(x => x.id !== id));
            return;
        }
        const product = products.find(p => p.id === id);
        if (v > product.stock) {
            showToast('Melebihi stok yang ada!', 'warning');
            return;
        }
        setCart(cart.map(x => x.id === id ? { ...x, qty: v } : x));
    };

    const updatePrice = (id, val) => {
        if (val === '') {
            setCart(cart.map(x => x.id === id ? { ...x, price: '' } : x));
            return;
        }
        const v = parseFloat(val);
        if (isNaN(v) || v < 0) return;
        setCart(cart.map(x => x.id === id ? { ...x, price: v } : x));
    };

    const handleAddCustomer = async () => {
        if (!newCustomerName) return showToast('Nama pelanggan wajib diisi', 'warning');
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/customers', {
                name: newCustomerName,
                phone: newCustomerPhone
            });
            const newCust = res.data;
            setCustomers([...customers, newCust]);
            setSelectedCustomerId(newCust.id);
            setCustomerName(newCust.name);
            setShowAddCustomerModal(false);
            setNewCustomerName('');
            setNewCustomerPhone('');
            showToast('Pelanggan berhasil ditambahkan', 'success');
        } catch (error) {
            console.error(error);
            showToast('Gagal menambah pelanggan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkout = async () => {
        const totalAmount = cart.reduce((acc, c) => acc + (c.qty || 0) * (c.price || 0), 0);
        const validCart = cart.filter(item => item.qty !== '' && parseInt(item.qty) > 0);
        if (validCart.length === 0) return showToast('Keranjang kosong atau jumlah tidak valid!', 'warning');
        setLoading(true);
        try {
            const items = validCart.map(item => ({
                product_id: item.product_id || item.id, 
                qty: parseInt(item.qty),
                price: item.price || 15000, 
                base_price: item.base_price || 10000
            }));

            const res = await axios.post('http://localhost:5000/api/sales', {
                branch_id: user.role === 'ADMIN' ? user.branch_id : (activeBranch === 'all' ? 1 : activeBranch),
                customer_name: customerName,
                customer_id: selectedCustomerId || null,
                payment_method: paymentMethod,
                items,
                transaction_date: isIndirectSale && transactionDate ? transactionDate : null,
                delivery_status: deliveryStatus,
                amount_paid: amountPaid ? parseFloat(String(amountPaid).replace(/[^0-9]/g, '')) : null,
                save_as_deposit: saveAsDeposit
            });

            const successData = {
                sale_id: res.data.sale_id,
                customer_name: customerName,
                payment_method: paymentMethod,
                items: [...validCart],
                total_amount: totalAmount,
                transaction_date: isIndirectSale && transactionDate ? transactionDate : new Date().toISOString()
            };

            if (paymentMethod === 'Kredit') {
                setTransactionSuccessData(successData);
                setPrintMode('kredit_success');
            } else {
                showToast('Transaksi Berhasil!', 'success');
                // Tidak mengatur setTransactionSuccessData / setPrintMode('menu') agar tidak muncul popup menu/struk
            }
            setCart([]);
            setQtys({});
            setCustomerName('');
            setSelectedCustomerId('');
            setAmountPaid('');
            setSaveAsDeposit(false);
            setPaymentMethod('Cash');
            setDeliveryStatus('Langsung');
            setTransactionDate('');
            setShowPaymentModal(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan saat transaksi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = cart.reduce((acc, item) => acc + ((item.price || 15000) * (item.qty === '' ? 0 : parseInt(item.qty))), 0);

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
                                Rp {Number(p.price || 0).toLocaleString('id-ID')}
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
                                {user?.role === 'ADMIN' || user?.role === 'OWNER' ? (
                                    <div style={{color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'}}>
                                        <span style={{fontWeight: 'bold'}}>Rp</span> 
                                        <CurrencyInput 
                                            value={c.price === '' ? '' : Number(c.price)} 
                                            onChange={e => updatePrice(c.id, e.target.value)} 
                                            style={{
                                                width: '120px', 
                                                padding: '6px 8px', 
                                                borderRadius: '6px', 
                                                border: '1px solid var(--primary-color)', 
                                                background: 'var(--panel-bg)', 
                                                color: 'var(--text-primary)', 
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }} 
                                        />
                                    </div>
                                ) : (
                                    <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Rp {Number(c.price || 15000).toLocaleString('id-ID')}</div>
                                )}
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input type="number" value={c.qty} onChange={e => updateQty(c.id, e.target.value)} style={{width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)'}} />
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px'}}>Belum ada barang di keranjang</div>}
                </div>
                
                <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '1.4rem'}}>
                        <span>Total:</span>
                        <span style={{color: 'var(--primary-color)'}}>Rp {Number(totalAmount).toLocaleString('id-ID')}</span>
                    </div>
                    
                    <button 
                        className="btn btn-primary" 
                        style={{width: '100%', padding: '16px', fontSize: '1.2rem', marginTop: '16px', fontWeight: 'bold'}} 
                        onClick={() => {
                            if (cart.length === 0) return showToast('Keranjang kosong!', 'warning');
                            setShowPaymentModal(true);
                        }} 
                        disabled={loading || cart.length === 0}
                    >
                        BAYAR SEKARANG
                    </button>
                </div>
            </div>

            {/* Modal Payment */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content glass-panel" style={{maxWidth: '500px', width: '90%', padding: '24px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                            <h3 style={{margin: 0, fontSize: '1.4rem'}}>Selesaikan Pembayaran</h3>
                            <button onClick={() => setShowPaymentModal(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)'}}>✕</button>
                        </div>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontWeight: 'bold', fontSize: '1.5rem', padding: '16px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--primary-color)'}}>
                            <span>Total Tagihan:</span>
                            <span style={{color: 'var(--primary-color)'}}>Rp {Number(totalAmount).toLocaleString('id-ID')}</span>
                        </div>

                        <div className="form-group">
                            <label>Pilih Pelanggan</label>
                            <select 
                                className="input-field" 
                                value={selectedCustomerId} 
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'new') {
                                        setShowAddCustomerModal(true);
                                        setSelectedCustomerId('');
                                    } else {
                                        setSelectedCustomerId(val);
                                        if (val) {
                                            const c = customers.find(x => x.id === parseInt(val));
                                            if (c) setCustomerName(c.name);
                                        } else {
                                            setCustomerName('');
                                        }
                                    }
                                }}
                            >
                                <option value="">Umum (Tanpa Akun)</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - Saldo: Rp {Number(c.balance).toLocaleString('id-ID')}</option>
                                ))}
                                <option value="new">+ Tambah Pelanggan Baru...</option>
                            </select>
                        </div>
                        {!selectedCustomerId && (
                            <div className="form-group" style={{marginTop: '12px'}}>
                                <label>Nama / Keterangan Pembeli</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={customerName} 
                                    onChange={e => setCustomerName(e.target.value)} 
                                    placeholder="Ketik nama pembeli..." 
                                />
                            </div>
                        )}
                        <div className="form-group" style={{marginTop: '16px'}}>
                            <label>Metode Pembayaran</label>
                            <div style={{display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap'}}>
                                <label style={{flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: '2px solid', borderRadius: '8px', background: paymentMethod === 'Cash' ? 'var(--primary-color)' : 'white', borderColor: paymentMethod === 'Cash' ? 'var(--primary-color)' : 'var(--border-color)', color: paymentMethod === 'Cash' ? 'white' : 'var(--text-primary)', transition: 'all 0.2s', textAlign: 'center'}}>
                                    <input type="radio" name="paymentMethod" value="Cash" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{display: 'none'}} />
                                    <span style={{fontWeight: 'bold'}}>Tunai (Lunas)</span>
                                </label>
                                <label style={{flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: '2px solid', borderRadius: '8px', background: paymentMethod === 'Kredit' ? '#ef4444' : 'white', borderColor: paymentMethod === 'Kredit' ? '#ef4444' : 'var(--border-color)', color: paymentMethod === 'Kredit' ? 'white' : 'var(--text-primary)', transition: 'all 0.2s', textAlign: 'center'}}>
                                    <input type="radio" name="paymentMethod" value="Kredit" checked={paymentMethod === 'Kredit'} onChange={() => setPaymentMethod('Kredit')} style={{display: 'none'}} />
                                    <span style={{fontWeight: 'bold'}}>Kredit (Hutang)</span>
                                </label>
                                <label style={{flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: '2px solid', borderRadius: '8px', background: paymentMethod === 'Potong Saldo' ? '#10b981' : 'white', borderColor: paymentMethod === 'Potong Saldo' ? '#10b981' : 'var(--border-color)', color: paymentMethod === 'Potong Saldo' ? 'white' : 'var(--text-primary)', transition: 'all 0.2s', textAlign: 'center'}}>
                                    <input type="radio" name="paymentMethod" value="Potong Saldo" checked={paymentMethod === 'Potong Saldo'} onChange={() => setPaymentMethod('Potong Saldo')} style={{display: 'none'}} />
                                    <span style={{fontWeight: 'bold'}}>Potong Saldo</span>
                                </label>
                            </div>
                        </div>
                        
                        {paymentMethod === 'Cash' && (
                            <div className="form-group" style={{marginTop: '16px'}}>
                                <label>Jumlah Uang Diterima (Rp)</label>
                                <CurrencyInput value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="input-field" placeholder="Ketik jumlah uang..." />
                                {(() => {
                                    const paid = amountPaid ? parseFloat(String(amountPaid).replace(/[^0-9]/g, '')) : 0;
                                    const change = paid - totalAmount;
                                    if (change > 0) {
                                        return (
                                            <div style={{marginTop: '8px', padding: '12px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: selectedCustomerId ? '8px' : '0', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                                    <span>Kembalian:</span>
                                                    <span>Rp {Number(change).toLocaleString('id-ID')}</span>
                                                </div>
                                                {selectedCustomerId ? (
                                                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)'}}>
                                                        <input type="checkbox" checked={saveAsDeposit} onChange={e => setSaveAsDeposit(e.target.checked)} />
                                                        Simpan kembalian sebagai Saldo / Titip Dana
                                                    </label>
                                                ) : (
                                                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px'}}>*Pilih pelanggan di atas jika ingin menyimpan kembalian ke Saldo.</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
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
                        <div className="form-group" style={{marginTop: '16px'}}>
                            <label>Status Pengambilan</label>
                            <div style={{display: 'flex', gap: '16px', marginTop: '8px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: deliveryStatus === 'Langsung' ? 'rgba(59,130,246,0.1)' : 'white', borderColor: deliveryStatus === 'Langsung' ? 'var(--primary-color)' : 'var(--border-color)'}}>
                                    <input type="radio" name="deliveryStatus" value="Langsung" checked={deliveryStatus === 'Langsung'} onChange={() => setDeliveryStatus('Langsung')} style={{margin: 0}} />
                                    <span style={{fontWeight: deliveryStatus === 'Langsung' ? 'bold' : 'normal', color: deliveryStatus === 'Langsung' ? 'var(--primary-color)' : 'var(--text-primary)'}}>Langsung</span>
                                </label>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: deliveryStatus === 'DO' ? 'rgba(245,158,11,0.1)' : 'white', borderColor: deliveryStatus === 'DO' ? '#f59e0b' : 'var(--border-color)'}}>
                                    <input type="radio" name="deliveryStatus" value="DO" checked={deliveryStatus === 'DO'} onChange={() => setDeliveryStatus('DO')} style={{margin: 0}} />
                                    <span style={{fontWeight: deliveryStatus === 'DO' ? 'bold' : 'normal', color: deliveryStatus === 'DO' ? '#f59e0b' : 'var(--text-primary)'}}>DO (Titip)</span>
                                </label>
                            </div>
                        </div>

                        <div style={{marginTop: '32px'}}>
                            <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 'bold'}} onClick={checkout} disabled={loading}>
                                {loading ? 'Memproses...' : 'PROSES PEMBAYARAN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add Customer */}
            {showAddCustomerModal && (
                <div className="modal-overlay" onClick={() => setShowAddCustomerModal(false)}>
                    <div className="modal-content glass-panel" style={{maxWidth: '400px', width: '90%'}} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop: 0, marginBottom: '24px', fontSize: '1.4rem'}}>+ Tambah Pelanggan Baru</h3>
                        <div className="form-group">
                            <label>Nama Pelanggan <span style={{color: 'red'}}>*</span></label>
                            <input type="text" className="input-field" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Contoh: Budi Santoso" autoFocus />
                        </div>
                        <div className="form-group" style={{marginTop: '16px'}}>
                            <label>Nomor HP (Opsional)</label>
                            <input type="text" className="input-field" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="08..." />
                        </div>
                        <div style={{display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end'}}>
                            <button className="btn btn-outline" onClick={() => setShowAddCustomerModal(false)} disabled={loading}>Batal</button>
                            <button className="btn btn-primary" onClick={handleAddCustomer} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
                        </div>
                    </div>
                </div>
            )}

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
                <div className={`modal-overlay ${printMode === 'struk' ? 'print-thermal' : (printMode === 'invoice' || printMode === 'surat_jalan' ? 'print-a4' : '')}`} 
                      style={(printMode === 'menu' || printMode === 'kredit_success') ? { gap: '24px' } : {}}
                      onClick={() => { if (printMode === 'menu' || printMode === 'kredit_success') setTransactionSuccessData(null); }}
                >
                    
                    {/* Layout Notifikasi Hutang */}
                    {printMode === 'kredit_success' && (
                        <div className="modal-content no-print" style={{maxWidth: '450px', width: '100%', padding: '32px', textAlign: 'center', flexShrink: 0, borderTop: '6px solid var(--primary-color)'}} onClick={e => e.stopPropagation()}>
                            <div style={{fontSize: '4rem', marginBottom: '16px'}}>📝</div>
                            <h2 style={{color: 'var(--primary-color)', marginBottom: '16px'}}>Transaksi Masuk Piutang</h2>
                            <button className="btn btn-primary" style={{width: '100%', padding: '14px', fontSize: '1.1rem'}} onClick={() => setTransactionSuccessData(null)}>
                                Tutup
                            </button>
                        </div>
                    )}

                    {/* Layout Struk Thermal (Detail & Cetak) */}
                    {printMode === 'struk' && (
                        <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '0', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                            <style>{`@media print { @page { margin: 0; } body { background: white; } }`}</style>
                            <div className="invoice-container" style={{padding: '24px', paddingBottom: '16px', fontFamily: '"Courier New", Courier, monospace', color: 'black', textTransform: 'uppercase', background: '#f8f8f8', minHeight: '300px'}}>
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px'}}>
                                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px'}}>
                                        <img src="/logo-baru.png" alt="Dio Bangunan Logo" style={{maxWidth: '100px', mixBlendMode: 'multiply'}} />
                                    </div>
                                </div>
                                
                                <div style={{fontSize: '0.75rem', marginBottom: '16px', textAlign: 'left', lineHeight: '1.4', color: '#666'}}>
                                    <div>MENJUAL ALAT BANGUNAN & LISTRIK</div>
                                    <div>ALAMAT : PASAR TARAM</div>
                                    <div style={{display: 'flex'}}>
                                        <div style={{width: '70px'}}>HP/WA</div>
                                        <div>: 0812 7786 7616<br/>&nbsp;&nbsp;0853 1407 8967</div>
                                    </div>
                                </div>
                                
                                <div style={{borderBottom: '1px dashed #999', margin: '8px 0'}}></div>
                                
                                <div style={{fontSize: '0.75rem', marginBottom: '8px', color: '#555'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}><span>Pembeli</span> <span>{transactionSuccessData.customer_name || 'UMUM'}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}><span>Pembayaran</span> <span>{transactionSuccessData.payment_method === 'Cash' ? 'LUNAS' : 'BELUM BAYAR'}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}><span>Tanggal</span> <span>{new Date(transactionSuccessData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}><span>No Struk</span> <span>SR{transactionSuccessData.sale_id}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Kasir</span> <span>{user.username}</span></div>
                                </div>
                                
                                <div style={{borderBottom: '1px dashed #999', margin: '8px 0'}}></div>
                                
                                <div style={{fontSize: '0.75rem', marginBottom: '8px', color: '#555'}}>
                                    {transactionSuccessData.items.map((item, idx) => (
                                        <div key={idx} style={{marginBottom: '6px'}}>
                                            <div style={{marginBottom: '2px'}}>{item.name}</div>
                                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                                <span>{Number(item.price || 0).toLocaleString('id-ID')} x {item.qty}</span>
                                                <span>{Number(item.qty * (item.price || 0)).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{borderBottom: '1px dashed #999', margin: '8px 0'}}></div>
                                
                                <div style={{fontSize: '0.75rem', marginBottom: '16px', color: '#555'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}>
                                        <span>TOTAL {transactionSuccessData.items.reduce((acc, item) => acc + parseInt(item.qty || 0), 0)} QTY</span>
                                        <span>{Number(transactionSuccessData.total_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2px'}}>
                                        <span>Bayar</span>
                                        <span>{transactionSuccessData.payment_method === 'Cash' ? Number(transactionSuccessData.total_amount).toLocaleString('id-ID') : '0'}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                        <span>Kurang</span>
                                        <span>{transactionSuccessData.payment_method === 'Cash' ? '0' : Number(transactionSuccessData.total_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                                
                                <div style={{borderBottom: '1px dashed #999', margin: '8px 0'}}></div>
                                
                                <div style={{fontSize: '0.75rem', lineHeight: '1.4', color: '#666'}}>
                                    <div>TERIMA KASIH</div>
                                    <div>KAMI SIAP MENYEDIAKAN KEBUTUHAN ANDA</div>
                                </div>
                            </div>
                            
                            {printMode === 'struk' && (
                                <div className="no-print" style={{display: 'flex', flexDirection: 'column', marginTop: '0', borderTop: '1px solid var(--border-color)'}}>
                                    <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('struk'); setTimeout(() => window.print(), 300); }}>Cetak</button>
                                    <button style={{padding: '16px', border: 'none', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => setPrintMode('menu')}>Kembali</button>
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
                                    Cetak
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
                                                {printMode === 'invoice' && <td style={{padding: '6px 4px', textAlign: 'right'}}>{Number(item.price).toLocaleString('id-ID')}</td>}
                                                <td style={{padding: '6px 4px', textAlign: 'center'}}>{item.qty}</td>
                                                {printMode === 'invoice' && <td style={{padding: '6px 4px', textAlign: 'right'}}>{Number(item.qty * item.price).toLocaleString('id-ID')}</td>}
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
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{Number(transactionSuccessData.total_amount).toLocaleString('id-ID')}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Bayar</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{transactionSuccessData.payment_method === 'Cash' ? Number(transactionSuccessData.total_amount).toLocaleString('id-ID') : '0'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Kurang</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{transactionSuccessData.payment_method === 'Cash' ? '0' : Number(transactionSuccessData.total_amount).toLocaleString('id-ID')}</td>
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
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rp {Number(row.total_sales).toLocaleString('id-ID')}</td>
                                            <td style={{textAlign: 'right', color: '#10b981', fontWeight: 'bold'}}>Rp {Number(row.total_profit).toLocaleString('id-ID')}</td>
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
                                            <td style={{textAlign: 'right'}}>Rp {Number(row.total_amount).toLocaleString('id-ID')}</td>
                                            <td style={{textAlign: 'right', color: '#10b981'}}>Rp {Number(row.profit).toLocaleString('id-ID')}</td>
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
                                                Rp {Number(detailData.reduce((acc, row) => acc + Number(row.total_amount), 0)).toLocaleString('id-ID')}
                                            </td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold', color: '#10b981'}}>
                                                Rp {Number(detailData.reduce((acc, row) => acc + Number(row.profit), 0)).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {toast.show && (
                <div className="modal-overlay" onClick={() => {
                    if (toast.onClose) toast.onClose();
                    setToast(prev => ({ ...prev, show: false, onClose: null }));
                }} style={{backdropFilter: 'blur(8px)', alignItems: 'center', zIndex: 999999}}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f59e0b' : '#dc2626',
                        border: toast.type === 'success' ? '2px solid #059669' : toast.type === 'warning' ? '2px solid #d97706' : '2px solid #b91c1c',
                        color: '#ffffff',
                        padding: '32px 48px',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '5rem', lineHeight: '1' }}>
                            {toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : '✅'}
                        </div>
                        <h2 style={{ margin: 0, fontWeight: '700', fontSize: '1.5rem', color: 'white' }}>{toast.message}</h2>
                        <button 
                            onClick={() => {
                                if (toast.onClose) toast.onClose();
                                setToast(prev => ({ ...prev, show: false, onClose: null }));
                            }} 
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                width: '100%',
                                marginTop: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesView;
