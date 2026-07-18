import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

const Dashboard = ({ user, setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inventory, setInventory] = useState([]);
    const [dss, setDss] = useState({ ropAlerts: [], transferSuggestions: [] });

    // Theme state
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const branchQuery = user.role === 'MANAGER' ? `?branch_id=${user.branch_id}` : '';
            const invRes = await axios.get(`http://localhost:5000/api/inventory${branchQuery}`);
            setInventory(invRes.data);

            const dssRes = await axios.get('http://localhost:5000/api/dss/recommendations');
            let alerts = dssRes.data.ropAlerts;
            let transfers = dssRes.data.transferSuggestions;
            if (user.role === 'MANAGER') {
                alerts = alerts.filter(a => a.branch_id === user.branch_id);
                transfers = transfers.filter(t => t.to_branch === user.branch_id || t.from_branch === user.branch_id);
            }
            setDss({ ropAlerts: alerts, transferSuggestions: transfers });
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="app-container">
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="logo-container">
                    <img src="/logo.jpeg" alt="Dio Bangunan Logo" className="logo-img" />
                </div>
                
                <nav style={{display: 'flex', flexDirection: 'column', marginTop: '32px'}}>
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/inventory" className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}>
                        Data Inventory
                    </Link>
                </nav>
                
                <div style={{marginTop: 'auto'}}>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                        <div className="role-badge" style={{width: '100%'}}>
                            {user.role === 'OWNER' ? 'Pemilik' : `Manajer Toko ${user.branch_id}`}
                        </div>
                    </div>
                    <button className="btn btn-danger" style={{width: '100%'}} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    ☰
                </button>
                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                
                <Routes>
                    <Route path="/" element={<DSSView dss={dss} user={user} />} />
                    <Route path="/inventory" element={<InventoryView inventory={inventory} refreshData={fetchData} user={user} />} />
                </Routes>
            </main>
        </div>
    );
};

const DSSView = ({ dss, user }) => (
    <div style={{animation: 'fadeIn 0.5s ease-out'}}>
        <div className="dashboard-grid">
            <div className="glass-panel" style={{borderTop: '4px solid var(--primary-color)'}}>
                <div className="metric-card">
                    <span className="metric-label">Peringatan ROP (Reorder Point)</span>
                    <span className="metric-value" style={{color: 'var(--primary-color)'}}>{dss.ropAlerts.length}</span>
                    <p style={{fontSize: '0.875rem'}}>Item berada di bawah batas aman.</p>
                </div>
            </div>
            <div className="glass-panel" style={{borderTop: '4px solid var(--secondary-color)'}}>
                <div className="metric-card">
                    <span className="metric-label">Saran Transfer Antar-Cabang</span>
                    <span className="metric-value" style={{color: 'var(--secondary-color)'}}>{dss.transferSuggestions.length}</span>
                    <p style={{fontSize: '0.875rem'}}>Peluang efisiensi (Smart Transfer).</p>
                </div>
            </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
            {dss.ropAlerts.length > 0 && (
                <div className="glass-panel alert-card critical">
                    <h3 style={{color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        Peringatan Restok (ROP Tercapai)
                    </h3>
                    <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        {dss.ropAlerts.map((alert, idx) => (
                            <div key={idx} style={{background: 'var(--item-bg)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)'}}>
                                <div style={{fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>
                                    [{alert.sku}] {alert.product_name} <span style={{color: 'var(--text-secondary)', fontWeight: 'normal'}}>di {alert.branch_name}</span>
                                </div>
                                <div style={{color: 'var(--danger-color)', fontSize: '0.9rem'}}>{alert.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dss.transferSuggestions.length > 0 && (
                <div className="glass-panel alert-card success">
                    <h3 style={{color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        Rekomendasi Transfer Cerdas
                    </h3>
                    <p style={{marginBottom: '20px'}}>Terdapat kelebihan stok di cabang lain yang bisa dialokasikan untuk menutupi kekurangan.</p>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px'}}>
                        {dss.transferSuggestions.map((ts, idx) => (
                            <div key={idx} style={{background: 'var(--item-bg)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px'}}>
                                <div style={{color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '12px'}}>[{ts.sku}] {ts.product_name}</div>
                                <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5'}}>{ts.message}</div>
                                {user.role === 'OWNER' && (
                                    <button className="btn btn-secondary" style={{width: '100%', fontSize: '0.9rem'}}>Setujui Transfer</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {dss.ropAlerts.length === 0 && dss.transferSuggestions.length === 0 && (
                <div className="glass-panel" style={{textAlign: 'center', padding: '64px'}}>
                    <div style={{fontSize: '4rem', marginBottom: '16px'}}>✅</div>
                    <h3 style={{color: 'var(--text-primary)'}}>Semua Stok Terkendali</h3>
                    <p>Tidak ada peringatan ROP atau saran transfer saat ini.</p>
                </div>
            )}
        </div>
    </div>
);

const InventoryView = ({ inventory, refreshData, user }) => {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({
        sku: '',
        name: '',
        category: '',
        price: '',
        stock: '',
        branch_id: user.role === 'MANAGER' ? user.branch_id : 1
    });

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/inventory', newItem);
            setShowModal(false);
            setNewItem({ sku: '', name: '', category: '', price: '', stock: '', branch_id: user.role === 'MANAGER' ? user.branch_id : 1 });
            refreshData();
        } catch (err) {
            console.error("Error adding item:", err);
            alert("Gagal menambahkan barang. SKU mungkin sudah ada.");
        }
    };

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1>Data Inventory</h1>
                <button className="btn" onClick={() => setShowModal(true)}>+ Tambah Barang</button>
            </div>
            
            <div className="glass-panel table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nama Barang</th>
                            <th>Kategori</th>
                            <th>Cabang</th>
                            <th>Stok</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => {
                            const rop = (5 * item.lead_time_days) + item.safety_stock;
                            const isLow = item.stock <= rop;
                            return (
                                <tr key={item.id}>
                                    <td style={{fontWeight: '600', color: 'var(--primary-color)'}}>{item.sku}</td>
                                    <td style={{color: 'var(--text-primary)'}}>{item.name}</td>
                                    <td><span style={{background: 'var(--border-color)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-primary)'}}>{item.category}</span></td>
                                    <td style={{color: 'var(--text-primary)'}}>{item.branch_name}</td>
                                    <td style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)'}}>{item.stock}</td>
                                    <td>
                                        <span className={`badge ${isLow ? 'low' : 'good'}`}>
                                            {isLow ? 'Stok Kritis' : 'Aman'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add Item Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{marginBottom: '24px'}}>Tambah Barang Baru</h2>
                        <form onSubmit={handleAddItem}>
                            <div className="form-group">
                                <label>SKU (Kode Barang)</label>
                                <input type="text" className="input-field" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Nama Barang</label>
                                <input type="text" className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <input type="text" className="input-field" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} required />
                            </div>
                            <div style={{display: 'flex', gap: '16px'}}>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Harga Jual (Rp)</label>
                                    <input type="number" className="input-field" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                                </div>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Stok Awal</label>
                                    <input type="number" className="input-field" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} required />
                                </div>
                            </div>
                            
                            {user.role === 'OWNER' && (
                                <div className="form-group">
                                    <label>Lokasi Cabang</label>
                                    <select className="input-field" value={newItem.branch_id} onChange={e => setNewItem({...newItem, branch_id: e.target.value})}>
                                        <option value="1">Toko 1 (Pusat)</option>
                                        <option value="2">Toko 2 (Cabang)</option>
                                    </select>
                                </div>
                            )}

                            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                                <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn" style={{flex: 1}}>Simpan Barang</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
