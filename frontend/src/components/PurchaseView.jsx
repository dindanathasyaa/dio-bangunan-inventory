import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PurchaseView = ({ user, activeBranch, branches, refreshData }) => {
    const navigate = useNavigate();
    const [selectedBranch, setSelectedBranch] = useState(activeBranch !== 'all' ? activeBranch : 1);
    const [supplierName, setSupplierName] = useState('');
    const [inventory, setInventory] = useState([]);
    const [cart, setCart] = useState([]);
    
    // Form for new item in cart
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [qty, setQty] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [messageModal, setMessageModal] = useState('');
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

    // New detailed item form state
    const [newItem, setNewItem] = useState({ sku: '', name: '', category_id: '', unit: 'Lembar', price: '', buy_price: '', qty: 0 });
    const [unitType, setUnitType] = useState('');
    const [majemukType, setMajemukType] = useState('');
    const [isMajemukDropdownOpen, setIsMajemukDropdownOpen] = useState(false);
    const [majemukMultiplier, setMajemukMultiplier] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
    const [dbCategories, setDbCategories] = useState([]);
    const largeUnitsList = [
        {name: 'Kodi', options: [20]},
        {name: 'Lusin', options: [12]},
        {name: 'Gross', options: [144]},
        {name: 'Rim', options: [500]},
        {name: 'Dus/Box/Karton', options: [6, 12, 24, 48]},
        {name: 'Pak/Slop', options: [10]},
        {name: 'Karung/Sak', options: [50]},
        {name: 'Roll', options: [50, 100]},
        {name: 'Set', options: [1]},
        {name: 'Bal', options: [10, 20]}
    ];

    useEffect(() => {
        if (messageModal) {
            const timer = setTimeout(() => setMessageModal(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [messageModal]);
    
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/categories');
                setDbCategories(res.data);
            } catch(e) { console.error(e); }
        };
        fetchCategories();
    }, []);


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
        if (!newItem.sku || !newItem.name || !newItem.category_id || !newItem.buy_price || !newItem.qty || (!unitType && !newItem.unit)) {
            return setMessageModal('Harap isi semua data barang dengan lengkap.');
        }

        let finalUnit = newItem.unit;
        if (unitType === 'Konversi') {
            if (!majemukType || !majemukMultiplier) return setMessageModal('Pilih Satuan Besar dan Pengali!');
            finalUnit = `${majemukType} (${majemukMultiplier} ${newItem.unit})`;
        }

        const existing = inventory.find(p => p.sku.toLowerCase() === newItem.sku.toLowerCase());

        setCart([...cart, {
            product_id: existing ? existing.product_id : null,
            sku: newItem.sku,
            name: newItem.name,
            category_id: newItem.category_id,
            unit: finalUnit,
            price: parseFloat(newItem.price) || parseFloat(newItem.buy_price),
            buy_price: parseFloat(newItem.buy_price),
            qty: parseFloat(newItem.qty)
        }]);

        setNewItem({ sku: '', name: '', category_id: '', unit: 'Lembar', price: '', buy_price: '', qty: 0 });
        setUnitType('');
        setMajemukType('');
        setMajemukMultiplier('');
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
            if (refreshData) refreshData();
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
                <h1 style={{margin: 0}}>Pencatatan Pembelian</h1>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Kembali ke Dashboard</button>
            </div>
            
            <div className="glass-panel" style={{marginBottom: '24px'}}>
                  {user.role === 'OWNER' && activeBranch === 'all' && (
                      <div className="form-group" style={{marginBottom: '16px'}}>
                          <label>Toko Cabang Tujuan (Untuk Menambah Stok)</label>
                          <div className="custom-dropdown-container" style={{position: 'relative'}}>
                              <div 
                                  className={`custom-select-3d ${isBranchDropdownOpen ? 'active' : ''}`}
                                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                                  style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box'}}
                              >
                                  <span>{branches?.find(b => b.id === selectedBranch)?.name || 'Pilih Toko Cabang'}</span>
                              </div>
                              {isBranchDropdownOpen && (
                                  <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000}}>
                                      {branches && branches.map(b => (
                                          <div 
                                              key={b.id} 
                                              className={`custom-dropdown-item branch-dropdown-item ${selectedBranch === b.id ? 'selected' : ''}`}
                                              onClick={() => { setSelectedBranch(b.id); setIsBranchDropdownOpen(false); }}
                                              style={{fontWeight: '500', padding: '12px 16px', cursor: 'pointer', color: 'var(--text-primary)'}}
                                          >
                                              {b.name}
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
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
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px'}}>
                    <div className="form-group" style={{flex: '1', minWidth: '200px'}}>
                        <label>Kode Barang</label>
                        <input type="text" className="input-field" value={newItem.sku} onChange={e => {
                            const val = e.target.value;
                            const existing = inventory.find(item => item.sku.toLowerCase() === val.toLowerCase());
                            if (existing) {
                                setNewItem({...newItem, sku: val, name: existing.name, price: existing.price || 0, buy_price: existing.base_price || existing.price || 0, unit: existing.unit, category_id: dbCategories.find(c => c.name === existing.category)?.id || newItem.category_id});
                            } else {
                                setNewItem({...newItem, sku: val});
                            }
                        }} required />
                    </div>
                    <div className="form-group" style={{flex: '2', minWidth: '300px'}}>
                        <label>Nama Barang</label>
                        <input type="text" className="input-field" value={newItem.name} onChange={e => {
                            const val = e.target.value;
                            const existing = inventory.find(item => item.name.toLowerCase() === val.toLowerCase());
                            if (existing) {
                                setNewItem({...newItem, name: val, price: existing.price || 0, buy_price: existing.base_price || existing.price || 0, unit: existing.unit, category_id: dbCategories.find(c => c.name === existing.category)?.id || newItem.category_id, sku: existing.sku});
                            } else {
                                setNewItem({...newItem, name: val});
                            }
                        }} required />
                    </div>
                </div>
                
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px'}}>
                    <div className="form-group" style={{flex: '1', minWidth: '200px'}}>
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
                                            onClick={() => { setNewItem({...newItem, category_id: cat.id}); setIsCategoryDropdownOpen(false); }}
                                            style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                        >
                                            {cat.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group" style={{flex: '1', minWidth: '200px'}}>
                        <label>Harga Modal (Beli)</label>
                        <input type="number" className="input-field" value={newItem.buy_price} onChange={e => setNewItem({...newItem, buy_price: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{flex: '1', minWidth: '200px'}}>
                        <label>Harga Jual</label>
                        <input type="number" className="input-field" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                    </div>
                </div>

                <div className="form-group" style={{marginBottom: '16px'}}>
                    <label>Jenis Satuan</label>
                    <div className="custom-dropdown-container" style={{position: 'relative', width: '100%', zIndex: isUnitDropdownOpen ? 10 : 1}}>
                        <div 
                            className={`custom-select-3d ${isUnitDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                        >
                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{unitType || 'Pilih Jenis Satuan'}</span>
                            <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                        </div>
                        {isUnitDropdownOpen && (
                            <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                <div 
                                    className={`custom-dropdown-item ${unitType === 'Konversi' ? 'selected' : ''}`}
                                    onClick={() => { setUnitType('Konversi'); setIsUnitDropdownOpen(false); }}
                                    style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                >
                                    Konversi
                                </div>
                                <div 
                                    className={`custom-dropdown-item ${unitType === 'Tidak Dapat Dikonversi' ? 'selected' : ''}`}
                                    onClick={() => { setUnitType('Tidak Dapat Dikonversi'); setIsUnitDropdownOpen(false); }}
                                    style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                >
                                    Tidak Dapat Dikonversi
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {unitType === 'Konversi' ? (
                    <div style={{background: 'var(--item-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                        <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                            <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                <label>Pilih Satuan Besar</label>
                                <div className="custom-dropdown-container" style={{position: 'relative', width: '100%', zIndex: isMajemukDropdownOpen ? 10 : 1}}>
                                    <div 
                                        className={`custom-select-3d ${isMajemukDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsMajemukDropdownOpen(!isMajemukDropdownOpen)}
                                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                                    >
                                        <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{majemukType || 'Satuan Besar'}</span>
                                        <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>▼</span>
                                    </div>
                                    {isMajemukDropdownOpen && (
                                        <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                            {largeUnitsList.map(unit => (
                                                <div 
                                                    key={unit.name}
                                                    className={`custom-dropdown-item ${majemukType === unit.name ? 'selected' : ''}`}
                                                    onClick={() => { setMajemukType(unit.name); setIsMajemukDropdownOpen(false); setMajemukMultiplier(''); }}
                                                    style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                                >
                                                    {unit.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                                <label>Isi Berapa {newItem.unit}?</label>
                                <select className="input-field" value={majemukMultiplier} onChange={e => setMajemukMultiplier(e.target.value)} disabled={!majemukType} style={{height: '48px'}}>
                                    <option value="">Pilih Pengali</option>
                                    {majemukType && largeUnitsList.find(u => u.name === majemukType)?.options.map(opt => (
                                        <option key={opt} value={opt}>{opt} {newItem.unit}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : unitType === 'Tidak Dapat Dikonversi' ? (
                    <div className="form-group" style={{marginBottom: '16px'}}>
                        <label>Satuan</label>
                        <input type="text" className="input-field" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} placeholder="Contoh: Sak, Lembar, Kg, dll" />
                    </div>
                ) : null}

                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', marginBottom: '24px'}}>
                    <div className="form-group" style={{marginBottom: 0, minWidth: '150px'}}>
                        <label>Jumlah Beli</label>
                        <input type="number" className="input-field" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} placeholder="0" />
                    </div>
                    <button className="btn btn-secondary" onClick={addItemToCart} style={{padding: '12px 32px', height: 'fit-content', alignSelf: 'flex-end'}}>+ Tambah Barang</button>
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
