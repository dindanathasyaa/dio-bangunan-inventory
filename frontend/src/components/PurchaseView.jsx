import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PurchaseView = ({ user }) => {
    const navigate = useNavigate();
    const [supplierName, setSupplierName] = useState('');
    const [totalDebt, setTotalDebt] = useState('');
    const [loading, setLoading] = useState(false);

    const submitDebt = async (e) => {
        e.preventDefault();
        if (!supplierName || !totalDebt) return alert('Semua kolom harus diisi!');
        setLoading(true);
        try {
            // We use the purchases endpoint but we just pass an empty items array.
            // Wait, the API requires items loop to calculate total amount unless we change it.
            // Let's look at the existing API.
            // Oh, I can just write a quick fix in `erp_routes.js` or just send a dummy item.
            // Wait, the easiest is to add a direct route for creating a payable. 
            // Or use the purchases API with a dummy item.
            // No, the purchases API requires items to deduct/add stock. 
            // If the user says "tidak diperlukan katalog pembelian, isinya hanya berupa jumlah hutang owner ke pembeli (supplier), formnya hanya nama toko dan jumlah hutang".
            // I will create a new endpoint in `erp_routes.js` for adding Hutang Owner, or just use the existing one but bypass stock.
            // Let's just create a new API endpoint `/api/payables/new` first.
            
            await axios.post('http://localhost:5000/api/payables/new', {
                branch_id: user.role === 'MANAGER' ? user.branch_id : 1,
                supplier_name: supplierName,
                total_debt: totalDebt
            });

            alert('Hutang Pembelian Berhasil Dicatat!');
            setSupplierName('');
            setTotalDebt('');
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat menyimpan hutang.');
        } finally {
            setLoading(false);
        }
    };

    if (user.role !== 'OWNER') {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--danger-color)'}}>Akses Ditolak. Modul ini khusus Owner.</div>;
    }

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', width: '100%', padding: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0}}>Pencatatan Pembelian (Hutang)</h1>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>
            
            <div className="glass-panel">
                <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>Gunakan form ini untuk mencatat hutang Anda (Toko) kepada Supplier atau Pabrik atas pembelian barang.</p>
                
                <form onSubmit={submitDebt}>
                    <div className="form-group">
                        <label>Nama Toko / Supplier</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={supplierName} 
                            onChange={e => setSupplierName(e.target.value)} 
                            placeholder="Contoh: PT Semen Indonesia" 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Jumlah Hutang (Rp)</label>
                        <input 
                            type="number" 
                            className="input-field" 
                            value={totalDebt} 
                            onChange={e => setTotalDebt(e.target.value)} 
                            placeholder="Contoh: 5000000" 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} disabled={loading}>
                        {loading ? 'Memproses...' : 'Simpan Catatan Hutang'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PurchaseView;
