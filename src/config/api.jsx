const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://18.219.64.19:3001' 
  : 'http://localhost:3001';

export default API_BASE_URL;