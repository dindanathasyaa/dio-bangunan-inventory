import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const CashDebtView = ({ user, activeBranch, branches }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'CashFlow'); // CashFlow, Receivables, Payables
    const [transactions, setTransactions] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [payables, setPayables] = useState([]);
    const [summary, setSummary] = useState({ cash: 0, profit: 0 });
    const [cashFlowDate, setCashFlowDate] = useState('');

    useEffect(() => {
        fetchData();
    }, [view, activeBranch]);

    const fetchData = async () => {
        try {
            if (view === 'CashFlow') {
                const res = await axios.get(`http://localhost:5000/api/cash?branch_id=${activeBranch}`);
                setTransactions(res.data.transactions);
                setSummary({ cash: res.data.totalCash, profit: res.data.totalProfit });
            } else if (view === 'Receivables') {
                const res = await axios.get(`http://localhost:5000/api/receivables?branch_id=${activeBranch}`);
                setReceivables(res.data);
            } else if (view === 'Payables') {
                const res = await axios.get(`http://localhost:5000/api/payables?branch_id=${activeBranch}`);
                setPayables(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePayReceivable = async (id, amount) => {
        let payBranch = user.role === 'MANAGER' ? user.branch_id : activeBranch;
        if (payBranch === 'all') {
            const chosen = prompt("Masukkan ID Toko (1 untuk Pusat, 2 untuk Cabang) tempat uang diterima:");
            if (!chosen) return;
            payBranch = parseInt(chosen);
        }
        try {
            await axios.post('http://localhost:5000/api/receivables/pay', {
                receivable_id: id,
                amount: amount,
                branch_id: payBranch
            });
            fetchData();
            alert('Pembayaran berhasil dicatat!');
        } catch (error) {
            console.error(error);
        }
    };

    const handlePayPayable = async (id, amount) => {
        let payBranch = user.role === 'MANAGER' ? user.branch_id : activeBranch;
        if (payBranch === 'all') {
            const chosen = prompt("Masukkan ID Toko (1 untuk Pusat, 2 untuk Cabang) tempat uang dikeluarkan:");
            if (!chosen) return;
            payBranch = parseInt(chosen);
        }
        try {
            await axios.post('http://localhost:5000/api/payables/pay', {
                payable_id: id,
                amount: amount,
                branch_id: payBranch
            });
            fetchData();
            alert('Pembayaran hutang berhasil dicatat!');
        } catch (error) {
            console.error(error);
        }
    };

    if (user.role !== 'OWNER' && view !== 'Receivables') {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--danger-color)'}}>Hanya Owner yang dapat mengakses Arus Kas & Hutang Supplier.</div>;
    }

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', padding: '0 24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <div style={{display: 'flex', gap: '16px'}}>
                    {user.role === 'OWNER' && <button className={`btn ${view === 'CashFlow' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('CashFlow')}>Arus Kas & Profit</button>}
                    <button className={`btn ${view === 'Receivables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Receivables')}>Piutang (Hutang Pembeli)</button>
                    {user.role === 'OWNER' && <button className={`btn ${view === 'Payables' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('Payables')}>Hutang Toko (Ke Supplier)</button>}
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>

            {view === 'CashFlow' && (
                <div>
                    <div style={{display: 'flex', gap: '24px', marginBottom: '24px'}}>
                        <div className="glass-panel metric-card" style={{flex: 1, borderTop: '4px solid #10b981'}}>
                            <span className="metric-label">Total Saldo Kas Tersedia</span>
                            <span className="metric-value" style={{color: '#10b981'}}>Rp {Number(summary.cash).toLocaleString()}</span>
                        </div>
                        <div className="glass-panel metric-card" style={{flex: 1, borderTop: '4px solid var(--primary-color)'}}>
                            <span className="metric-label">Total Keuntungan (Profit Kotor)</span>
                            <span className="metric-value" style={{color: 'var(--primary-color)'}}>Rp {Number(summary.profit).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="glass-panel table-container">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h2>Riwayat Transaksi Kas</h2>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <label style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Pilih Tanggal:</label>
                                <input type="date" className="input-field" value={cashFlowDate} onChange={e => setCashFlowDate(e.target.value)} />
                                {cashFlowDate && <button className="btn btn-secondary" onClick={() => setCashFlowDate('')}>Tampilkan Semua</button>}
                            </div>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Keterangan</th>
                                    <th>Jenis</th>
                                    <th>Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.filter(t => cashFlowDate ? new Date(t.created_at).toISOString().split('T')[0] === cashFlowDate : true).map(t => (
                                    <tr key={t.id}>
                                        <td>{new Date(t.created_at).toLocaleString()}</td>
                                        <td>{t.description}</td>
                                        <td>
                                            <span style={{color: t.type === 'Masuk' ? '#10b981' : 'var(--danger-color)', fontWeight: 'bold'}}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td style={{fontWeight: 'bold'}}>Rp {parseFloat(t.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {transactions.filter(t => cashFlowDate ? new Date(t.created_at).toISOString().split('T')[0] === cashFlowDate : true).length === 0 && (
                                    <tr><td colSpan="4" style={{textAlign: 'center'}}>Tidak ada transaksi pada tanggal ini</td></tr>
                                )}
                            </tbody>
                        </table>
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
                                    <td>
                                        {p.status !== 'Lunas' && (
                                            <button className="btn btn-primary" onClick={() => {
                                                const amt = prompt(`Masukkan nominal pembayaran ke ${p.supplier_name}:`);
                                                if(amt && !isNaN(amt)) handlePayPayable(p.id, parseFloat(amt));
                                            }}>Bayar Hutang (Ambil Kas)</button>
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
