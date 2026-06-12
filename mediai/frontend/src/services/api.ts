import axios from 'axios';

// Create central API client
const api = axios.create({
  baseURL: '/api', // Proxied via Vite dev server or Nginx
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Invalidate session on authorization failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Clearing local session state.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login in window context
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
