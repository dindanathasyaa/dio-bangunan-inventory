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

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const branchQuery = user.role === 'MANAGER' ? `?branch_id=${user.branch_id}` : '';
            const invRes = await axios.get(`http://localhost:5000/api/inventory${branchQuery}`);
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
                
                {/* Theme Toggle Button */}
                <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 10, display: 'flex', background: 'var(--item-bg)', borderRadius: '30px', padding: '4px', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-color)' }}>
                    <button onClick={() => { if(theme !== 'light') toggleTheme() }} style={{ background: theme === 'light' ? 'var(--primary-color)' : 'transparent', border: 'none', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', fontSize: '1.2rem' }}>☀️</button>
                    <button onClick={() => { if(theme !== 'dark') toggleTheme() }} style={{ background: theme === 'dark' ? 'var(--primary-color)' : 'transparent', border: 'none', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', fontSize: '1.2rem' }}>🌙</button>
                </div>

                <div style={{height: '100%', paddingTop: '40px'}}>
                    <Routes>
                        <Route path="/" element={<ControlCenter user={user} />} />
                        <Route path="/inventory" element={<InventoryView inventory={inventory} refreshData={fetchData} user={user} />} />
                        <Route path="/sales" element={<SalesView user={user} />} />
                        <Route path="/orders" element={<OrderDeliveryView user={user} />} />
                        <Route path="/purchases" element={<PurchaseView user={user} />} />
                        <Route path="/cash" element={<CashDebtView user={user} />} />
                        <Route path="/categories" element={<CategorySettings />} />
                        <Route path="/scanner" element={<Scanner user={user} />} />
                        
                        <Route path="/alert-min" element={<StockAlertView type="min" />} />
                        <Route path="/alert-max" element={<StockAlertView type="max" />} />
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

const ControlCenter = ({ user }) => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/dashboard/summary')
            .then(res => setSummary(res.data))
            .catch(console.error);
    }, []);

    if (!summary) return <div style={{padding: '32px', textAlign: 'center'}}>Memuat Control Center...</div>;

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            <h1 style={{marginBottom: '8px'}}>Control Center</h1>
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

// ... keep InventoryView as is
const InventoryView = ({ inventory, refreshData, user }) => {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Semua');
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

    const categories = ['Semua', ...new Set(inventory.map(item => item.category))];
    const filteredInventory = inventory.filter(item => {
        const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/inventory', { ...newItem, stock: lembar });
            setShowModal(false);
            setNewItem({ sku: '', name: '', category_id: '', unit: 'Lembar', price: '', stock: 0, min_stock: 5, max_stock: 50, branch_id: user.role === 'MANAGER' ? user.branch_id : 1 });
            setKodi(0); setLembar(0);
            refreshData();
        } catch (err) {
            console.error(err);
            alert("Gagal menambahkan barang. SKU mungkin sudah ada.");
        }
    };

    const downloadBarcode = (sku) => {
        const svg = document.querySelector(`#barcode-${sku} svg`) || document.getElementById(`barcode-${sku}`);
        if (!svg) return alert("Barcode belum siap");
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `barcode-${sku}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <div style={{position: 'relative'}}>
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{minWidth: '240px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--item-bg)', border: isDropdownOpen ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px 20px', borderRadius: '14px', outline: 'none'}}>
                            <span style={{fontWeight: '600'}}>{selectedCategory}</span>
                            <span>▼</span>
                        </button>
                        {isDropdownOpen && (
                            <div style={{position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '10px', background: 'var(--item-bg)', borderRadius: '14px', zIndex: 50, border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }} style={{padding: '14px 20px', background: 'transparent', color: 'var(--text-primary)', border: 'none', textAlign: 'left', cursor: 'pointer'}}>{cat}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="btn" style={{width: '45px', height: '45px', borderRadius: '50%', padding: 0, fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={() => setShowModal(true)}>+</button>
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
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map(item => {
                            const isLow = item.stock <= item.min_stock;
                            return (
                                <tr key={item.id}>
                                    <td style={{padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div id={`barcode-${item.sku}`} style={{background: 'white', padding: '4px 8px', borderRadius: '4px', display: 'inline-block'}}>
                                            <Barcode value={item.sku} height={30} width={1.5} fontSize={12} displayValue={true} background="transparent" margin={0} />
                                        </div>
                                        <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '0.8rem'}} onClick={() => downloadBarcode(item.sku)} title="Unduh Barcode">⬇️</button>
                                    </td>
                                    <td style={{color: 'var(--text-primary)', fontWeight: '500'}}>{item.name}</td>
                                    <td><span style={{background: 'var(--border-color)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem'}}>{item.category}</span></td>
                                    <td>{item.branch_name}</td>
                                    <td style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{item.stock}</td>
                                    <td><span className={`badge ${isLow ? 'low' : 'good'}`}>{isLow ? 'Stok Kritis' : 'Aman'}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah Barang */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{marginBottom: '24px'}}>Tambah Barang Baru</h2>
                        <form onSubmit={handleAddItem}>
                            <div className="form-group"><label>SKU</label><input type="text" className="input-field" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} required /></div>
                            <div className="form-group"><label>Nama Barang</label><input type="text" className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required /></div>
                            <div className="form-group">
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
        </div>
    );
};

export default Dashboard;
