const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/DailyRecapView.jsx', 'utf8');

// Add printMode state
content = content.replace(
    /const \[printData, setPrintData\] = useState\(null\);/g, 
    `const [printData, setPrintData] = useState(null);
    const [printMode, setPrintMode] = useState('menu');`
);

// Update handlePrintReceipt to set printMode to 'menu'
content = content.replace(
    /        \/\/ Preview modal will automatically show when printData is set\n    \};\n/g,
    `        setPrintMode('menu');
    };
`
);

// Replace the entire Print Preview Modal block with the new layout
const modalStart = content.indexOf('{/* Print Preview Modal */}');
if (modalStart !== -1) {
    const returnEnd = content.indexOf('</div>\n    );\n};', modalStart);
    if (returnEnd !== -1) {
        content = content.substring(0, modalStart) + `
            {/* Print Modals */}
            {printData && (
                <div className="modal-overlay" onClick={() => setPrintData(null)}>
                    
                    {/* Menu Pilihan Aksi */}
                    {printMode === 'menu' && (
                        <div className="modal-content no-print" style={{maxWidth: '300px', width: '100%', padding: 0, borderRadius: '12px', overflow: 'hidden', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                            <div style={{background: 'var(--primary-color)', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem'}}>Cetak Transaksi</div>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => setPrintMode('struk')}>Detail</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('struk'); setTimeout(() => window.print(), 300); }}>Cetak Struk Kasir</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('invoice'); setTimeout(() => window.print(), 300); }}>Cetak Invoice A4</button>
                                <button style={{padding: '16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => { setPrintMode('surat_jalan'); setTimeout(() => window.print(), 300); }}>Cetak Surat Jalan</button>
                                <button style={{padding: '16px', border: 'none', background: 'white', color: 'var(--primary-color)', fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => setPrintData(null)}>Tutup</button>
                            </div>
                        </div>
                    )}

                    {/* Struk Thermal Layout */}
                    {printMode === 'struk' && (
                        <div className="modal-content print-thermal" style={{position: 'relative', maxWidth: '350px', padding: '24px', flexShrink: 0}} onClick={e => e.stopPropagation()}>
                            <style>{\`@media print { .print-thermal { display: block !important; } .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { margin: 0; } body { background: white; margin: 0; padding: 0; } }\`}</style>
                            <div className="invoice-container" style={{background: 'white', color: 'black'}}>
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
                                <button className="btn btn-secondary" style={{flex: 1, padding: '12px'}} onClick={() => setPrintMode('menu')}>
                                    Kembali
                                </button>
                                <button className="btn btn-primary" style={{flex: 1, padding: '12px'}} onClick={() => window.print()}>
                                    🖨️ Cetak
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Layout A4 (Invoice & Surat Jalan) */}
                    {(printMode === 'invoice' || printMode === 'surat_jalan') && (
                        <div className="modal-content a4-container print-a4" style={{position: 'relative', width: '210mm', padding: '40px', background: 'white', color: 'black', margin: '20px auto', fontFamily: 'sans-serif'}} onClick={e => e.stopPropagation()}>
                            <style>{\`@media print { .no-print, .sidebar, .top-nav, .glass-panel, .modal-overlay { display: none !important; } @page { size: A4 portrait; margin: 0; } body { background: white; } }\`}</style>
                            
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
        ` + content.substring(returnEnd);
    }
}

fs.writeFileSync('frontend/src/components/DailyRecapView.jsx', content);
console.log('DailyRecapView print menu updated successfully.');
