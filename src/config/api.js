// Base URLs for the application
const isProd = process.env.NODE_ENV === 'production';
const DOMAIN = isProd ? 'pokernowai.com' : 'localhost';
const CLIENT_PORT = '5173';
const API_PORT = '5000';

// In production, use relative path for API to handle both domain and subdomain access
export const APP_URL = isProd
  ? `https://${DOMAIN}`
  : `http://${DOMAIN}:${CLIENT_PORT}`;

export const API_URL = isProd
  ? '/api' // Use relative path in production
  : `http://${DOMAIN}:${API_PORT}/api`;

// Firebase redirect URLs
export const FIREBASE_REDIRECT_URL = `${APP_URL}/verify-email`;

// Export configuration object
export default {
  APP_URL,
  API_URL,
  isProd,
  DOMAIN,
  FIREBASE_REDIRECT_URL
}; 