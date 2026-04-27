import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

if (!import.meta.env.VITE_API_URL) {
  console.warn("Frontend is falling back to localhost; check Vercel environment variables.");
}

const AUTH_CHANGED_EVENT = 'mediq:auth-changed';
const ACCOUNT_SCOPED_KEYS = [
  'mediq_cart',
  'mediq_favorites',
  'pending_order',
  'completed_order',
  'mediq_chat_session_id',
  'preferredCurrency'
];

// Helper functions
const getToken = () => localStorage.getItem('token');

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const emitAuthChanged = (user, metadata = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, {
    detail: {
      user,
      ...metadata
    }
  }));
};

const clearAccountScopedData = () => {
  ACCOUNT_SCOPED_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch (e) { }
    try { sessionStorage.removeItem(key); } catch (e) { }
  });
};

const setAuthData = (token, user) => {
  const previousUser = getUser();
  const accountChanged = Boolean(previousUser?.id && user?.id && previousUser.id !== user.id);

  if (accountChanged) {
    clearAccountScopedData();
  }

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  emitAuthChanged(user, { accountChanged });
};

const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  clearAccountScopedData();
  emitAuthChanged(null, { accountChanged: true });
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`
});

const fetchCurrentUser = async () => {
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
};

// Setup axios interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

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

  getCurrentUser: fetchCurrentUser,

  getProfileStatus: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${API_URL}/auth/profile-status`, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await axios.post(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to change password');
    }

    return response.data.data;
  },

  updateProfile: async (updates = {}) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await axios.patch(`${API_URL}/auth/profile`, updates, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to update profile');
    }

    if (response.data?.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      emitAuthChanged(response.data.data, { accountChanged: false });
    }

    return response.data.data;
  },

  completeVendorOnboarding: async (data) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await axios.post(`${API_URL}/onboarding/vendor`, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      await fetchCurrentUser();
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
      await fetchCurrentUser();
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
  ,

  logoutAllSessions: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await axios.post(`${API_URL}/auth/logout-all`, {}, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to revoke sessions');
    }

    // Clear local session and account-scoped data
    clearAuthData();
    return true;
  }
};
