import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const shippingService = {
  getQuote: async (payload) => {
    const response = await axios.post(`${API_URL}/shipping/quote`, payload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch shipping quote');
    }

    return response.data.data;
  }
};

export default shippingService;
