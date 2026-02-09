import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Setup axios interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Return error with message from backend
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  /**
   * Register a new user
   */
  async register(data) {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      this.setAuthData(token, user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  /**
   * Login user
   */
  async login(email, password, role) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      role
    });
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      this.setAuthData(token, user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });

    if (response.data.success) {
      this.user = response.data.data;
      localStorage.setItem('user', JSON.stringify(this.user));
      return this.user;
    }

    throw new Error('Failed to fetch user data');
  }

  /**
   * Get profile status
   */
  async getProfileStatus() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${API_URL}/auth/profile-status`, {
      headers: this.getAuthHeaders()
    });

    return response.data.data;
  }

  /**
   * Complete vendor onboarding
   */
  async completeVendorOnboarding(data) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(`${API_URL}/onboarding/vendor`, data, {
      headers: this.getAuthHeaders()
    });

    if (response.data.success) {
      // Refresh user data
      await this.getCurrentUser();
      return response.data.data;
    }

    throw new Error(response.data.message || 'Onboarding failed');
  }

  /**
   * Complete customer onboarding
   */
  async completeCustomerOnboarding(data) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(`${API_URL}/onboarding/customer`, data, {
      headers: this.getAuthHeaders()
    });

    if (response.data.success) {
      // Refresh user data
      await this.getCurrentUser();
      return response.data.data;
    }

    throw new Error(response.data.message || 'Onboarding failed');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Get auth headers
   */
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`
    };
  }

  /**
   * Set auth data
   */
  setAuthData(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get user role
   */
  getUserRole() {
    return this.user?.role || null;
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete() {
    return this.user?.isProfileComplete || false;
  }
}

export default new AuthService();
