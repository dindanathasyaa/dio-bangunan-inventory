import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderDeliveryView = ({ user, activeBranch }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'NewOrder');

    // Delivery state
    const [deliveries, setDeliveries] = useState([]);

    // Inventory for item selection
    const [inventory, setInventory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    // New Order State
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [orderItems, setOrderItems] = useState([]); // [{product_id, name, unit, qty, price}]
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 4000);
    };

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

    useEffect(() => {
        fetchData();
    }, [activeBranch]);

    const fetchData = async () => {
        try {
            const [delRes, invRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/deliveries?branch_id=${activeBranch}`),
                axios.get(`http://localhost:5000/api/inventory?branch_id=${activeBranch === 'all' ? 1 : activeBranch}`)
            ]);
            setDeliveries(delRes.data);
            setInventory(invRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addItem = (invItem) => {
        const existing = orderItems.find(i => i.product_id === invItem.product_id);
        if (existing) {
            setOrderItems(orderItems.map(i =>
                i.product_id === invItem.product_id ? { ...i, qty: i.qty + 1 } : i
            ));
        } else {
            setOrderItems([...orderItems, {
                product_id: invItem.product_id,
                name: invItem.name,
                unit: invItem.unit,
                qty: 1,
                price: invItem.price
            }]);
        }
        setSearchQuery('');
        setShowItemDropdown(false);
    };

    const removeItem = (product_id) => {
        setOrderItems(orderItems.filter(i => i.product_id !== product_id));
    };

    const updateItemQty = (product_id, val) => {
        if (val === '') {
            setOrderItems(orderItems.map(i => i.product_id === product_id ? { ...i, qty: '' } : i));
            return;
        }
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 0) return;
        setOrderItems(orderItems.map(i => i.product_id === product_id ? { ...i, qty } : i));
    };

    const updateItemPrice = (product_id, price) => {
        setOrderItems(orderItems.map(i => i.product_id === product_id ? { ...i, price: Number(price) } : i));
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 8);

    const submitOrder = async (e) => {
        e.preventDefault();
        if (!customerName || !address) return showToast('Nama dan Alamat harus diisi!', 'warning');
        
        // Remove empty or 0 qty items before submitting
        const validItems = orderItems.filter(i => i.qty !== '' && parseInt(i.qty) > 0);
        if (validItems.length === 0) return showToast('Tambahkan minimal 1 barang dengan jumlah valid!', 'warning');
        
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/orders', {
                branch_id: user.role === 'ADMIN' ? user.branch_id : (activeBranch === 'all' ? 1 : activeBranch),
                customer_name: customerName,
                phone,
                address,
                total_amount: validItems.reduce((sum, item) => sum + (parseInt(item.qty) * item.price), 0),
                items: validItems.map(i => ({
                    product_id: i.product_id,
                    qty: parseInt(i.qty),
                    price: i.price
                }))
            });
            showToast('Orderan berhasil dibuat dan masuk Jadwal Pengantaran!', 'success');
            setCustomerName(''); setPhone(''); setAddress(''); setOrderItems([]);
            fetchData();
            setView('DeliveryBoard');
        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan saat menyimpan orderan.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateDeliveryStatus = async (id, newStatus, currentDriver) => {
        const driver = prompt("Masukkan Nama Sopir/Kurir:", currentDriver || '');
        if (driver === null) return;
        try {
            await axios.put(`http://localhost:5000/api/deliveries/${id}`, { driver_name: driver, status: newStatus });
            fetchData();
        } catch (error) {
            console.error(error);
            showToast('Gagal update status pengantaran', 'error');
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', height: '100%', gap: '24px', padding: '0 24px' }}>
            {toast.show && (
                <div className="modal-overlay" onClick={() => setToast(prev => ({ ...prev, show: false }))} style={{backdropFilter: 'blur(8px)', alignItems: 'center', zIndex: 999999}}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f59e0b' : '#dc2626',
                        border: toast.type === 'success' ? '2px solid #059669' : toast.type === 'warning' ? '2px solid #d97706' : '2px solid #b91c1c',
                        color: '#ffffff',
                        padding: '32px 48px',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '5rem', lineHeight: '1' }}>
                            {toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : '✅'}
                        </div>
                        <h2 style={{ margin: 0, fontWeight: '700', fontSize: '1.5rem', color: 'white' }}>{toast.message}</h2>
                        <button 
                            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                width: '100%',
                                marginTop: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className={`btn ${view === 'NewOrder' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('NewOrder')}>Buat Orderan Baru</button>
                    <button className={`btn ${view === 'DeliveryBoard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('DeliveryBoard')}>Papan Jadwal Pengantaran</button>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>

            {view === 'NewOrder' && (
                <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

                    {/* Section 1: Info Pelanggan */}
                    <div className="glass-panel" style={{ width: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>👤 DATA PELANGGAN</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Nama Pelanggan</label>
                                <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Contoh: Bpk. Budi" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>No Telepon <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Opsional)</span></label>
                                <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contoh: 08123456789" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Alamat Pengantaran</label>
                                <input type="text" className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="Contoh: Jl. Merdeka No. 10" required />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Pilih Barang */}
                    <div className="glass-panel" style={{ width: '100%', boxSizing: 'border-box' }}>
                        <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>📦 DAFTAR BARANG PESANAN</h3>

                        {/* Search Barang */}
                        <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                            <label>Cari & Tambah Barang</label>
                            <input
                                type="text"
                                className="input-field"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowItemDropdown(true); }}
                                onFocus={() => setShowItemDropdown(true)}
                                placeholder="Ketik nama atau kode barang..."
                                autoComplete="off"
                            />
                            {showItemDropdown && searchQuery && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                    background: 'var(--card-bg)', border: '2px solid var(--primary-color)',
                                    borderRadius: '8px', marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                }}>
                                    {filteredInventory.length === 0 ? (
                                        <div style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Barang tidak ditemukan</div>
                                    ) : filteredInventory.map(item => (
                                        <div
                                            key={item.product_id}
                                            onClick={() => addItem(item)}
                                            style={{
                                                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--item-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.sku} • Stok: {item.stock} {item.unit}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Rp {(item.price || 0).toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/{item.unit}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tabel Barang Dipilih */}
                        {orderItems.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Nama Barang</th>
                                            <th>Satuan</th>
                                            <th style={{ width: '130px' }}>Jumlah</th>
                                            <th style={{ width: '180px' }}>Harga Satuan (Rp)</th>
                                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                                            <th style={{ width: '60px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.map(item => (
                                            <tr key={item.product_id}>
                                                <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        value={item.qty}
                                                        min="1"
                                                        step="1"
                                                        onChange={e => updateItemQty(item.product_id, e.target.value)}
                                                        style={{ margin: 0, padding: '6px 10px', width: '100%' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        value={Number(item.price).toLocaleString('en-US')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            if (!isNaN(raw)) updateItemPrice(item.product_id, raw);
                                                        }}
                                                        style={{ margin: 0, padding: '6px 10px', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                    Rp {(item.qty * item.price).toLocaleString()}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button type="button" onClick={() => removeItem(item.product_id)}
                                                        style={{ background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '1rem' }}>
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Total */}
                                <div style={{
                                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                                    marginTop: '16px', padding: '16px 20px',
                                    background: 'var(--item-bg)', borderRadius: '8px',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Tagihan:</span>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                        Rp {totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center', padding: '40px',
                                color: 'var(--text-secondary)', background: 'var(--item-bg)',
                                borderRadius: '8px', border: '2px dashed var(--border-color)'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
                                <div style={{ fontWeight: '500' }}>Belum ada barang dipilih</div>
                                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Cari nama atau kode barang di atas untuk menambahkan</div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? '⏳ Memproses...' : '🚚 Buat Orderan & Jadwalkan Kirim'}
                    </button>
                </form>
            )}

            {view === 'DeliveryBoard' && (
                <div className="glass-panel table-container">
                    <h2>Jadwal Pengantaran</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID Order</th>
                                <th>Pelanggan</th>
                                <th>Alamat</th>
                                <th>Total Tagihan</th>
                                <th>Sopir/Kurir</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map(d => (
                                <tr key={d.id}>
                                    <td>ORD-{d.order_id}</td>
                                    <td style={{ fontWeight: 'bold' }}>{d.customer_name} <br /><span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.phone}</span></td>
                                    <td style={{ maxWidth: '250px' }}>{d.address}</td>
                                    <td>Rp {(d.total_amount || 0).toLocaleString()}</td>
                                    <td>{d.driver_name || '-'}</td>
                                    <td>
                                        <span className={`badge ${d.status === 'Terkirim' ? 'good' : d.status === 'Di Perjalanan' ? 'low' : ''}`} style={d.status === 'Menunggu' ? { background: '#64748b', color: 'white' } : {}}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td>
                                        {d.status === 'Menunggu' && <button className="btn btn-secondary" onClick={() => updateDeliveryStatus(d.id, 'Di Perjalanan', d.driver_name)}>Kirim Sekarang</button>}
                                        {d.status === 'Di Perjalanan' && <button className="btn btn-primary" onClick={() => updateDeliveryStatus(d.id, 'Terkirim', d.driver_name)}>Tandai Selesai & Lunas</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderDeliveryView;
