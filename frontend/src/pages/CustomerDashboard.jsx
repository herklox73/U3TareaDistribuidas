import { Fragment, useEffect, useState } from 'react';
import {
  getProducts, searchProducts, createOrder, getMyOrders, getOrderDetails,
} from '../services/api';
import Pagination from '../components/Pagination';

export default function CustomerDashboard() {
  const [tab, setTab] = useState('catalogo');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [cart, setCart] = useState({}); // { [product_id]: quantity }
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [msg, setMsg] = useState(null);

  const notify = (text, ok = true) => setMsg({ text, ok });

  const loadProducts = async () => {
    try {
      const data = search ? await searchProducts(search) : await getProducts();
      setProducts(data);
      setPage(1);
    } catch (e) { notify(e.message, false); }
  };

  const loadOrders = async () => {
    try {
      setOrders(await getMyOrders());
    } catch (e) { notify(e.message, false); }
  };

  useEffect(() => { loadProducts(); }, [search]);
  useEffect(() => { if (tab === 'mis-compras') loadOrders(); }, [tab]);

  const setQty = (productId, qty) => {
    setCart((c) => ({ ...c, [productId]: qty }));
  };

  const addToCart = (product) => {
    const qty = parseInt(cart[product.product_id]) || 1;
    if (qty <= 0) return;
    setCart((c) => ({ ...c, [`in_${product.product_id}`]: qty }));
    notify(`${product.product_name} agregado al carrito`);
  };

  const cartItems = Object.entries(cart)
    .filter(([key]) => key.startsWith('in_'))
    .map(([key, quantity]) => {
      const productId = key.replace('in_', '');
      const product = products.find((p) => String(p.product_id) === productId);
      return product ? { product, quantity } : null;
    })
    .filter(Boolean);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.unit_price * item.quantity, 0);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const pagedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  const removeFromCart = (productId) => {
    setCart((c) => {
      const next = { ...c };
      delete next[`in_${productId}`];
      return next;
    });
  };

  const confirmPurchase = async () => {
    if (cartItems.length === 0) return;
    try {
      const items = cartItems.map((i) => ({ product_id: i.product.product_id, quantity: parseInt(i.quantity) }));
      const res = await createOrder(items);
      notify(`Compra confirmada: orden #${res.order.order_id} - total $${res.order.total}`);
      setCart({});
      loadProducts();
    } catch (e) { notify(e.message, false); }
  };

  const toggleOrder = async (orderId) => {
    if (openOrder === orderId) { setOpenOrder(null); setOrderDetails(null); return; }
    setOpenOrder(orderId);
    try {
      const res = await getOrderDetails(orderId);
      setOrderDetails(res.details);
    } catch (e) { notify(e.message, false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Catalogo</h1>
          <p className="subtitle">Explora los productos disponibles y arma tu compra</p>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>x</button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'catalogo' ? 'active' : ''}`} onClick={() => setTab('catalogo')}>
          Catalogo
        </button>
        <button className={`tab ${tab === 'mis-compras' ? 'active' : ''}`} onClick={() => setTab('mis-compras')}>
          Mis compras
        </button>
      </div>

      {tab === 'catalogo' && (
        <>
          {cartItems.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3>Carrito</h3>
              <div className="table-wrap" style={{ marginTop: 10, marginBottom: 12 }}>
                <table>
                  <thead>
                    <tr><th>Producto</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.product.product_id}>
                        <td>{item.product.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${(item.product.unit_price * item.quantity).toFixed(2)}</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => removeFromCart(item.product.product_id)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Total: ${cartTotal.toFixed(2)}</strong>
                <button className="btn btn-accent" onClick={confirmPurchase}>Confirmar compra</button>
              </div>
            </div>
          )}

          <input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 16, width: 280 }}
          />

          <Pagination page={page} totalPages={totalPages} onChange={setPage}
            pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th><th>Precio</th><th>Stock</th><th>Categoria</th><th>Cantidad</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((p) => (
                  <tr key={p.product_id}>
                    <td>{p.product_name}</td>
                    <td>${p.unit_price}</td>
                    <td>
                      {p.units_in_stock === 0
                        ? <span className="badge badge-low">Agotado</span>
                        : p.units_in_stock}
                    </td>
                    <td>{p.category_name || '-'}</td>
                    <td>
                      <input type="number" min="1" max={p.units_in_stock}
                        value={cart[p.product_id] ?? 1}
                        onChange={(e) => setQty(p.product_id, e.target.value)} />
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" disabled={p.units_in_stock === 0}
                        onClick={() => addToCart(p)}>
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="empty">No hay productos para mostrar</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'mis-compras' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Orden</th><th>Fecha</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.order_id}>
                  <tr>
                    <td>#{o.order_id}</td>
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
                      <td colSpan={4} style={{ background: 'rgba(31,30,26,0.02)' }}>
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
                <tr><td colSpan={4} className="empty">Todavia no has hecho ninguna compra</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
