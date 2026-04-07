import React, { useEffect, useMemo, useRef, useState } from 'react';
import aiService from '../../services/ai.service';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import './ChatbotPanel.css';

function ChatbotPanel({ isOpen, onClose }) {
	const { addToCart } = useCart();
	const { user } = useUser();
	const [messages, setMessages] = useState([
		{
			id: 'welcome',
			role: 'assistant',
			text: 'Hi! I am your MedIQ Symptom Assistant. Tell me your symptoms and I can guide safe medicine options from our catalog.',
			products: [],
			timestamp: new Date().toISOString()
		}
	]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef(null);

	const currencyCode = localStorage.getItem('preferredCurrency') || 'INR';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);

	const quickPrompts = useMemo(() => [
		'I have fever and headache since yesterday',
		'I have sore throat and dry cough',
		'I have acidity after meals'
	], []);

	const handleAddRecommendedProduct = (product) => {
		const buyerType = user?.customer?.buyerType || 'RETAIL';
		addToCart(
			{
				id: product.id,
				medicineId: product.medicineId,
				name: product.name,
				category: 'Recommended',
				imageUrl: product.imageUrl,
				vendor: product.vendor,
				vendorId: product.vendorId
			},
			1,
			product.retailPrice,
			product.wholesalePrice,
			buyerType,
			product.currencyCode || currencyCode,
			'standard',
			product.bulkPrice,
			product.bulkMinQty
		);
	};

	useEffect(() => {
		if (!isOpen) return;
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const onEscape = (event) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', onEscape);
		return () => window.removeEventListener('keydown', onEscape);
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	const sendMessage = async (text) => {
		const normalized = String(text || '').trim();
		if (!normalized || isLoading) return;

		const userMessage = {
			id: `user-${Date.now()}`,
			role: 'user',
			text: normalized,
			timestamp: new Date().toISOString()
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);

		try {
			const { reply, products = [] } = await aiService.sendMessage({
				message: normalized,
				context: { channel: 'chatbot-widget' }
			});

			setMessages((prev) => [
				...prev,
				{
					id: `assistant-${Date.now()}`,
					role: 'assistant',
					text: reply,
					products,
					timestamp: new Date().toISOString()
				}
			]);
		} catch (_error) {
			setMessages((prev) => [
				...prev,
				{
					id: `assistant-error-${Date.now()}`,
					role: 'assistant',
					text: 'I could not process that right now. Please try again in a moment.',
					products: [],
					timestamp: new Date().toISOString()
				}
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		await sendMessage(input);
	};

	return (
		<>
			<div className="chatbot-panel-backdrop" onClick={onClose} />
			<section className="chatbot-panel" role="dialog" aria-modal="true" aria-label="MedIQ Assistant">
				<header className="chatbot-panel-header">
					<div className="chatbot-panel-title-wrap">
						<p className="chatbot-panel-kicker">AI Assistant</p>
						<h3 className="chatbot-panel-title">MedIQ Chat</h3>
						<p className="chatbot-panel-subtitle">Ask questions and get quick guidance</p>
					</div>
					<button type="button" className="chatbot-panel-close" onClick={onClose} aria-label="Close chatbot">
						✕
					</button>
				</header>

				<div className="chatbot-panel-prompts">
					<p className="chatbot-prompts-label">Try asking</p>
					<div className="chatbot-prompts-grid">
					{quickPrompts.map((prompt) => (
						<button
							key={prompt}
							type="button"
							className="chatbot-prompt-chip"
							onClick={() => sendMessage(prompt)}
							disabled={isLoading}
						>
							{prompt}
						</button>
					))}
					</div>
				</div>

				<div className="chatbot-messages">
					{messages.map((msg) => (
						<div key={msg.id} className={`chatbot-message-row ${msg.role === 'user' ? 'user' : 'assistant'}`}>
							<div className={`chatbot-message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
								<p className="chatbot-message-text">{msg.text}</p>
								{msg.role === 'assistant' && Array.isArray(msg.products) && msg.products.length > 0 && (
									<div className="chatbot-products-list">
										{msg.products.map((product) => (
											<div key={`${msg.id}-${product.id}`} className="chatbot-product-card">
												<div className="chatbot-product-main">
													<p className="chatbot-product-name">{product.name}</p>
													<p className="chatbot-product-meta">
														{product.vendor} • {product.requiresPrescription ? 'Rx Required' : 'OTC'}
													</p>
													<p className="chatbot-product-price">{formatPrice(product.displayPrice || product.retailPrice || 0)}</p>
												</div>
												<button
													type="button"
													className="chatbot-product-add"
													onClick={() => handleAddRecommendedProduct(product)}
												>
													Add to Cart
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					))}
					{isLoading && (
						<div className="chatbot-message-row assistant">
							<div className="chatbot-message-bubble assistant typing">
								<span />
								<span />
								<span />
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>

				<form className="chatbot-input-row" onSubmit={handleSubmit}>
					<input
						type="text"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="Ask anything..."
						className="chatbot-input"
						disabled={isLoading}
					/>
					<button
						type="submit"
						className="chatbot-send"
						disabled={!input.trim() || isLoading}
					>
						Send
					</button>
				</form>
			</section>
		</>
	);
}

export default ChatbotPanel;