import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

if (!import.meta.env.VITE_API_URL) {
  console.warn("Frontend is falling back to localhost; check Vercel environment variables.");
}


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const adminService = {
  getStats: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/stats`, {
      ...getAuthHeaders(),
      params
    });
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

  updateSettings: async (updates) => {
    const response = await axios.patch(`${API_URL}/admin/settings`, updates, getAuthHeaders());
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  updateUserModeration: async (id, isBanned, moderationNote) => {
    const response = await axios.patch(`${API_URL}/admin/users/${id}/moderation`, { isBanned, moderationNote }, getAuthHeaders());
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await axios.patch(`${API_URL}/admin/users/${id}/role`, { role }, getAuthHeaders());
    return response.data;
  },

  // Catalog mutations
  updateMedicineStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/catalog/${id}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  adminOverrideMedicine: async (id, updates) => {
    const response = await axios.patch(`${API_URL}/admin/catalog/${id}/admin-override`, updates, getAuthHeaders());
    return response.data;
  },

  forceEditMedicine: async (id, updates) => {
    const response = await axios.patch(`${API_URL}/admin/catalog/${id}/admin-override`, updates, getAuthHeaders());
    return response.data;
  },

  // Prescription mutations
  updatePrescriptionStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/prescriptions/${id}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  // Compliance / KYC mutations
  verifyKycDocument: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/compliance/${id}/verify`, { status }, getAuthHeaders());
    return response.data;
  },

  // Support Ticket mutations
  replyToSupportTicket: async (id, message) => {
    const response = await axios.post(`${API_URL}/admin/support-tickets/${id}/reply`, { message }, getAuthHeaders());
    return response.data;
  },

  updateSupportTicketStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/support-tickets/${id}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  // Dispute mutations
  resolveDispute: async (id, resolution) => {
    const response = await axios.patch(`${API_URL}/admin/disputes/${id}`, { status: 'RESOLVED', resolution }, getAuthHeaders());
    return response.data;
  },

  // Integration toggle
  toggleIntegration: async (key) => {
    const response = await axios.patch(`${API_URL}/admin/integrations/${key}`, {}, getAuthHeaders());
    return response.data;
  },

  // Return request mutations
  updateReturnRequestStatus: async (id, status) => {
    const response = await axios.patch(`${API_URL}/admin/return-requests/${id}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  // Broadcast notification
  broadcastNotification: async (payload) => {
    const response = await axios.post(`${API_URL}/admin/notifications/broadcast`, payload, getAuthHeaders());
    return response.data;
  },

  // Inventory stock adjustment
  adjustInventoryStock: async (inventoryId, delta, note = '') => {
    const response = await axios.patch(
      `${API_URL}/admin/inventory/${inventoryId}/adjust`,
      { delta, note },
      getAuthHeaders()
    );
    return response.data;
  },

  // Notification mutations
  markNotificationRead: async (id) => {
    const response = await axios.patch(`${API_URL}/admin/notifications/${id}/read`, {}, getAuthHeaders());
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await axios.patch(`${API_URL}/admin/notifications/read-all`, {}, getAuthHeaders());
    return response.data;
  },

  clearAllNotifications: async () => {
    const response = await axios.delete(`${API_URL}/admin/notifications/clear-all`, getAuthHeaders());
    return response.data;
  },

  // ✅ FIX: Create new admin user
  createAdminUser: async (userData) => {
    const response = await axios.post(`${API_URL}/admin/users`, userData, getAuthHeaders());
    return response.data;
  },
  
  getRecentTransactions: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/transactions`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  },
};

export default adminService;
