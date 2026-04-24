import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

if (!import.meta.env.VITE_API_URL) {
  console.warn("Frontend is falling back to localhost; check Vercel environment variables.");
}


const getStoredUserContext = () => {
	try {
		const rawUser = localStorage.getItem('user');
		if (!rawUser) return {};

		const user = JSON.parse(rawUser);
		return {
			country: user?.customer?.country || user?.vendor?.country || null
		};
	} catch (_error) {
		return {};
	}
};

const getAuthHeaders = () => {
	const token = localStorage.getItem('token');
	return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildQueryParams = (params = {}) => {
	const userContext = getStoredUserContext();
	const preferredCurrency = localStorage.getItem('preferredCurrency');

	return {
		page: params.page || 1,
		limit: params.limit || 12,
		...(params.search ? { search: params.search } : {}),
		...(params.category ? { category: params.category } : {}),
		...(params.minPrice !== undefined ? { minPrice: params.minPrice } : {}),
		...(params.maxPrice !== undefined ? { maxPrice: params.maxPrice } : {}),
		...(params.prescriptionOnly !== undefined ? { prescriptionOnly: params.prescriptionOnly } : {}),
		...(params.sortBy ? { sortBy: params.sortBy } : {}),
		...(userContext.country ? { country: userContext.country } : {}),
		...(preferredCurrency ? { currency: preferredCurrency } : {})
	};
};

const catalogService = {
	getMedicines: async (params = {}) => {
		const response = await axios.get(`${API_URL}/medicines`, {
			headers: getAuthHeaders(),
			params: buildQueryParams(params)
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load medicines');
		}

		return {
			medicines: response.data.data || [],
			pagination: response.data.pagination || {},
			currency: response.data.currency || localStorage.getItem('preferredCurrency') || 'USD'
		};
	},

	getMedicineById: async (medicineId) => {
		const userContext = getStoredUserContext();
		const preferredCurrency = localStorage.getItem('preferredCurrency');
		const queryParams = new URLSearchParams({
			...(userContext.country ? { country: userContext.country } : {}),
			...(preferredCurrency ? { currency: preferredCurrency } : {})
		}).toString();

		const response = await axios.get(
			`${API_URL}/medicines/${medicineId}${queryParams ? `?${queryParams}` : ''}`,
			{ headers: getAuthHeaders() }
		);

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load medicine');
		}

		return {
			medicine: response.data.data || null,
			currency: response.data.currency || preferredCurrency || 'USD'
		};
	}
};

export default catalogService;
