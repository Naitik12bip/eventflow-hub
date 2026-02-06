import axios, { AxiosError } from 'axios';

// Backend base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout - fail fast if backend unreachable
});

// Clerk token handling
let getTokenFunction: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
  getTokenFunction = getter;
};

// Attach auth token
api.interceptors.request.use(
  async (config) => {
    if (getTokenFunction) {
      const token = await getTokenFunction();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized');
    } else if (error.response?.status === 403) {
      console.error('Forbidden');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

// TMDB helpers
export const TMDB_IMAGE_BASE_URL =
  import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
  'https://image.tmdb.org/t/p/w500';

export const getTMDBImageUrl = (path: string | null) =>
  path ? `${TMDB_IMAGE_BASE_URL}${path}` : '/placeholder.svg';

export default api;
