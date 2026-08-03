import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencyInput from './CurrencyInput';

const CashDebtView = ({ user, activeBranch, setActiveBranch, branches, inventory }) => {
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [view, setView] = useState('CashFlow'); // CashFlow, Receivables, Payables
    const [transactions, setTransactions] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [payables, setPayables] = useState([]);
    const [summary, setSummary] = useState({ cash: 0, profit: 0 });
    const [cashFlowDate, setCashFlowDate] = useState('');
    
    // Details Modal
    const [detailData, setDetailData] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Payment Modal
    const [paymentModalData, setPaymentModalData] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // Edit Nota Modal
    const [editNotaData, setEditNotaData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [printDebtData, setPrintDebtData] = useState(null);

    // History Modal
    const [historyModalData, setHistoryModalData] = useState(null);
    const [historyData, setHistoryData] = useState([]);

    // Custom Toast Alert State
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 4000);
    };

    useEffect(() => {
        fetchData();
    }, [activeBranch]);

    const fetchData = () => {
        axios.get(`/api/cash?branch_id=${activeBranch}`).then(res => setTransactions(res.data.transactions || [])).catch(console.error);
        axios.get(`/api/receivables?branch_id=${activeBranch}`).then(res => setReceivables(res.data)).catch(console.error);
        axios.get(`/api/payables?branch_id=${activeBranch}`).then(res => setPayables(res.data)).catch(console.error);
        axios.get(`/api/dashboard/summary?branch_id=${activeBranch}`).then(res => setSummary(res.data)).catch(console.error);
    };

    const handlePayReceivable = async (id, amount) => {
        try {
            await axios.post('/api/receivables/pay', {
                receivable_id: id,
                amount,
                branch_id: user.role === 'ADMIN' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1)
            });
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal memproses pembayaran", "error");
        }
    };

    const handlePayPayable = async (id, amount) => {
        try {
            await axios.post('/api/payables/pay', {
                payable_id: id,
                amount,
                branch_id: user.role === 'ADMIN' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1)
            });
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal memproses pembayaran", "error");
        }
    };
    const handleAddToCart = (product) => {
        const productId = product.product_id || product.id;
        const existingItem = cart.find(item => item.product_id === productId);
        if (existingItem) {
            setCart(cart.map(item => item.product_id === productId ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { 
                product_id: productId, 
                name: product.name, 
                qty: 1, 
                price: product.price || 15000, 
                base_price: product.base_price || (product.price ? product.price * 0.8 : 10000), 
                sku: product.sku, 
                unit: product.unit 
            }]);
        }
    };

    const handleUpdateQty = (productId, newQty) => {
        if (newQty < 1) {
            setCart(cart.filter(item => item.product_id !== productId));
        } else {
            setCart(cart.map(item => item.product_id === productId ? { ...item, qty: newQty } : item));
        }
    };

    const handleSaveEditNota = async () => {
        if (!editNotaData || cart.length === 0) return;
        try {
            await axios.post(`/api/receivables/${editNotaData.id}/add-items`, { items: cart });
            showToast("Berhasil menambahkan barang ke nota hutang!", "success");
            setEditNotaData(null);
            setCart([]);
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal menambahkan barang ke nota hutang", "error");
        }
    };

    const showTransactionDetail = async (cfId) => {
        try {
            const res = await axios.get(`/api/cash_flow/detail/${cfId}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat detail transaksi.", "error");
        }
    };

    const handleShowHistory = async (id, type) => {
        try {
            const endpoint = type === 'Receivable' ? `/api/receivables/${id}/history` : `/api/payables/${id}/history`;
            const res = await axios.get(`${endpoint}`);
            setHistoryData(res.data);
            setHistoryModalData({ id, type });
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat riwayat cicilan.", "error");
        }
    };

    const handlePrintDebt = async (r) => {
        if (r.sale_id > 0) {
            try {
                const res = await axios.get(`/api/sales/${r.sale_id}/items`);
                setPrintDebtData({ ...r, items: res.data });
            } catch (error) {
                console.error("Gagal memuat detail barang:", error);
                setPrintDebtData({ ...r, items: [] });
            }
        } else {
            setPrintDebtData({ ...r, items: [] });
        }
    };

    const renderDetailModal = () => {
        if (!showDetailModal || !detailData) return null;
        const { cashFlow, items } = detailData;

        return (
            <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', width: '90%'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                        <h2>Detail Transaksi Kas</h2>
                        <button className="btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
                    </div>
                    
                    <div style={{marginBottom: '24px'}}>
                        <p><strong>Tanggal:</strong> {new Date(cashFlow.created_at).toLocaleString('id-ID', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                        <p><strong>Keterangan:</strong> {cashFlow.description}</p>
                        <p><strong>Jenis:</strong> <span style={{color: cashFlow.type === 'Masuk' ? '#10b981' : 'var(--danger-color)', fontWeight: 'bold'}}>{cashFlow.type}</span></p>
                        <p><strong>Nominal:</strong> Rp {parseFloat(cashFlow.amount).toLocaleString('id-ID')}</p>
                    </div>

                    {items && items.length > 0 ? (
                        <div className="table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                            <h3>Daftar Barang Terkait:</h3>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th>Jumlah</th>
                                        <th>Harga Satuan</th>
                                        <th style={{textAlign: 'right'}}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.product_name}</td>
                                            <td>{item.qty} {item.unit}</td>
                                            <td>Rp {parseFloat(item.price || item.buy_price || 0).toLocaleString('id-ID')}</td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                                                Rp {parseFloat(item.qty * (item.price || item.buy_price || 0)).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{position: 'sticky', bottom: 0, background: 'var(--panel-bg)', zIndex: 1, borderTop: '2px solid var(--border-color)'}}>
                                    <tr>
                                        <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>Total Keseluruhan:</td>
                                        <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                            Rp {items.reduce((acc, item) => acc + (item.qty * (item.price || item.buy_price || 0)), 0).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div style={{padding: '16px', background: 'var(--surface-color)', borderRadius: '8px', textAlign: 'center'}}>
                            <p>Tidak ada detail daftar barang untuk transaksi ini.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Filter transactions by date
    const filteredTransactions = (transactions || []).filter(t => {
        if (!cashFlowDate) return true;
        const d = new Date(t.created_at);
        const pad = n => n.toString().padStart(2, '0');
        const rowDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return rowDateStr === cashFlowDate;
    });

    const kasMasuk = filteredTransactions.filter(t => t?.type === 'Masuk');
    const kasKeluar = filteredTransactions.filter(t => t?.type === 'Keluar');

    const renderPaymentModal = () => {        if (!paymentModalData) return null;
        
        // Hitung sisa hutang yang belum dibayar
        const selectedItem = paymentModalData.type === 'Receivable' 
            ? receivables.find(r => r.id === paymentModalData.id)
            : payables.find(p => p.id === paymentModalData.id);
        const maxAmount = selectedItem ? (parseFloat(selectedItem.total_debt) - parseFloat(selectedItem.amount_paid || 0)) : 0;

        const handleSavePayment = () => {
            const amt = parseFloat(paymentAmount);
            if (amt && !isNaN(amt) && amt > 0) {
                if (paymentModalData.type === 'Receivable') {
                    handlePayReceivable(paymentModalData.id, amt);
                } else {
                    handlePayPayable(paymentModalData.id, amt);
                }
                setPaymentModalData(null);
                setPaymentAmount('');
            } else {
                showToast("Nominal tidak valid", "error");
            }
        };

        return (
            <div className="modal-overlay" onClick={() => setPaymentModalData(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', width: '90%'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                        <h2>{paymentModalData.type === 'Receivable' ? 'Terima Cicilan' : 'Bayar Hutang'}</h2>
                        <button className="btn-icon" onClick={() => setPaymentModalData(null)}>✕</button>
                    </div>
                    
                    <p style={{marginBottom: '8px'}}>
                        Masukkan nominal pembayaran {paymentModalData.type === 'Receivable' ? 'untuk' : 'ke'} <strong>{paymentModalData.name}</strong>:
                    </p>
                    <p style={{fontSize: '0.9rem', color: 'var(--danger-color)', marginBottom: '16px', fontWeight: 'bold'}}>
                        Sisa Tagihan: Rp {maxAmount.toLocaleString('id-ID')}
                    </p>

                    <CurrencyInput 
                        className="input-field" 
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleSavePayment();
                            }
                        }}
                        placeholder={`Contoh: 50.000`}
                        autoFocus
                    />

                    <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px'}}>
                        <button className="btn btn-secondary" onClick={() => setPaymentModalData(null)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSavePayment}>Simpan</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryModal = () => {
        if (!historyModalData) return null;
        return (
            <div className="modal-overlay" onClick={() => setHistoryModalData(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                        <h2>Riwayat Pembayaran Cicilan</h2>
                        <button className="btn-icon" onClick={() => setHistoryModalData(null)}>✕</button>
                    </div>
                    {historyData.length > 0 ? (
                        <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                            {historyData.map((h, i) => (
                                <div key={i} style={{padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <div>
                                        <div style={{fontWeight: 'bold'}}>{new Date(h.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'})}</div>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{new Date(h.created_at).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'})}</div>
                                    </div>
                                    <div style={{fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem'}}>
                                        + Rp {Number(h.amount).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0'}}>Belum ada riwayat pembayaran.</div>
                    )}
                </div>
            </div>
        );
    };

    const renderPrintModal = () => {
        if (!printDebtData) return null;
        
        const sisa = parseFloat(printDebtData.total_debt || 0) - parseFloat(printDebtData.amount_paid || 0);

        return (
            <div className="modal-overlay print-thermal" onClick={() => setPrintDebtData(null)} style={{ alignItems: 'center' }}>
                <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '24px', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                    <style>{`@media print { @page { margin: 0; } body { background: white; } }`}</style>
                    <div className="invoice-container">
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                            <img src="/logo-transparent.png" alt="Dio Bangunan Logo" style={{maxWidth: '140px', width: '100%', mixBlendMode: 'multiply'}} />
                        </div>
                        
                        <div style={{fontSize: '0.85rem', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                            INFO TAGIHAN PIUTANG
                        </div>

                        <div style={{fontSize: '0.85rem', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Tanggal:</span> <span>{new Date().toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Petugas:</span> <span>{user.username}</span></div>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Pelanggan:</span> <span style={{fontWeight: 'bold'}}>{printDebtData.customer_name}</span></div>
                        </div>

                        {printDebtData.items && printDebtData.items.length > 0 && (
                            <div style={{marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px', fontSize: '0.85rem'}}>
                                <div style={{fontWeight: 'bold', marginBottom: '8px', textAlign: 'center'}}>DETAIL BARANG</div>
                                {printDebtData.items.map((item, idx) => (
                                    <div key={idx} style={{marginBottom: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '2px'}}>{item.name}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)'}}>
                                            <span>{item.qty} {item.unit} x {Number(item.price).toLocaleString('id-ID')}</span>
                                            <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{Number(item.qty * item.price).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div style={{marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', fontSize: '0.85rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span>Total Hutang:</span>
                                <span>Rp {parseFloat(printDebtData.total_debt).toLocaleString('id-ID')}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span>Sudah Dibayar:</span>
                                <span>Rp {parseFloat(printDebtData.amount_paid).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        
                        <div style={{fontSize: '0.9rem', marginBottom: '24px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                <span>SISA TAGIHAN</span>
                                <span>Rp {sisa.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        
                        <div style={{textAlign: 'center', fontSize: '0.85rem'}}>
                            <p style={{margin: 0, fontStyle: 'italic'}}>Harap simpan struk ini sebagai bukti.</p>
                            <p style={{margin: 0, fontStyle: 'italic', marginTop: '4px'}}>Terima kasih!</p>
                        </div>
                    </div>
                    
                    <div className="no-print" style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                        <button className="btn btn-secondary" style={{flex: 1, padding: '12px'}} onClick={() => setPrintDebtData(null)}>Tutup</button>
                        <button className="btn btn-primary" style={{flex: 1, padding: '12px'}} onClick={() => window.print()}>Cetak</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEditNotaModal = () => {
        if (!editNotaData) return null;
        
        const filteredInventory = (inventory || []).filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="modal-overlay" onClick={() => { setEditNotaData(null); setCart([]); setSearchQuery(''); }}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                        <h2>✏️ Edit Nota (Tambah Hutang) - {editNotaData.customer_name}</h2>
                        <button className="btn-icon" onClick={() => { setEditNotaData(null); setCart([]); setSearchQuery(''); }}>✕</button>
                    </div>
                    
                    <div className="flex-responsive" style={{gap: '24px', flexWrap: 'wrap'}}>
                        {/* Kiri: Pencarian Barang */}
                        <div style={{flex: '1 1 300px'}}>
                            <h3 style={{marginBottom: '16px', color: 'var(--text-primary)'}}>Pilih Barang</h3>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Cari nama barang atau kode..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{marginBottom: '16px'}}
                            />
                            <div style={{maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                {filteredInventory.slice(0, 20).map(item => (
                                    <div key={item.id} className="glass-panel" style={{padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--item-bg)'}}>
                                        <div>
                                            <div style={{fontWeight: 'bold', color: 'var(--text-primary)'}}>{item.name}</div>
                                            <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Stok: {item.stock} {item.unit} | Rp {Number(item.price).toLocaleString('id-ID')}</div>
                                        </div>
                                        <button className="btn btn-outline" style={{padding: '6px 12px'}} onClick={() => handleAddToCart(item)}>+ Tambah</button>
                                    </div>
                                ))}
                                {filteredInventory.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px'}}>Barang tidak ditemukan</div>}
                            </div>
                        </div>

                        {/* Kanan: Keranjang Tambahan */}
                        <div style={{flex: '1 1 300px'}}>
                            <h3 style={{marginBottom: '16px', color: 'var(--text-primary)'}}>Barang yang Ditambahkan</h3>
                            <div style={{maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
                                {cart.map(item => (
                                    <div key={item.product_id} className="glass-panel" style={{padding: '12px', background: 'var(--item-bg)'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)'}}>{item.name}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <button className="btn-icon" style={{background: 'var(--danger-color)', color: 'white', width: '28px', height: '28px'}} onClick={() => handleUpdateQty(item.product_id, item.qty - 1)}>-</button>
                                                <input type="number" className="input-field" style={{width: '60px', marginBottom: 0, textAlign: 'center', padding: '4px'}} value={item.qty} onChange={e => handleUpdateQty(item.product_id, Number(e.target.value))} />
                                                <button className="btn-icon" style={{background: 'var(--success-color)', color: 'white', width: '28px', height: '28px'}} onClick={() => handleUpdateQty(item.product_id, item.qty + 1)}>+</button>
                                            </div>
                                            <div style={{fontWeight: 'bold'}}>Rp {(item.qty * item.price).toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px'}}>Keranjang kosong</div>}
                            </div>
                            
                            <div style={{borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '16px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                    <span>Total Tambahan:</span>
                                    <span>Rp {cart.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString('id-ID')}</span>
                                </div>
                                <button className="btn btn-primary" style={{width: '100%', padding: '12px'}} onClick={handleSaveEditNota} disabled={cart.length === 0}>Simpan Tambahan Hutang</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    try {
        return (
            <div style={{animation: 'fadeIn 0.5s ease-out'}}>
                {/* Custom Toast Notification */}
                {toast.show && (
                    <div className="modal-overlay" onClick={() => setToast(prev => ({ ...prev, show: false }))} style={{backdropFilter: 'blur(8px)', alignItems: 'center', zIndex: 999999}}>
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
                                onClick={() => setToast(prev => ({ ...prev, show: false }))} 
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
                {renderDetailModal()}
            {renderHistoryModal()}
            {renderPaymentModal()}
                {renderPrintModal()}
                {renderEditNotaModal()}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                    <h1 style={{margin: 0}}>Kas, Piutang, Hutang</h1>
                    
                    {user?.role === 'OWNER' && user?.branch_id === null && (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{fontWeight: 'bold', color: 'var(--text-secondary)', marginRight: '12px'}}>Pilih Toko:</span>
                            <div className="custom-dropdown-container" style={{position: 'relative'}}>
                                <div 
                                    className={`custom-select-3d ${isBranchDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '220px', background: 'var(--item-bg)', border: '2px solid var(--border-color)', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', color: 'var(--text-primary)'}}
                                >
                                    <span style={{fontWeight: 'bold'}}>{activeBranch === 'all' ? 'Semua Toko (Gabungan)' : branches.find(b => b.id.toString() === activeBranch.toString())?.name}</span>
                                    <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                                </div>
                                {isBranchDropdownOpen && (
                                    <div className="custom-dropdown-menu" style={{right: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000}}>
                                        <div 
                                            className={`custom-dropdown-item branch-dropdown-item ${activeBranch === 'all' ? 'selected' : ''}`}
                                            onClick={() => { setActiveBranch('all'); setIsBranchDropdownOpen(false); }}
                                            style={{fontWeight: '500'}}
                                        >
                                            Semua Toko (Gabungan)
                                        </div>
                                        {branches.map(b => (
                                            <div 
                                                key={b.id} 
                                                className={`custom-dropdown-item branch-dropdown-item ${activeBranch.toString() === b.id.toString() ? 'selected' : ''}`}
                                                onClick={() => { setActiveBranch(b.id); setIsBranchDropdownOpen(false); }}
                                                style={{fontWeight: '500'}}
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

                <div className="flex-responsive" style={{marginBottom: '24px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                    <button className={`btn ${view === 'CashFlow' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('CashFlow')}>Riwayat Transaksi Kas</button>
                    <button className={`btn ${view === 'Receivables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Receivables')}>Daftar Piutang Pembeli</button>
                    {user?.role === 'OWNER' && (
                        <button className={`btn ${view === 'Payables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Payables')}>Daftar Hutang (Supplier)</button>
                    )}
                </div>

            {view === 'CashFlow' && (
                <div>
                    <div className="flex-responsive" style={{marginBottom: '24px'}}>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Saldo Kas Saat Ini</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary?.totalCash || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Keuntungan (Profit Kotor)</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary?.totalProfit || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{marginBottom: '24px'}}>
                        <div className="flex-responsive" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h2>Riwayat Transaksi Kas</h2>
                            <div className="flex-responsive w-full-mobile" style={{alignItems: 'center'}}>
                                <label style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Pilih Tanggal:</label>
                                <input type="date" className="input-field" style={{marginBottom: 0}} value={cashFlowDate} onChange={e => setCashFlowDate(e.target.value)} />
                                {cashFlowDate && <button className="btn btn-secondary" onClick={() => setCashFlowDate('')}>Tampilkan Semua</button>}
                            </div>
                        </div>

                        <div className="flex-responsive" style={{gap: '24px', flexWrap: 'wrap'}}>
                            {/* Kas Masuk Table */}
                            <div className="table-container" style={{flex: '1 1 45%'}}>
                                <h3 style={{color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '8px'}}>KAS MASUK</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Keterangan</th>
                                            <th>Nominal</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kasMasuk.map(t => (
                                            <tr key={t.id}>
                                                <td>{new Date(t.created_at).toLocaleString('id-ID', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                                                <td>{t.description}</td>
                                                <td style={{fontWeight: 'bold', color: '#10b981'}}>Rp {parseFloat(t.amount).toLocaleString('id-ID')}</td>
                                                <td><button className="btn btn-outline" style={{padding: '4px 12px', fontSize: '0.9rem'}} onClick={() => showTransactionDetail(t.id)}>Detail</button></td>
                                            </tr>
                                        ))}
                                        {kasMasuk.length === 0 && (
                                            <tr><td colSpan="4" style={{textAlign: 'center'}}>Tidak ada data kas masuk</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Kas Keluar Table */}
                            <div className="table-container" style={{flex: '1 1 45%'}}>
                                <h3 style={{color: 'var(--danger-color)', borderBottom: '2px solid var(--danger-color)', paddingBottom: '8px'}}>KAS KELUAR</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Keterangan</th>
                                            <th>Nominal</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kasKeluar.map(t => (
                                            <tr key={t.id}>
                                                <td>{new Date(t.created_at).toLocaleString('id-ID', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                                                <td>{t.description}</td>
                                                <td style={{fontWeight: 'bold', color: 'var(--danger-color)'}}>Rp {parseFloat(t.amount).toLocaleString('id-ID')}</td>
                                                <td><button className="btn btn-outline" style={{padding: '4px 12px', fontSize: '0.9rem'}} onClick={() => showTransactionDetail(t.id)}>Detail</button></td>
                                            </tr>
                                        ))}
                                        {kasKeluar.length === 0 && (
                                            <tr><td colSpan="4" style={{textAlign: 'center'}}>Tidak ada data kas keluar</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'Receivables' && (
                <div className="glass-panel table-container">
                    <div className="flex-responsive" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                        <h2>Daftar Piutang Pembeli</h2>
                    </div>
                    <table className="data-table mobile-card-table">
                        <thead>
                            <tr>
                                <th>Nama Pelanggan</th>
                                <th>Total Hutang</th>
                                <th>Sudah Dibayar</th>
                                <th>Sisa Tagihan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                                <th>Cetak Struk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(receivables || []).map(r => {
                                const sisa = parseFloat(r.total_debt || 0) - parseFloat(r.amount_paid || 0);
                                return (
                                <tr key={r.id}>
                                    <td data-label="Nama Pelanggan" style={{fontWeight: 'bold'}}>{r.customer_name}</td>
                                    <td data-label="Total Hutang">Rp {parseFloat(r.total_debt).toLocaleString('id-ID')}</td>
                                    <td data-label="Sudah Dibayar">Rp {parseFloat(r.amount_paid).toLocaleString('id-ID')}</td>
                                    <td data-label="Sisa Tagihan" style={{color: 'var(--danger-color)', fontWeight: 'bold'}}>Rp {sisa.toLocaleString('id-ID')}</td>
                                    <td data-label="Status">
                                        <span className={`badge ${r.status === 'Lunas' ? 'good' : 'low'}`}>{r.status}</span>
                                    </td>
                                    <td data-label="Aksi">
                                        {r.status !== 'Lunas' && (
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                                <button className="btn btn-secondary" onClick={() => {
                                                    setPaymentModalData({ type: 'Receivable', id: r.id, name: r.customer_name });
                                                    setPaymentAmount('');
                                                }}>Terima Cicilan/Pelunasan</button>
                                                {r.sale_id > 0 && (
                                                    <button className="btn btn-outline" style={{borderColor: '#f59e0b', color: '#f59e0b'}} onClick={() => {
                                                        setEditNotaData(r);
                                                        setCart([]);
                                                        setSearchQuery('');
                                                    }}>✏️ Edit Nota (Tambah Hutang)</button>
                                                )}
                                            </div>
                                        )}
                                        <button className="btn btn-outline" style={{borderColor: '#3b82f6', color: '#3b82f6', marginTop: r.status !== 'Lunas' ? '8px' : '0', width: '100%'}} onClick={() => {
                                            handleShowHistory(r.id, 'Receivable');
                                        }}>Riwayat Cicilan</button>
                                    </td>
                                    <td data-label="Cetak">
                                        <button className="btn btn-outline" style={{borderColor: '#3b82f6', color: '#3b82f6', width: '100%', marginTop: '8px'}} onClick={() => handlePrintDebt(r)}>
                                            Cetak
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'Payables' && (
                <div className="glass-panel table-container">
                    <h2>Daftar Hutang Toko (Ke Supplier)</h2>
                    <table className="data-table mobile-card-table">
                        <thead>
                            <tr>
                                <th>Nama Supplier / Pabrik</th>
                                <th>Total Hutang</th>
                                <th>Sudah Dibayar</th>
                                <th>Sisa Tagihan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(payables || []).map(p => {
                                const sisa = parseFloat(p.total_debt || 0) - parseFloat(p.amount_paid || 0);
                                return (
                                <tr key={p.id}>
                                    <td data-label="Nama Supplier" style={{fontWeight: 'bold'}}>{p.supplier_name}</td>
                                    <td data-label="Total Hutang">Rp {parseFloat(p.total_debt).toLocaleString('id-ID')}</td>
                                    <td data-label="Sudah Dibayar">Rp {parseFloat(p.amount_paid).toLocaleString('id-ID')}</td>
                                    <td data-label="Sisa Tagihan" style={{color: 'var(--danger-color)', fontWeight: 'bold'}}>Rp {sisa.toLocaleString('id-ID')}</td>
                                    <td data-label="Status">
                                        <span className={`badge ${p.status === 'Lunas' ? 'good' : 'low'}`}>{p.status}</span>
                                    </td>
                                    <td data-label="Aksi" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        {p.status !== 'Lunas' && (
                                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                <button className="btn btn-primary" onClick={() => {
                                                    setPaymentModalData({ type: 'Payable', id: p.id, name: p.supplier_name });
                                                    setPaymentAmount('');
                                                }}>Bayar (Ambil Kas)</button>
                                                <button className="btn btn-secondary" onClick={() => {
                                                    if(window.confirm(`Lunas otomatis sebesar Rp ${sisa.toLocaleString('id-ID')} untuk ${p.supplier_name}?`)) {
                                                        handlePayPayable(p.id, sisa);
                                                    }
                                                }}>Sudah Lunas</button>
                                            </div>
                                        )}
                                        <button className="btn btn-outline" style={{borderColor: '#3b82f6', color: '#3b82f6', width: '100%'}} onClick={() => {
                                            handleShowHistory(p.id, 'Payable');
                                        }}>Riwayat Cicilan</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        );
    } catch (error) {
        return <div style={{padding: '32px', color: 'red'}}><h1>Crash in CashDebtView</h1><pre>{error.stack}</pre></div>;
    }
};

export default CashDebtView;
