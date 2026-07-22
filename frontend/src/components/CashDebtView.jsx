import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CashDebtView = ({ user, activeBranch, branches }) => {
    const [view, setView] = useState('CashFlow'); // CashFlow, Receivables, Payables
    const [transactions, setTransactions] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [payables, setPayables] = useState([]);
    const [summary, setSummary] = useState({ cash: 0, profit: 0 });
    const [cashFlowDate, setCashFlowDate] = useState('');
    
    // Details Modal
    const [detailData, setDetailData] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeBranch]);

    const fetchData = () => {
        axios.get(`http://localhost:5000/api/cash?branch_id=${activeBranch}`).then(res => setTransactions(res.data)).catch(console.error);
        axios.get(`http://localhost:5000/api/receivables?branch_id=${activeBranch}`).then(res => setReceivables(res.data)).catch(console.error);
        axios.get(`http://localhost:5000/api/payables?branch_id=${activeBranch}`).then(res => setPayables(res.data)).catch(console.error);
        axios.get(`http://localhost:5000/api/dashboard/summary?branch_id=${activeBranch}`).then(res => setSummary(res.data)).catch(console.error);
    };

    const handlePayReceivable = async (id, amount) => {
        try {
            await axios.post('http://localhost:5000/api/receivables/pay', {
                receivable_id: id,
                amount,
                branch_id: user.role === 'MANAGER' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1)
            });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Gagal memproses pembayaran");
        }
    };

    const handlePayPayable = async (id, amount) => {
        try {
            await axios.post('http://localhost:5000/api/payables/pay', {
                payable_id: id,
                amount,
                branch_id: user.role === 'MANAGER' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1)
            });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Gagal memproses pembayaran");
        }
    };

    const showTransactionDetail = async (cfId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/cash_flow/detail/${cfId}`);
            setDetailData(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            alert("Gagal memuat detail transaksi.");
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.product_name}</td>
                                            <td>{item.qty} {item.unit}</td>
                                            <td>Rp {parseFloat(item.price || item.buy_price || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
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
    const filteredTransactions = transactions.filter(t => {
        if (!cashFlowDate) return true;
        const d = new Date(t.created_at);
        const pad = n => n.toString().padStart(2, '0');
        const rowDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return rowDateStr === cashFlowDate;
    });

    const kasMasuk = filteredTransactions.filter(t => t.type === 'Masuk');
    const kasKeluar = filteredTransactions.filter(t => t.type === 'Keluar');

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            {renderDetailModal()}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0}}>Kas, Piutang, Hutang</h1>
            </div>

            <div style={{display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                <button className={`btn ${view === 'CashFlow' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('CashFlow')}>Riwayat Transaksi Kas</button>
                <button className={`btn ${view === 'Receivables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Receivables')}>Daftar Piutang Pembeli</button>
                {user.role === 'OWNER' && (
                    <button className={`btn ${view === 'Payables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Payables')}>Daftar Hutang (Supplier)</button>
                )}
            </div>

            {view === 'CashFlow' && (
                <div>
                    <div style={{display: 'flex', gap: '24px', marginBottom: '24px'}}>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Saldo Kas Saat Ini</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary.cash).toLocaleString()}</span>
                        </div>
                        <div className="glass-panel" style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Keuntungan (Profit Kotor)</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary.profit).toLocaleString()}</span>
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
                    <h2>Daftar Piutang (Orang Yang Berhutang ke Toko)</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Pelanggan</th>
                                <th>Total Hutang</th>
                                <th>Sudah Dibayar</th>
                                <th>Sisa Tagihan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receivables.map(r => {
                                const sisa = parseFloat(r.total_debt) - parseFloat(r.amount_paid);
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
                                                const amt = prompt(`Masukkan nominal pembayaran untuk ${r.customer_name}:`);
                                                if(amt && !isNaN(amt)) handlePayReceivable(r.id, parseFloat(amt));
                                            }}>Terima Cicilan/Pelunasan</button>
                                        )}
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
                            {payables.map(p => {
                                const sisa = parseFloat(p.total_debt) - parseFloat(p.amount_paid);
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
                                                    const amt = prompt(`Masukkan nominal pembayaran ke ${p.supplier_name}:`);
                                                    if(amt && !isNaN(amt)) handlePayPayable(p.id, parseFloat(amt));
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
};

export default CashDebtView;
