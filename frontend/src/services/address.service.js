import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default {
  /**
   * List all addresses for current user
   */
  list: async () => {
    try {
      const response = await axios.get(`${API_BASE}/addresses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to list addresses:', error);
      return [];
    }
  },

  /**
   * Create a new address
   */
  create: async (addressData) => {
    try {
      const response = await axios.post(`${API_BASE}/addresses`, addressData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to create address:', error);
      throw error;
    }
  },

  /**
   * Get single address by ID
   */
  get: async (addressId) => {
    try {
      const response = await axios.get(`${API_BASE}/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to get address:', error);
      throw error;
    }
  },

  /**
   * Update an address
   */
  update: async (addressId, addressData) => {
    try {
      const response = await axios.patch(`${API_BASE}/addresses/${addressId}`, addressData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  },

  /**
   * Delete an address
   */
  delete: async (addressId) => {
    try {
      await axios.delete(`${API_BASE}/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  }
};
