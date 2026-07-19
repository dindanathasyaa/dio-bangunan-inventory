import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderDeliveryView = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'NewOrder'); // NewOrder, DeliveryBoard
    
    // Delivery state
    const [deliveries, setDeliveries] = useState([]);
    
    // New Order State
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const delRes = await axios.get('http://localhost:5000/api/deliveries');
            setDeliveries(delRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const submitOrder = async (e) => {
        e.preventDefault();
        if (!customerName || !address || !totalAmount) return alert('Nama, Alamat, dan Total Tagihan harus diisi!');
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/orders/simple', {
                branch_id: user.role === 'MANAGER' ? user.branch_id : 1,
                customer_name: customerName,
                phone,
                address,
                total_amount: totalAmount
            });

            alert('Orderan berhasil dibuat dan masuk Jadwal Pengantaran!');
            setCustomerName('');
            setPhone('');
            setAddress('');
            setTotalAmount('');
            fetchData();
            setView('DeliveryBoard');
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat menyimpan orderan.');
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
                <div style={{width: '100%'}}>
                    <div className="glass-panel">
                        <h2 style={{marginBottom: '24px'}}>Input Orderan & Pengantaran</h2>
                        <form onSubmit={submitOrder}>
                            <div className="form-group">
                                <label>Nama Pelanggan</label>
                                <input type="text" className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Contoh: Bpk. Budi" required />
                            </div>
                            <div className="form-group">
                                <label>No Telepon (Opsional)</label>
                                <input type="text" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contoh: 08123456789" />
                            </div>
                            <div className="form-group">
                                <label>Alamat Pengantaran</label>
                                <textarea className="input-field" rows="3" value={address} onChange={e => setAddress(e.target.value)} placeholder="Contoh: Jl. Merdeka No. 10" required></textarea>
                            </div>
                            <div className="form-group">
                                <label>Total Tagihan (Rp)</label>
                                <input type="number" className="input-field" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Contoh: 1500000" required />
                            </div>
                            <button className="btn btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem'}} type="submit" disabled={loading}>
                                {loading ? 'Memproses...' : 'Buat Orderan & Jadwalkan Kirim'}
                            </button>
                        </form>
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
