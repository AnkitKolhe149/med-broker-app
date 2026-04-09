import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminUsers = () => (
	<AdminModulePage
		title="User Management"
		description="Manage customer lifecycle, risk flags, and account controls."
		priority="High"
		capabilities={[
			'Customer profile governance',
			'Account suspension and reactivation',
			'Segmentation and lifecycle status',
			'User activity visibility',
		]}
	/>
);

export default AdminUsers;
