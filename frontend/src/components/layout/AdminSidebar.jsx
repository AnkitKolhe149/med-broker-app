import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import authService from '../../services/auth.service';
import { 
    LayoutDashboard, 
    Users, 
    Wallet,
    LogOut 
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Analytics' },
        { path: '/admin/vendors', icon: <Users size={20} />, label: 'Vendor Approvals' },
        { path: '/admin/payouts', icon: <Wallet size={20} />, label: 'Payouts & Finance' }
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h2>MedBroker <span className="admin-badge">Admin</span></h2>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name || 'Administrator'}</span>
                        <span className="user-role">System Admin</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
