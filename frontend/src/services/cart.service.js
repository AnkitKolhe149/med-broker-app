import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const cartService = {
  getCart: async () => {
    const res = await axios.get(`${API_URL}/cart`, getAuthHeaders());
    return res.data;
  },
  addToCart: async (payload) => {
    const res = await axios.post(`${API_URL}/cart`, payload, getAuthHeaders());
    return res.data;
  },
  updateCartItem: async (id, payload) => {
    const res = await axios.patch(`${API_URL}/cart/${id}`, payload, getAuthHeaders());
    return res.data;
  },
  removeCartItem: async (id) => {
    const res = await axios.delete(`${API_URL}/cart/${id}`, getAuthHeaders());
    return res.data;
  },
  clearCart: async () => {
    const res = await axios.delete(`${API_URL}/cart`, getAuthHeaders());
    return res.data;
  }
};

export default cartService;
