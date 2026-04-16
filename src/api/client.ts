import axios from 'axios';

const BACKEND_URL_KEY = 'backend-url';
const DEFAULT_BACKEND_URL = 'http://localhost:8080';

/**
 * Returns the base URL used for API requests.
 * - In dev mode (Vite dev server), always returns '' so requests go through the
 *   Vite proxy (same-origin /api/*) and avoid CORS issues.
 * - In production, uses a user-configured URL from localStorage, VITE_API_BASE_URL,
 *   or '' (for reverse-proxy setups where backend is on the same origin).
 */
function getBaseURL(): string {
  if (import.meta.env.DEV) return '';
  const saved = localStorage.getItem(BACKEND_URL_KEY);
  if (saved) return saved.replace(/\/+$/, '');
  return import.meta.env.VITE_API_BASE_URL || '';
}

/**
 * Returns the backend URL for display purposes (Settings, Integrations).
 * Always resolves to a human-readable URL even when getBaseURL() is empty.
 */
export function getBackendUrl(): string {
  const saved = localStorage.getItem(BACKEND_URL_KEY);
  if (saved) return saved.replace(/\/+$/, '');
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_URL;
}

export function setBackendUrl(url: string): void {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed) {
    localStorage.setItem(BACKEND_URL_KEY, trimmed);
  } else {
    localStorage.removeItem(BACKEND_URL_KEY);
  }
}

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set baseURL dynamically on every request so changes take effect immediately.
apiClient.interceptors.request.use((config) => {
  config.baseURL = `${getBaseURL()}/api`;
  return config;
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps all responses in: { success, data, error, timestamp, request_id }
    // Unwrap the envelope so callers get the inner data directly.
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
