import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context providers
import { CartProvider } from '../context/CartContext';
import { UserProvider } from '../context/UserContext';
import { NotificationProvider } from '../context/NotificationContext';

// Layout components
import AppShell from '../components/layout/AppShell';
import VendorLayout from '../components/layout/VendorLayout';

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
import MedicineDetail from '../pages/customer/MedicineDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import Payment from '../pages/customer/Payment';
import OrderConfirmation from '../pages/customer/OrderConfirmation';
import OrdersHistory from '../pages/customer/OrdersHistory';
import CustomerProfile from '../pages/customer/Profile';

// Vendor pages
import VendorDashboard from '../pages/vendor/Dashboard';
import VendorOrders from '../pages/vendor/Orders';
import VendorMedicineManager from '../pages/vendor/MedicineManager';
import VendorShipping from '../pages/vendor/Shipping';
import VendorPayments from '../pages/vendor/Payments';
import VendorAnalytics from '../pages/vendor/Analytics';
import VendorCompliance from '../pages/vendor/Compliance';
import VendorCommunication from '../pages/vendor/Communication';
import VendorSettings from '../pages/vendor/Settings';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';

function App() {
    return (
        <NotificationProvider>
            <UserProvider>
                <CartProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Onboarding routes (require authentication but not complete profile) */}
                    <Route path="/onboarding/vendor" element={<VendorOnboarding />} />
                    <Route path="/onboarding/customer" element={<CustomerOnboarding />} />
                    <Route path="/customer/onboarding" element={<CustomerOnboarding />} />
                    
                    {/* Customer routes (require authentication and complete profile) */}
                    <Route path="/customer/dashboard" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><CustomerDashboard /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/catalog" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><Catalog /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/medicine/:id" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><MedicineDetail /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/cart" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><Cart /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/checkout" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><Checkout /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/payment" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><Payment /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/order-confirmation/:orderId" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><OrderConfirmation /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/orders" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><OrdersHistory /></AppShell>
                        </AuthGuard>
                    } />
                    <Route path="/customer/profile" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><CustomerProfile /></AppShell>
                        </AuthGuard>
                    } />
                    
                    {/* Vendor routes (require authentication and complete profile) */}
                    <Route path="/vendor/dashboard" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorDashboard /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/orders" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorOrders /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/products" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorMedicineManager /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/shipping" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorShipping /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/payments" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorPayments /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/analytics" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorAnalytics /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/compliance" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorCompliance /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/chat" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorCommunication /></VendorLayout>
                        </AuthGuard>
                    } />
                    <Route path="/vendor/settings" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorSettings /></VendorLayout>
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
                </CartProvider>
            </UserProvider>
        </NotificationProvider>
    );
}

export default App;