import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ user }) => {
    const [scannedProduct, setScannedProduct] = useState(null);
    const [error, setError] = useState('');
    const [scannerInstance, setScannerInstance] = useState(null);

    const allowedEmails = ['dioorlando@gmail.com', 'dindanathasya943@gmail.com', 'dindanathasya943@gmai.com'];

    useEffect(() => {
        // Only allow specific emails
        if (!allowedEmails.includes(user.email)) {
            return;
        }

        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: {
                width: 250,
                height: 250,
            },
            fps: 5,
        });

        scanner.render(success, (err) => {
            // Ignore scan errors, they happen continuously until a barcode is found
        });
        
        setScannerInstance(scanner);

        async function success(result) {
            if (scanner) {
                scanner.pause(true); // pause scanning on success
            }
            try {
                // Fetch product details by SKU
                const res = await axios.get(`http://localhost:5000/api/inventory`);
                const product = res.data.find(p => p.sku === result);
                if (product) {
                    setScannedProduct(product);
                    setError('');
                } else {
                    setScannedProduct(null);
                    setError('Barang dengan SKU/Barcode ' + result + ' tidak ditemukan di database.');
                }
            } catch (e) {
                console.error(e);
                setError('Terjadi kesalahan sistem.');
            }
        }

        return () => {
            scanner.clear().catch(e => console.error(e));
        };
    }, [user.email]);

    const handleScanAnother = () => {
        setScannedProduct(null);
        setError('');
        if (scannerInstance) {
            scannerInstance.resume();
        }
    };

    if (!allowedEmails.includes(user.email)) {
        return (
            <div className="glass-panel" style={{padding: '40px', textAlign: 'center'}}>
                <div style={{fontSize: '4rem', marginBottom: '16px'}}>🔒</div>
                <h2 style={{color: 'var(--danger-color)'}}>Akses Ditolak</h2>
                <p>Fitur pemindai barcode eksklusif hanya untuk Owner / Akun yang terverifikasi.</p>
                <p>Email Anda: {user.email || 'Tidak diketahui'}</p>
            </div>
        );
    }

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', maxWidth: '800px', margin: '0 auto'}}>
            <h1 style={{marginBottom: '24px'}}>Barcode Scanner Eksklusif</h1>
            
            <div className="glass-panel" style={{padding: '24px', marginBottom: '24px'}}>
                <div id="reader" style={{width: '100%', borderRadius: '12px', overflow: 'hidden'}}></div>
                {!scannedProduct && <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '16px'}}>Arahkan kamera ke Barcode / QR Code barang (SKU)</p>}
            </div>

            {error && (
                <div className="glass-panel alert-card critical" style={{marginBottom: '24px'}}>
                    {error}
                    <button className="btn btn-secondary" style={{marginTop: '10px', width: '100%'}} onClick={handleScanAnother}>Coba Lagi</button>
                </div>
            )}

            {scannedProduct && (
                <div className="glass-panel" style={{padding: '24px', borderLeft: '4px solid var(--primary-color)'}}>
                    <h2 style={{color: 'var(--primary-color)', marginBottom: '16px'}}>Detail Barang</h2>
                    <table className="data-table">
                        <tbody>
                            <tr>
                                <td style={{fontWeight: 'bold', width: '30%'}}>Nama Barang</td>
                                <td>{scannedProduct.name}</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold'}}>SKU</td>
                                <td>{scannedProduct.sku}</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold'}}>Kategori</td>
                                <td>{scannedProduct.category}</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold'}}>Stok Total</td>
                                <td>{scannedProduct.stock} {scannedProduct.unit}</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold'}}>Lokasi / Cabang</td>
                                <td>{scannedProduct.branch_name}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <button className="btn btn-secondary" style={{marginTop: '20px', width: '100%'}} onClick={handleScanAnother}>
                        Scan Barang Lain
                    </button>
                </div>
            )}
        </div>
    );
};

export default Scanner;
