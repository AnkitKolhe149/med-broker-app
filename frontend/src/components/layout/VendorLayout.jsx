import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './VendorLayout.css';

function VendorLayout({ children }) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

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

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth <= 768;
			setIsMobileView(mobile);
			if (!mobile) {
				setIsMobileMenuOpen(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		if (isMobileMenuOpen) {
			setIsMobileMenuOpen(false);
		}
	}, [location.pathname]);

	const handleToggleSidebar = () => {
		if (isMobileView) {
			setIsMobileMenuOpen(prev => !prev);
			return;
		}
		setIsCollapsed(prev => !prev);
	};

	return (
		<div className="vendor-layout">
			<button
				className="vendor-mobile-toggle"
				onClick={() => setIsMobileMenuOpen(true)}
				aria-label="Open vendor navigation"
			>
				☰
			</button>

			<div
				className={`vendor-sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
				onClick={() => setIsMobileMenuOpen(false)}
				aria-hidden={!isMobileMenuOpen}
			/>

			{/* Sidebar */}
			<aside className={`vendor-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'open' : ''}`}>
				{/* Sidebar Header */}
				<div className="vendor-sidebar-header">
					{!isCollapsed && (
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
							<div className="vendor-menu-item-icon">💊</div>
							<h2>MedBroker</h2>
						</div>
					)}
					<button
						onClick={handleToggleSidebar}
						className="vendor-sidebar-toggle"
						aria-label={isMobileView ? 'Close vendor navigation' : 'Toggle vendor sidebar'}
					>
						{isMobileView ? '✕' : isCollapsed ? '›' : '‹'}
					</button>
				</div>

				{/* Menu Items */}
				<nav className="vendor-sidebar-nav">
					{menuItems.map(item => (
						<button
							key={item.path}
							onClick={() => navigate(item.path)}
							className={`vendor-menu-item ${isActive(item.path) ? 'active' : ''}`}
							aria-current={isActive(item.path) ? 'page' : undefined}
						>
							<span className="vendor-menu-item-icon">{item.icon}</span>
							{!isCollapsed && (
								<span className="vendor-menu-item-label">{item.label}</span>
							)}
						</button>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<main className={`vendor-main ${isCollapsed ? 'expanded' : ''}`}>
				{children}
			</main>
		</div>
	);
}

export default VendorLayout;
