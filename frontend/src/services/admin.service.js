import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const adminService = {
  getStats: async () => {
    const response = await axios.get(`${API_URL}/admin/stats`, getAuthHeaders());
    return response.data;
  },

  getPendingVendors: async () => {
    const response = await axios.get(`${API_URL}/admin/vendors/pending`, getAuthHeaders());
    return response.data;
  },

  updateVendorStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/vendors/${id}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  getPayoutOverview: async () => {
    const response = await axios.get(`${API_URL}/admin/payouts/overview`, getAuthHeaders());
    return response.data;
  },

  processPayout: async (vendorId, amountCents) => {
    const response = await axios.post(`${API_URL}/admin/payouts/${vendorId}/process`, { amountCents }, getAuthHeaders());
    return response.data;
  }
};

export default adminService;
