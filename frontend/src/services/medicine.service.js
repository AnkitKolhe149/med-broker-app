const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
			const queryString = new URLSearchParams({
				page: params.page || 1,
				limit: params.limit || 12
			}).toString();

			const response = await fetch(
				`${API_BASE_URL}/medicines?${queryString}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				throw new Error(`API Error: ${response.statusText}`);
			}

			const data = await response.json();
			return {
				success: true,
				medicines: data.data || [],
				pagination: data.pagination || {}
			};
		} catch (error) {
			console.error('Failed to fetch medicines:', error);
			return {
				success: false,
				medicines: [],
				pagination: {},
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
			const response = await fetch(
				`${API_BASE_URL}/medicines/${medicineId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (!response.ok) {
				throw new Error(`API Error: ${response.statusText}`);
			}

			const data = await response.json();
			return data.data;
		} catch (error) {
			console.error('Failed to fetch medicine:', error);
			throw error;
		}
	}
};

export default medicineService;
