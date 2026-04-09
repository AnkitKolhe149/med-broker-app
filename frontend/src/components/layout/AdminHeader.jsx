import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, Plus } from 'lucide-react';
import authService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ sidebarOpen, setSidebarOpen }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

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

                <div className="admin-header-context">
                    <span className="admin-context-pill active">Full Statistics</span>
                    <span className="admin-context-pill">Results Summary</span>
                </div>
            </div>

            <div className="admin-header-right">
                <button className="admin-header-icon-btn" aria-label="Create">
                    <Plus size={18} />
                </button>
                <button className="admin-header-icon-btn" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="admin-notification-badge">3</span>
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
