import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VendorLayout.css';

function VendorLayout({ children }) {
	const navigate = useNavigate();
	const location = useLocation();
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const menuItems = [
		{ path: '/vendor/dashboard', label: 'Dashboard', icon: '📊' },
		{ path: '/vendor/orders', label: 'Orders', icon: '📦' },
		{ path: '/vendor/products', label: 'Products', icon: '💊' },
		{ path: '/vendor/shipping', label: 'Shipping', icon: '🚚' },
		{ path: '/vendor/analytics', label: 'Analytics', icon: '📈' },
		{ path: '/vendor/payments', label: 'Payments', icon: '💰' },
		{ path: '/vendor/compliance', label: 'Compliance', icon: '📋' },
		{ path: '/vendor/chat', label: 'Chat', icon: '💬' },
		{ path: '/vendor/settings', label: 'Settings', icon: '⚙️' }
	];

	const isActive = (path) => location.pathname === path;

	return (
		<div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
			{/* Sidebar */}
			<aside
				style={{
					width: sidebarOpen ? '280px' : '80px',
					backgroundColor: '#1a1a2e',
					color: 'white',
					transition: 'width 0.3s ease',
					borderRight: '1px solid rgba(255,255,255,0.1)',
					overflow: 'hidden',
					position: 'fixed',
					height: '100vh',
					left: 0,
					top: 0,
					zIndex: 100
				}}
			>
				{/* Sidebar Header */}
				<div style={{
					padding: '1.5rem',
					borderBottom: '1px solid rgba(255,255,255,0.1)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					{sidebarOpen && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
							<div style={{ fontSize: '1.5rem' }}>💊</div>
							<h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>MedBroker</h2>
						</div>
					)}
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						style={{
							background: 'none',
							border: 'none',
							color: 'white',
							cursor: 'pointer',
							fontSize: '1.2rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						{sidebarOpen ? '‹' : '›'}
					</button>
				</div>

				{/* Menu Items */}
				<nav style={{ paddingTop: '1rem' }}>
					{menuItems.map(item => (
						<button
							key={item.path}
							onClick={() => navigate(item.path)}
							style={{
								width: '100%',
								padding: '1rem 1.5rem',
								backgroundColor: isActive(item.path) ? 'var(--primary)' : 'transparent',
								border: 'none',
								color: 'white',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '1rem',
								transition: 'background-color 0.2s',
								borderLeft: isActive(item.path) ? '4px solid white' : 'none'
							}}
							onMouseEnter={(e) => {
								if (!isActive(item.path)) {
									e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
								}
							}}
							onMouseLeave={(e) => {
								if (!isActive(item.path)) {
									e.target.style.backgroundColor = 'transparent';
								}
							}}
						>
							<span style={{ fontSize: '1.3rem', minWidth: '24px', textAlign: 'center' }}>
								{item.icon}
							</span>
							{sidebarOpen && (
								<span style={{ fontSize: '0.9rem', fontWeight: isActive(item.path) ? '600' : '500' }}>
									{item.label}
								</span>
							)}
						</button>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<main
				style={{
					flex: 1,
					marginLeft: sidebarOpen ? '280px' : '80px',
					transition: 'margin-left 0.3s ease',
					overflow: 'auto'
				}}
			>
				{children}
			</main>
		</div>
	);
}

export default VendorLayout;
