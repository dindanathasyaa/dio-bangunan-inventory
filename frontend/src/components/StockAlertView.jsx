import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StockAlertView = ({ type, activeBranch }) => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, [type, activeBranch]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const dssRes = await axios.get(`http://localhost:5000/api/dss/recommendations?branch_id=${activeBranch}`);
            if (type === 'min') {
                setAlerts(dssRes.data.ropAlerts);
            } else if (type === 'max') {
                setAlerts(dssRes.data.transferSuggestions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', padding: '0 24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0}}>{type === 'min' ? 'Peringatan Stok Minimum (Habis)' : 'Peringatan Stok Maksimum (Overstock)'}</h1>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>

            <div className="glass-panel table-container">
                {loading ? (
                    <div style={{padding: '32px', textAlign: 'center'}}>Memuat data...</div>
                ) : alerts.length === 0 ? (
                    <div style={{padding: '32px', textAlign: 'center'}}>Tidak ada peringatan saat ini.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ whiteSpace: 'nowrap', width: '15%' }}>Kode Barang</th>
                                <th style={{ width: '25%' }}>Nama Barang</th>
                                <th style={{ whiteSpace: 'nowrap', width: '15%' }}>Cabang</th>
                                <th style={{ whiteSpace: 'nowrap', textAlign: 'center', width: '15%' }}>{type === 'min' ? 'Stok (Batas Min)' : 'Stok (Batas Max)'}</th>
                                <th style={{ width: '30%' }}>Saran / Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{item.sku}</td>
                                    <td>{item.product_name}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{item.branch_name || item.from_branch_name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{fontWeight: 'bold'}}>{type === 'min' ? Number(item.current_stock) : (Number(item.current_stock) || item.suggested_qty)}</span>
                                    </td>
                                    <td style={{color: type === 'min' ? 'var(--danger-color)' : 'var(--secondary-color)'}}>{item.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default StockAlertView;
