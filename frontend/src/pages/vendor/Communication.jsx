import React, { useState } from 'react';

function VendorCommunication() {
	const [conversations, setConversations] = useState([
		{
			id: 1,
			customerName: 'Dr. Rajesh Kumar',
			lastMessage: 'Can you provide bulk pricing for Paracetamol?',
			timestamp: '2 hours ago',
			unread: true,
			avatar: '👨‍⚕️'
		},
		{
			id: 2,
			customerName: 'Health Plus Clinic',
			lastMessage: 'Order received in good condition. Thanks!',
			timestamp: '5 hours ago',
			unread: false,
			avatar: '🏥'
		},
		{
			id: 3,
			customerName: 'Healing Hospital',
			lastMessage: 'When can you deliver the order?',
			timestamp: '1 day ago',
			unread: false,
			avatar: '🏨'
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
			text: '📎 Paracetamol_Bulk_Pricing_Jan2024.pdf',
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

	const styles = {
		container: {
			display: 'grid',
			gridTemplateColumns: '320px 1fr',
			gap: 0,
			minHeight: 'calc(100vh - 80px)',
			backgroundColor: 'white'
		},
		sidebar: {
			backgroundColor: 'var(--surface)',
			borderRight: '1px solid var(--border)',
			overflow: 'auto',
			maxHeight: 'calc(100vh - 80px)'
		},
		sidebarHeader: {
			padding: '1.5rem',
			borderBottom: '1px solid var(--border)',
			backgroundColor: 'white'
		},
		sidebarTitle: {
			fontSize: '1.1rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0,
			marginBottom: '1rem'
		},
		searchBox: {
			width: '100%',
			padding: '0.6rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.9rem',
			backgroundColor: 'white'
		},
		conversationList: {
			padding: '0.5rem'
		},
		conversationItem: {
			padding: '1rem',
			borderBottom: '1px solid var(--border)',
			cursor: 'pointer',
			transition: 'all 0.2s',
			backgroundColor: 'white'
		},
		conversationItemActive: {
			padding: '1rem',
			borderBottom: '1px solid var(--border)',
			cursor: 'pointer',
			backgroundColor: 'var(--primary-light)',
			borderLeft: '4px solid var(--primary)'
		},
		conversationHeader: {
			display: 'flex',
			alignItems: 'center',
			gap: '0.8rem',
			marginBottom: '0.5rem'
		},
		conversationAvatar: {
			fontSize: '1.5rem'
		},
		conversationName: {
			fontWeight: '600',
			color: 'var(--text-primary)',
			fontSize: '0.95rem'
		},
		conversationMeta: {
			fontSize: '0.8rem',
			color: 'var(--text-secondary)',
			whiteSpace: 'nowrap'
		},
		conversationPreview: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap'
		},
		unreadBadge: {
			display: 'inline-block',
			width: '10px',
			height: '10px',
			borderRadius: '50%',
			backgroundColor: 'var(--primary)',
			marginLeft: 'auto'
		},

		chatArea: {
			display: 'flex',
			flexDirection: 'column',
			height: 'calc(100vh - 80px)'
		},
		chatHeader: {
			padding: '1.5rem',
			borderBottom: '1px solid var(--border)',
			backgroundColor: 'white',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		chatHeaderTitle: {
			fontSize: '1.1rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0
		},
		chatMessages: {
			flex: 1,
			overflow: 'auto',
			padding: '1.5rem',
			display: 'flex',
			flexDirection: 'column',
			gap: '1rem',
			backgroundColor: 'var(--surface)'
		},
		messageGroup: {
			display: 'flex',
			flexDirection: 'column',
			gap: '0.3rem',
			marginBottom: '0.5rem'
		},
		messageBubble: {
			maxWidth: '70%',
			padding: '0.8rem 1rem',
			borderRadius: 'var(--radius)',
			wordWrap: 'break-word',
			fontSize: '0.95rem'
		},
		messageBubbleVendor: {
			maxWidth: '70%',
			padding: '0.8rem 1rem',
			borderRadius: 'var(--radius)',
			wordWrap: 'break-word',
			fontSize: '0.95rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			alignSelf: 'flex-end'
		},
		messageBubbleCustomer: {
			maxWidth: '70%',
			padding: '0.8rem 1rem',
			borderRadius: 'var(--radius)',
			wordWrap: 'break-word',
			fontSize: '0.95rem',
			backgroundColor: 'white',
			color: 'var(--text-primary)',
			border: '1px solid var(--border)',
			alignSelf: 'flex-start'
		},
		messageTime: {
			fontSize: '0.75rem',
			color: 'var(--text-secondary)',
			marginTop: '0.2rem'
		},
		inputArea: {
			padding: '1.5rem',
			backgroundColor: 'white',
			borderTop: '1px solid var(--border)',
			display: 'flex',
			gap: '0.8rem'
		},
		inputField: {
			flex: 1,
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			backgroundColor: 'var(--surface)',
			fontFamily: 'inherit'
		},
		sendButton: {
			padding: '0.8rem 1.5rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		fileMessage: {
			backgroundColor: 'var(--primary-light)',
			border: '1px solid var(--primary)',
			padding: '0.8rem 1rem',
			borderRadius: 'var(--radius)',
			display: 'flex',
			alignItems: 'center',
			gap: '0.5rem'
		},
		emptyState: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			color: 'var(--text-secondary)',
			textAlign: 'center'
		}
	};

	return (
		<div style={styles.container}>
			{/* Conversations Sidebar */}
			<div style={styles.sidebar}>
				<div style={styles.sidebarHeader}>
					<h2 style={styles.sidebarTitle}>Conversations</h2>
					<input
						type="text"
						placeholder="Search conversations..."
						style={styles.searchBox}
					/>
				</div>
				<div style={styles.conversationList}>
					{conversations.map(conv => (
						<div
							key={conv.id}
							style={selectedConversation.id === conv.id ? styles.conversationItemActive : styles.conversationItem}
							onClick={() => setSelectedConversation(conv)}
						>
							<div style={styles.conversationHeader}>
								<span style={styles.conversationAvatar}>{conv.avatar}</span>
								<div style={{ flex: 1 }}>
									<div style={styles.conversationName}>{conv.customerName}</div>
									<div style={styles.conversationMeta}>{conv.timestamp}</div>
								</div>
								{conv.unread && <div style={styles.unreadBadge} />}
							</div>
							<div style={styles.conversationPreview}>{conv.lastMessage}</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat Area */}
			<div style={styles.chatArea}>
				<div style={styles.chatHeader}>
					<div>
						<h2 style={styles.chatHeaderTitle}>{selectedConversation.customerName}</h2>
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

				<div style={styles.chatMessages}>
					{messages.map(msg => (
						<div key={msg.id} style={styles.messageGroup}>
							{msg.file ? (
								<div style={{
									...styles.messageBubble,
									...(msg.sender === 'vendor' ? { alignSelf: 'flex-end' } : {})
								}}>
									<div style={styles.fileMessage}>
										📎 {msg.text}
									</div>
									<div style={styles.messageTime}>{msg.timestamp}</div>
								</div>
							) : (
								<div style={msg.sender === 'vendor' ? styles.messageBubbleVendor : styles.messageBubbleCustomer}>
									{msg.text}
									<div style={{
										...styles.messageTime,
										color: msg.sender === 'vendor' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
									}}>
										{msg.timestamp}
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				<div style={styles.inputArea}>
					<input
						type="text"
						placeholder="Type your message..."
						style={styles.inputField}
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
					/>
					<button
						style={styles.sendButton}
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
