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
  },

  getAdminOrders: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/orders`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getPrescriptionQueue: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/prescriptions`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getRefundCenter: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/refunds`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  processRefund: async ({ orderId, reason, amount }) => {
    const response = await axios.post(`${API_URL}/admin/refunds/process`, { orderId, reason, amount }, getAuthHeaders());
    return response.data;
  },

  getDisputes: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/disputes`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  exportDemandTrainingData: async (months = 12) => {
    const response = await axios.get(`${API_URL}/admin/training-data/demand`, {
      ...getAuthHeaders(),
      params: { months }
    });
    return response.data;
  }
};

export default adminService;
