import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import CategorySettings from './CategorySettings';
import Scanner from './Scanner';

// Import New ERP Modules
import SalesView from './SalesView';
import PurchaseView from './PurchaseView';
import OrderDeliveryView from './OrderDeliveryView';
import CashDebtView from './CashDebtView';
import StockAlertView from './StockAlertView';

const Dashboard = ({ user, setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inventory, setInventory] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    
    // Multi-Branch State
    const [activeBranch, setActiveBranch] = useState(user.role === 'OWNER' ? 'all' : user.branch_id);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/branches')
            .then(res => setBranches(res.data))
            .catch(console.error);
    }, []);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        fetchData();
    }, [user, activeBranch]);

    const fetchData = async () => {
        try {
            const invRes = await axios.get(`http://localhost:5000/api/inventory?branch_id=${activeBranch}`);
            setInventory(invRes.data);
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
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`} style={{position: 'relative'}}>
                {isSidebarOpen && (
                    <button className="sidebar-toggle" onClick={toggleSidebar} style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '8px', zIndex: 10 }}>❮</button>
                )}
                <div className="logo-container" style={{paddingBottom: '0', display: 'flex', justifyContent: 'center', marginTop: '32px'}}>
                    <img src="/logo-transparent.png" alt="Dio Bangunan Logo" className="logo-img" style={{width: '100%'}} />
                </div>
                
                <nav style={{display: 'flex', flexDirection: 'column', marginTop: '10px', flex: 1, overflowY: 'auto'}}>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '12px 20px', fontWeight: 'bold', letterSpacing: '1px'}}>MAIN MENU</div>
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Control Center</Link>
                    <Link to="/inventory" className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}>Data Inventory</Link>
                    <Link to="/sales" className={`nav-link ${location.pathname === '/sales' ? 'active' : ''}`}>Penjualan (Kasir)</Link>
                    <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>Order & Pengantaran</Link>
                    
                    {user.role === 'OWNER' && (
                        <>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '12px 20px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '16px'}}>MANAJEMEN OWNER</div>
                            <Link to="/purchases" className={`nav-link ${location.pathname === '/purchases' ? 'active' : ''}`}>Pembelian</Link>
                            <Link to="/cash" className={`nav-link ${location.pathname === '/cash' ? 'active' : ''}`}>Kas, Piutang, Hutang</Link>
                            <Link to="/categories" className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}>Pengaturan Kategori</Link>
                            <Link to="/scanner" className={`nav-link ${location.pathname === '/scanner' ? 'active' : ''}`}>Scan Barcode</Link>
                        </>
                    )}
                </nav>
                
                <div style={{marginTop: 'auto'}}>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                        <button className="role-badge" onClick={() => setShowSettingsModal(true)} style={{width: '100%', border: 'none', cursor: 'pointer', gap: '8px'}}>Setting</button>
                    </div>
                    <button className="btn btn-danger" style={{width: '100%'}} onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            
            <main className="main-content">
                {!isSidebarOpen && (
                    <button className="sidebar-toggle" onClick={toggleSidebar} style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', height: '40px', borderRadius: '8px', zIndex: 100 }}>☰</button>
                )}
                
                {/* Branch selector moved to ControlCenter */}

                <div style={{height: '100%', padding: '0 24px', paddingTop: '16px'}}>
                    <Routes>
                        <Route path="/" element={<ControlCenter user={user} activeBranch={activeBranch} setActiveBranch={setActiveBranch} branches={branches} />} />
                        <Route path="/inventory" element={<InventoryView inventory={inventory} refreshData={fetchData} user={user} activeBranch={activeBranch} branches={branches} />} />
                        <Route path="/sales" element={<SalesView user={user} activeBranch={activeBranch} />} />
                        <Route path="/orders" element={<OrderDeliveryView user={user} activeBranch={activeBranch} />} />
                        <Route path="/purchases" element={<PurchaseView user={user} activeBranch={activeBranch} branches={branches} />} />
                        <Route path="/cash" element={<CashDebtView user={user} activeBranch={activeBranch} branches={branches} />} />
                        <Route path="/categories" element={<CategorySettings />} />
                        <Route path="/scanner" element={<Scanner user={user} activeBranch={activeBranch} />} />
                        
                        <Route path="/alert-min" element={<StockAlertView type="min" activeBranch={activeBranch} />} />
                        <Route path="/alert-max" element={<StockAlertView type="max" activeBranch={activeBranch} />} />
                    </Routes>
                </div>
            </main>

            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{marginBottom: '24px', color: 'var(--text-primary)'}}>Pengaturan Akun</h2>
                        <div style={{background: 'var(--item-bg)', padding: '20px', borderRadius: '12px', marginBottom: '24px'}}>
                            <div style={{marginBottom: '12px'}}>
                                <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block'}}>Username</span>
                                <strong style={{color: 'var(--text-primary)', fontSize: '1.1rem'}}>{user.username}</strong>
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block'}}>Peran / Hak Akses</span>
                                <strong style={{color: 'var(--text-primary)', fontSize: '1.1rem'}}>{user.role === 'OWNER' ? 'Pemilik Toko' : 'Manajer Toko'}</strong>
                            </div>
                            {user.role === 'MANAGER' && (
                                <div>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block'}}>Lokasi Cabang</span>
                                    <strong style={{color: 'var(--text-primary)', fontSize: '1.1rem'}}>Toko {user.branch_id}</strong>
                                </div>
                            )}
                        </div>
                        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                            <button className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ControlCenter = ({ user, activeBranch, setActiveBranch, branches }) => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/dashboard/summary?branch_id=${activeBranch}`)
            .then(res => setSummary(res.data))
            .catch(console.error);
    }, [activeBranch]);

    if (!summary) return <div style={{padding: '32px', textAlign: 'center'}}>Memuat Control Center...</div>;

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <h1 style={{margin: 0}}>Control Center</h1>
                
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                    {user.role === 'OWNER' && (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{fontWeight: 'bold', color: 'white', marginRight: '12px', background: 'var(--secondary-color)', padding: '12px 16px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box'}}>Pilih Toko:</span>
                            <div className="custom-dropdown-container" style={{position: 'relative'}}>
                                <div 
                                    className={`custom-select-3d ${isBranchDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', color: 'var(--secondary-color)', border: '2px solid var(--secondary-color)', borderRadius: '8px', boxSizing: 'border-box', padding: '12px 16px'}}
                                >
                                    <span style={{fontWeight: 'bold'}}>{activeBranch === 'all' ? 'Semua Toko (Gabungan)' : branches.find(b => b.id.toString() === activeBranch.toString())?.name}</span>
                                    <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                                </div>
                                {isBranchDropdownOpen && (
                                    <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--secondary-color)', zIndex: 1000}}>
                                    <div 
                                        className={`custom-dropdown-item branch-dropdown-item ${activeBranch === 'all' ? 'selected' : ''}`}
                                        onClick={() => { setActiveBranch('all'); setIsBranchDropdownOpen(false); }}
                                        style={{fontWeight: '500'}}
                                    >
                                        Semua Toko (Gabungan)
                                    </div>
                                    {branches.map(b => (
                                        <div 
                                            key={b.id} 
                                            className={`custom-dropdown-item branch-dropdown-item ${activeBranch.toString() === b.id.toString() ? 'selected' : ''}`}
                                            onClick={() => { setActiveBranch(b.id); setIsBranchDropdownOpen(false); }}
                                            style={{fontWeight: '500'}}
                                        >
                                            {b.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                            </div>
                        </div>
                    )}

                    <div className="theme-toggle" onClick={() => {
                        const currentTheme = localStorage.getItem('theme') || 'dark';
                        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                        document.documentElement.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                        window.dispatchEvent(new Event('storage'));
                    }}>
                        <div className="icon">☀️</div>
                        <div className="icon">🌙</div>
                    </div>
                </div>
            </div>
            <p style={{color: 'var(--text-secondary)', marginBottom: '32px'}}>Ringkasan Cepat & Pintasan Navigasi</p>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
                {/* Row 1: Stock Alerts */}
                <div className="glass-panel" style={{borderTop: '4px solid var(--danger-color)', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => navigate('/alert-min')} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Stok Mau Habis</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>{summary.lowStockCount}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>📦</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Klik untuk melihat daftar beli.</div>
                </div>

                <div className="glass-panel" style={{borderTop: '4px solid var(--secondary-color)', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => navigate('/alert-max')} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Barang Overstock</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>{summary.overStockCount}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>⚠️</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Klik untuk daftar promo diskon.</div>
                </div>

                {/* Row 2: Deliveries & Debt */}
                <div className="glass-panel" style={{borderTop: '4px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => navigate('/orders', { state: { view: 'DeliveryBoard' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Jadwal Pengantaran</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b'}}>{summary.pendingDeliveries}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>🚚</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Menunggu diantar.</div>
                </div>

                {user.role === 'OWNER' && (
                    <>
                        <div className="glass-panel" style={{borderTop: '4px solid #10b981', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => navigate('/cash', { state: { view: 'Receivables' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Piutang (Pembeli Ngutang)</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981'}}>Rp {summary.totalReceivables.toLocaleString()}</div>
                                </div>
                                <div style={{fontSize: '2rem'}}>📒</div>
                            </div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Uang tertahan di pelanggan.</div>
                        </div>

                        <div className="glass-panel" style={{borderTop: '4px solid #ef4444', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => navigate('/cash', { state: { view: 'Payables' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Hutang Toko (Ke Supplier)</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444'}}>Rp {summary.totalPayables.toLocaleString()}</div>
                                </div>
                                <div style={{fontSize: '2rem'}}>🏢</div>
                            </div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Uang yang harus dibayar.</div>
                        </div>

                        <div className="glass-panel" style={{borderTop: '4px solid var(--primary-color)', cursor: 'pointer', transition: 'transform 0.2s', gridColumn: '1 / -1', background: 'linear-gradient(to right, rgba(234, 88, 12, 0.1), transparent)'}} onClick={() => navigate('/cash', { state: { view: 'CashFlow' } })}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div style={{color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px'}}>Saldo Kas Tunai Saat Ini</div>
                                    <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>Rp {summary.totalCash.toLocaleString()}</div>
                                    <div style={{color: 'var(--text-primary)', fontSize: '1rem', marginTop: '8px'}}>Total Profit Kotor: <span style={{fontWeight: 'bold'}}>Rp {summary.totalProfit.toLocaleString()}</span></div>
                                </div>
                                <div style={{fontSize: '4rem', opacity: 0.8}}>💰</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const InventoryView = ({ inventory, refreshData, user, activeBranch, branches }) => {
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddBranchDropdownOpen, setIsAddBranchDropdownOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Kategori');
    const [activeBarcode, setActiveBarcode] = useState(null);
    const [editingData, setEditingData] = useState(null);
    const [dbCategories, setDbCategories] = useState([]);
    const [unitType, setUnitType] = useState('Kodi/Lembar');
    const [kodi, setKodi] = useState(0);
    const [lembar, setLembar] = useState(0);

    const [newItem, setNewItem] = useState({
        sku: '',
        name: '',
        category_id: '',
        unit: 'Lembar',
        price: '',
        stock: 0,
        min_stock: 5,
        max_stock: 50,
        branch_id: user.role === 'MANAGER' ? user.branch_id : 1
    });

    useEffect(() => {
        axios.get('http://localhost:5000/api/categories').then(res => setDbCategories(res.data)).catch(err => console.error(err));
    }, []);

    const categories = ['Kategori', ...new Set(inventory.map(item => item.category))];
    const filteredInventory = inventory.filter(item => {
        const matchesCategory = selectedCategory === 'Kategori' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/inventory', { ...newItem, stock: lembar });
            setShowModal(false);
            setNewItem({ sku: '', name: '', category_id: '', unit: 'Lembar', price: '', stock: 0, min_stock: 5, max_stock: 50, branch_id: user.role === 'MANAGER' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1) });
            setKodi(0); setLembar(0);
            refreshData();
        } catch (err) {
            console.error(err);
            alert("Gagal menambahkan barang. SKU mungkin sudah ada.");
        }
    };

    const downloadBarcodePng = (sku) => {
        const svg = document.querySelector(`#barcode-modal-${sku} svg`) || document.getElementById(`barcode-modal-${sku}`);
        if (!svg) return alert("Barcode belum siap");
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 40;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20);
            
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `barcode-${sku}.png`;
            downloadLink.href = pngFile;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0}}>Data Inventory</h1>
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                    <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Cari barang atau kode..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{marginBottom: 0, minWidth: '250px'}}
                    />
                    <div className="custom-dropdown-container">
                        <div 
                            className={`custom-select-3d ${isDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{minWidth: '200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                        >
                            <span>{selectedCategory}</span>
                        </div>
                        {isDropdownOpen && (
                            <div className="custom-dropdown-menu">
                                {categories.map(cat => (
                                    <div 
                                        key={cat} 
                                        className={`custom-dropdown-item ${selectedCategory === cat ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(cat);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="btn-circle" onClick={() => setShowModal(true)}>+</button>
                </div>
            </div>
            
            <div className="glass-panel table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Barang</th>
                            <th>Kategori</th>
                            <th>Cabang</th>
                            <th>Stok</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map(item => {
                            const isEmpty = Math.floor(item.stock) === 0;
                            const isLow = Math.floor(item.stock) <= item.min_stock;
                            
                            let badgeClass = 'good';
                            let badgeText = 'Aman';
                            
                            if (isEmpty) {
                                badgeClass = 'danger';
                                badgeText = 'Habis';
                            } else if (isLow) {
                                badgeClass = 'warning';
                                badgeText = 'Kritis';
                            }

                            return (
                                <tr key={item.id}>
                                    <td style={{padding: '8px 16px'}}>
                                        <button className="btn-navy" onClick={() => setActiveBarcode(item.sku)}>
                                            Barcode
                                        </button>
                                    </td>
                                    <td style={{color: 'var(--text-primary)', fontWeight: '500'}}>{item.name}</td>
                                    <td><span style={{background: 'var(--border-color)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem'}}>{item.category}</span></td>
                                    <td>{item.branch_name}</td>
                                    <td style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{Math.floor(item.stock)}</td>
                                    <td><span className={`badge ${badgeClass}`}>{badgeText}</span></td>
                                    <td>
                                        <button className="btn-icon" style={{color: '#c2410c', fontWeight: '600', fontSize: '0.8rem', padding: '4px 12px', background: 'transparent', border: '1px solid #c2410c', borderRadius: '6px'}} onClick={() => setEditingData({...item})} title="Edit Data">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Barcode */}
            {activeBarcode && (
                <div className="modal-overlay" onClick={() => setActiveBarcode(null)}>
                    <div className="modal-content" style={{textAlign: 'center', width: 'auto', padding: '40px', position: 'relative'}} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" onClick={() => setActiveBarcode(null)} style={{position: 'absolute', top: '4px', right: '4px', fontSize: '1.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}} title="Tutup">
                            ✕
                        </button>
                        <h3 style={{marginBottom: '24px'}}>Kode Barcode: {activeBarcode}</h3>
                        <div id={`barcode-modal-${activeBarcode}`} style={{background: 'white', padding: '24px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px'}}>
                            <Barcode value={activeBarcode} height={60} width={2} fontSize={16} displayValue={true} background="transparent" margin={0} />
                        </div>
                        <div>
                            <button className="btn-icon" onClick={() => downloadBarcodePng(activeBarcode)} style={{fontSize: '2rem'}} title="Unduh format PNG">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Barang */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{marginBottom: '24px'}}>Tambah Barang Baru</h2>
                        <form onSubmit={handleAddItem}>
                            {user.role === 'OWNER' && (
                                <div className="form-group" style={{marginBottom: '16px'}}>
                                    <label>Toko Cabang</label>
                                    <div className="custom-dropdown-container" style={{position: 'relative'}}>
                                        <div 
                                            className={`custom-select-3d ${isAddBranchDropdownOpen ? 'active' : ''}`}
                                            onClick={() => setIsAddBranchDropdownOpen(!isAddBranchDropdownOpen)}
                                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box'}}
                                        >
                                            <span>{branches?.find(b => b.id === newItem.branch_id)?.name || 'Pilih Toko Cabang'}</span>
                                        </div>
                                        {isAddBranchDropdownOpen && (
                                            <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000}}>
                                                {branches && branches.map(b => (
                                                    <div 
                                                        key={b.id} 
                                                        className={`custom-dropdown-item ${newItem.branch_id === b.id ? 'selected' : ''}`}
                                                        onClick={() => { setNewItem({...newItem, branch_id: b.id}); setIsAddBranchDropdownOpen(false); }}
                                                        style={{fontWeight: '500'}}
                                                    >
                                                        {b.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="form-group" style={{marginBottom: '16px'}}><label>Kode Barang</label><input type="text" className="input-field" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} required /></div>
                            <div className="form-group" style={{marginBottom: '16px'}}><label>Nama Barang</label><input type="text" className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required /></div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Kategori</label>
                                <select className="input-field" value={newItem.category_id} onChange={e => {
                                    const catId = e.target.value;
                                    const cat = dbCategories.find(c => c.id === parseInt(catId));
                                    if(cat) setNewItem({...newItem, category_id: catId, min_stock: cat.min_stock, max_stock: cat.max_stock});
                                }} required>
                                    <option value="" disabled>Pilih Kategori</option>
                                    {dbCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '16px'}}>
                                <div className="form-group" style={{flex: 1}}><label>Harga Jual (Rp)</label><input type="number" className="input-field" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required /></div>
                                <div className="form-group" style={{flex: 1}}><label>Jenis Satuan Form</label><select className="input-field" value={unitType} onChange={e => setUnitType(e.target.value)}><option value="Kodi/Lembar">Kodi / Lembar</option><option value="Tunggal">Satuan Tunggal</option></select></div>
                            </div>
                            
                            {unitType === 'Kodi/Lembar' ? (
                                <div style={{display: 'flex', gap: '16px', background: 'var(--item-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                                    <div className="form-group" style={{flex: 1, marginBottom: 0}}><label>Stok (Kodi)</label><input type="number" className="input-field" value={kodi} onChange={e => {setKodi(e.target.value); setLembar(e.target.value*20);}} /></div>
                                    <div className="form-group" style={{flex: 1, marginBottom: 0}}><label>Stok (Lembar)</label><input type="number" className="input-field" value={lembar} onChange={e => {setLembar(e.target.value); setKodi(e.target.value/20);}} /></div>
                                </div>
                            ) : (
                                <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                                    <div className="form-group" style={{flex: 1}}><label>Satuan</label><input type="text" className="input-field" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required /></div>
                                    <div className="form-group" style={{flex: 1}}><label>Stok</label><input type="number" className="input-field" value={lembar} onChange={e => {setLembar(e.target.value);}} required /></div>
                                </div>
                            )}

                            <div style={{display: 'flex', gap: '16px'}}>
                                <div className="form-group" style={{flex: 1}}><label>Batas Minimum Stok</label><input type="number" className="input-field" value={newItem.min_stock} onChange={e => setNewItem({...newItem, min_stock: e.target.value})} required /></div>
                                <div className="form-group" style={{flex: 1}}><label>Batas Maksimal Stok</label><input type="number" className="input-field" value={newItem.max_stock} onChange={e => setNewItem({...newItem, max_stock: e.target.value})} required /></div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                                <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn" style={{flex: 1}}>Simpan Barang</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingData && (
                <div className="modal-overlay" onClick={() => setEditingData(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <h2>Edit Data Inventory</h2>
                            <button className="btn-icon" onClick={() => setEditingData(null)}>✕</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            axios.put(`http://localhost:5000/api/inventory/${editingData.id}`, {
                                name: editingData.name,
                                stock: editingData.stock,
                                min_stock: editingData.min_stock,
                                max_stock: editingData.max_stock
                            })
                            .then(() => {
                                refreshData();
                                setEditingData(null);
                            })
                            .catch(err => alert("Gagal update data!"));
                        }}>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Kode Barang</label>
                                <input type="text" className="input-field" value={editingData.sku} disabled style={{background: '#f3f4f6', cursor: 'not-allowed'}} />
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Nama Barang</label>
                                <input type="text" className="input-field" value={editingData.name} onChange={e => setEditingData({...editingData, name: e.target.value})} required />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px'}}>
                                <div className="form-group">
                                    <label>Stok Saat Ini</label>
                                    <input type="number" className="input-field" value={Number(editingData.stock)} onChange={e => setEditingData({...editingData, stock: parseInt(e.target.value)})} required />
                                </div>
                                <div className="form-group">
                                    <label>Batas Minimum</label>
                                    <input type="number" className="input-field" value={Number(editingData.min_stock)} onChange={e => setEditingData({...editingData, min_stock: parseInt(e.target.value)})} required />
                                </div>
                                <div className="form-group">
                                    <label>Batas Maksimum</label>
                                    <input type="number" className="input-field" value={Number(editingData.max_stock)} onChange={e => setEditingData({...editingData, max_stock: parseInt(e.target.value)})} required />
                                </div>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditingData(null)}>Batal</button>
                                <button type="submit" className="btn">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
