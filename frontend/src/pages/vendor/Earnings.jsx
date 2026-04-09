import React from 'react';
import { Navigate } from 'react-router-dom';

function VendorEarnings() {
	return <Navigate to="/vendor/payments" replace />;
}

export default VendorEarnings;
