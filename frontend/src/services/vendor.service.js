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
	},

	getProfile: async () => {
		const response = await axios.get(`${API_URL}/vendor/profile`, {
			headers: getAuthHeaders()
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load vendor profile');
		}

		return response.data.data;
	},

	updateProfile: async (payload) => {
		const response = await axios.patch(`${API_URL}/vendor/profile`, payload, {
			headers: getAuthHeaders()
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to update vendor profile');
		}

		return response.data.data;
	},

	getDemandForecast: async () => {
		const response = await axios.get(`${API_URL}/vendor-insights/forecast`, {
			headers: getAuthHeaders()
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load demand forecast');
		}

		return response.data.data;
	},

	requestWithdrawal: async ({ amountCents, note }) => {
		const response = await axios.post(
			`${API_URL}/vendor/withdrawals/request`,
			{ amountCents, note },
			{
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to request withdrawal');
		}

		return response.data.data;
	},

	getWithdrawalHistory: async (params = {}) => {
		const response = await axios.get(`${API_URL}/vendor/withdrawals`, {
			headers: getAuthHeaders(),
			params
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load withdrawal history');
		}

		return {
			requests: response.data.data || [],
			pagination: response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
		};
	}
};

export default vendorService;
