import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const catalogService = {
	getMedicines: async () => {
		const response = await axios.get(`${API_URL}/medicines`);
		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to load medicines');
		}

		return response.data.data || [];
	}
};

export default catalogService;
