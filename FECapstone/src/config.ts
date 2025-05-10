// Centralized configuration using Vite's environment variables

// Base URL for API endpoints, read from .env files
// Vite exposes variables prefixed with VITE_ via import.meta.env
// Provide a default fallback for safety, although Vite should inject the value.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.4.89.48:1337'; // Strapi URL

// Flask API Base URL
export const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL || 'http://10.4.89.48:5000';

// Note: Storing sensitive tokens directly in frontend code or .env files 
// accessible by the frontend is generally discouraged for security reasons.
// Authentication tokens (like JWTs) should ideally be obtained after user login 
// and stored securely (e.g., localStorage or sessionStorage).
// If a master API token is needed for certain operations, those should typically
// be handled by a backend proxy/service you control, not directly by the frontend.
export const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'default_fallback_token';
