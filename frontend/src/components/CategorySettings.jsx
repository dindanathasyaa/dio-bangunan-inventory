import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategorySettings = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [leadTime, setLeadTime] = useState(3);
    const [safetyStock, setSafetyStock] = useState(5);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await axios.post('http://localhost:5000/api/categories', {
                name,
                default_lead_time: leadTime,
                default_safety_stock: safetyStock
            });
            setMessage('Kategori berhasil ditambahkan!');
            setName('');
            setLeadTime(3);
            setSafetyStock(5);
            fetchCategories();
        } catch (error) {
            setMessage('Gagal menambahkan kategori');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, newLeadTime, newSafetyStock) => {
        try {
            const cat = categories.find(c => c.id === id);
            await axios.put(`http://localhost:5000/api/categories/${id}`, {
                name: cat.name,
                default_lead_time: newLeadTime,
                default_safety_stock: newSafetyStock
            });
            fetchCategories();
            alert('Berhasil diperbarui');
        } catch (error) {
            console.error(error);
            alert('Gagal memperbarui');
        }
    };

    return (
        <div className="glass-panel" style={{padding: '24px'}}>
            <h2 style={{marginBottom: '20px', color: 'var(--text-primary)'}}>Pengaturan Kategori & Parameter Inventory</h2>
            
            <form onSubmit={handleSubmit} style={{display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Nama Kategori</label>
                    <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Bahan Bangunan" />
                </div>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Waktu Tunggu Pengiriman / Lead Time (Hari)</label>
                    <input type="number" className="input-field" value={leadTime} onChange={e => setLeadTime(e.target.value)} required min="1" />
                </div>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Stok Cadangan Aman / Safety Stock</label>
                    <input type="number" className="input-field" value={safetyStock} onChange={e => setSafetyStock(e.target.value)} required min="1" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Tambah Kategori'}
                </button>
            </form>
            
            {message && <div style={{marginBottom: '16px', color: 'var(--success-color)'}}>{message}</div>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Kategori</th>
                        <th>Default Waktu Tunggu (Hari)</th>
                        <th>Default Stok Cadangan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td>{cat.name}</td>
                            <td>
                                <input type="number" className="input-field" defaultValue={cat.default_lead_time} id={`lt-${cat.id}`} style={{width: '80px', padding: '4px 8px'}} />
                            </td>
                            <td>
                                <input type="number" className="input-field" defaultValue={cat.default_safety_stock} id={`ss-${cat.id}`} style={{width: '80px', padding: '4px 8px'}} />
                            </td>
                            <td>
                                <button className="btn btn-secondary" onClick={() => handleUpdate(cat.id, document.getElementById(`lt-${cat.id}`).value, document.getElementById(`ss-${cat.id}`).value)}>
                                    Simpan Perubahan
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CategorySettings;
