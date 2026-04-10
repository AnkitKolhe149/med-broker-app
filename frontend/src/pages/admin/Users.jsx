import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import AdminPagination from '../../components/common/AdminPagination';
import './AdminOperations.css';

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [summary, setSummary] = useState({ totalUsers: 0, roleCounts: {} });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [role, setRole] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

	const loadUsers = async () => {
		try {
			setLoading(true);
			setError('');
			const response = await adminService.getUsersOverview({
				page: currentPage,
				limit: pageSize,
				role: role || undefined,
				search: search || undefined
			});
			setUsers(response?.data || []);
			setSummary(response?.summary || { totalUsers: 0, roleCounts: {} });
			setPagination(response?.pagination || { page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
		} catch (error) {
			console.error('Failed to load users overview', error);
			setError('Unable to fetch users right now.');
			setUsers([]);
			setPagination({ page: currentPage, limit: pageSize, total: 0, totalPages: 1 });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUsers();
	}, [role, currentPage, pageSize]);

	const handleSearch = () => {
		if (currentPage === 1) {
			loadUsers();
			return;
		}
		setCurrentPage(1);
	};

	if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading users...</div>;
	if (error) return <div className="admin-error">{error}</div>;

	return (
		<section className="admin-ops-page">
			<header className="page-header">
				<div>
					<h1>User Management</h1>
					<p>Monitor all customer, vendor, and admin accounts with lifecycle visibility.</p>
				</div>
			</header>

			<div className="admin-ops-summary">
				<div className="admin-ops-summary-card"><h4>Total Users</h4><p>{summary.totalUsers}</p></div>
				<div className="admin-ops-summary-card"><h4>Customers</h4><p>{summary.roleCounts?.CUSTOMER || 0}</p></div>
				<div className="admin-ops-summary-card"><h4>Vendors</h4><p>{summary.roleCounts?.VENDOR || 0}</p></div>
				<div className="admin-ops-summary-card"><h4>Admins</h4><p>{summary.roleCounts?.ADMIN || 0}</p></div>
			</div>

			<div className="admin-ops-toolbar">
				<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, mobile" />
				<button className="btn btn-secondary" onClick={handleSearch}>Search</button>
				<select value={role} onChange={(e) => { setRole(e.target.value); setCurrentPage(1); }}>
					<option value="">All roles</option>
					<option value="CUSTOMER">Customer</option>
					<option value="VENDOR">Vendor</option>
					<option value="ADMIN">Admin</option>
				</select>
			</div>

			<div className="admin-ops-table-wrap">
				<table className="admin-table">
					<thead>
						<tr>
							<th>User</th>
							<th>Role</th>
							<th>Region</th>
							<th>Currency</th>
							<th>Status</th>
							<th>Last Login</th>
						</tr>
					</thead>
					<tbody>
						{users.length === 0 ? (
							<tr>
								<td colSpan="6" className="admin-muted">No users found for current filters.</td>
							</tr>
						) : users.map((user) => {
							const region = user.customer
								? `${user.customer.city || '-'}, ${user.customer.country || '-'}`
								: user.vendor
									? `${user.vendor.companyName || '-'} (${user.vendor.country || '-'})`
									: '-';

							return (
								<tr key={user.id}>
									<td>
										<strong>{user.name || 'Unnamed User'}</strong>
										<div className="admin-muted">{user.email}</div>
									</td>
									<td>{user.role}</td>
									<td>{region}</td>
									<td>{user.preferredCurrency || 'INR'}</td>
									<td><span className={`admin-pill ${user.isActive ? 'succeeded' : 'failed'}`}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
									<td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<AdminPagination
				pagination={pagination}
				loading={loading}
				itemLabel="users"
				onPageChange={setCurrentPage}
				onPageSizeChange={(value) => {
					setPageSize(value);
					setCurrentPage(1);
				}}
			/>
		</section>
	);
};

export default AdminUsers;
