import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import vendorService from '../../services/vendor.service';
import styles from './Communication.module.css';
import { User2, Building2, Hotel, Paperclip } from 'lucide-react';


const DEFAULT_CONVERSATIONS = [
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
];

const DEFAULT_MESSAGES_BY_CONVERSATION = {
	1: [
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
	],
	2: [
		{
			id: 1,
			sender: 'customer',
			text: 'Please confirm the batch numbers for the order we received.',
			timestamp: '8:15 AM',
			date: '2024-01-15'
		}
	],
	3: [
		{
			id: 1,
			sender: 'customer',
			text: 'When can you deliver the order to the emergency wing?',
			timestamp: 'Yesterday',
			date: '2024-01-14'
		}
	]
};

const buildConversationIcon = (conversationId) => {
	switch (conversationId) {
		case 1:
			return <User2 size={18} strokeWidth={1.5} />;
		case 2:
			return <Building2 size={18} strokeWidth={1.5} />;
		case 3:
			return <Hotel size={18} strokeWidth={1.5} />;
		default:
			return <User2 size={18} strokeWidth={1.5} />;
	}
};

const normalizeConversation = (conversation) => ({
	...conversation,
	avatarIcon: buildConversationIcon(conversation.id)
});

const stripConversationForSave = (conversation) => ({
	id: conversation.id,
	customerName: conversation.customerName,
	lastMessage: conversation.lastMessage,
	timestamp: conversation.timestamp,
	unread: conversation.unread
});

function VendorCommunication() {
	const { showError, showSuccess } = useNotification();
	const [loading, setLoading] = useState(true);
	const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS.map(normalizeConversation));
	const [messagesByConversation, setMessagesByConversation] = useState(DEFAULT_MESSAGES_BY_CONVERSATION);
	const [selectedConversationId, setSelectedConversationId] = useState(1);
	const [newMessage, setNewMessage] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const loadChatState = async () => {
			try {
				setLoading(true);
				const profile = await vendorService.getProfile();
				const chatThreads = profile.chatThreads || {};
				const storedConversations = Array.isArray(chatThreads.conversations) && chatThreads.conversations.length
					? chatThreads.conversations
					: DEFAULT_CONVERSATIONS;
				const storedMessages = chatThreads.messagesByConversation && typeof chatThreads.messagesByConversation === 'object'
					? chatThreads.messagesByConversation
					: DEFAULT_MESSAGES_BY_CONVERSATION;

				setConversations(storedConversations.map(normalizeConversation));
				setMessagesByConversation(storedMessages);
				setSelectedConversationId(chatThreads.selectedConversationId || storedConversations[0]?.id || 1);
			} catch (error) {
				console.error('Failed to load chat state:', error);
				showError(error?.response?.data?.message || error?.message || 'Failed to load conversations');
			} finally {
				setLoading(false);
			}
		};

		loadChatState();
	}, [showError]);

	const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || conversations[0];
	const messages = messagesByConversation[selectedConversation?.id] || [];

	const filteredConversations = conversations.filter((conversation) =>
		conversation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const persistChatState = async (nextConversations, nextMessagesByConversation, nextSelectedConversationId) => {
		await vendorService.updateProfile({
			chatThreads: {
				conversations: nextConversations.map(stripConversationForSave),
				messagesByConversation: nextMessagesByConversation,
				selectedConversationId: nextSelectedConversationId
			}
		});
	};

	const handleConversationSelect = async (conversationId) => {
		const nextConversations = conversations.map((conversation) => (
			conversation.id === conversationId
				? { ...conversation, unread: false }
				: conversation
		));

		setSelectedConversationId(conversationId);
		setConversations(nextConversations);

		try {
			await persistChatState(nextConversations, messagesByConversation, conversationId);
		} catch (error) {
			showError(error?.response?.data?.message || error?.message || 'Failed to save conversation state');
		}
	};

	const sendMessage = async () => {
		const trimmedMessage = newMessage.trim();
		if (!trimmedMessage || !selectedConversation) {
			return;
		}

		const nextMessage = {
			id: messages.length + 1,
			sender: 'vendor',
			text: trimmedMessage,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			date: new Date().toLocaleDateString()
		};

		const nextMessagesByConversation = {
			...messagesByConversation,
			[selectedConversation.id]: [...messages, nextMessage]
		};
		const nextConversations = conversations.map((conversation) => (
			conversation.id === selectedConversation.id
				? {
					...conversation,
					lastMessage: trimmedMessage,
					timestamp: 'Just now',
					unread: false
				}
				: conversation
		));

		try {
			await persistChatState(nextConversations, nextMessagesByConversation, selectedConversation.id);
			setMessagesByConversation(nextMessagesByConversation);
			setConversations(nextConversations);
			setNewMessage('');
			showSuccess('Message saved');
		} catch (error) {
			showError(error?.response?.data?.message || error?.message || 'Failed to save message');
		}
	};

	return (
		<div className={styles.container}>
			{loading && <p className={styles.loadingText}>Loading conversations...</p>}
			<div style={{
				marginBottom: '1rem',
				padding: '0.9rem 1rem',
				borderRadius: 'var(--radius-lg)',
				border: '1px solid var(--border)',
				backgroundColor: 'var(--primary-light)',
				color: 'var(--text-primary)',
				fontSize: '0.92rem'
			}}>
				Messages are persisted with your vendor profile.
			</div>
			{/* Conversations Sidebar */}
			<div className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<h2 className={styles.sidebarTitle}>Conversations</h2>
					<input
						type="text"
						placeholder="Search conversations..."
						className={styles.searchBox}
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
					/>
				</div>
				<div className={styles.conversationList}>
					{filteredConversations.map((conv) => (
						<div
							key={conv.id}
							className={selectedConversation?.id === conv.id ? styles.conversationItemActive : styles.conversationItem}
							onClick={() => handleConversationSelect(conv.id)}
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
					{messages.map((msg) => (
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
