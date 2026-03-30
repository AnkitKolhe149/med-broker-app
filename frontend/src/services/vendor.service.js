import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getAuthHeaders = () => {
	const token = localStorage.getItem('token');
	return {
		Authorization: `Bearer ${token}`
	};
};

const vendorService = {
	getDashboard: async () => {
		const response = await axios.get(`${API_URL}/vendor-insights/dashboard`, {
			headers: getAuthHeaders()
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load vendor dashboard');
		}

		return response.data.data;
	},

	getAnalytics: async (range = 'month') => {
		const response = await axios.get(`${API_URL}/vendor-insights/analytics`, {
			headers: getAuthHeaders(),
			params: { range }
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load vendor analytics');
		}

		return response.data.data;
	}
};

export default vendorService;
