import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const CHAT_SESSION_KEY = 'mediq_chat_session_id';

const getSessionId = () => {
	const existing = localStorage.getItem(CHAT_SESSION_KEY);
	if (existing) return existing;

	const generated = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
	localStorage.setItem(CHAT_SESSION_KEY, generated);
	return generated;
};

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
		return 'Hello! Tell me your symptoms and I can help shortlist suitable medicines available on MedIQ.';
	}

	return 'Share your symptoms, duration, and severity. I will guide safe next steps and product options from the catalog.';
};

const aiService = {
	sendMessage: async ({ message, context = {} }) => {
		const trimmedMessage = String(message || '').trim();
		if (!trimmedMessage) {
			throw new Error('Message is required');
		}

		try {
			const sessionId = getSessionId();
			const response = await axios.post(`${API_URL}/ai/chat`, {
				message: trimmedMessage,
				sessionId,
				context
			});

			const payload = response?.data?.data || {};
			if (payload.sessionId) {
				localStorage.setItem(CHAT_SESSION_KEY, payload.sessionId);
			}

			const reply = payload.reply || response?.data?.reply;
			if (reply) {
				return {
					reply,
					products: payload.products || [],
					type: payload.type || 'message',
					symptomSummary: payload.symptomSummary || [],
					followUpQuestion: payload.followUpQuestion || null,
					sessionId: payload.sessionId || sessionId,
					source: 'api'
				};
			}
		} catch (_error) {
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
		return {
			reply: localFallbackResponse(trimmedMessage),
			products: [],
			type: 'fallback',
			symptomSummary: [],
			followUpQuestion: null,
			source: 'fallback'
		};
	}
};

export default aiService;
