import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/admin.css';

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    return (
        <div className="admin-layout">
            <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay admin-mobile-only"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div className="admin-main">
                <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
