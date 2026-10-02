import axios from 'axios';
const isElectron = window.navigator.userAgent.includes('Electron');
const productionApiUrl = 'https://eventbill1.onrender.com/api';

const API = axios.create({ 
  baseURL: isElectron ? productionApiUrl : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') 
});
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.authorization = `Bearer ${token}`;
  return req;
});
export default API;
