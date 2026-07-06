const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  let data = {};
  try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }
  if (!res.ok) throw new Error(data.message || data.error || 'Error en la solicitud');
  return data;
};

export const loginWithGoogle = () => {
  window.location.href = `${BASE_URL}/auth/google`;
};

export const logout = async () => {
  try {
    await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: headers() });
  } catch (e) {
    console.error('Error en logout:', e);
  } finally {
    localStorage.removeItem('token');
  }
};

// Productos
export const getProducts = () =>
  fetch(`${BASE_URL}/products`, { headers: headers() }).then(handleResponse);

export const searchProducts = (q) =>
  fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(q)}`, { headers: headers() }).then(handleResponse);

export const createProduct = (data) =>
  fetch(`${BASE_URL}/products`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateProduct = (id, data) =>
  fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  }).then(handleResponse);

export const deleteProduct = (id) =>
  fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE', headers: headers(),
  }).then(handleResponse);

export const reactivateProduct = (id) =>
  fetch(`${BASE_URL}/products/${id}/reactivate`, {
    method: 'PATCH', headers: headers(),
  }).then(handleResponse);

// Vista administrativa: incluye productos activos e inactivos.
export const getAllProductsAdmin = (q = '') =>
  fetch(`${BASE_URL}/products/all${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers: headers() }).then(handleResponse);

export const adjustStock = (id, delta) =>
  fetch(`${BASE_URL}/products/${id}/stock`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ delta }),
  }).then(handleResponse);

// Ordenes
export const createOrder = (items) =>
  fetch(`${BASE_URL}/orders`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ items }),
  }).then(handleResponse);

export const getMyOrders = () =>
  fetch(`${BASE_URL}/orders/mine`, { headers: headers() }).then(handleResponse);

export const getAllOrders = () =>
  fetch(`${BASE_URL}/orders`, { headers: headers() }).then(handleResponse);

export const getOrderDetails = (orderId) =>
  fetch(`${BASE_URL}/orders/${orderId}/details`, { headers: headers() }).then(handleResponse);

// Logs (admin)
export const getLogs = (limit = 100) =>
  fetch(`${BASE_URL}/logs?limit=${limit}`, { headers: headers() }).then(handleResponse);
