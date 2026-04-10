import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const PricingRules = () => {
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const response = await adminService.getSettingsOverview();
				setSettings(response?.data || null);
			} catch (error) {
				console.error('Failed to load pricing settings', error);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading pricing controls...</div>;
	if (!settings) return <div className="admin-error">Unable to load pricing settings.</div>;

	const rules = settings.pricing || {};

	return (
		<section className="admin-ops-page">
			<header className="page-header">
				<div>
					<h1>Pricing Rules</h1>
					<p>System-level policy guardrails for markups, discounts, and automatic pricing updates.</p>
				</div>
			</header>

			<div className="admin-ops-summary">
				<div className="admin-ops-summary-card"><h4>Base Markup</h4><p>{rules.baseMarkupPercent || 0}%</p></div>
				<div className="admin-ops-summary-card"><h4>Max Discount</h4><p>{rules.maxDiscountPercent || 0}%</p></div>
				<div className="admin-ops-summary-card"><h4>Auto-Reprice</h4><p>{rules.autoReprice ? 'Enabled' : 'Disabled'}</p></div>
				<div className="admin-ops-summary-card"><h4>Update Interval</h4><p>{rules.updateIntervalMinutes || 0} min</p></div>
			</div>

			<div className="admin-ops-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>Rule</th>
							<th>Current Value</th>
							<th>Scope</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Base Markup Percent</td>
							<td>{rules.baseMarkupPercent || 0}%</td>
							<td>Global</td>
						</tr>
						<tr>
							<td>Maximum Discount Percent</td>
							<td>{rules.maxDiscountPercent || 0}%</td>
							<td>Global</td>
						</tr>
						<tr>
							<td>Automatic Repricing</td>
							<td>{rules.autoReprice ? 'Enabled' : 'Disabled'}</td>
							<td>Marketplace</td>
						</tr>
						<tr>
							<td>Repricing Interval</td>
							<td>{rules.updateIntervalMinutes || 0} minutes</td>
							<td>Scheduler</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default PricingRules;
