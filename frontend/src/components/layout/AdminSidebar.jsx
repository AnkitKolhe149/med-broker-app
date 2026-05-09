import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Pill,
  Boxes,
  RotateCcw,
  LifeBuoy,
  ShieldAlert,
  FileCheck,
  Bell,
  Plug,
  Settings,
  BarChart3,
  CreditCard,
  ClipboardList,
  X,
  LogOut,
} from 'lucide-react';
import authService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const mainMenuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/vendors', icon: Building2, label: 'Vendors' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/admin/payouts', icon: CreditCard, label: 'Payouts' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  const operationsItems = [
    { path: '/admin/catalog', icon: Package, label: 'Catalog' },
    { path: '/admin/inventory', icon: Boxes, label: 'Inventory' },
    { path: '/admin/prescriptions', icon: Pill, label: 'Prescriptions' },
    { path: '/admin/returns-refunds', icon: RotateCcw, label: 'Returns & Refunds' },
  ];

  const governanceItems = [
    { path: '/admin/support-tickets', icon: LifeBuoy, label: 'Support Tickets' },
    { path: '/admin/disputes', icon: ShieldAlert, label: 'Disputes' },
    { path: '/admin/compliance', icon: FileCheck, label: 'Compliance' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="admin-sidebar-header">
        <Link to="/admin" className="admin-logo">
          <span className="topnav-logo-mark" aria-hidden="true">✚</span>
          <span className="topnav-logo-word">
            <span className="topnav-logo-med">Med</span>
            <span className="topnav-logo-iq">IQ</span>
          </span>
          <span className="topnav-logo-trust">Admin Console</span>
        </Link>
        <button
          className="admin-sidebar-toggle admin-mobile-only"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        <p className="admin-sidebar-section-title">Main Menu</p>
        {mainMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <item.icon size={18} />
            <span className="admin-nav-label">{item.label}</span>
          </Link>
        ))}

        <p className="admin-sidebar-section-title">Operations</p>
        {operationsItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <item.icon size={18} />
            <span className="admin-nav-label">{item.label}</span>
          </Link>
        ))}

        <p className="admin-sidebar-section-title">Governance</p>
        {governanceItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
          >
            <item.icon size={18} />
            <span className="admin-nav-label">{item.label}</span>
          </Link>
        ))}

        <p className="admin-sidebar-section-title">Teams</p>
        <div className="admin-team-list">
          <span className="admin-team-chip">Marketing</span>
          <span className="admin-team-chip">Development</span>
          <span className="admin-team-chip">Finance</span>
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;