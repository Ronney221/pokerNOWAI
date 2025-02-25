const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pokernowai.com'
  : 'http://localhost:5173';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.pokernowai.com/api'
  : 'http://localhost:5000/api';

export { APP_URL, API_URL }; 