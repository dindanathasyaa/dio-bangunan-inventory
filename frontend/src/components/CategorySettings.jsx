import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategorySettings = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [minStock, setMinStock] = useState(5);
    const [maxStock, setMaxStock] = useState(50);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Large Units state
    const [largeUnits, setLargeUnits] = useState([]);
    const [unitName, setUnitName] = useState('');
    const [unitMultiplier, setUnitMultiplier] = useState(1);
    const [unitLoading, setUnitLoading] = useState(false);
    const [unitMessage, setUnitMessage] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLargeUnits = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/large_units');
            setLargeUnits(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchLargeUnits();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await axios.post('http://localhost:5000/api/categories', {
                name,
                min_stock: minStock,
                max_stock: maxStock
            });
            setMessage('Kategori berhasil ditambahkan!');
            setName('');
            setMinStock(5);
            setMaxStock(50);
            fetchCategories();
        } catch (error) {
            setMessage('Gagal menambahkan kategori');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, newMin, newMax) => {
        try {
            const cat = categories.find(c => c.id === id);
            await axios.put(`http://localhost:5000/api/categories/${id}`, {
                name: cat.name,
                min_stock: newMin,
                max_stock: newMax
            });
            fetchCategories();
            alert('Berhasil diperbarui');
        } catch (error) {
            console.error(error);
            alert('Gagal memperbarui');
        }
    };

    const handleUnitSubmit = async (e) => {
        e.preventDefault();
        setUnitLoading(true);
        setUnitMessage('');
        try {
            await axios.post('http://localhost:5000/api/large_units', {
                name: unitName,
                default_multiplier: unitMultiplier
            });
            setUnitMessage('Satuan besar berhasil ditambahkan!');
            setUnitName('');
            setUnitMultiplier(1);
            fetchLargeUnits();
        } catch (error) {
            setUnitMessage('Gagal menambahkan satuan besar');
            console.error(error);
        } finally {
            setUnitLoading(false);
        }
    };

    const handleUnitUpdate = async (id, newMultiplier) => {
        try {
            await axios.put(`http://localhost:5000/api/large_units/${id}`, {
                default_multiplier: newMultiplier
            });
            fetchLargeUnits();
            alert('Satuan berhasil diperbarui');
        } catch (error) {
            console.error(error);
            alert('Gagal memperbarui satuan');
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
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Batas Minimum Stok</label>
                    <input type="number" className="input-field" value={minStock} onChange={e => setMinStock(e.target.value)} required min="0" />
                </div>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Batas Maksimal Stok</label>
                    <input type="number" className="input-field" value={maxStock} onChange={e => setMaxStock(e.target.value)} required min="1" />
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
                        <th>Batas Minimum Stok</th>
                        <th>Batas Maksimal Stok</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td>{cat.name}</td>
                            <td>
                                <input type="number" className="input-field" defaultValue={cat.min_stock} id={`min-${cat.id}`} style={{width: '80px', padding: '4px 8px'}} />
                            </td>
                            <td>
                                <input type="number" className="input-field" defaultValue={cat.max_stock} id={`max-${cat.id}`} style={{width: '80px', padding: '4px 8px'}} />
                            </td>
                            <td>
                                <button className="btn btn-secondary" onClick={() => handleUpdate(cat.id, document.getElementById(`min-${cat.id}`).value, document.getElementById(`max-${cat.id}`).value)}>
                                    Simpan Perubahan
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{margin: '40px 0', borderColor: 'var(--border-color)'}} />

            <h2 style={{marginBottom: '20px', color: 'var(--text-primary)'}}>Pengaturan Satuan Besar</h2>
            
            <form onSubmit={handleUnitSubmit} style={{display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Nama Satuan</label>
                    <input type="text" className="input-field" value={unitName} onChange={e => setUnitName(e.target.value)} required placeholder="Misal: Gross, Bal" />
                </div>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Nilai Pengali (Isi)</label>
                    <input type="number" className="input-field" value={unitMultiplier} onChange={e => setUnitMultiplier(e.target.value)} required min="1" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={unitLoading}>
                    {unitLoading ? 'Menyimpan...' : 'Tambah Satuan'}
                </button>
            </form>
            
            {unitMessage && <div style={{marginBottom: '16px', color: 'var(--success-color)'}}>{unitMessage}</div>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Satuan</th>
                        <th>Nilai Pengali Default</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {largeUnits.map(unit => (
                        <tr key={unit.id}>
                            <td>{unit.id}</td>
                            <td>{unit.name}</td>
                            <td>
                                <input type="number" className="input-field" defaultValue={unit.default_multiplier} id={`multiplier-${unit.id}`} style={{width: '100px', padding: '4px 8px'}} />
                            </td>
                            <td>
                                <button className="btn btn-secondary" onClick={() => handleUnitUpdate(unit.id, document.getElementById(`multiplier-${unit.id}`).value)}>
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
