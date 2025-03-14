// Base URLs for the application
const isProd = process.env.NODE_ENV === 'production';
const DOMAIN = isProd ? 'pokernowai.com' : 'localhost';
const WWW_DOMAIN = isProd ? 'pokernowai.com' : 'localhost';
const CLIENT_PORT = '5173';
const API_PORT = '5000';

// PythonAnywhere Flask API URL
// In production, this should be your actual PythonAnywhere domain
// Example: https://yourusername.pythonanywhere.com
export const PYTHON_API_URL = isProd 
  ? process.env.REACT_APP_PYTHON_API_URL || 'https://yourusername.pythonanywhere.com'
  : 'http://localhost:5000'; // Use local Flask server in development

// Debug logging function
const debugLog = (message, data) => {
  console.log(`[API Config Debug] ${message}:`, data);
};

// In production, use relative path for API to handle both domain and subdomain access
export const APP_URL = isProd
  ? 'https://www.pokernowai.com'
  : 'http://localhost:5173';

export const API_URL = isProd
  ? '/api' // Use relative path in production
  : 'http://localhost:5000/api';

// Firebase redirect URLs
export const FIREBASE_REDIRECT_URL = `${APP_URL}/verify-email`;

// Debug log configuration
debugLog('Environment Configuration', {
  NODE_ENV: process.env.NODE_ENV,
  isProd,
  APP_URL,
  API_URL,
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
  currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR'
});

// Export configuration object
export default {
  APP_URL,
  API_URL,
  PYTHON_API_URL,
  isProd,
  DOMAIN,
  WWW_DOMAIN,
  FIREBASE_REDIRECT_URL
}; 