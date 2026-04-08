import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';

const getAuthHeaders = () => {
	const token = localStorage.getItem('token');
	return {
		Authorization: `Bearer ${token}`
	};
};

const paymentService = {
	initiatePayment: async ({ orderId, provider = 'mock', returnUrl }) => {
		const response = await axios.post(
			`${API_URL}/payments/initiate`,
			{ orderId, provider, returnUrl },
			{
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to initiate payment');
		}

		return response.data.data;
	},

	verifyPayment: async ({ paymentId, orderId, status = 'SUCCEEDED' }) => {
		const response = await axios.post(
			`${API_URL}/payments/verify`,
			{ paymentId, orderId, status },
			{
				headers: {
					...getAuthHeaders(),
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Payment verification failed');
		}

		return response.data.data;
	},

	getPaymentStatus: async (orderId) => {
		const response = await axios.get(`${API_URL}/payments/${orderId}`, {
			headers: getAuthHeaders()
		});

		if (!response.data?.success) {
			throw new Error(response.data?.message || 'Failed to fetch payment status');
		}

		return response.data.data;
	}
};

export default paymentService;
