import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminPricingRules = () => (
	<AdminModulePage
		title="Pricing Rules"
		description="Manage platform margins, rule-based pricing, and promotional guardrails."
		priority="Medium"
		capabilities={[
			'Category and tier based markup rules',
			'Promotion conflict prevention',
			'Dynamic pricing policy controls',
			'Margin protection alerts',
		]}
	/>
);

export default AdminPricingRules;
