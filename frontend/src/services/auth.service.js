import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Setup axios interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Helper functions
const getToken = () => localStorage.getItem('token');

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`
});

// Public API
export default {
  register: async (data) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    if (response.data.success) {
      const { token, user } = response.data.data;
      setAuthData(token, user);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  login: async (email, password, role) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      role
    });
    if (response.data.success) {
      const { token, user } = response.data.data;
      setAuthData(token, user);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  logout: () => {
    clearAuthData();
  },

  getCurrentUser: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      return response.data.data;
    }
    throw new Error('Failed to fetch user data');
  },

  getProfileStatus: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${API_URL}/auth/profile-status`, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  },

  completeVendorOnboarding: async (data) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.post(`${API_URL}/onboarding/vendor`, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      await this.getCurrentUser();
      return response.data.data;
    }
    throw new Error(response.data.message || 'Onboarding failed');
  },

  completeCustomerOnboarding: async (data) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.post(`${API_URL}/onboarding/customer`, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      await this.getCurrentUser();
      return response.data.data;
    }
    throw new Error(response.data.message || 'Onboarding failed');
  },

  isAuthenticated: () => {
    return !!getToken() && !!getUser();
  },

  getUserRole: () => {
    return getUser()?.role || null;
  },

  isProfileComplete: () => {
    return getUser()?.isProfileComplete || false;
  }
};
