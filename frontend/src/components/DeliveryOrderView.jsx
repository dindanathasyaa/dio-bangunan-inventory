import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeliveryOrderView = ({ user, activeBranch, branches }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    useEffect(() => {
        fetchDO();
    }, [activeBranch]);

    const fetchDO = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/sales/delivery-orders?branch_id=${activeBranch}`);
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch DO:', error);
            showToast('Gagal memuat data DO', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsTaken = (id) => {
        setConfirmModal({ show: true, orderId: id });
    };

    const confirmMarkAsTaken = async () => {
        const id = confirmModal.orderId;
        setConfirmModal({ show: false, orderId: null });
        try {
            await axios.put(`http://localhost:5000/api/sales/${id}/delivery-status`, {
                delivery_status: 'Sudah Diambil'
            });
            showToast('Barang berhasil diambil. Stok telah terpotong.', 'success');
            fetchDO();
        } catch (error) {
            console.error('Failed to update DO:', error);
            showToast(error.response?.data?.error || 'Gagal mengubah status', 'error');
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', height: '100%', gap: '24px', padding: '0 24px', paddingBottom: '40px' }}>
            {toast.show && (
                <div className="modal-overlay" onClick={() => setToast({ ...toast, show: false })} style={{backdropFilter: 'blur(8px)', alignItems: 'center', zIndex: 999999}}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#dc2626' : '#3b82f6',
                        color: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center'
                    }}>
                        <h3 style={{margin: '0 0 16px 0'}}>{toast.message}</h3>
                        <button className="btn btn-outline" style={{borderColor: 'white', color: 'white'}} onClick={() => setToast({ ...toast, show: false })}>Tutup</button>
                    </div>
                </div>
            )}

            {confirmModal.show && (
                <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, orderId: null })} style={{backdropFilter: 'blur(8px)', alignItems: 'center', zIndex: 999999}}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{
                        padding: '32px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px'
                    }}>
                        <div style={{fontSize: '3rem', marginBottom: '16px'}}>📦</div>
                        <h3 style={{margin: '0 0 12px 0'}}>Konfirmasi Pengambilan</h3>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>
                            Tandai barang ini sebagai <strong>Sudah Diambil</strong>?<br/>
                            Stok akan dipotong sekarang secara otomatis.
                        </p>
                        <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
                            <button className="btn btn-outline" onClick={() => setConfirmModal({ show: false, orderId: null })}>Batal</button>
                            <button className="btn btn-primary" onClick={confirmMarkAsTaken}>Ya, Sudah Diambil</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h2 style={{margin: 0}}>📦 Daftar DO (Barang Titipan)</h2>
                <div style={{display: 'flex', gap: '12px'}}>
                    <button className="btn btn-primary" onClick={fetchDO}>🔄</button>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali</button>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div style={{textAlign: 'center', padding: '40px'}}>Memuat data...</div>
                ) : orders.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
                        <div style={{fontSize: '3rem', marginBottom: '16px'}}>📦</div>
                        Belum ada pesanan DO (Titip Barang).
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tanggal Transaksi</th>
                                    <th>No. Nota</th>
                                    <th>Pelanggan</th>
                                    <th>Barang</th>
                                    <th>Total Nilai</th>
                                    <th>Status Pembayaran</th>
                                    <th style={{textAlign: 'center'}}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                    return (
                                        <tr key={order.id}>
                                            <td>{new Date(order.created_at).toLocaleString('id-ID')}</td>
                                            <td><strong>SR{order.id}</strong></td>
                                            <td>{order.customer_name || 'Umum'}</td>
                                            <td>
                                                <ul style={{margin: 0, paddingLeft: '20px'}}>
                                                    {items?.map((item, idx) => (
                                                        <li key={idx}>{item.name} - {item.qty} {item.unit}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td>Rp {Number(order.total_amount).toLocaleString('id-ID')}</td>
                                            <td>
                                                <span className={`status-badge ${order.payment_method === 'Cash' ? 'success' : 'warning'}`}>
                                                    {order.payment_method === 'Cash' ? 'Lunas (Cash)' : 'Hutang'}
                                                </span>
                                            </td>
                                            <td style={{textAlign: 'center'}}>
                                                <button className="btn btn-primary" style={{padding: '8px 16px', fontSize: '0.9rem'}} onClick={() => handleMarkAsTaken(order.id)}>
                                                    Tandai Sudah Diambil
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrderView;
