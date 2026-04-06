import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const localFallbackResponse = (message) => {
	const text = (message || '').toLowerCase();

	if (text.includes('order')) {
		return 'You can track all your orders in the Orders section. If you share your order ID, I can guide you on the exact next step.';
	}

	if (text.includes('payment') || text.includes('refund')) {
		return 'For payment or refund help, open the Payments section from your dashboard. I can also walk you through common payment errors.';
	}

	if (text.includes('stock') || text.includes('inventory') || text.includes('medicine')) {
		return 'You can manage medicines and stock from Inventory & Stock. Use search and filters to quickly update quantities or prices.';
	}

	if (text.includes('shipping') || text.includes('delivery')) {
		return 'Shipping updates are available in the Shipping module. If you are facing delays, I can suggest quick checks to isolate the issue.';
	}

	if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
		return 'Hello! I am your MedIQ Assistant. I can help with orders, payments, inventory, shipping, and account guidance.';
	}

	return 'I can help with orders, payments, inventory, shipping, and account settings. Tell me what you want to do, and I will guide you step by step.';
};

const aiService = {
	sendMessage: async ({ message, context = {} }) => {
		const trimmedMessage = String(message || '').trim();
		if (!trimmedMessage) {
			throw new Error('Message is required');
		}

		try {
			const response = await axios.post(`${API_URL}/ai/chat`, {
				message: trimmedMessage,
				context
			});

			const reply = response?.data?.data?.reply || response?.data?.reply;
			if (reply) {
				return {
					reply,
					source: 'api'
				};
			}
		} catch (_error) {
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			reply: localFallbackResponse(trimmedMessage),
			source: 'fallback'
		};
	}
};

export default aiService;
