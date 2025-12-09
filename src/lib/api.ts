import axios from 'axios';

// Use relative API base to work behind Nginx/reverse proxies.
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  '/api';

export const api = axios.create({
  baseURL: API_BASE
});

export async function fetchProducts(params: Record<string, any> = {}) {
  const res = await api.get('/products', { params });
  return res.data;
}

export async function fetchProductsByCountry(country: string, params: Record<string, any> = {}) {
  const res = await api.get('/products', { params: { country, ...params } });
  return res.data;
}

export async function fetchPopularProducts(params: Record<string, any> = {}) {
  const res = await api.get('/products/popular', { params });
  return res.data;
}

export async function fetchProduct(id: string, country?: string) {
  const res = await api.get(`/products/${id}`, { params: country ? { country } : undefined });
  return res.data;
}

export async function fetchProductVariants(id: string, country?: string) {
  const res = await api.get(`/products/${id}/variants`, {
    params: country ? { country } : undefined
  });
  return res.data;
}

export async function fetchCategories(country?: string) {
  const res = await api.get('/categories', { params: country ? { country } : undefined });
  return res.data;
}

export async function fetchCountryStats() {
  const res = await api.get('/stats/countries');
  return res.data;
}

export async function login(email: string, name?: string) {
  const res = await api.post('/auth/login', { email, name });
  return res.data;
}

export async function fetchCart(userId: number) {
  const res = await api.get('/cart', { params: { userId } });
  return res.data;
}

export async function addToCart(userId: number, productId: string, quantity = 1) {
  const res = await api.post('/cart/add', { userId, productId, quantity });
  return res.data;
}

export async function updateCartItem(userId: number, productId: string, quantity: number) {
  const res = await api.post('/cart/update', { userId, productId, quantity });
  return res.data;
}

export async function removeCartItem(userId: number, productId: string) {
  const res = await api.delete(`/cart/item/${productId}`, { params: { userId } });
  return res.data;
}

export async function checkout(userId: number) {
  const res = await api.post('/orders/checkout', { userId });
  return res.data;
}

export async function fetchOrders(userId: number) {
  const res = await api.get('/orders', { params: { userId } });
  return res.data;
}
