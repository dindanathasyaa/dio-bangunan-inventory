import re

with open('d:/APP DIO BANGUNAN/frontend/src/components/PurchaseView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add new state variables
new_states = """
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
        const fetchCategories = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/categories');
                setDbCategories(res.data);
            } catch(e) { console.error(e); }
        };
        fetchCategories();
    }, []);
"""

text = text.replace("const [messageModal, setMessageModal] = useState('');\n    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);", "const [messageModal, setMessageModal] = useState('');\n    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);\n" + new_states)

# Replace the addItemToCart function
old_add_item = """
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
"""

new_add_item = """
    const addItemToCart = () => {
        if (!newItem.sku || !newItem.name || !newItem.category_id || !unitType || !newItem.buy_price || !newItem.qty) {
            return setMessageModal('Harap isi semua data barang dengan lengkap.');
        }

        let finalUnit = newItem.unit;
        if (unitType === 'Konversi') {
            if (!majemukType || !majemukMultiplier) return setMessageModal('Pilih Satuan Besar dan Pengali!');
            finalUnit = ${majemukType} ( );
        }

        // Check if existing product in inventory based on SKU
        const existing = inventory.find(p => p.sku.toLowerCase() === newItem.sku.toLowerCase());

        setCart([...cart, {
            product_id: existing ? existing.id : null,
            sku: newItem.sku,
            name: newItem.name,
            category_id: newItem.category_id,
            unit: finalUnit,
            price: parseFloat(newItem.price) || parseFloat(newItem.buy_price),
            buy_price: parseFloat(newItem.buy_price),
            qty: parseFloat(newItem.qty)
        }]);

        // reset form
        setNewItem({ sku: '', name: '', category_id: '', unit: 'Lembar', price: '', buy_price: '', qty: 0 });
        setUnitType('');
        setMajemukType('');
        setMajemukMultiplier('');
    };
"""
text = text.replace(old_add_item.strip(), new_add_item.strip())

# Replace the form JSX
form_start_marker = "<div style={{display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap'}}>"
form_end_marker = "<div className=\"table-container\">"
form_content = """<div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px'}}>
                    <div className="form-group" style={{flex: '1', minWidth: '200px'}}>
                        <label>Kode Barang</label>
                        <input type="text" className="input-field" value={newItem.sku} onChange={e => {
                            const val = e.target.value;
                            const existing = inventory.find(item => item.sku.toLowerCase() === val.toLowerCase());
                            if (existing) {
                                setNewItem({...newItem, sku: val, name: existing.name, price: existing.price, buy_price: existing.base_price || 0, unit: existing.unit, category_id: dbCategories.find(c => c.name === existing.category)?.id || newItem.category_id});
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
                                setNewItem({...newItem, name: val, price: existing.price, buy_price: existing.base_price || 0, unit: existing.unit, category_id: dbCategories.find(c => c.name === existing.category)?.id || newItem.category_id, sku: existing.sku});
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
                                className={custom-select-3d }
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                            >
                                <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{dbCategories.find(c => c.id === parseInt(newItem.category_id))?.name || 'Pilih Kategori'}</span>
                                <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>?</span>
                            </div>
                            {isCategoryDropdownOpen && (
                                <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                    {dbCategories.map(cat => (
                                        <div 
                                            key={cat.id}
                                            className={custom-dropdown-item }
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
                            className={custom-select-3d }
                            onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                        >
                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{unitType || 'Pilih Jenis Satuan'}</span>
                            <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>?</span>
                        </div>
                        {isUnitDropdownOpen && (
                            <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                <div 
                                    className={custom-dropdown-item }
                                    onClick={() => { setUnitType('Konversi'); setIsUnitDropdownOpen(false); }}
                                    style={{padding: '12px 16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)'}}
                                >
                                    Konversi
                                </div>
                                <div 
                                    className={custom-dropdown-item }
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
                                        className={custom-select-3d }
                                        onClick={() => setIsMajemukDropdownOpen(!isMajemukDropdownOpen)}
                                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 'bold', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer'}}
                                    >
                                        <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{majemukType || 'Satuan Besar'}</span>
                                        <span style={{fontSize: '0.8rem', marginLeft: '16px'}}>?</span>
                                    </div>
                                    {isMajemukDropdownOpen && (
                                        <div className="custom-dropdown-menu" style={{right: 0, left: 0, top: '100%', marginTop: '4px', border: '2px solid var(--primary-color)', zIndex: 1000, overflow: 'hidden', padding: 0}}>
                                            {largeUnitsList.map(unit => (
                                                <div 
                                                    key={unit.name}
                                                    className={custom-dropdown-item }
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

                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px'}}>
                    <div className="form-group" style={{marginBottom: 0, minWidth: '150px'}}>
                        <label>Jumlah Beli</label>
                        <input type="number" className="input-field" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} placeholder="0" />
                    </div>
                    <button className="btn btn-secondary" onClick={addItemToCart} style={{padding: '12px 32px', height: 'fit-content', alignSelf: 'flex-end'}}>+ Tambah Barang</button>
                </div>
                """

start_idx = text.find(form_start_marker)
end_idx = text.find(form_end_marker)
if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + form_content + "\n                " + text[end_idx:]

with open('d:/APP DIO BANGUNAN/frontend/src/components/PurchaseView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("PurchaseView rewritten successfully.")
