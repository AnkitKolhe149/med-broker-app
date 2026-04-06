import React, { useState } from 'react';
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
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 4.2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
					<circle cx="12" cy="3" r="1" fill="currentColor"/>
					<rect x="5" y="7" width="14" height="10" rx="4" stroke="currentColor" strokeWidth="1.8"/>
					<circle cx="9.5" cy="12" r="1.15" fill="currentColor"/>
					<circle cx="14.5" cy="12" r="1.15" fill="currentColor"/>
					<path d="M9 15H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
				</svg>
			</span>
			{!isOpen && <span className="chatbot-fab-badge" aria-hidden="true" />}
		</button>
	);
}

export default ChatbotFloatingButton;