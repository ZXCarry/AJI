// src/api/client.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Tokeny trzymamy w localStorage.
function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('login');
}

let isRefreshing = false;
let refreshQueue = [];

// Kolejka requestów czekających na refresh
function enqueueRefresh(cb) {
  refreshQueue.push(cb);
}
function flushQueue(error, newAccessToken) {
  refreshQueue.forEach((cb) => cb(error, newAccessToken));
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor odpowiedzi: gdy 401 -> próbujemy odświeżyć token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;

    // Jeśli nie ma response albo to nie 401 -> normalnie zwracamy błąd
    if (!error?.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const url = String(original?.url || '');
    if (url.includes('/login') || url.includes('/register') || url.includes('/token/refresh')) {
      return Promise.reject(error);
    }

    // Jeśli request już raz był retry
    if (original?._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.location.assign('/login');
      return Promise.reject(error);
    }

    // Jeśli refresh już trwa - ustawiamy request do kolejki
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        enqueueRefresh((err, newAccessToken) => {
          if (err) return reject(err);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const resp = await axios.post(
        `${API_URL}/token/refresh`,
        { refreshToken },
        { timeout: 15000 }
      );

      const newAccessToken = resp.data?.accessToken;
      const newRefreshToken = resp.data?.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Brak tokenów w odpowiedzi refresh');
      }

      setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
      flushQueue(null, newAccessToken);

      // retry oryginalnego requestu
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      clearTokens();
      window.location.assign('/login');
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// Helper do czytania błędu z backendu (ApiError)
export function getApiErrorMessage(err, fallback = 'Wystąpił błąd') {
  const msg = err?.response?.data?.message;
  if (msg) return msg;
  return fallback;
}

export function getApiErrorDetails(err) {
  return err?.response?.data?.details || err?.response?.data || null;
}
