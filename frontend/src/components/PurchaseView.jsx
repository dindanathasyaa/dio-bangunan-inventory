import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PurchaseView = ({ user, activeBranch, branches }) => {
    const navigate = useNavigate();
    const [selectedBranch, setSelectedBranch] = useState(activeBranch !== 'all' ? activeBranch : 1);
    const [supplierName, setSupplierName] = useState('');
    const [inventory, setInventory] = useState([]);
    const [cart, setCart] = useState([]);
    
    // Form for new item in cart
    const [selectedProductId, setSelectedProductId] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [qty, setQty] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [messageModal, setMessageModal] = useState('');

    useEffect(() => {
        fetchInventory();
    }, [selectedBranch, activeBranch]);

    const fetchInventory = async () => {
        const branchToFetch = user.role === 'MANAGER' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : selectedBranch);
        try {
            const res = await axios.get(`http://localhost:5000/api/inventory?branch_id=${branchToFetch}`);
            setInventory(res.data);
        } catch (error) {
            console.error("Gagal mengambil inventory:", error);
        }
    };

    const handleProductSelect = (e) => {
        const pId = e.target.value;
        setSelectedProductId(pId);
        if (pId) {
            const product = inventory.find(p => p.id.toString() === pId.toString());
            if (product && product.base_price) {
                setBuyPrice(product.base_price);
            } else if (product && product.price) {
                 // fallback if base_price is not in payload, though it should be. Wait, inventory API might not return base_price. Let's check!
                 // If not, we just leave it blank or 0
                 setBuyPrice('');
            }
        } else {
            setBuyPrice('');
        }
    };

    const addItemToCart = () => {
        if (!selectedProductId || !qty || !buyPrice) {
            return setMessageModal('Harap pilih barang, isi jumlah, dan harga beli.');
        }
        const product = inventory.find(p => p.id.toString() === selectedProductId.toString());
        if (!product) return;

        setCart([...cart, {
            product_id: product.id,
            name: product.name,
            unit: product.unit,
            qty: parseFloat(qty),
            buy_price: parseFloat(buyPrice)
        }]);

        // reset form
        setSelectedProductId('');
        setQty('');
        setBuyPrice('');
    };

    const removeCartItem = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const submitPurchase = async (paymentMethod) => {
        if (!supplierName) return setMessageModal('Nama Supplier harus diisi!');
        if (cart.length === 0) return setMessageModal('Keranjang pembelian masih kosong!');
        
        setLoading(true);
        try {
            const branchId = user.role === 'MANAGER' ? user.branch_id : (activeBranch !== 'all' ? activeBranch : selectedBranch);
            await axios.post('http://localhost:5000/api/purchases', {
                branch_id: branchId,
                supplier_name: supplierName,
                payment_method: paymentMethod, // 'Kredit' or 'Cash'
                items: cart
            });

            setMessageModal(paymentMethod === 'Cash' ? 'Data Pembelian Tunai Berhasil Dicatat!' : 'Catatan Hutang Berhasil Disimpan!');
            setSupplierName('');
            setCart([]);
        } catch (error) {
            console.error(error);
            setMessageModal('Terjadi kesalahan saat menyimpan pembelian.');
        } finally {
            setLoading(false);
        }
    };

    if (user.role !== 'OWNER') {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--danger-color)'}}>Akses Ditolak. Modul ini khusus Owner.</div>;
    }

    const totalPurchase = cart.reduce((acc, item) => acc + (item.qty * item.buy_price), 0);

    return (
        <div style={{animation: 'fadeIn 0.5s ease-out', width: '100%', padding: '24px'}}>
            {messageModal && (
                <div className="modal-overlay" onClick={() => setMessageModal('')} style={{zIndex: 9999}}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{textAlign: 'center', maxWidth: '400px'}}>
                        <h2 style={{color: 'var(--primary-color)', marginBottom: '16px'}}>Pemberitahuan</h2>
                        <p style={{fontSize: '1.1rem', marginBottom: '24px'}}>{messageModal}</p>
                        <button className="btn btn-primary" onClick={() => setMessageModal('')} style={{width: '100%'}}>Tutup</button>
                    </div>
                </div>
            )}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <h1 style={{margin: 0}}>Pencatatan Pembelian</h1>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>
            
            <div className="glass-panel" style={{marginBottom: '24px'}}>
                {user.role === 'OWNER' && activeBranch === 'all' && (
                    <div className="form-group" style={{marginBottom: '16px'}}>
                        <label>Toko Cabang Tujuan (Untuk Menambah Stok)</label>
                        <select className="input-field" value={selectedBranch} onChange={e => setSelectedBranch(parseInt(e.target.value))} required>
                            {branches && branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="form-group" style={{marginBottom: '16px'}}>
                    <label>Nama Toko / Supplier</label>
                    <input 
                        type="text" 
                        className="input-field" 
                        value={supplierName} 
                        onChange={e => setSupplierName(e.target.value)} 
                        placeholder="Contoh: PT Semen Indonesia" 
                        required 
                    />
                </div>
            </div>

            <div className="glass-panel" style={{marginBottom: '24px'}}>
                <h2>Daftar Barang Dibeli</h2>
                <div style={{display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap'}}>
                    <div className="form-group" style={{flex: '2', minWidth: '200px', marginBottom: 0, position: 'relative'}}>
                        <label>Pilih Barang</label>
                        <div 
                            className={`input-field custom-select-3d ${isProductDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--panel-bg)', color: 'var(--text-primary)'}}
                        >
                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {selectedProductId 
                                    ? (() => {
                                        const p = inventory.find(i => i.id.toString() === selectedProductId.toString());
                                        return p ? `${p.name} (${p.sku}) - Satuan: ${p.unit}` : '-- Pilih Barang dari Inventory --';
                                    })()
                                    : '-- Pilih Barang dari Inventory --'}
                            </span>
                            <span style={{fontSize: '0.8rem', marginLeft: '8px'}}>▼</span>
                        </div>
                        {isProductDropdownOpen && (
                            <div className="custom-dropdown-menu" style={{position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 1000, overflowY: 'auto', maxHeight: '300px'}}>
                                <div style={{padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: '#ffffff'}}>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        style={{marginBottom: 0, padding: '6px 12px', fontSize: '0.9rem'}}
                                        placeholder="Ketik untuk mencari barang..."
                                        value={productSearchTerm}
                                        onChange={e => setProductSearchTerm(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                                <div 
                                    className={`custom-dropdown-item ${!selectedProductId ? 'selected' : ''}`}
                                    onClick={() => { 
                                        handleProductSelect({target: {value: ''}}); 
                                        setIsProductDropdownOpen(false);
                                        setProductSearchTerm('');
                                    }}
                                    style={{padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)'}}
                                >
                                    -- Pilih Barang dari Inventory --
                                </div>
                                {inventory.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())).map(p => (
                                    <div 
                                        key={p.id}
                                        className={`custom-dropdown-item ${selectedProductId.toString() === p.id.toString() ? 'selected' : ''}`}
                                        onClick={() => { 
                                            handleProductSelect({target: {value: p.id}}); 
                                            setIsProductDropdownOpen(false);
                                            setProductSearchTerm('');
                                        }}
                                        style={{padding: '10px 12px', cursor: 'pointer'}}
                                    >
                                        {p.name} ({p.sku}) - Satuan: {p.unit}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="form-group" style={{flex: '1', minWidth: '100px', marginBottom: 0}}>
                        <label>Jumlah</label>
                        <input type="number" className="input-field" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" min="0" step="any" />
                    </div>
                    <div className="form-group" style={{flex: '1.5', minWidth: '150px', marginBottom: 0}}>
                        <label>Harga Beli (Satuan)</label>
                        <input type="number" className="input-field" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="Rp" min="0" />
                    </div>
                    <button className="btn btn-secondary" onClick={addItemToCart} style={{padding: '12px 24px'}}>+ Tambah</button>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama Barang</th>
                                <th>Jumlah</th>
                                <th>Harga Satuan</th>
                                <th style={{textAlign: 'right'}}>Subtotal</th>
                                <th style={{textAlign: 'center'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.qty} {item.unit}</td>
                                    <td>Rp {item.buy_price.toLocaleString()}</td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold'}}>Rp {(item.qty * item.buy_price).toLocaleString()}</td>
                                    <td style={{textAlign: 'center'}}>
                                        <button className="btn btn-danger" style={{padding: '4px 12px'}} onClick={() => removeCartItem(idx)}>Hapus</button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center'}}>Belum ada barang di keranjang</td>
                                </tr>
                            )}
                        </tbody>
                        {cart.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>Total Pembelian:</td>
                                    <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>Rp {totalPurchase.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <div style={{display: 'flex', gap: '16px', justifyContent: 'flex-end'}}>
                <button className="btn btn-outline" style={{padding: '16px 24px', fontSize: '1.1rem'}} onClick={() => submitPurchase('Kredit')} disabled={loading}>
                    {loading ? 'Memproses...' : 'Simpan Catatan Hutang'}
                </button>
                <button className="btn btn-primary" style={{padding: '16px 24px', fontSize: '1.1rem'}} onClick={() => submitPurchase('Cash')} disabled={loading}>
                    {loading ? 'Memproses...' : 'Simpan Data Pembelian (Lunas)'}
                </button>
            </div>
        </div>
    );
};

export default PurchaseView;
