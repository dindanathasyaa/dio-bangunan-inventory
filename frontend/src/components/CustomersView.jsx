import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomersView = ({ user }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.phone && c.phone.includes(search))
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', height: '100%', gap: '24px', padding: '0 24px', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h2 style={{margin: 0}}>👥 Buku Pelanggan & Titip Dana</h2>
                <div style={{display: 'flex', gap: '12px'}}>
                    <div className="search-bar" style={{width: '300px'}}>
                        <input type="text" placeholder="Cari nama atau no HP..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={fetchCustomers}>🔄 Segarkan</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', paddingBottom: '20px' }}>
                {loading ? (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px'}}>Memuat data...</div>
                ) : filtered.length === 0 ? (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
                        <div style={{fontSize: '3rem', marginBottom: '16px'}}>📭</div>
                        Belum ada data pelanggan.
                    </div>
                ) : (
                    filtered.map(c => (
                        <div key={c.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1.4rem' }}>{c.name}</h3>
                                <div style={{color: 'var(--text-secondary)', fontSize: '0.95rem'}}>📞 {c.phone || '-'}</div>
                            </div>
                            
                            <div style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Titipan Dana (Saldo)</div>
                                <div style={{ fontWeight: 'bold', fontSize: '2rem', color: 'var(--primary-color)' }}>
                                    Rp {Number(c.balance).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomersView;
