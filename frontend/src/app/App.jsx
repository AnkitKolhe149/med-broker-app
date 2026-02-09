import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth guard
import AuthGuard from './authGuard';

// Public pages
import Landing from '../pages/public/Landing';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import VendorOnboarding from '../pages/public/VendorOnboarding';
import CustomerOnboarding from '../pages/public/CustomerOnboarding';

// Customer pages
import CustomerDashboard from '../pages/customer/Dashboard';
import Catalog from '../pages/customer/Catalog';

// Vendor pages
import VendorDashboard from '../pages/vendor/Dashboard';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Onboarding routes (require authentication but not complete profile) */}
                <Route path="/onboarding/vendor" element={<VendorOnboarding />} />
                <Route path="/onboarding/customer" element={<CustomerOnboarding />} />
                
                {/* Customer routes (require authentication and complete profile) */}
                <Route path="/customer/dashboard" element={
                    <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                        <CustomerDashboard />
                    </AuthGuard>
                } />
                <Route path="/customer/catalog" element={
                    <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                        <Catalog />
                    </AuthGuard>
                } />
                
                {/* Vendor routes (require authentication and complete profile) */}
                <Route path="/vendor/dashboard" element={
                    <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                        <VendorDashboard />
                    </AuthGuard>
                } />
                
                {/* Admin routes (require authentication and admin role) */}
                <Route path="/admin/dashboard" element={
                    <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                        <AdminDashboard />
                    </AuthGuard>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;