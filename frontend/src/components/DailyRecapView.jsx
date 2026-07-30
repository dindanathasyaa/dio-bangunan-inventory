import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyRecapView = ({ user, activeBranch }) => {
    const [recapData, setRecapData] = useState([]);
    const [recapDate, setRecapDate] = useState('');
    const [detailData, setDetailData] = useState([]);
    const [detailDate, setDetailDate] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [printMode, setPrintMode] = useState('menu'); // Data for receipt printing

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
        setPrintMode('menu');
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

            
            {/* Print Modals */}
            {printData && (
                <div className="modal-overlay" onClick={() => setPrintData(null)}>
                    
                    {/* Struk Thermal Layout & Menu */}
                    {(printMode === 'menu' || printMode === 'struk') && (
                        <div className="print-thermal" style={{display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', maxWidth: '350px', width: '100%'}} onClick={e => e.stopPropagation()}>
                            <style>{`@media print { .print-thermal { display: block !important; } .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { margin: 0; } body { background: white; margin: 0; padding: 0; } }`}</style>
                            
                            {/* Receipt Container */}
                            <div className="modal-content" style={{position: 'relative', width: '100%', padding: '0', flexShrink: 0, overflow: 'hidden'}}>
                                <div className="invoice-container" style={{padding: '24px', paddingBottom: '16px'}}>
                                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                                    <img src="/logo-transparent.png" alt="Dio Bangunan Logo" style={{maxWidth: '140px', width: '100%', mixBlendMode: 'multiply'}} />
                                </div>
                                
                                <div style={{fontSize: '0.85rem', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>No. Faktur:</span> <span style={{fontWeight: 'bold'}}>#{printData.sale_id}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Tanggal:</span> <span>{new Date(printData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Kasir:</span> <span>{user?.username}</span></div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Pelanggan:</span> <span>{printData.customer_name || 'Umum'}</span></div>
                                </div>
                                
                                <div style={{marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px'}}>
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

                            </div>

                            {/* Action Menu Container */}
                            <div className="modal-content no-print" style={{width: '100%', padding: '0', flexShrink: 0, overflow: 'hidden'}}>
                                <div style={{background: 'var(--primary-color)', color: 'white', padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem'}}>Pilih Format Cetak</div>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('struk'); setTimeout(() => window.print(), 300); }}>Cetak Struk Kasir</button>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('invoice'); setTimeout(() => window.print(), 300); }}>Cetak Invoice A4</button>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('surat_jalan'); setTimeout(() => window.print(), 300); }}>Cetak Surat Jalan</button>
                                    <button style={{padding: '12px', border: 'none', background: '#f87171', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setPrintData(null)}>Tutup</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Layout A4 (Invoice & Surat Jalan) */}
                    {(printMode === 'invoice' || printMode === 'surat_jalan') && (
                        <div className="modal-content a4-container print-a4" style={{position: 'relative', width: '210mm', padding: '40px', background: 'white', color: 'black', margin: '20px auto', fontFamily: 'sans-serif'}} onClick={e => e.stopPropagation()}>
                            <style>{`@media print { .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { size: A4 portrait; margin: 0; } body { background: white; } }`}</style>
                            
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
                                                <tr><td style={{paddingRight: '16px'}}>Pembayaran</td><td>: {printData.payment_method === 'Cash' ? 'Lunas' : 'Belum Bayar'}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Tanggal</td><td>: {new Date(printData.transaction_date).toLocaleString('id-ID', {dateStyle: 'short', timeStyle: 'short'})}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Nomor</td><td>: SR{printData.sale_id}</td></tr>
                                                <tr><td style={{paddingRight: '16px'}}>Kasir</td><td>: {user?.username}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <table style={{borderCollapse: 'collapse'}}>
                                            <tbody>
                                                <tr><td style={{paddingRight: '16px'}}>Pembeli</td><td>: {printData.customer_name || 'Umum'}</td></tr>
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
                                        {printData.items.map((item, idx) => (
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
                                                    <td style={{padding: '4px 0'}}>TOTAL {printData.items.reduce((sum, i) => sum + Number(i.qty), 0)} QTY</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{Number(printData.total_amount).toLocaleString('id-ID')}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Bayar</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{printData.payment_method === 'Cash' ? Number(printData.total_amount).toLocaleString('id-ID') : '0'}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{padding: '4px 0'}}>Kurang</td>
                                                    <td style={{padding: '4px 0', textAlign: 'right'}}>{printData.payment_method === 'Cash' ? '0' : Number(printData.total_amount).toLocaleString('id-ID')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: printMode === 'surat_jalan' ? '64px' : '0'}}>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{marginBottom: '80px'}}>Hormat Kami</div>
                                        <div>{user?.username}</div>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{marginBottom: '80px'}}>Pembeli</div>
                                        <div>{printData.customer_name || '....................'}</div>
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
        </div>
    );
};

export default DailyRecapView;
