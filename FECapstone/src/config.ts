
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.4.89.48:1337'; // Strapi URL server
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://strapi:1337'; // Strapi URL laptop

// Flask API Base URL
// export const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL || 'http://10.4.89.48:5000';
// export const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL || 'http://app:5000';
// export const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL || 'http://app:5000';
// export const WA_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL || 'http://wa-js:5000';

// Semua request diarahkan ke relative path
export const API_BASE_URL = '/strapi';
export const FLASK_API_BASE_URL = '/flask';
export const WA_API_BASE_URL = '/wa';

// Token tetap dari env
export const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'default_fallback_token';
