import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api'
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            // Potential redirect to login if we use router here, or handle in component
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
