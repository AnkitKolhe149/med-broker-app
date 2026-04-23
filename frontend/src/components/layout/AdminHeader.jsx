import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import authService from '../../services/auth.service';
import adminService from '../../services/admin.service';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ sidebarOpen, setSidebarOpen }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const tickets = await adminService.getSupportTicketsOverview({ status: 'OPEN' });
                setNotificationCount(tickets.pagination?.total || 0);
            } catch (error) {
                console.error("Failed to fetch notification count", error);
            }
        };
        fetchNotifications();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <button
                    className="admin-sidebar-toggle admin-desktop-only"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>


            </div>

            <div className="admin-header-right">
                <button className="admin-header-icon-btn" aria-label="Settings" onClick={() => navigate('/admin/settings')}>
                    <SettingsIcon size={20} strokeWidth={2} color="#4b5563" />
                </button>
                <button className="admin-header-icon-btn" aria-label="Notifications" onClick={() => navigate('/admin/notifications')}>
                    <Bell size={20} />
                    {notificationCount > 0 && <span className="admin-notification-badge">{notificationCount}</span>}
                </button>

                <div className="admin-user-menu">
                    <button
                        className="admin-user-profile"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        aria-label="User menu"
                    >
                        <div className="admin-user-avatar">
                            {user?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <span className="admin-user-name">Admin</span>
                        <ChevronDown size={16} />
                    </button>

                    {userMenuOpen && (
                        <div className="admin-dropdown-menu">
                            <div className="admin-dropdown-header">
                                <div className="admin-dropdown-user-info">
                                    <div className="admin-dropdown-avatar">
                                        {user?.email?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                        <div className="admin-dropdown-name">Administrator</div>
                                        <div className="admin-dropdown-email">{user?.email}</div>
                                    </div>
                                </div>
                            </div>
                            <hr className="admin-dropdown-divider" />
                            <button className="admin-dropdown-item logout" onClick={handleLogout}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
