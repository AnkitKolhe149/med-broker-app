import React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import styles from './CustomerAccountSidebar.module.css';

const MENU_ITEMS = [
  { key: 'my-profile', label: 'My Profile', icon: '👤', route: '/customer/profile' },
  { key: 'my-list', label: 'My List', icon: '📋', route: '/customer/favorites' },
  { key: 'my-orders', label: 'My Orders', icon: '✓', route: '/customer/orders' },
  { key: 'payments', label: 'Payments', icon: '💳', route: '/customer/orders?tab=previous' },
  { key: 'referrals', label: 'Referrals', icon: '➤', route: '/customer/dashboard' }
];

function CustomerAccountSidebar({ user, activeItem, hiddenItemKeys = [] }) {
  const navigate = useNavigate();
  const profileName = user?.customer?.fullName || 'Customer';
  const profileEmail = user?.email || 'No email';
  const buyerType = user?.customer?.buyerType || 'RETAIL';
  const visibleMenuItems = MENU_ITEMS.filter((item) => !hiddenItemKeys.includes(item.key));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTopGlow} />

      <div className={styles.profileCard}>
        <Avatar
          src={user?.customer?.profileImage}
          name={profileName}
          size={48}
        />
        <div>
          <p className={styles.profileName}>{profileName}</p>
          <p className={styles.profileSub}>{profileEmail}</p>
          <span className={styles.profileTag}>{buyerType}</span>
        </div>
      </div>

      <p className={styles.sectionLabel}>Navigation</p>
      <nav className={styles.menuList}>
        {visibleMenuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.route)}
            className={`${styles.menuItem} ${activeItem === item.key ? styles.menuItemActive : ''}`}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
            <span className={styles.menuArrow}>›</span>
          </button>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={styles.footerTitle}>Quick Access</p>
        <div className={styles.quickActions}>
          <button type="button" className={styles.quickButton} onClick={() => navigate('/customer/catalog')}>
            Browse Medicines
          </button>
          <button type="button" className={styles.quickButton} onClick={() => navigate('/customer/cart')}>
            Open Cart
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CustomerAccountSidebar;
