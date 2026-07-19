import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
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
                <div className="logo-container" style={{paddingBottom: '20px'}}>
                    <img src="/logo-v2.jpeg" alt="Dio Bangunan Logo" className="logo-img" style={{maxWidth: '220px'}} />
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
                
                <Routes>
                    <Route path="/" element={<DSSView dss={dss} user={user} theme={theme} toggleTheme={toggleTheme} />} />
                    <Route path="/inventory" element={<InventoryView inventory={inventory} refreshData={fetchData} user={user} />} />
                </Routes>
            </main>
        </div>
    );
};

const DSSView = ({ dss, user, theme, toggleTheme }) => (
    <div style={{animation: 'fadeIn 0.5s ease-out'}}>
        {/* Theme Toggle (Dashboard Only) */}
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', background: 'var(--item-bg)', borderRadius: '30px', padding: '4px', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-color)' }}>
            <button 
                onClick={() => { if(theme !== 'light') toggleTheme() }} 
                style={{ background: theme === 'light' ? 'var(--primary-color)' : 'transparent', color: theme === 'light' ? 'white' : 'var(--text-primary)', border: 'none', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.3s' }}>
                ☀️ Light
            </button>
            <button 
                onClick={() => { if(theme !== 'dark') toggleTheme() }} 
                style={{ background: theme === 'dark' ? 'var(--primary-color)' : 'transparent', color: theme === 'dark' ? 'white' : 'var(--text-primary)', border: 'none', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.3s' }}>
                🌙 Dark
            </button>
        </div>

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [newItem, setNewItem] = useState({
        sku: '',
        name: '',
        category: '',
        price: '',
        stock: '',
        branch_id: user.role === 'MANAGER' ? user.branch_id : 1
    });

    const categories = ['Semua', ...new Set(inventory.map(item => item.category))];
    
    const filteredInventory = selectedCategory === 'Semua' 
        ? inventory 
        : inventory.filter(item => item.category === selectedCategory);

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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'}}>
                <h1 style={{margin: 0}}>Data Inventory</h1>
                
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                    {/* Custom Interactive Dropdown */}
                    <div style={{position: 'relative'}}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                marginBottom: 0, 
                                minWidth: '240px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                background: 'var(--item-bg)', 
                                border: isDropdownOpen ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                                color: 'var(--text-primary)',
                                padding: '12px 20px',
                                borderRadius: '14px',
                                boxShadow: isDropdownOpen ? '0 6px 20px rgba(234, 88, 12, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease-in-out',
                                outline: 'none'
                            }}
                        >
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '12px'}}>
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                                <span style={{fontWeight: '600', fontSize: '1.05rem'}}>{selectedCategory}</span>
                            </div>
                            <div style={{transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </button>
                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute', 
                                top: '100%', 
                                left: 0, 
                                right: 0, 
                                marginTop: '10px', 
                                background: 'var(--item-bg)', 
                                borderRadius: '14px', 
                                boxShadow: '0 12px 30px rgba(0,0,0,0.15)', 
                                zIndex: 50,
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                                        style={{
                                            padding: '14px 20px',
                                            background: selectedCategory === cat ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                                            color: selectedCategory === cat ? 'var(--primary-color)' : 'var(--text-primary)',
                                            border: 'none',
                                            borderLeft: selectedCategory === cat ? '4px solid var(--primary-color)' : '4px solid transparent',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: selectedCategory === cat ? '700' : '500',
                                            fontSize: '1rem'
                                        }}
                                        onMouseEnter={(e) => { if(selectedCategory !== cat) e.target.style.background = 'rgba(0, 0, 0, 0.03)' }}
                                        onMouseLeave={(e) => { if(selectedCategory !== cat) e.target.style.background = 'transparent' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        className="btn" 
                        style={{width: '45px', height: '45px', borderRadius: '50%', padding: 0, fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)'}} 
                        onClick={() => setShowModal(true)} 
                        title="Tambah Barang"
                    >
                        +
                    </button>
                </div>
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
                        {filteredInventory.map(item => {
                            const rop = (5 * item.lead_time_days) + item.safety_stock;
                            const isLow = item.stock <= rop;
                            return (
                                <tr key={item.id}>
                                    <td style={{padding: '8px 16px'}}>
                                        <div style={{background: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                            <Barcode value={item.sku} height={30} width={1.5} fontSize={12} displayValue={true} background="transparent" margin={0} />
                                        </div>
                                    </td>
                                    <td style={{color: 'var(--text-primary)', fontWeight: '500'}}>{item.name}</td>
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
                                {newItem.sku && (
                                    <div style={{marginTop: '12px', display: 'flex', justifyContent: 'center', background: 'white', padding: '12px', borderRadius: '8px'}}>
                                        <Barcode value={newItem.sku} height={50} displayValue={true} background="transparent" />
                                    </div>
                                )}
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
