import { Fragment, useEffect, useState } from 'react';
import {
  getAllProductsAdmin, createProduct, updateProduct, deleteProduct, reactivateProduct,
  getAllOrders, getOrderDetails,
} from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = { product_name: '', unit_price: '', units_in_stock: '', category_id: '' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [msg, setMsg] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const notify = (text, ok = true) => setMsg({ text, ok });

  const loadProducts = async () => {
    try {
      const data = await getAllProductsAdmin(search);
      setProducts(data);
      setPage(1);
      const seen = new Map();
      data.forEach((p) => {
        if (p.category_id && !seen.has(p.category_id)) seen.set(p.category_id, p.category_name);
      });
      setCategories(Array.from(seen, ([id, name]) => ({ id, name })));
    } catch (e) { notify(e.message, false); }
  };

  const isActive = (p) => Number(p.discontinued) === 0;

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'activo') return isActive(p);
    if (statusFilter === 'inactivo') return !isActive(p);
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const loadOrders = async () => {
    try { setOrders(await getAllOrders()); } catch (e) { notify(e.message, false); }
  };

  useEffect(() => { loadProducts(); }, [search]);
  useEffect(() => { if (tab === 'ordenes') loadOrders(); }, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await updateProduct(editId, form); notify('Producto actualizado'); }
      else { await createProduct(form); notify('Producto creado'); }
      setForm(emptyForm); setEditId(null); loadProducts();
    } catch (e) { notify(e.message, false); }
  };

  const handleEdit = (p) => {
    setEditId(p.product_id);
    setForm({
      product_name: p.product_name, unit_price: p.unit_price,
      units_in_stock: p.units_in_stock, category_id: p.category_id,
    });
  };

  const handleToggleActive = async (p) => {
    if (isActive(p)) {
      setPendingDeactivate(p);
    } else {
      try { await reactivateProduct(p.product_id); notify('Producto reactivado'); loadProducts(); }
      catch (e) { notify(e.message, false); }
    }
  };

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    try {
      await deleteProduct(pendingDeactivate.product_id);
      notify('Producto desactivado');
      loadProducts();
    } catch (e) { notify(e.message, false); }
    finally { setPendingDeactivate(null); }
  };

  const toggleOrder = async (orderId) => {
    if (openOrder === orderId) { setOpenOrder(null); setOrderDetails(null); return; }
    setOpenOrder(orderId);
    try { setOrderDetails((await getOrderDetails(orderId)).details); }
    catch (e) { notify(e.message, false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Panel de administracion</h1>
          <p className="subtitle">Gestion de productos, stock y ordenes</p>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>x</button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>
          Productos
        </button>
        <button className={`tab ${tab === 'ordenes' ? 'active' : ''}`} onClick={() => setTab('ordenes')}>
          Ordenes
        </button>
      </div>

      {tab === 'productos' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>{editId ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit} className="field-row" style={{ marginTop: 10 }}>
              <div className="field">
                <label>Nombre</label>
                <input style={{ minWidth: 180 }} value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Precio</label>
                <input type="number" step="0.01" value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
              </div>
              <div className="field">
                <label>Stock</label>
                <input type="number" min="0" value={form.units_in_stock}
                  onChange={(e) => setForm({ ...form, units_in_stock: e.target.value })} required />
              </div>
              <div className="field">
                <label>Categoria</label>
                <select value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sin categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                {editId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {editId && (
                <button type="button" className="btn btn-outline"
                  onClick={() => { setEditId(null); setForm(emptyForm); }}>
                  Cancelar
                </button>
              )}
            </form>
          </div>

          <div className="field-row" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Buscar</label>
              <input placeholder="Buscar producto..." value={search}
                onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage}
            pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th><th>Precio</th><th>Stock</th><th>Categoria</th>
                  <th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p) => {
                  const active = isActive(p);
                  return (
                    <tr key={p.product_id} style={{ opacity: active ? 1 : 0.55 }}>
                      <td>{p.product_name}</td>
                      <td>${p.unit_price}</td>
                      <td>
                        {active && p.units_in_stock === 0
                          ? <span className="badge badge-low">Agotado</span>
                          : p.units_in_stock}
                      </td>
                      <td>{p.category_name || '-'}</td>
                      <td>
                        <span className={`badge ${active ? 'badge-success' : 'badge-inactive'}`}>
                          {active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>Editar</button>
                          <button className={`btn btn-sm ${active ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => handleToggleActive(p)}>
                            {active ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={6} className="empty">No hay productos para mostrar</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'ordenes' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Orden</th><th>Cliente</th><th>Fecha</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.order_id}>
                  <tr>
                    <td>#{o.order_id}</td>
                    <td>{o.user_email}</td>
                    <td>{new Date(o.order_date).toLocaleString()}</td>
                    <td>${o.total}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleOrder(o.order_id)}>
                        {openOrder === o.order_id ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {openOrder === o.order_id && orderDetails && (
                    <tr>
                      <td colSpan={5} style={{ background: 'rgba(31,30,26,0.02)' }}>
                        <table>
                          <thead>
                            <tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr>
                          </thead>
                          <tbody>
                            {orderDetails.map((d) => (
                              <tr key={d.id}>
                                <td>{d.product_name}</td>
                                <td>{d.quantity}</td>
                                <td>${d.unit_price}</td>
                                <td>${d.subtotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="empty">Todavia no hay ordenes registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pendingDeactivate && (
        <ConfirmModal
          title="Desactivar producto"
          message={`Desactivar "${pendingDeactivate.product_name}"? Seguira existiendo en el sistema, solo dejara de estar disponible para la venta.`}
          confirmLabel="Desactivar"
          danger
          onConfirm={confirmDeactivate}
          onCancel={() => setPendingDeactivate(null)}
        />
      )}
    </div>
  );
}
