const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';
const CACHE_TTL_MS = 60 * 1000;
const medicinesCache = new Map();

const buildCacheKey = (params = {}, userContext = {}, preferredCurrency = '') => {
	return JSON.stringify({
		page: Number(params.page || 1),
		limit: Number(params.limit || 12),
		country: userContext.country || '',
		currency: preferredCurrency || ''
	});
};

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
	if (!token) {
		return {
			'Content-Type': 'application/json'
		};
	}

	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};
};

const medicineService = {
	/**
	 * Fetch all medicines with pagination and filters
	 * @param {Object} params - Query parameters
	 * @param {number} params.page - Page number (default: 1)
	 * @param {number} params.limit - Items per page (default: 12)
	 * @returns {Promise<Object>} - { items: Medicine[], pagination: {...} }
	 */
	getMedicines: async (params = {}) => {
		try {
			const userContext = getStoredUserContext();
			const preferredCurrency = localStorage.getItem('preferredCurrency');
			const cacheKey = buildCacheKey(params, userContext, preferredCurrency);
			const cached = medicinesCache.get(cacheKey);

			if (cached && cached.expiresAt > Date.now()) {
				return cached.value;
			}

			const queryString = new URLSearchParams({
				page: params.page || 1,
				limit: params.limit || 12,
				...(userContext.country ? { country: userContext.country } : {}),
				...(preferredCurrency ? { currency: preferredCurrency } : {})
			}).toString();

			const response = await fetch(
				`${API_BASE_URL}/medicines?${queryString}`,
				{
					method: 'GET',
					headers: getAuthHeaders()
				}
			);

			if (!response.ok) {
				throw new Error(`API Error: ${response.statusText}`);
			}

			const data = await response.json();
			const payload = {
				success: true,
				medicines: data.data || [],
				pagination: data.pagination || {},
				currency: data.currency || preferredCurrency || 'USD'
			};

			medicinesCache.set(cacheKey, {
				value: payload,
				expiresAt: Date.now() + CACHE_TTL_MS
			});

			return payload;
		} catch (error) {
			console.error('Failed to fetch medicines:', error);
			return {
				success: false,
				medicines: [],
				pagination: {},
				currency: localStorage.getItem('preferredCurrency') || 'USD',
				error: error.message
			};
		}
	},

	/**
	 * Get a single medicine by ID
	 * @param {string} medicineId - Medicine ID
	 * @returns {Promise<Object>} - Medicine object
	 */
	getMedicineById: async (medicineId) => {
		try {
			const userContext = getStoredUserContext();
			const preferredCurrency = localStorage.getItem('preferredCurrency');
			const queryString = new URLSearchParams({
				...(userContext.country ? { country: userContext.country } : {}),
				...(preferredCurrency ? { currency: preferredCurrency } : {})
			}).toString();

			const response = await fetch(
				`${API_BASE_URL}/medicines/${medicineId}${queryString ? `?${queryString}` : ''}`,
				{
					method: 'GET',
					headers: getAuthHeaders()
				}
			);

			if (!response.ok) {
				throw new Error(`API Error: ${response.statusText}`);
			}

			const data = await response.json();
			return data.data || null;
		} catch (error) {
			console.error('Failed to fetch medicine:', error);
			throw error;
		}
	},

	prefetchMedicines: async (params = {}) => {
		try {
			await medicineService.getMedicines(params);
		} catch (_error) {
			// Prefetch is best-effort and should not affect UX.
		}
	}
};

export default medicineService;
