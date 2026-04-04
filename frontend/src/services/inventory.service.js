import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

const inventoryService = {
  getInventory: async (params = {}) => {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: getAuthHeaders(),
      params
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load inventory');
    }

    return {
      items: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
    };
  },

  addMedicineToInventory: async (payload) => {
    const response = await axios.post(`${API_URL}/inventory/medicines`, payload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to add medicine');
    }

    return response.data.data;
  },

  uploadMedicineImage: async (inventoryId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(`${API_URL}/inventory/${inventoryId}/image`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to upload medicine image');
    }

    return response.data.data;
  },

  deleteInventoryItem: async (inventoryId) => {
    const response = await axios.delete(`${API_URL}/inventory/${inventoryId}`, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete inventory item');
    }

    return true;
  }
};

export default inventoryService;
