import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import CategorySettings from './CategorySettings';
import Scanner from './Scanner';

// Import New ERP Modules
import SalesView from './SalesView';
import PurchaseView from './PurchaseView';
import OrderDeliveryView from './OrderDeliveryView';
import DeliveryOrderView from './DeliveryOrderView';
import CashDebtView from './CashDebtView';
import StockAlertView from './StockAlertView';
import DailyRecapView from './DailyRecapView';
import CurrencyInput from './CurrencyInput';
import CustomersView from './CustomersView';

const Dashboard = ({ user, setUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inventory, setInventory] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState(null);
    
    // Multi-Branch State
    const [activeBranch, setActiveBranch] = useState(user.branch_id === null ? 'all' : user.branch_id);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        axios.get('/api/branches')
            .then(res => setBranches(res.data))
            .catch(console.error);
    }, []);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        fetchData();
    }, [user, activeBranch]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        try {
            const invRes = await axios.get(`/api/inventory?branch_id=${activeBranch}`);
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
                <div className="logo-container" style={{paddingBottom: '0', display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '0'}}>
                    <img src="/logo-transparent.png" alt="Dio Bangunan Logo" className="logo-img" style={{width: '80%', mixBlendMode: 'multiply', display: 'block'}} />
                </div>
                
                <nav style={{display: 'flex', flexDirection: 'column', marginTop: '4px', flex: 1, overflowY: 'auto', overflowX: 'hidden'}}>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '12px 20px', fontWeight: 'bold', letterSpacing: '1px'}}>MAIN MENU</div>
                    {user.role !== 'ADMIN' && <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Control Center</Link>}
                    {user.role !== 'ADMIN' && <Link to="/inventory" className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}>Data Inventory</Link>}
                    <Link to="/sales" className={`nav-link ${location.pathname === '/sales' ? 'active' : ''}`}>Penjualan (Kasir)</Link>
                    <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>Order & Pengantaran</Link>
                    <Link to="/delivery-orders" className={`nav-link ${location.pathname === '/delivery-orders' ? 'active' : ''}`}>Daftar DO (Titipan)</Link>
                    <Link to="/customers" className={`nav-link ${location.pathname === '/customers' ? 'active' : ''}`}>Data Pelanggan</Link>
                    
                    {user.role === 'OWNER' && (
                        <>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '12px 20px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '16px'}}>MANAJEMEN OWNER</div>
                            <Link to="/rekap" className={`nav-link ${location.pathname === '/rekap' ? 'active' : ''}`}>Rekap Harian</Link>
                            <Link to="/purchases" className={`nav-link ${location.pathname === '/purchases' ? 'active' : ''}`}>Pembelian</Link>
                            <Link to="/cash" className={`nav-link ${location.pathname === '/cash' ? 'active' : ''}`}>Kas, Piutang, Hutang</Link>
                            <Link to="/categories" className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}>Pengaturan Kategori</Link>
                            <Link to="/scanner" className={`nav-link ${location.pathname === '/scanner' ? 'active' : ''}`}>Scan Barcode</Link>
                        </>
                    )}
                </nav>
                
                <div style={{marginTop: 'auto'}}>
                    {user.role === 'OWNER' && (
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '16px'}}>
                            <button className="role-badge" onClick={() => setShowSettingsModal(true)} style={{width: '100%', border: 'none', cursor: 'pointer', gap: '8px'}}>Setting</button>
                        </div>
                    )}
                    <button className="btn btn-danger" style={{width: '100%'}} onClick={handleLogout}>Logout</button>
                </div>
            </aside>
            
            <main className="main-content">
                {!isSidebarOpen && (
                    <button className="sidebar-toggle" onClick={toggleSidebar} style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', height: '40px', borderRadius: '8px', zIndex: 100 }}>☰</button>
                )}
                
                <div style={{height: '100%', padding: '0 24px', paddingTop: '16px'}}>
                    <Routes>
                        <Route path="/" element={user.role === 'ADMIN' ? <Navigate to="/sales" replace /> : <ControlCenter user={user} activeBranch={activeBranch} setActiveBranch={setActiveBranch} branches={branches} />} />
                        <Route path="/inventory" element={user.role === 'ADMIN' ? <Navigate to="/sales" replace /> : <InventoryView inventory={inventory} refreshData={fetchData} user={user} activeBranch={activeBranch} branches={branches} />} />
                        <Route path="/sales" element={<SalesView user={user} activeBranch={activeBranch} setActiveBranch={setActiveBranch} branches={branches} />} />
                        <Route path="/orders" element={<OrderDeliveryView user={user} activeBranch={activeBranch} />} />
                        <Route path="/delivery-orders" element={<DeliveryOrderView user={user} activeBranch={activeBranch} />} />
                        <Route path="/customers" element={<CustomersView user={user} />} />
                        <Route path="/rekap" element={<DailyRecapView user={user} activeBranch={activeBranch} />} />
                        <Route path="/purchases" element={<PurchaseView user={user} activeBranch={activeBranch} branches={branches} refreshData={fetchData} />} />
                        <Route path="/cash" element={<CashDebtView user={user} activeBranch={activeBranch} setActiveBranch={setActiveBranch} branches={branches} inventory={inventory} />} />
                        <Route path="/categories" element={<CategorySettings />} />
                        <Route path="/scanner" element={<Scanner user={user} activeBranch={activeBranch} />} />
                        
                        <Route path="/alert-min" element={<StockAlertView type="min" activeBranch={activeBranch} />} />
                        <Route path="/alert-max" element={<StockAlertView type="max" activeBranch={activeBranch} />} />
                    </Routes>
                </div>
            </main>

            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => { setShowSettingsModal(false); setPasswordMsg(null); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
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
                            {user.role === 'ADMIN' && (
                                <div>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block'}}>Lokasi Cabang</span>
                                    <strong style={{color: 'var(--text-primary)', fontSize: '1.1rem'}}>
                                        {branches.find(b => b.id === user.branch_id)?.name || `Toko ${user.branch_id}`}
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Ganti Password */}
                        <div style={{background: 'var(--item-bg)', padding: '20px', borderRadius: '12px', marginBottom: '24px'}}>
                            <h3 style={{marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)'}}>🔒 Ganti Password</h3>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px'}}>Password Lama</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Masukkan password lama"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    style={{width: '100%'}}
                                />
                            </div>
                            <div style={{marginBottom: '12px'}}>
                                <label style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px'}}>Password Baru</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Masukkan password baru"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    style={{width: '100%'}}
                                />
                            </div>
                            <div style={{marginBottom: '16px'}}>
                                <label style={{color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px'}}>Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Ulangi password baru"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    style={{width: '100%'}}
                                />
                            </div>
                            {passwordMsg && (
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    marginBottom: '12px',
                                    fontSize: '0.9rem',
                                    background: passwordMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: passwordMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                                    border: `1px solid ${passwordMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
                                }}>
                                    {passwordMsg.text}
                                </div>
                            )}
                            <button
                                className="btn btn-primary"
                                style={{width: '100%'}}
                                onClick={async () => {
                                    if (!oldPassword || !newPassword || !confirmPassword) {
                                        setPasswordMsg({ type: 'error', text: 'Semua kolom wajib diisi!' });
                                        return;
                                    }
                                    if (newPassword !== confirmPassword) {
                                        setPasswordMsg({ type: 'error', text: 'Password baru tidak cocok!' });
                                        return;
                                    }
                                    if (newPassword.length < 4) {
                                        setPasswordMsg({ type: 'error', text: 'Password minimal 4 karakter!' });
                                        return;
                                    }
                                    try {
                                        await axios.post('/api/change-password', {
                                            user_id: user.id,
                                            old_password: oldPassword,
                                            new_password: newPassword
                                        });
                                        setPasswordMsg({ type: 'success', text: '✅ Password berhasil diubah!' });
                                        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                                    } catch (err) {
                                        setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Gagal mengubah password' });
                                    }
                                }}
                            >
                                Simpan Password Baru
                            </button>
                        </div>

                        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                            <button className="btn btn-outline" onClick={() => { setShowSettingsModal(false); setPasswordMsg(null); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Tutup</button>
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
        axios.get(`/api/dashboard/summary?branch_id=${activeBranch}`)
            .then(res => setSummary(res.data))
            .catch(console.error);
    }, [activeBranch]);

    if (!summary) return <div style={{padding: '32px', textAlign: 'center'}}>Memuat Control Center...</div>;

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', paddingBottom: '40px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <h1 style={{margin: 0}}>Control Center</h1>
                
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                    {user.role === 'OWNER' && user.branch_id === null && (
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
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
                {/* Row 1: Stock Alerts */}
                <div className="glass-panel" style={{borderTop: '4px solid var(--danger-color)', cursor: 'pointer', transition: 'transform 0.2s', height: 'fit-content'}} onClick={() => navigate('/alert-min')} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Stok Akan Habis</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>{Math.floor(summary.lowStockCount)}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>📦</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Klik untuk melihat daftar beli.</div>
                    
                    {summary.aprioriLowStock && summary.aprioriLowStock.length > 0 && (
                        <div style={{marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px'}}>
                            <div style={{fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger-color)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>10 Prioritas (Paling Laku)</div>
                            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                {[...summary.aprioriLowStock].sort((a, b) => a.stock - b.stock).map((item, idx) => (
                                    <li key={idx} style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%'}}>
                                            <span style={{color: 'var(--primary-color)', marginRight: '4px'}}>#{idx + 1}</span> {item.name}
                                        </span>
                                        <span style={{fontWeight: 'bold', color: 'white', background: 'var(--danger-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'}}>Stok: {Math.max(0, Math.floor(item.stock))}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="glass-panel" style={{borderTop: '4px solid var(--secondary-color)', cursor: 'pointer', transition: 'transform 0.2s', height: 'fit-content'}} onClick={() => navigate('/alert-max')} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Stok Terlalu Banyak</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>{Math.floor(summary.overStockCount)}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>⚠️</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Klik untuk daftar promo diskon.</div>
                    
                    {summary.overStockList && summary.overStockList.length > 0 && (
                        <div style={{marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px'}}>
                            <div style={{fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>10 Terbanyak (Surplus)</div>
                            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                {summary.overStockList.map((item, idx) => (
                                    <li key={idx} style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%'}}>
                                            <span style={{color: 'var(--primary-color)', marginRight: '4px'}}>#{idx + 1}</span> {item.name}
                                        </span>
                                        <span style={{fontWeight: 'bold', color: 'white', background: 'var(--secondary-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'}}>Sisa: {Math.floor(item.stock)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px'}}>
                {user.role === 'OWNER' && (
                    <>
                        <div className="glass-panel" style={{borderTop: '4px solid #10b981', cursor: 'pointer', transition: 'transform 0.2s', height: 'fit-content'}} onClick={() => navigate('/cash', { state: { view: 'Receivables' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Piutang (Pembeli Ngutang)</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981'}}>Rp {Number(summary.totalReceivables || 0).toLocaleString('id-ID')}</div>
                                </div>
                                <div style={{fontSize: '2rem'}}>📒</div>
                            </div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Uang tertahan di pelanggan.</div>
                        </div>

                        <div className="glass-panel" style={{borderTop: '4px solid #ef4444', cursor: 'pointer', transition: 'transform 0.2s', height: 'fit-content'}} onClick={() => navigate('/cash', { state: { view: 'Payables' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Hutang Toko (Ke Supplier)</div>
                                    <div style={{fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444'}}>Rp {Number(summary.totalPayables || 0).toLocaleString('id-ID')}</div>
                                </div>
                                <div style={{fontSize: '2rem'}}>🏢</div>
                            </div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Uang yang harus dibayar.</div>
                        </div>
                    </>
                )}

                <div className="glass-panel" style={{borderTop: '4px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.2s', height: 'fit-content'}} onClick={() => navigate('/orders', { state: { view: 'DeliveryBoard' } })} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Jadwal Pengantaran</div>
                            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b'}}>{summary.pendingDeliveries?.toLocaleString()}</div>
                        </div>
                        <div style={{fontSize: '2rem'}}>🚚</div>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px'}}>Menunggu diantar.</div>
                </div>

                {user.role === 'OWNER' && (
                    <div className="glass-panel" style={{borderTop: '4px solid var(--primary-color)', cursor: 'pointer', transition: 'transform 0.2s', gridColumn: '1 / -1', background: 'linear-gradient(to right, rgba(234, 88, 12, 0.1), transparent)'}} onClick={() => navigate('/cash', { state: { view: 'CashFlow' } })}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                                <div style={{color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px'}}>Saldo Kas Tunai Saat Ini</div>
                                <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>Rp {Math.floor(Number(summary.totalCash || 0)).toLocaleString('id-ID')}</div>
                                <div style={{color: 'var(--text-primary)', fontSize: '1rem', marginTop: '8px'}}>Total Profit Kotor: <span style={{fontWeight: 'bold'}}>Rp {Math.floor(Number(summary.totalProfit || 0)).toLocaleString('id-ID')}</span></div>
                            </div>
                            <div style={{fontSize: '4rem', opacity: 0.8}}>💰</div>
                        </div>
                    </div>
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
    const [messageModal, setMessageModal] = useState('');
    const [dbCategories, setDbCategories] = useState([]);

    const [kodi, setKodi] = useState(0);
    const [lembar, setLembar] = useState(0);
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
    const [isMajemukDropdownOpen, setIsMajemukDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isSmallUnitDropdownOpen, setIsSmallUnitDropdownOpen] = useState(false);
    const [majemukType, setMajemukType] = useState('');
    const [majemukMultiplier, setMajemukMultiplier] = useState(20);
    const [largeUnitsList, setLargeUnitsList] = useState([]);
    const [smallUnitsList, setSmallUnitsList] = useState([]);

    const [newItem, setNewItem] = useState({
        sku: '',
        name: '',
        category_id: '',
        unit: '',
        price: '',
        base_price: '',
        stock: 0,
        min_stock: 5,
        max_stock: 50,
        branch_id: user.role === 'ADMIN' ? user.branch_id : 1,
        hasVariants: false,
        variants: [{ name: '', stock: 0 }],
        hasConversions: false,
        conversions: [{ name: '', multiplier: '', price: '' }]
    });

    useEffect(() => {
        if (messageModal) {
            const timer = setTimeout(() => setMessageModal(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [messageModal]);

    useEffect(() => {
        axios.get('/api/categories').then(res => setDbCategories(res.data)).catch(err => console.error(err));
        axios.get('/api/large_units').then(res => setLargeUnitsList(res.data)).catch(err => console.error(err));
        axios.get('/api/small_units').then(res => {
            setSmallUnitsList(res.data);
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (showModal && !newItem.sku) {
            axios.get('/api/next-sku')
                .then(res => setNewItem(prev => ({...prev, sku: res.data.sku})))
                .catch(console.error);
        }
    }, [showModal]);

    const categories = ['Kategori', ...new Set(inventory.map(item => item.category))];
    const filteredInventory = inventory.filter(item => {
        const matchesCategory = selectedCategory === 'Kategori' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (parseFloat(newItem.base_price) > parseFloat(newItem.price)) {
            setMessageModal("Periksa Kembali Harga");
            return;
        }

        let finalUnit = newItem.unit;

        try {
            await axios.post('/api/inventory', { ...newItem, unit: finalUnit, stock: lembar, variants: newItem.hasVariants ? newItem.variants : [], conversions: newItem.hasConversions ? newItem.conversions : [] });
            setShowModal(false);
            setNewItem({ sku: '', name: '', category_id: '', unit: '', price: '', base_price: '', stock: 0, min_stock: 5, max_stock: 50, branch_id: user.role === 'ADMIN' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : 1), hasVariants: false, variants: [{ name: '', stock: 0 }], hasConversions: false, conversions: [{ name: '', multiplier: '', price: '' }] });
            setMajemukType('');
            setMajemukMultiplier(20);
            setKodi(0); setLembar(0);
            refreshData();
            setMessageModal("Barang berhasil ditambahkan ke Data Inventory!");
        } catch (err) {
            console.error(err);
            alert("Gagal menambahkan barang. SKU mungkin sudah ada atau data tidak lengkap.");
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
            {messageModal && (
                <div style={{
                    position: 'fixed', top: '20px', left: '0', right: '0', margin: '0 auto', width: 'max-content',
                    background: messageModal.toLowerCase().includes('berhasil') ? '#4caf50' : '#f44336', color: 'white', padding: '16px 32px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, fontWeight: 'bold', fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideDown 0.3s ease-out'
                }}>
                    <span>{messageModal.toLowerCase().includes('berhasil') ? '✓' : '⚠️'}</span>
                    <span>{messageModal}</span>
                </div>
            )}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', paddingBottom: '20px' }}>
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
                        <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{flex: 1}}>
                                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.4' }}>{item.name} {item.variant_name ? `- ${item.variant_name}` : ''}</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{background: 'var(--border-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>🏷️ {item.category}</span>
                                        <span style={{background: 'var(--border-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>🏢 {item.branch_name}</span>
                                    </div>
                                </div>
                                <button className="btn-icon" style={{color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem', padding: '6px 14px', background: 'transparent', border: '1px solid var(--primary-color)', borderRadius: '6px', flexShrink: 0}} onClick={() => setActiveBarcode(item.sku)} title="Lihat Barcode">
                                    🔍 Barcode
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sisa Stok</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.8rem', color: 'var(--text-primary)' }}>{Math.floor(item.stock)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                    <span className={`badge ${badgeClass}`} style={{fontSize: '1.1rem', padding: '8px 16px', fontWeight: 'bold'}}>{badgeText}</span>
                                </div>
                            </div>
                            
                            <button className="btn-navy" style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '8px', background: '#c2410c', color: 'white', border: 'none' }} onClick={() => setEditingData({...item})}>
                                ✏️ Edit Data
                            </button>
                        </div>
                    );
                })}
                {filteredInventory.length === 0 && (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--panel-bg)', borderRadius: '12px'}}>
                        <div style={{fontSize: '3rem', marginBottom: '16px'}}>📦</div>
                        Tidak ada barang yang ditemukan.
                    </div>
                )}
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
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Nama Barang</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={newItem.name} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        const existing = inventory.find(item => item.name.toLowerCase() === val.toLowerCase());
                                        if (existing) {
                                            setNewItem({...newItem, name: val, price: existing.price, base_price: existing.base_price || 0, unit: existing.unit, category_id: dbCategories.find(c => c.name === existing.category)?.id || newItem.category_id});
                                        } else {
                                            setNewItem({...newItem, name: val});
                                        }
                                    }} 
                                    required 
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Kategori</label>
                                <div className="custom-dropdown-container" style={{position: 'relative', width: '100%', zIndex: isCategoryDropdownOpen ? 10 : 1}}>
                                    <div 
                                        className={`custom-select-3d ${isCategoryDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                                    >
                                        <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{dbCategories.find(c => c.id === parseInt(newItem.category_id))?.name || 'Pilih Kategori'}</span>
                                        <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                                    </div>
                                    {isCategoryDropdownOpen && (
                                        <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                            {dbCategories.map(cat => (
                                                <div 
                                                    key={cat.id}
                                                    className={`custom-dropdown-item ${newItem.category_id == cat.id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setNewItem({...newItem, category_id: cat.id, min_stock: cat.min_stock, max_stock: cat.max_stock});
                                                        setIsCategoryDropdownOpen(false);
                                                    }}
                                                    style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                                >
                                                    {cat.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group" style={{flex: 1}}>
                                    <label>Satuan (Terkecil)</label>
                                    <div className="custom-dropdown-container" style={{position: 'relative', width: '100%', zIndex: isSmallUnitDropdownOpen ? 10 : 1}}>
                                        <div 
                                            className={`custom-select-3d ${isSmallUnitDropdownOpen ? 'active' : ''}`}
                                            onClick={() => setIsSmallUnitDropdownOpen(!isSmallUnitDropdownOpen)}
                                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                                        >
                                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{newItem.unit || 'Pilih Satuan'}</span>
                                            <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                                        </div>
                                        {isSmallUnitDropdownOpen && (
                                            <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                                {smallUnitsList.map(unit => (
                                                    <div 
                                                        key={unit.name}
                                                        className={`custom-dropdown-item ${newItem.unit === unit.name ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setNewItem({...newItem, unit: unit.name});
                                                            setIsSmallUnitDropdownOpen(false);
                                                        }}
                                                        style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                                    >
                                                        {unit.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group" style={{flex: 1}}><label>Stok Barang Masuk</label><input type="number" className="input-field" value={lembar} onChange={e => {setLembar(e.target.value);}} required /></div>
                            </div>
                            
                            <div style={{marginBottom: '16px', background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                    <input type="checkbox" checked={newItem.hasConversions} onChange={e => setNewItem({...newItem, hasConversions: e.target.checked})} style={{transform: 'scale(1.2)'}} />
                                    Apakah barang ini bisa dijual dalam pecahan atau satuan ganda? (Opsional)
                                </label>
                                {newItem.hasConversions && (
                                    <div style={{marginTop: '16px'}}>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>Tambahkan opsi pecahan/satuan jual yang akan memotong dari stok induk di atas. (Contoh: 1/4 Meter dengan pengali 0.25, atau 1 Dus dengan pengali 12)</div>
                                        {newItem.conversions.map((conv, index) => (
                                            <div key={index} style={{display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-end', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
                                                <div className="form-group" style={{flex: 2, marginBottom: 0}}>
                                                    <label>Nama Satuan Jual</label>
                                                    <input type="text" className="input-field" value={conv.name} onChange={e => {
                                                        const newConvs = [...newItem.conversions];
                                                        newConvs[index].name = e.target.value;
                                                        setNewItem({...newItem, conversions: newConvs});
                                                    }} placeholder="Cth: 1/4 Meter atau 1 Dus" required />
                                                </div>
                                                <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                    <label>Pengali Stok</label>
                                                    <input type="number" step="0.01" className="input-field" value={conv.multiplier} onChange={e => {
                                                        const newConvs = [...newItem.conversions];
                                                        newConvs[index].multiplier = e.target.value;
                                                        setNewItem({...newItem, conversions: newConvs});
                                                    }} placeholder="Cth: 0.25 atau 12" required />
                                                </div>
                                                <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                    <label>Harga Jual (Rp)</label>
                                                    <input type="number" className="input-field" value={conv.price} onChange={e => {
                                                        const newConvs = [...newItem.conversions];
                                                        newConvs[index].price = e.target.value;
                                                        setNewItem({...newItem, conversions: newConvs});
                                                    }} placeholder="Cth: 5000" required />
                                                </div>
                                                {index > 0 && (
                                                    <button type="button" className="btn btn-danger" style={{padding: '12px 16px', marginBottom: '0'}} onClick={() => {
                                                        const newConvs = newItem.conversions.filter((_, i) => i !== index);
                                                        setNewItem({...newItem, conversions: newConvs});
                                                    }}>X</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-outline" style={{width: '100%', marginTop: '8px', borderStyle: 'dashed'}} onClick={() => {
                                            setNewItem({...newItem, conversions: [...newItem.conversions, {name: '', multiplier: '', price: ''}]});
                                        }}>+ Tambah Satuan Jual Lain</button>
                                    </div>
                                )}
                            </div>

                            <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group" style={{flex: 1}}><label>Batas Maksimal Stok</label><input type="number" className="input-field" value={newItem.max_stock} onChange={e => setNewItem({...newItem, max_stock: e.target.value})} required /></div>
                                <div className="form-group" style={{flex: 1}}><label>Batas Minimum Stok</label><input type="number" className="input-field" value={newItem.min_stock} onChange={e => setNewItem({...newItem, min_stock: e.target.value})} required /></div>
                            </div>

                            <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group" style={{flex: 1}}><label>Harga Jual (Rp)</label><CurrencyInput className="input-field" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required /></div>
                                <div className="form-group" style={{flex: 1}}><label>Modal Barang (Rp)</label><CurrencyInput className="input-field" value={newItem.base_price} onChange={e => setNewItem({...newItem, base_price: e.target.value})} required /></div>
                            </div>
                            
                            <div style={{marginBottom: '16px', background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                                    <input type="checkbox" checked={newItem.hasVariants} onChange={e => setNewItem({...newItem, hasVariants: e.target.checked})} style={{transform: 'scale(1.2)'}} />
                                    Apakah produk ini memiliki varian? (Misal: Warna, Ukuran)
                                </label>
                                {newItem.hasVariants && (
                                    <div style={{marginTop: '16px'}}>
                                        <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>Jika punya varian, stok akan dihitung per varian. Kolom "Stok" utama di atas akan diabaikan.</div>
                                        {newItem.variants.map((variant, index) => (
                                            <div key={index} style={{display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-end', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
                                                <div className="form-group" style={{flex: 2, marginBottom: 0}}>
                                                    <label>Nama Varian</label>
                                                    <input type="text" className="input-field" value={variant.name} onChange={e => {
                                                        const newVariants = [...newItem.variants];
                                                        newVariants[index].name = e.target.value;
                                                        setNewItem({...newItem, variants: newVariants});
                                                    }} placeholder="Cth: Merah 5kg" required />
                                                </div>
                                                <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                    <label>Stok Varian</label>
                                                    <input type="number" className="input-field" value={variant.stock === '' ? '' : variant.stock} onChange={e => {
                                                        const newVariants = [...newItem.variants];
                                                        newVariants[index].stock = e.target.value === '' ? '' : Number(e.target.value);
                                                        setNewItem({...newItem, variants: newVariants});
                                                    }} required />
                                                </div>
                                                <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                                    <label>Harga (Opsi)</label>
                                                    <input type="number" className="input-field" value={variant.price || ''} onChange={e => {
                                                        const newVariants = [...newItem.variants];
                                                        newVariants[index].price = e.target.value ? Number(e.target.value) : null;
                                                        setNewItem({...newItem, variants: newVariants});
                                                    }} placeholder="Kosong = Induk" />
                                                </div>
                                                {newItem.variants.length > 1 && (
                                                    <button type="button" className="btn-icon" style={{color: '#ef4444', padding: '10px', background: '#fee2e2', borderRadius: '6px'}} onClick={() => {
                                                        const newVariants = newItem.variants.filter((_, i) => i !== index);
                                                        setNewItem({...newItem, variants: newVariants});
                                                    }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-outline" style={{padding: '8px 16px', fontSize: '0.9rem', width: '100%', borderStyle: 'dashed'}} onClick={() => {
                                            setNewItem({...newItem, variants: [...newItem.variants, {name: '', stock: 0}]});
                                        }}>+ Tambah Varian Lain</button>
                                    </div>
                                )}
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
                            axios.put(`/api/inventory/${editingData.id}`, {
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
                                    <input type="number" className="input-field" value={editingData.stock === '' ? '' : Number(editingData.stock)} onChange={e => setEditingData({...editingData, stock: e.target.value === '' ? '' : parseInt(e.target.value)})} required />
                                </div>
                                <div className="form-group">
                                    <label>Batas Minimum</label>
                                    <input type="number" className="input-field" value={editingData.min_stock === '' ? '' : Number(editingData.min_stock)} onChange={e => setEditingData({...editingData, min_stock: e.target.value === '' ? '' : parseInt(e.target.value)})} required />
                                </div>
                                <div className="form-group">
                                    <label>Batas Maksimum</label>
                                    <input type="number" className="input-field" value={editingData.max_stock === '' ? '' : Number(editingData.max_stock)} onChange={e => setEditingData({...editingData, max_stock: e.target.value === '' ? '' : parseInt(e.target.value)})} required />
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
