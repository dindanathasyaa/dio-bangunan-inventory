import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CashDebtView = ({ user, activeBranch, setActiveBranch, branches }) => {
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

    // New Receivable Modal
    const [showNewReceivableModal, setShowNewReceivableModal] = useState(false);
    const [newReceivableForm, setNewReceivableForm] = useState({ customer_name: '', total_debt: '' });
    const [printDebtData, setPrintDebtData] = useState(null);

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
        axios.get(`http://localhost:5000/api/cash?branch_id=${activeBranch}`).then(res => setTransactions(res.data.transactions || [])).catch(console.error);
        axios.get(`http://localhost:5000/api/receivables?branch_id=${activeBranch}`).then(res => setReceivables(res.data)).catch(console.error);
        axios.get(`http://localhost:5000/api/payables?branch_id=${activeBranch}`).then(res => setPayables(res.data)).catch(console.error);
        axios.get(`http://localhost:5000/api/dashboard/summary?branch_id=${activeBranch}`).then(res => setSummary(res.data)).catch(console.error);
    };

    const handlePayReceivable = async (id, amount) => {
        try {
            await axios.post('http://localhost:5000/api/receivables/pay', {
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
            await axios.post('http://localhost:5000/api/payables/pay', {
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

    const handleCreateNewReceivable = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/receivables/new', newReceivableForm);
            setShowNewReceivableModal(false);
            setNewReceivableForm({ customer_name: '', total_debt: '' });
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Gagal menambahkan piutang baru", "error");
        }
    };

    const showTransactionDetail = async (cfId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/cash_flow/detail/${cfId}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat detail transaksi.", "error");
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
                        <p><strong>Nominal:</strong> Rp {parseFloat(cashFlow.amount).toLocaleString()}</p>
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
                                            <td>Rp {parseFloat(item.price || item.buy_price || 0).toLocaleString('en-US')}</td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>
                                                Rp {parseFloat(item.qty * (item.price || item.buy_price || 0)).toLocaleString('en-US')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{position: 'sticky', bottom: 0, background: 'var(--panel-bg)', zIndex: 1, borderTop: '2px solid var(--border-color)'}}>
                                    <tr>
                                        <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>Total Keseluruhan:</td>
                                        <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                            Rp {items.reduce((acc, item) => acc + (item.qty * (item.price || item.buy_price || 0)), 0).toLocaleString('en-US')}
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
                        Sisa Tagihan: Rp {maxAmount.toLocaleString()}
                    </p>

                    <input 
                        type="number" 
                        className="input-field" 
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder={`Maks. Rp ${maxAmount.toLocaleString()}`}
                        autoFocus
                    />

                    <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px'}}>
                        <button className="btn btn-secondary" onClick={() => setPaymentModalData(null)}>Batal</button>
                        <button className="btn btn-primary" onClick={() => {
                            const amt = parseFloat(paymentAmount);
                            if (amt && !isNaN(amt) && amt > 0) {
                                if (amt > maxAmount) {
                                    showToast(`Nominal pembayaran melebihi sisa tagihan (Maksimal Rp ${maxAmount.toLocaleString()})`, "error");
                                    return;
                                }
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
                        }}>Simpan</button>
                    </div>
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
                        
                        <div style={{marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', fontSize: '0.85rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span>Total Hutang:</span>
                                <span>Rp {parseFloat(printDebtData.total_debt).toLocaleString()}</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                                <span>Sudah Dibayar:</span>
                                <span>Rp {parseFloat(printDebtData.amount_paid).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div style={{fontSize: '0.9rem', marginBottom: '24px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                <span>SISA TAGIHAN</span>
                                <span>Rp {sisa.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div style={{textAlign: 'center', fontSize: '0.85rem'}}>
                            <p style={{margin: 0, fontStyle: 'italic'}}>Harap simpan struk ini sebagai bukti.</p>
                            <p style={{margin: 0, fontStyle: 'italic', marginTop: '4px'}}>Terima kasih!</p>
                        </div>
                    </div>
                    
                    <div className="no-print" style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                        <button className="btn btn-secondary" style={{flex: 1, padding: '12px'}} onClick={() => setPrintDebtData(null)}>Tutup</button>
                        <button className="btn btn-primary" style={{flex: 1, padding: '12px'}} onClick={() => window.print()}>🖨️ Cetak</button>
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
                {renderPaymentModal()}
                {renderPrintModal()}
                {showNewReceivableModal && (
                    <div className="modal-overlay" onClick={() => setShowNewReceivableModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', width: '90%'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                                <h2>Tambah Piutang Lama</h2>
                                <button className="btn-icon" onClick={() => setShowNewReceivableModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreateNewReceivable}>
                                <div className="form-group" style={{marginBottom: '16px'}}>
                                    <label>Nama Pembeli</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        value={newReceivableForm.customer_name}
                                        onChange={e => setNewReceivableForm({...newReceivableForm, customer_name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="form-group" style={{marginBottom: '24px'}}>
                                    <label>Total Nominal Hutang</label>
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        value={newReceivableForm.total_debt}
                                        onChange={e => setNewReceivableForm({...newReceivableForm, total_debt: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewReceivableModal(false)}>Batal</button>
                                    <button type="submit" className="btn btn-primary">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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

                <div style={{display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                    <button className={`btn ${view === 'CashFlow' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('CashFlow')}>Riwayat Transaksi Kas</button>
                    <button className={`btn ${view === 'Receivables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Receivables')}>Daftar Piutang Pembeli</button>
                    {user?.role === 'OWNER' && (
                        <button className={`btn ${view === 'Payables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Payables')}>Daftar Hutang (Supplier)</button>
                    )}
                </div>

            {view === 'CashFlow' && (
                <div>
                    <div style={{display: 'flex', gap: '24px', marginBottom: '24px'}}>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Saldo Kas Saat Ini</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary?.totalCash || 0).toLocaleString('en-US')}</span>
                        </div>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Keuntungan (Profit Kotor)</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary?.totalProfit || 0).toLocaleString('en-US')}</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{marginBottom: '24px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h2>Riwayat Transaksi Kas</h2>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <label style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Pilih Tanggal:</label>
                                <input type="date" className="input-field" style={{marginBottom: 0}} value={cashFlowDate} onChange={e => setCashFlowDate(e.target.value)} />
                                {cashFlowDate && <button className="btn btn-secondary" onClick={() => setCashFlowDate('')}>Tampilkan Semua</button>}
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
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
                                                <td style={{fontWeight: 'bold', color: '#10b981'}}>Rp {parseFloat(t.amount).toLocaleString()}</td>
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
                                                <td style={{fontWeight: 'bold', color: 'var(--danger-color)'}}>Rp {parseFloat(t.amount).toLocaleString()}</td>
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
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                        <h2>Daftar Piutang Pembeli</h2>
                        <button className="btn btn-primary" onClick={() => setShowNewReceivableModal(true)}>+ Tambah Piutang Lama</button>
                    </div>
                    <table className="data-table">
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
                                    <td style={{fontWeight: 'bold'}}>{r.customer_name}</td>
                                    <td>Rp {parseFloat(r.total_debt).toLocaleString()}</td>
                                    <td>Rp {parseFloat(r.amount_paid).toLocaleString()}</td>
                                    <td style={{color: 'var(--danger-color)', fontWeight: 'bold'}}>Rp {sisa.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${r.status === 'Lunas' ? 'good' : 'low'}`}>{r.status}</span>
                                    </td>
                                    <td>
                                        {r.status !== 'Lunas' && (
                                            <button className="btn btn-secondary" onClick={() => {
                                                setPaymentModalData({ type: 'Receivable', id: r.id, name: r.customer_name });
                                                setPaymentAmount('');
                                            }}>Terima Cicilan/Pelunasan</button>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn btn-outline" style={{padding: '6px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => setPrintDebtData(r)}>
                                            🖨️ Cetak
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
                    <table className="data-table">
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
                                    <td style={{fontWeight: 'bold'}}>{p.supplier_name}</td>
                                    <td>Rp {parseFloat(p.total_debt).toLocaleString()}</td>
                                    <td>Rp {parseFloat(p.amount_paid).toLocaleString()}</td>
                                    <td style={{color: 'var(--danger-color)', fontWeight: 'bold'}}>Rp {sisa.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${p.status === 'Lunas' ? 'good' : 'low'}`}>{p.status}</span>
                                    </td>
                                    <td style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                        {p.status !== 'Lunas' && (
                                            <>
                                                <button className="btn btn-primary" onClick={() => {
                                                    setPaymentModalData({ type: 'Payable', id: p.id, name: p.supplier_name });
                                                    setPaymentAmount('');
                                                }}>Bayar (Ambil Kas)</button>
                                                <button className="btn btn-secondary" onClick={() => {
                                                    if(window.confirm(`Lunas otomatis sebesar Rp ${sisa.toLocaleString()} untuk ${p.supplier_name}?`)) {
                                                        handlePayPayable(p.id, sisa);
                                                    }
                                                }}>Sudah Lunas</button>
                                            </>
                                        )}
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
