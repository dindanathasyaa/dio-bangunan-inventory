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
            const dssRes = await axios.get(`/api/dss/recommendations?branch_id=${activeBranch}`);
            if (type === 'min') {
                setAlerts(dssRes.data.ropAlerts.sort((a, b) => a.current_stock - b.current_stock));
            } else if (type === 'max') {
                setAlerts(dssRes.data.transferSuggestions.sort((a, b) => b.current_stock - a.current_stock));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-wrapper" style={{animation: 'fadeIn 0.5s ease-out'}}>
            <div className="flex-responsive" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0, lineHeight: '1.2'}}>{type === 'min' ? 'Peringatan Stok Minimum (Habis)' : 'Peringatan Stok Maksimum (Overstock)'}</h1>
                <button className="btn btn-outline" style={{padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap'}} onClick={() => navigate('/')}>Kembali ke Dashboard</button>
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
                                <th style={{ width: '15%' }}>Kode Barang</th>
                                <th style={{ width: '25%' }}>Nama Barang</th>
                                <th style={{ width: '15%' }}>Cabang</th>
                                <th style={{ textAlign: 'center', width: '15%' }}>{type === 'min' ? 'Stok (Batas Min)' : 'Stok (Batas Max)'}</th>
                                <th style={{ width: '30%' }}>Saran / Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.sku}</td>
                                    <td>{item.product_name}</td>
                                    <td>{item.branch_name || item.from_branch_name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{fontWeight: 'bold'}}>{type === 'min' ? Math.max(0, Math.floor(Number(item.current_stock))) : Math.floor(Number(item.current_stock) || item.suggested_qty)}</span>
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
