import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';
import {
  BarChart2, Package, PackageSearch, Pill,
  Truck, TrendingUp, Wallet, ClipboardList,
  MessageSquare, Settings, LogOut
} from 'lucide-react';
import './VendorLayout.css';

function VendorLayout({ children }) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

	const menuSections = [
		{
			title: 'Operations',
			items: [
				{ path: '/vendor/dashboard', label: 'Dashboard', icon: <BarChart2 size={18} strokeWidth={1.5} />, hint: 'Business overview', description: 'Track sales, orders and stock alerts' },
				{ path: '/vendor/orders', label: 'Orders', icon: <Package size={18} strokeWidth={1.5} />, hint: 'Incoming demand', description: 'Process and update order statuses' },
				{ path: '/vendor/products', label: 'Inventory & Products', icon: <Pill size={18} strokeWidth={1.5} />, hint: 'Add / update products', description: 'Manage medicines, pricing, images and listing details' },
				{ path: '/vendor/stock', label: 'Stock Manager', icon: <PackageSearch size={18} strokeWidth={1.5} />, hint: 'Live quantity control', description: 'Adjust medicine stock levels and sync customer availability' },
				{ path: '/vendor/shipping', label: 'Shipping', icon: <Truck size={18} strokeWidth={1.5} />, hint: 'Dispatch tracking', description: 'Track deliveries and shipment status' }
			]
		},
		{
			title: 'Business Intelligence',
			items: [
				{ path: '/vendor/analytics', label: 'Analytics', icon: <TrendingUp size={18} strokeWidth={1.5} />, hint: 'Performance insights', description: 'Monitor trends and business KPIs' },
				{ path: '/vendor/payments', label: 'Payments', icon: <Wallet size={18} strokeWidth={1.5} />, hint: 'Payouts & ledger', description: 'Review transactions and settlement details' },
				{ path: '/vendor/compliance', label: 'Compliance', icon: <ClipboardList size={18} strokeWidth={1.5} />, hint: 'Document health', description: 'Manage documents, audits and compliance tasks' }
			]
		},
		{
			title: 'Support',
			items: [
				{ path: '/vendor/chat', label: 'Chat', icon: <MessageSquare size={18} strokeWidth={1.5} />, hint: 'Conversations', description: 'Respond to customer and partner messages' },
				{ path: '/vendor/settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.5} />, hint: 'Account controls', description: 'Update account, notification and security settings' }
			]
		}
	];

	const menuItems = menuSections.flatMap((section) => section.items);

	const isActive = (path) => location.pathname === path;
	const activeMenuItem = menuItems.find((item) => isActive(item.path));

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

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
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
							<div className="vendor-menu-item-icon"><Pill size={18} strokeWidth={1.5} /></div>
							<h2>medIQ</h2>
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
					{menuSections.map((section) => (
						<div key={section.title} className="vendor-sidebar-section">
							{!isCollapsed && (
								<p className="vendor-sidebar-section-title">{section.title}</p>
							)}
							{section.items.map(item => (
								<button
									key={item.path}
									onClick={() => navigate(item.path)}
									className={`vendor-menu-item ${isActive(item.path) ? 'active' : ''}`}
									aria-current={isActive(item.path) ? 'page' : undefined}
									title={isCollapsed ? item.label : undefined}
								>
									<span className="vendor-menu-item-icon">{item.icon}</span>
									{!isCollapsed && (
										<span className="vendor-menu-item-content">
											<span className="vendor-menu-item-label">{item.label}</span>
											<span className="vendor-menu-item-hint">{item.hint}</span>
										</span>
									)}
								</button>
							))}
						</div>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<main className={`vendor-main ${isCollapsed ? 'expanded' : ''}`}>
				<div className="vendor-utility-bar">
					<div className="vendor-utility-context">
						<p className="vendor-utility-title">{activeMenuItem?.label || 'Vendor Workspace'}</p>
						<p className="vendor-utility-subtitle">{activeMenuItem?.description || 'Manage your operations, inventory and business performance'}</p>
					</div>
					<div className="vendor-utility-actions">
						<button type="button" className="vendor-quick-action" onClick={() => navigate('/vendor/orders')}>Open Orders</button>
						<button type="button" className="vendor-quick-action" onClick={() => navigate('/vendor/stock')}>Manage Stock</button>
						<button
							type="button"
							className="vendor-quick-action vendor-quick-action-premium-logout"
							onClick={handleLogout}
						>
							<span aria-hidden="true"><LogOut size={18} strokeWidth={1.5} /></span> Logout
						</button>
					</div>
				</div>
				{children}
			</main>
		</div>
	);
}

export default VendorLayout;
