import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct,
         deleteProduct, purchase, searchProducts } from '../services/api';

const emptyForm = { product_name:'', unit_price:'', units_in_stock:'', category_id:'' };

export default function ProductsPage() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');
  const [msg, setMsg]             = useState({ text:'', ok:true });
  const [buyQty, setBuyQty]       = useState({});

  const load = async () => {
    try {
      const data = search ? await searchProducts(search) : await getProducts();
      setProducts(data);
      // Extraer categorias unicas de los productos
      const seen = new Map();
      data.forEach(p => {
        if (p.category_id && !seen.has(p.category_id)) {
          seen.set(p.category_id, p.category_name);
        }
      });
      setCategories(Array.from(seen, ([id, name]) => ({ id, name })));
    } catch(e) { setMsg({ text: e.message, ok: false }); }
  };

  useEffect(() => { load(); }, [search]);

  const notify = (text, ok = true) => setMsg({ text, ok });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await updateProduct(editId, form); notify('Producto actualizado'); }
      else        { await createProduct(form);          notify('Producto creado'); }
      setForm(emptyForm); setEditId(null); load();
    } catch(e) { notify(e.message, false); }
  };

  const handleEdit = (p) => {
    setEditId(p.product_id);
    setForm({ product_name: p.product_name, unit_price: p.unit_price,
              units_in_stock: p.units_in_stock, category_id: p.category_id });
  };

  const handleDelete = async (id) => {
    if (!confirm('Desactivar este producto?')) return;
    try { await deleteProduct(id); notify('Producto desactivado'); load(); }
    catch(e) { notify(e.message, false); }
  };

  const handlePurchase = async (productId) => {
    const qty = parseInt(buyQty[productId] || 1);
    try {
      const res = await purchase(productId, qty);
      notify(`Compra exitosa: ${res.quantity}x ${res.product} - Total: $${res.total}`);
      load();
    } catch(e) { notify(e.message, false); }
  };

  const inp = {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 14,
  };

  const btn = (bg) => ({
    padding: '6px 12px',
    backgroundColor: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  });

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', color: '#000' }}>
      <h2 style={{ marginBottom: 16 }}>Productos</h2>

      {msg.text && (
        <div style={{
          padding: '8px 12px',
          marginBottom: 16,
          borderRadius: 4,
          backgroundColor: msg.ok ? '#d4edda' : '#f8d7da',
          border: `1px solid ${msg.ok ? '#c3e6cb' : '#f5c6cb'}`,
          color: msg.ok ? '#155724' : '#721c24',
        }}>
          {msg.text}
          <button onClick={() => setMsg({ text:'', ok:true })}
            style={{ marginLeft: 12, background: 'none', border: 'none',
                     cursor: 'pointer', fontWeight: 'bold' }}>x</button>
        </div>
      )}

      <form onSubmit={handleSubmit}
        style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        <input style={{...inp, flex:2, minWidth:140}}
          placeholder="Nombre del producto"
          value={form.product_name}
          onChange={e => setForm({...form, product_name: e.target.value})} required />
        <input style={{...inp, width:90}}
          placeholder="Precio" type="number" step="0.01"
          value={form.unit_price}
          onChange={e => setForm({...form, unit_price: e.target.value})} required />
        <input style={{...inp, width:80}}
          placeholder="Stock" type="number"
          value={form.units_in_stock}
          onChange={e => setForm({...form, units_in_stock: e.target.value})} required />
        <select
          style={{...inp, width:150}}
          value={form.category_id}
          onChange={e => setForm({...form, category_id: e.target.value})}>
          <option value="">Categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" style={btn('#333')}>
          {editId ? 'Actualizar' : 'Crear'}
        </button>
        {editId && (
          <button type="button" style={btn('#888')}
            onClick={() => { setEditId(null); setForm(emptyForm); }}>
            Cancelar
          </button>
        )}
      </form>

      <input style={{...inp, width:260, marginBottom:16}}
        placeholder="Buscar producto..."
        value={search}
        onChange={e => setSearch(e.target.value)} />

      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
        <thead>
          <tr style={{ backgroundColor:'#f0f0f0' }}>
            {['ID','Nombre','Precio','Stock','Categoria','Acciones'].map(h => (
              <th key={h} style={{ padding:'10px 8px', textAlign:'left',
                                   borderBottom:'2px solid #ccc' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.product_id} style={{ borderBottom:'1px solid #eee' }}>
              <td style={{ padding:'8px' }}>{p.product_id}</td>
              <td style={{ padding:'8px' }}>{p.product_name}</td>
              <td style={{ padding:'8px' }}>${p.unit_price}</td>
              <td style={{ padding:'8px', color: p.units_in_stock === 0 ? 'red' : 'inherit' }}>
                {p.units_in_stock}
              </td>
              <td style={{ padding:'8px' }}>{p.category_name || '-'}</td>
              <td style={{ padding:'8px', display:'flex', gap:4, alignItems:'center' }}>
                <button onClick={() => handleEdit(p)} style={btn('#555')}>Editar</button>
                <button onClick={() => handleDelete(p.product_id)} style={btn('#c0392b')}>Eliminar</button>
                <input type="number" min="1"
                  value={buyQty[p.product_id] || 1}
                  onChange={e => setBuyQty({...buyQty, [p.product_id]: e.target.value})}
                  style={{...inp, width:50}} />
                <button onClick={() => handlePurchase(p.product_id)} style={btn('#2c3e50')}>
                  Comprar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}