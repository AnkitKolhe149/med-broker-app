import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const favoritesService = {
  getFavorites: async () => {
    const res = await axios.get(`${API_URL}/favorites`, getAuthHeaders());
    return res.data;
  },
  addFavorite: async (medicineId) => {
    const res = await axios.post(`${API_URL}/favorites`, { medicineId }, getAuthHeaders());
    return res.data;
  },
  removeFavorite: async (id) => {
    const res = await axios.delete(`${API_URL}/favorites/${id}`, getAuthHeaders());
    return res.data;
  }
};

export default favoritesService;
