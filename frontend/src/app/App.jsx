import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context providers
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { UserProvider } from '../context/UserContext';
import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';

// Layout components
import AppShell from '../components/layout/AppShell';
import VendorLayout from '../components/layout/VendorLayout';
import AdminLayout from '../components/layout/AdminLayout';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import ChatbotFloatingButton from '../components/layout/ChatbotFloatingButton';
import ChatbotPanel from '../components/layout/ChatbotPanel';

// Auth guard
import AuthGuard from './authGuard';

// Public pages
import Landing from '../pages/public/Landing';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import VendorOnboarding from '../pages/public/VendorOnboarding';
import CustomerOnboarding from '../pages/public/CustomerOnboarding';
import HelpCenter from '../pages/public/HelpCenter';
import ContactUs from '../pages/public/ContactUs';
import FAQ from '../pages/public/FAQ';
import TermsOfService from '../pages/public/TermsOfService';
import HelpArticle from '../pages/public/HelpArticle';
import About from '../pages/public/About';
import PublicLayout from '../components/layout/PublicLayout';

// Customer pages
import CustomerDashboard from '../pages/customer/Dashboard';
import Catalog from '../pages/customer/Catalog';
import MedicineDetail from '../pages/customer/MedicineDetail';
import Favorites from '../pages/customer/Favorites';
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
import VendorStockManager from '../pages/vendor/StockManager';
import VendorShipping from '../pages/vendor/Shipping';
import VendorPayments from '../pages/vendor/Payments';
import VendorAnalytics from '../pages/vendor/Analytics';
import VendorCompliance from '../pages/vendor/Compliance';
import VendorCommunication from '../pages/vendor/Communication';
import VendorSettings from '../pages/vendor/Settings';
import VendorDemandForecasting from '../pages/vendor/DemandForecasting';


// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminVendors from '../pages/admin/Vendors';
import AdminPayouts from '../pages/admin/Payouts';
import AdminUsers from '../pages/admin/Users';
import AdminOrders from '../pages/admin/Orders';
import AdminReports from '../pages/admin/Reports';
import AdminPricingRules from '../pages/admin/PricingRules';
import AdminCatalog from '../pages/admin/Catalog';
import AdminInventory from '../pages/admin/Inventory';
import AdminPrescriptions from '../pages/admin/Prescriptions';
import AdminReturnsRefunds from '../pages/admin/ReturnsRefunds';
import AdminSupportTickets from '../pages/admin/SupportTickets';
import AdminDisputes from '../pages/admin/Disputes';
import AdminCompliance from '../pages/admin/Compliance';
import AdminNotifications from '../pages/admin/Notifications';
import AdminIntegrations from '../pages/admin/Integrations';
import AdminSettings from '../pages/admin/Settings';
function App() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <NotificationProvider>
            <UserProvider>
                <CurrencyProvider>
                        <FavoritesProvider>
                        <CartProvider>
                        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            {/* Animated background layer */}
                            <AnimatedBackground />
                            
                            <div className="app-content-layer">
                            <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/support/help-center" element={<HelpCenter />} />
                    <Route path="/support/contact-us" element={<ContactUs />} />
                    <Route path="/support/faq" element={<FAQ />} />
                    <Route path="/support/terms" element={<TermsOfService />} />
                    <Route path="/support/help-center/:topicId" element={<HelpArticle />} />
                    <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
                    
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
                    <Route path="/customer/favorites" element={
                        <AuthGuard requiredRole="CUSTOMER" requireCompleteProfile={true}>
                            <AppShell><Favorites /></AppShell>
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
                    <Route path="/vendor/stock" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorStockManager /></VendorLayout>
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
                    <Route path="/vendor/demand-forecasting" element={
                        <AuthGuard requiredRole="VENDOR" requireCompleteProfile={true}>
                            <VendorLayout><VendorDemandForecasting /></VendorLayout>
                        </AuthGuard>
                    } />
                    
                    {/* Admin routes (require authentication and admin role) */}
                    <Route path="/admin" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminDashboard /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/dashboard" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminDashboard /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/vendors" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminVendors /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/users" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminUsers /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/orders" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminOrders /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/payouts" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminPayouts /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/reports" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminReports /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/pricing-rules" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminPricingRules /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/catalog" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminCatalog /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/inventory" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminInventory /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/prescriptions" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminPrescriptions /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/returns-refunds" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminReturnsRefunds /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/support-tickets" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminSupportTickets /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/disputes" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminDisputes /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/compliance" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminCompliance /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/notifications" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminNotifications /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/integrations" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminIntegrations /></AdminLayout>
                        </AuthGuard>
                    } />
                    <Route path="/admin/settings" element={
                        <AuthGuard requiredRole="ADMIN" requireCompleteProfile={true}>
                            <AdminLayout><AdminSettings /></AdminLayout>
                        </AuthGuard>
                    } />
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        <ChatbotPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                        <ChatbotFloatingButton
                            isOpen={isChatOpen}
                            onClick={() => setIsChatOpen((prev) => !prev)}
                        />
                        </div>
                        </Router>
                        </CartProvider>
                        </FavoritesProvider>
            </CurrencyProvider>
            </UserProvider>
        </NotificationProvider>
    );
}

export default App;