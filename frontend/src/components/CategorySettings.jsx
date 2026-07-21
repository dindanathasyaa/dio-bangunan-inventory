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
    
    // Small Units state
    const [smallUnits, setSmallUnits] = useState([]);
    const [smallUnitName, setSmallUnitName] = useState('');
    const [smallUnitLoading, setSmallUnitLoading] = useState(false);
    const [smallUnitMessage, setSmallUnitMessage] = useState('');

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

    const fetchSmallUnits = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/small_units');
            setSmallUnits(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchLargeUnits();
        fetchSmallUnits();
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

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/categories/${id}`);
            fetchCategories();
            alert('Kategori berhasil dihapus');
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert('Gagal menghapus kategori');
            }
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

    const handleSmallUnitSubmit = async (e) => {
        e.preventDefault();
        setSmallUnitLoading(true);
        setSmallUnitMessage('');
        try {
            await axios.post('http://localhost:5000/api/small_units', {
                name: smallUnitName
            });
            setSmallUnitMessage('Satuan tunggal berhasil ditambahkan!');
            setSmallUnitName('');
            fetchSmallUnits();
        } catch (error) {
            setSmallUnitMessage('Gagal menambahkan satuan tunggal');
            console.error(error);
        } finally {
            setSmallUnitLoading(false);
        }
    };

    const handleSmallUnitUpdate = async (id, newName) => {
        try {
            await axios.put(`http://localhost:5000/api/small_units/${id}`, {
                name: newName
            });
            fetchSmallUnits();
            alert('Satuan tunggal berhasil diperbarui');
        } catch (error) {
            console.error(error);
            alert('Gagal memperbarui satuan tunggal');
        }
    };

    const handleDeleteLargeUnit = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus satuan besar ini?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/large_units/${id}`);
            fetchLargeUnits();
            alert('Satuan besar berhasil dihapus');
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus satuan besar');
        }
    };

    const handleDeleteSmallUnit = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus satuan tunggal ini?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/small_units/${id}`);
            fetchSmallUnits();
            alert('Satuan tunggal berhasil dihapus');
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus satuan tunggal');
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
                            <td style={{display: 'flex', gap: '8px'}}>
                                <button className="btn btn-secondary" onClick={() => handleUpdate(cat.id, document.getElementById(`min-${cat.id}`).value, document.getElementById(`max-${cat.id}`).value)}>
                                    Simpan
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteCategory(cat.id)} style={{background: 'var(--danger-color, #ef4444)', color: 'white'}}>
                                    Hapus
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
                            <td style={{display: 'flex', gap: '8px'}}>
                                <button className="btn btn-secondary" onClick={() => handleUnitUpdate(unit.id, document.getElementById(`multiplier-${unit.id}`).value)}>
                                    Simpan
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteLargeUnit(unit.id)} style={{background: 'var(--danger-color, #ef4444)', color: 'white'}}>
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{margin: '40px 0', borderColor: 'var(--border-color)'}} />

            <h2 style={{marginBottom: '20px', color: 'var(--text-primary)'}}>Pengaturan Satuan Tunggal</h2>
            
            <form onSubmit={handleSmallUnitSubmit} style={{display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div>
                    <label style={{display: 'block', color: 'var(--text-secondary)', marginBottom: '8px'}}>Nama Satuan Tunggal</label>
                    <input type="text" className="input-field" value={smallUnitName} onChange={e => setSmallUnitName(e.target.value)} required placeholder="Misal: Lembar, Pcs, Buah" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={smallUnitLoading}>
                    {smallUnitLoading ? 'Menyimpan...' : 'Tambah Satuan Tunggal'}
                </button>
            </form>
            
            {smallUnitMessage && <div style={{marginBottom: '16px', color: 'var(--success-color)'}}>{smallUnitMessage}</div>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Satuan Tunggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {smallUnits.map(unit => (
                        <tr key={unit.id}>
                            <td>{unit.id}</td>
                            <td>
                                <input type="text" className="input-field" defaultValue={unit.name} id={`small-unit-name-${unit.id}`} style={{width: '200px', padding: '4px 8px'}} />
                            </td>
                            <td style={{display: 'flex', gap: '8px'}}>
                                <button className="btn btn-secondary" onClick={() => handleSmallUnitUpdate(unit.id, document.getElementById(`small-unit-name-${unit.id}`).value)}>
                                    Simpan
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteSmallUnit(unit.id)} style={{background: 'var(--danger-color, #ef4444)', color: 'white'}}>
                                    Hapus
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
