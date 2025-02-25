import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { APP_URL } from './config/api';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set custom parameters for auth actions
auth.useDeviceLanguage();

// No need to set custom auth domain, use the one from the environment variables
// Let Firebase handle the redirects with the proper authDomain

export { auth }; 