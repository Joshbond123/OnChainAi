import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    if (!config.__retried && (!error.response || error.code === 'ECONNABORTED')) {
      config.__retried = true;
      await new Promise((r) => setTimeout(r, 1500));
      return api(config);
    }
    return Promise.reject(error);
  }
);
