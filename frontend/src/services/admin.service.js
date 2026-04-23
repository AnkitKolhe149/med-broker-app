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

  getPayoutRequests: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/payouts/requests`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  processPayout: async (vendorId, amountCents) => {
    const response = await axios.post(`${API_URL}/admin/payouts/${vendorId}/process`, { amountCents }, getAuthHeaders());
    return response.data;
  },

  approvePayoutRequest: async ({ vendorId, payoutRequestId, amountCents }) => {
    const response = await axios.post(
      `${API_URL}/admin/payouts/${vendorId}/process`,
      { payoutRequestId, amountCents },
      getAuthHeaders()
    );
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

  getUsersOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/users`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getVendorsOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/vendors`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getCatalogOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/catalog`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getInventoryOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/inventory`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getSupportTicketsOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/support-tickets`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getComplianceOverview: async () => {
    const response = await axios.get(`${API_URL}/admin/compliance`, getAuthHeaders());
    return response.data;
  },

  getReportsOverview: async () => {
    const response = await axios.get(`${API_URL}/admin/reports`, getAuthHeaders());
    return response.data;
  },

  getNotificationsOverview: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/notifications`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },

  getIntegrationsOverview: async () => {
    const response = await axios.get(`${API_URL}/admin/integrations`, getAuthHeaders());
    return response.data;
  },

  getSettingsOverview: async () => {
    const response = await axios.get(`${API_URL}/admin/settings`, getAuthHeaders());
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, { status }, getAuthHeaders());
    return response.data;
  }
};

export default adminService;
