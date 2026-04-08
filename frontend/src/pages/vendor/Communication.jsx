import React, { useState } from 'react';
import styles from './Communication.module.css';
import { User2, Building2, Hotel, Paperclip } from 'lucide-react';

function VendorCommunication() {
	const [conversations, setConversations] = useState([
		{
			id: 1,
			customerName: 'Dr. Rajesh Kumar',
			lastMessage: 'Can you provide bulk pricing for Paracetamol?',
			timestamp: '2 hours ago',
			unread: true,
			avatarIcon: <User2 size={18} strokeWidth={1.5} />
		},
		{
			id: 2,
			customerName: 'Health Plus Clinic',
			lastMessage: 'Order received in good condition. Thanks!',
			timestamp: '5 hours ago',
			unread: false,
			avatarIcon: <Building2 size={18} strokeWidth={1.5} />
		},
		{
			id: 3,
			customerName: 'Healing Hospital',
			lastMessage: 'When can you deliver the order?',
			timestamp: '1 day ago',
			unread: false,
			avatarIcon: <Hotel size={18} strokeWidth={1.5} />
		}
	]);

	const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
	const [messages, setMessages] = useState([
		{
			id: 1,
			sender: 'customer',
			text: 'Hi, I would like to inquire about bulk pricing for Paracetamol 500mg tablets.',
			timestamp: '10:30 AM',
			date: '2024-01-15'
		},
		{
			id: 2,
			sender: 'vendor',
			text: 'Hello! Thank you for reaching out. Our bulk pricing starts from 100 strips. Let me send you our pricing sheet.',
			timestamp: '10:35 AM',
			date: '2024-01-15'
		},
		{
			id: 3,
			sender: 'vendor',
			text: 'Paracetamol_Bulk_Pricing_Jan2024.pdf',
			timestamp: '10:36 AM',
			date: '2024-01-15',
			file: true
		},
		{
			id: 4,
			sender: 'customer',
			text: 'Can you provide more details about the minimum order quantity and delivery timeline?',
			timestamp: '2 hours ago',
			date: '2024-01-15'
		}
	]);

	const [newMessage, setNewMessage] = useState('');

	const sendMessage = () => {
		if (newMessage.trim()) {
			const message = {
				id: messages.length + 1,
				sender: 'vendor',
				text: newMessage,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				date: new Date().toLocaleDateString()
			};
			setMessages([...messages, message]);
			setNewMessage('');
		}
	};

	return (
		<div className={styles.container}>
			{/* Conversations Sidebar */}
			<div className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<h2 className={styles.sidebarTitle}>Conversations</h2>
					<input
						type="text"
						placeholder="Search conversations..."
						className={styles.searchBox}
					/>
				</div>
				<div className={styles.conversationList}>
					{conversations.map(conv => (
						<div
							key={conv.id}
							className={selectedConversation.id === conv.id ? styles.conversationItemActive : styles.conversationItem}
							onClick={() => setSelectedConversation(conv)}
						>
							<div className={styles.conversationHeader}>
								<span className={styles.conversationAvatar}>{conv.avatarIcon}</span>
								<div style={{ flex: 1 }}>
									<div className={styles.conversationName}>{conv.customerName}</div>
									<div className={styles.conversationMeta}>{conv.timestamp}</div>
								</div>
								{conv.unread && <div className={styles.unreadBadge} />}
							</div>
							<div className={styles.conversationPreview}>{conv.lastMessage}</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat Area */}
			<div className={styles.chatArea}>
				<div className={styles.chatHeader}>
					<div>
						<h2 className={styles.chatHeaderTitle}>{selectedConversation.customerName}</h2>
						<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
							Responded in 2 hours average
						</div>
					</div>
					<button style={{
						padding: '0.6rem 1.2rem',
						border: '1px solid var(--border)',
						backgroundColor: 'white',
						borderRadius: 'var(--radius)',
						cursor: 'pointer',
						fontWeight: '500'
					}}>
						⋮ More
					</button>
				</div>

				<div className={styles.chatMessages}>
					{messages.map(msg => (
						<div key={msg.id} className={styles.messageGroup}>
							{msg.file ? (
								<div style={{
									maxWidth: '70%',
									padding: '0.8rem 1rem',
									borderRadius: 'var(--radius)',
									wordWrap: 'break-word',
									fontSize: '0.95rem',
									...(msg.sender === 'vendor' ? { alignSelf: 'flex-end' } : {})
								}}>
									<div className={styles.fileMessage}>
										<Paperclip size={14} strokeWidth={1.5} /> {msg.text}
									</div>
									<div className={styles.messageTime}>{msg.timestamp}</div>
								</div>
							) : (
								<div className={msg.sender === 'vendor' ? styles.messageBubbleVendor : styles.messageBubbleCustomer}>
									{msg.text}
									<div style={{
										fontSize: '0.75rem',
										marginTop: '0.2rem',
										color: msg.sender === 'vendor' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
									}}>
										{msg.timestamp}
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				<div className={styles.inputArea}>
					<input
						type="text"
						placeholder="Type your message..."
						className={styles.inputField}
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
					/>
					<button
						className={styles.sendButton}
						onClick={sendMessage}
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
}

export default VendorCommunication;
