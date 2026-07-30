import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyRecapView = ({ user, activeBranch }) => {
    const [recapData, setRecapData] = useState([]);
    const [recapDate, setRecapDate] = useState('');
    const [detailData, setDetailData] = useState([]);
    const [detailDate, setDetailDate] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [printData, setPrintData] = useState(null); // Data for receipt printing

    useEffect(() => {
        if (activeBranch) {
            fetchRecap();
        }
        // eslint-disable-next-line
    }, [activeBranch]);

    const fetchRecap = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/sales/recap?branch_id=${activeBranch}`);
            setRecapData(res.data);
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

    const handlePrintReceipt = (transaction) => {
        // Format the transaction data to match the receipt template
        setPrintData({
            sale_id: transaction.id,
            transaction_date: transaction.created_at,
            customer_name: transaction.customer_name,
            total_amount: transaction.total_amount,
            payment_method: transaction.payment_method,
            items: transaction.items || []
        });
        // Preview modal will automatically show when printData is set
    };

    const filteredRecap = recapData.filter(row => {
        if (!recapDate) return true;
        const d = new Date(row.date);
        const pad = n => n.toString().padStart(2, '0');
        const rowDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return rowDateStr === recapDate;
    });

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', height: '100%', display: 'flex', flexDirection: 'column'}}>
            <div className="glass-panel" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                    <h2 style={{margin: 0}}>📊 Rekap Penjualan Harian</h2>
                    <div style={{display: 'flex', gap: '12px'}}>
                        <button className="btn btn-primary" onClick={fetchRecap}>🔄 Refresh</button>
                    </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
                    <label style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>Filter Tanggal:</label>
                    <input type="date" className="input-field" style={{marginBottom: 0, width: '200px'}} value={recapDate} onChange={e => setRecapDate(e.target.value)} />
                    {recapDate && <button className="btn btn-secondary" onClick={() => setRecapDate('')}>Reset</button>}
                </div>

                <div className="table-container" style={{flex: 1, overflowY: 'auto'}}>
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
                            {filteredRecap.length > 0 ? filteredRecap.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{new Date(row.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</td>
                                    <td style={{textAlign: 'center'}}>{row.total_transactions}</td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rp {Number(row.total_sales).toLocaleString('id-ID')}</td>
                                    <td style={{textAlign: 'right', color: '#10b981', fontWeight: 'bold'}}>Rp {Number(row.total_profit).toLocaleString('id-ID')}</td>
                                    <td style={{textAlign: 'center'}}>
                                        <button className="btn btn-secondary" style={{padding: '6px 16px', fontSize: '0.9rem'}} onClick={() => viewDetail(row.date)}>Lihat Detail</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>Tidak ada data rekap penjualan</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail Penjualan */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content no-print" style={{maxWidth: '1100px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <h2>Detail Penjualan - {new Date(detailDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</h2>
                            <button className="btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
                        </div>
                        <div className="table-container" style={{flex: 1, overflowY: 'auto'}}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Faktur</th>
                                        <th>Pelanggan</th>
                                        <th>Metode</th>
                                        <th>Item Terjual</th>
                                        <th style={{textAlign: 'right'}}>Total Omset</th>
                                        <th style={{textAlign: 'center'}}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailData.map(sale => (
                                        <tr key={sale.id}>
                                            <td>{new Date(sale.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td>#{sale.id}</td>
                                            <td>{sale.customer_name || 'Umum'}</td>
                                            <td>
                                                <span className={`status-badge ${sale.payment_method === 'Cash' ? 'status-completed' : 'status-pending'}`}>
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                                    {sale.items && sale.items.map((item, i) => (
                                                        <li key={i}>{item.name} ({item.qty} {item.unit})</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rp {Number(sale.total_amount).toLocaleString('id-ID')}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <button className="btn btn-primary" style={{padding: '6px 12px', fontSize: '0.85rem'}} onClick={() => handlePrintReceipt(sale)}>
                                                    🖨️ Cetak Struk
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {detailData.length === 0 && (
                                        <tr><td colSpan="7" style={{textAlign: 'center'}}>Tidak ada transaksi.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {printData && (
                <div className="modal-overlay" onClick={() => setPrintData(null)}>
                    <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '24px', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                        <style>{`@media print { .print-thermal { display: block !important; } .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { margin: 0; } body { background: white; margin: 0; padding: 0; } }`}</style>
                        <div className="invoice-container" style={{background: 'white', color: 'black', padding: '16px', borderRadius: '8px'}}>
                            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                                <img src="/logo-transparent.png" alt="Dio Bangunan Logo" style={{maxWidth: '140px', width: '100%', mixBlendMode: 'multiply'}} />
                            </div>
                            
                            <div style={{fontSize: '0.85rem', marginBottom: '16px', borderBottom: '1px dashed black', paddingBottom: '12px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>No. Faktur:</span> <span style={{fontWeight: 'bold'}}>#{printData.sale_id}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Tanggal:</span> <span>{new Date(printData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Kasir:</span> <span>{user?.username}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Pelanggan:</span> <span>{printData.customer_name || 'Umum'}</span></div>
                            </div>
                            
                            <div style={{marginBottom: '16px', borderBottom: '1px dashed black', paddingBottom: '8px'}}>
                                {printData.items.map((item, idx) => (
                                    <div key={idx} style={{marginBottom: '8px', fontSize: '0.85rem'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{item.name}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                            <span>{item.qty} x {Number(item.price || 0).toLocaleString('id-ID')}</span>
                                            <span style={{fontWeight: 'bold'}}>{Number(item.qty * (item.price || 0)).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{fontSize: '0.9rem', marginBottom: '24px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px'}}>
                                    <span>TOTAL</span>
                                    <span>Rp {Number(printData.total_amount).toLocaleString('id-ID')}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span>Pembayaran</span>
                                    <span>{printData.payment_method === 'Cash' ? 'TUNAI' : 'KREDIT'}</span>
                                </div>
                            </div>
                            
                            <div style={{textAlign: 'center', fontSize: '0.85rem'}}>
                                <p style={{margin: 0, fontStyle: 'italic'}}>Terima kasih atas kunjungan Anda!</p>
                            </div>
                        </div>

                        <div className="no-print" style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)'}}>
                            <button className="btn btn-secondary" style={{flex: 1, padding: '12px'}} onClick={() => setPrintData(null)}>
                                Tutup
                            </button>
                            <button className="btn btn-primary" style={{flex: 1, padding: '12px'}} onClick={() => window.print()}>
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyRecapView;
