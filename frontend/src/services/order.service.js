import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

const orderService = {
  uploadPrescription: async (file) => {
    const formData = new FormData();
    formData.append('prescription', file);

    const response = await axios.post(`${API_URL}/orders/prescription/upload`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to upload prescription');
    }

    return response.data.data;
  },

  createCustomerOrder: async (payload) => {
    const response = await axios.post(`${API_URL}/orders`, payload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to create order');
    }

    return response.data.data;
  },

  getCustomerOrders: async (params = {}) => {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: getAuthHeaders(),
      params
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load orders');
    }

    return {
      orders: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
    };
  },

  getCustomerOrderById: async (orderId) => {
    const response = await axios.get(`${API_URL}/orders/${orderId}`, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load order details');
    }

    return response.data.data;
  },

  cancelCustomerOrder: async (orderId) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/cancel`, {}, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to cancel order');
    }

    return response.data.data;
  },

  getVendorOrders: async (params = {}) => {
    const response = await axios.get(`${API_URL}/vendor-insights/orders`, {
      headers: getAuthHeaders(),
      params
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load vendor orders');
    }

    return {
      orders: response.data.data?.orders || [],
      pagination: response.data.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
    };
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/status`, { status }, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to update order status');
    }

    return response.data.data;
  },

  downloadOrderReceipt: async (orderId) => {
    const response = await axios.get(`${API_URL}/orders/${orderId}/receipt`, {
      headers: getAuthHeaders(),
      responseType: 'blob'
    });

    return response.data;
  }
};

export default orderService;
