import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import './ChatbotFloatingButton.css';

function ChatbotFloatingButton({ isOpen = false, onClick }) {
	const imageSrc = '/assets/chatbot-bot.png';
	const [imageError, setImageError] = useState(false);

	return (
		<button
			type="button"
			className={`chatbot-fab ${imageError ? 'image-error' : ''}`}
			aria-label="Open chatbot"
			title="Chat with MedIQ Assistant"
			onClick={onClick}
			aria-expanded={isOpen}
			aria-haspopup="dialog"
		>
			<span className="chatbot-fab-pulse" aria-hidden="true" />
			<span className="chatbot-fab-core" aria-hidden="true" />
			<img
				src={imageSrc}
				alt=""
				aria-hidden="true"
				className="chatbot-fab-image"
				onError={() => setImageError(true)}
				onLoad={() => setImageError(false)}
			/>
			<span className="chatbot-fab-icon chatbot-fab-fallback-icon" aria-hidden="true">
				<MessageCircle
					size={22}
					strokeWidth={1.5}
					fill="currentColor"
				/>
			</span>
			{!isOpen && <span className="chatbot-fab-badge" aria-hidden="true" />}
		</button>
	);
}

export default ChatbotFloatingButton;