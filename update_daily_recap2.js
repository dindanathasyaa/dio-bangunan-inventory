const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/DailyRecapView.jsx', 'utf8');

const modalStart = content.indexOf('{/* Menu Pilihan Aksi */}');
if (modalStart !== -1) {
    const strukEnd = content.indexOf('{/* Layout A4 (Invoice & Surat Jalan) */}');
    if (strukEnd !== -1) {
        content = content.substring(0, modalStart) + `{/* Struk Thermal Layout & Menu */}
                    {(printMode === 'menu' || printMode === 'struk') && (
                        <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '0', flexShrink: 0, overflow: 'hidden'}} onClick={e => e.stopPropagation()}>
                            <style>{\`@media print { .print-thermal { display: block !important; } .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { margin: 0; } body { background: white; margin: 0; padding: 0; } }\`}</style>
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

                            <div className="no-print">
                                <div style={{background: 'var(--primary-color)', color: 'white', padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem'}}>Pilih Format Cetak</div>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('struk'); setTimeout(() => window.print(), 300); }}>🖨️ Cetak Struk Kasir</button>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('invoice'); setTimeout(() => window.print(), 300); }}>📄 Cetak Invoice A4</button>
                                    <button style={{padding: '12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => { setPrintMode('surat_jalan'); setTimeout(() => window.print(), 300); }}>🚚 Cetak Surat Jalan</button>
                                    <button style={{padding: '12px', border: 'none', background: '#f87171', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setPrintData(null)}>Tutup</button>
                                </div>
                            </div>
                        </div>
                    )}

                    ` + content.substring(strukEnd);
    }
}

fs.writeFileSync('frontend/src/components/DailyRecapView.jsx', content);
console.log('DailyRecapView print menu merged with preview successfully.');
