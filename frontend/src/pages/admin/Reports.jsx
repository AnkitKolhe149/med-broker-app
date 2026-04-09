import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminReports = () => (
	<AdminModulePage
		title="Reports & Analytics"
		description="Generate operational, financial, and compliance reports for executive decisions."
		priority="Medium"
		capabilities={[
			'Scheduled reporting',
			'Revenue and margin snapshots',
			'Vendor performance scorecards',
			'Export-ready compliance datasets',
		]}
	/>
);

export default AdminReports;
