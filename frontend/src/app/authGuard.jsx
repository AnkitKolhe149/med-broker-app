import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

/**
 * AuthGuard component to protect routes
 * Checks authentication, role, and profile completion status
 */
function AuthGuard({ children, requiredRole, requireCompleteProfile = false }) {
	const [loading, setLoading] = useState(true);
	const [authenticated, setAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			// Check if user is authenticated
			if (!authService.isAuthenticated()) {
				setAuthenticated(false);
				setLoading(false);
				return;
			}

			// Fetch current user data
			const userData = await authService.getCurrentUser();
			setUser(userData);
			setAuthenticated(true);
		} catch (error) {
			console.error('Auth check failed:', error);
			authService.logout();
			setAuthenticated(false);
		} finally {
			setLoading(false);
		}
	};

	// Show loading state
	if (loading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				color: '#1E88E5'
			}}>
				<div style={{ textAlign: 'center' }}>
					<div className="spinner" style={{
						width: '50px',
						height: '50px',
						border: '4px solid #e0e0e0',
						borderTop: '4px solid #1E88E5',
						borderRadius: '50%',
						margin: '0 auto 1rem'
					}}></div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	// If not authenticated, redirect to login
	if (!authenticated) {
		return <Navigate to="/login" replace />;
	}

	// Check role if required
	if (requiredRole && user.role !== requiredRole) {
		// Redirect to appropriate dashboard based on user's actual role
		if (user.role === 'CUSTOMER') {
			return <Navigate to="/customer/catalog" replace />;
		} else if (user.role === 'VENDOR') {
			return <Navigate to="/vendor/dashboard" replace />;
		} else if (user.role === 'ADMIN') {
			return <Navigate to="/admin/dashboard" replace />;
		}
		return <Navigate to="/" replace />;
	}

	// Check profile completion if required
	if (requireCompleteProfile && !user.isProfileComplete) {
		// Redirect to onboarding based on role
		if (user.role === 'VENDOR') {
			return <Navigate to="/onboarding/vendor" replace />;
		} else if (user.role === 'CUSTOMER') {
			return <Navigate to="/customer/onboarding" replace />;
		}
	}

	// All checks passed, render children
	return <>{children}</>;
}

export default AuthGuard;
