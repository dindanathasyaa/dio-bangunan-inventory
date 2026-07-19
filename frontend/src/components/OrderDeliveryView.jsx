import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderDeliveryView = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'NewOrder'); // NewOrder, OrderList, DeliveryBoard
    
    // Delivery / Order state
    const [deliveries, setDeliveries] = useState([]);
    
    // New Order State
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const branchQuery = user.role === 'MANAGER' ? `?branch_id=${user.branch_id}` : '';
            const res = await axios.get(`http://localhost:5000/api/inventory${branchQuery}`);
            setProducts(res.data);

            const delRes = await axios.get('http://localhost:5000/api/deliveries');
            setDeliveries(delRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = (product) => {
        const exist = cart.find(x => x.id === product.id);
        if (exist) {
            if (exist.qty >= product.stock) {
                alert('Stok tidak mencukupi!');
                return;
            }
            setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
        } else {
            if (product.stock <= 0) {
                alert('Stok habis!');
                return;
            }
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateQty = (id, val) => {
        const v = parseFloat(val);
        if(v <= 0) {
            setCart(cart.filter(x => x.id !== id));
            return;
        }
        const product = products.find(p => p.id === id);
        if (v > product.stock) {
            alert('Melebihi stok yang ada!');
            return;
        }
        setCart(cart.map(x => x.id === id ? { ...x, qty: v } : x));
    };

    const submitOrder = async () => {
        if (cart.length === 0) return alert('Keranjang kosong!');
        if (!customerName || !address) return alert('Nama dan Alamat harus diisi untuk pengantaran!');
        setLoading(true);
        try {
            const items = cart.map(item => ({
                product_id: item.product_id || item.id,
                qty: item.qty,
                price: item.price || 15000
            }));

            await axios.post('http://localhost:5000/api/orders', {
                branch_id: user.role === 'MANAGER' ? user.branch_id : 1,
                customer_name: customerName,
                phone,
                address,
                items
            });

            alert('Orderan berhasil dibuat dan masuk Jadwal Pengantaran!');
            setCart([]);
            setCustomerName('');
            setPhone('');
            setAddress('');
            fetchData();
            setView('DeliveryBoard');
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const updateDeliveryStatus = async (id, newStatus, currentDriver) => {
        const driver = prompt("Masukkan Nama Sopir/Kurir:", currentDriver || '');
        if (driver === null) return; // Cancelled

        try {
            await axios.put(`http://localhost:5000/api/deliveries/${id}`, {
                driver_name: driver,
                status: newStatus
            });
            fetchData();
        } catch(error) {
            console.error(error);
            alert('Gagal update status pengantaran');
        }
    };

    const totalAmount = cart.reduce((acc, item) => acc + ((item.price || 15000) * item.qty), 0);
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search));

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', height: '100%', gap: '24px', padding: '0 24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                <div style={{display: 'flex', gap: '16px'}}>
                    <button className={`btn ${view === 'NewOrder' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('NewOrder')}>Buat Orderan Baru</button>
                    <button className={`btn ${view === 'DeliveryBoard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('DeliveryBoard')}>Papan Jadwal Pengantaran</button>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>

            {view === 'NewOrder' && (
                <div style={{display: 'flex', gap: '24px', flex: 1}}>
                    <div className="glass-panel" style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                        <h2>Katalog Barang</h2>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Cari barang..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{marginBottom: '16px'}}
                        />
                        <div style={{overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'}}>
                            {filtered.map(p => (
                                <div key={p.id} style={{background: 'var(--item-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', cursor: 'pointer'}} onClick={() => addToCart(p)}>
                                    <div style={{fontWeight: 'bold', marginBottom: '8px'}}>{p.name}</div>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>[{p.sku}]</div>
                                    <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>Stok: {p.stock}</span>
                                        <span style={{background: 'rgba(234, 88, 12, 0.1)', padding: '4px 8px', borderRadius: '4px'}}>+ Tambah</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                        <h2>Detail Orderan (Telepon)</h2>
                        <div style={{flex: 1, overflowY: 'auto', marginBottom: '16px'}}>
                            {cart.map(c => (
                                <div key={c.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'var(--item-bg)', padding: '12px', borderRadius: '8px'}}>
                                    <div>
                                        <div style={{fontWeight: 'bold'}}>{c.name}</div>
                                        <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Rp {(c.price || 15000).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <input type="number" value={c.qty} onChange={e => updateQty(c.id, e.target.value)} style={{width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)'}} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', fontSize: '1.2rem'}}>
                                <span>Total:</span>
                                <span>Rp {totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="form-group">
                                <label>Nama Pelanggan</label>
                                <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>No Telepon</label>
                                <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Alamat Pengantaran</label>
                                <textarea className="input-field" rows="3" value={address} onChange={e => setAddress(e.target.value)} required></textarea>
                            </div>
                            <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} onClick={submitOrder} disabled={loading || cart.length === 0}>
                                {loading ? 'Memproses...' : 'Buat Orderan & Jadwalkan'}
                            </button>
                        </div>
                    </div>
                </div>
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
                                    <td style={{fontWeight: 'bold'}}>{d.customer_name} <br/><span style={{fontWeight: 'normal', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{d.phone}</span></td>
                                    <td style={{maxWidth: '250px'}}>{d.address}</td>
                                    <td>Rp {(d.total_amount || 0).toLocaleString()}</td>
                                    <td>{d.driver_name || '-'}</td>
                                    <td>
                                        <span className={`badge ${d.status === 'Terkirim' ? 'good' : d.status === 'Di Perjalanan' ? 'low' : ''}`} style={d.status === 'Menunggu' ? {background: '#64748b', color: 'white'} : {}}>
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
