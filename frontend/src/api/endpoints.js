// src/api/endpoints.js
import { api } from './client';

// AUTH
export async function login(login, password) {
  const res = await api.post('/login', { login, password });
  return res.data;
}

export async function register(login, password) {
  const res = await api.post('/register', { login, password });
  return res.data;
}

// PRODUCTS
export async function getProducts() {
  const res = await api.get('/products');
  return res.data;
}

export async function getProduct(id) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}

export async function updateProduct(id, payload) {
  const res = await api.put(`/products/${id}`, payload);
  return res.data;
}

export async function createProduct(payload) {
  const res = await api.post('/products', payload);
  return res.data;
}

// SEO description (HTML)
export async function getProductSeoDescription(id) {
  const res = await api.get(`/products/${id}/seo-description`, {
    responseType: 'text',
    headers: { Accept: 'text/html' },
  });
  return res.data; // string HTML
}

// CATEGORIES
export async function getCategories() {
  const res = await api.get('/categories');
  return res.data;
}

// STATUSES
export async function getStatuses() {
  const res = await api.get('/status');
  return res.data;
}

// ORDERS
export async function createOrder(payload) {
  const res = await api.post('/orders', payload);
  return res.data;
}

export async function getMyOrders() {
  const res = await api.get('/orders/my');
  return res.data;
}

export async function getOrder(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

// PRACOWNIK
export async function getOrders(userName = '') {
  const params = {};
  if (userName?.trim()) params.user = userName.trim();
  const res = await api.get('/orders', { params });
  return res.data;
}

// PATCH statusu
export async function patchOrderStatus(id, statusName) {
  const body = { op: 'replace', path: '/status', value: statusName };
  const res = await api.patch(`/orders/${id}`, body);
  return res.data;
}

// INIT (multipart file)
export async function initProductsByFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/init', fd);
  return res.data;
}

// OPINIONS
export async function addOpinion(orderId, rating, content) {
  const res = await api.post(`/orders/${orderId}/opinions`, { rating, content });
  return res.data;
}
