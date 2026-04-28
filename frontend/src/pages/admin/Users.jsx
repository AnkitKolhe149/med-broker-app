import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import AdminPagination from '../../components/common/AdminPagination';
import './AdminOperations.css';

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [summary, setSummary] = useState({ totalUsers: 0, roleCounts: {} });
	const [globalSummary, setGlobalSummary] = useState({ totalUsers: 0, roleCounts: {} });
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

	// Fetch unfiltered global summary once on mount — never overwritten by filters
	useEffect(() => {
		adminService.getUsersOverview({ page: 1, limit: 1 })
			.then(res => setGlobalSummary(res?.summary || { totalUsers: 0, roleCounts: {} }))
			.catch(() => {});
	}, []);

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

	const handleRoleChange = async (userId, newRole) => {
		try {
			await adminService.updateUserRole(userId, newRole);
			setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
		} catch (error) {
			alert('Failed to update role');
		}
	};

	const handleBanToggle = async (user) => {
		const action = user.isBanned ? 'unban' : 'ban';
		const note = window.prompt(`Are you sure you want to ${action} this user? Please enter a moderation note:`);
		if (note === null) return; // User cancelled

		try {
			await adminService.updateUserModeration(user.id, !user.isBanned, note);
			setUsers(users.map(u => u.id === user.id ? { ...u, isBanned: !user.isBanned } : u));
		} catch (error) {
			alert(`Failed to ${action} user`);
		}
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
				<div
					className={`admin-ops-summary-card cursor-pointer hover:shadow-md transition-all active:scale-95 ${role === '' ? 'border-2 border-blue-500 bg-blue-50/50' : 'border border-transparent'}`}
					onClick={() => { setRole(''); setCurrentPage(1); }}
				>
					<h4>Total Users</h4><p>{globalSummary.totalUsers}</p>
				</div>
				<div
					className={`admin-ops-summary-card cursor-pointer hover:shadow-md transition-all active:scale-95 ${role === 'CUSTOMER' ? 'border-2 border-blue-500 bg-blue-50/50' : 'border border-transparent'}`}
					onClick={() => { setRole('CUSTOMER'); setCurrentPage(1); }}
				>
					<h4>Customers</h4><p>{globalSummary.roleCounts?.CUSTOMER || 0}</p>
				</div>
				<div
					className={`admin-ops-summary-card cursor-pointer hover:shadow-md transition-all active:scale-95 ${role === 'VENDOR' ? 'border-2 border-blue-500 bg-blue-50/50' : 'border border-transparent'}`}
					onClick={() => { setRole('VENDOR'); setCurrentPage(1); }}
				>
					<h4>Vendors</h4><p>{globalSummary.roleCounts?.VENDOR || 0}</p>
				</div>
				<div
					className={`admin-ops-summary-card cursor-pointer hover:shadow-md transition-all active:scale-95 ${role === 'ADMIN' ? 'border-2 border-blue-500 bg-blue-50/50' : 'border border-transparent'}`}
					onClick={() => { setRole('ADMIN'); setCurrentPage(1); }}
				>
					<h4>Admins</h4><p>{globalSummary.roleCounts?.ADMIN || 0}</p>
				</div>
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
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.length === 0 ? (
							<tr>
								<td colSpan="6" className="admin-muted">No users found for current filters.</td>
							</tr>
						) : users.map((user) => {
							const emailPrefix = user.email ? user.email.split('@')[0] : '';
							const displayName = user.name
								|| user.customer?.fullName
								|| user.vendor?.contactPersonName
								|| user.vendor?.companyName
								|| emailPrefix
								|| 'Unnamed User';
							const region = user.customer
								? `${user.customer.city || '-'}, ${user.customer.country || '-'}`
								: user.vendor
									? `${user.vendor.companyName || '-'} (${user.vendor.country || '-'})`
									: '-';

							const loggedInUserId = JSON.parse(localStorage.getItem('user'))?.id;
							const isSelf = user.id === loggedInUserId;

							return (
								<tr key={user.id}>
									<td>
										<strong>{displayName}</strong>
										<div className="admin-muted">{user.email}</div>
									</td>
									<td>
										<select
											value={user.role}
											onChange={(e) => handleRoleChange(user.id, e.target.value)}
											disabled={isSelf}
										>
											<option value="CUSTOMER">Customer</option>
											<option value="VENDOR">Vendor</option>
											<option value="ADMIN">Admin</option>
										</select>
									</td>
									<td>{region}</td>
									<td>{user.preferredCurrency || 'INR'}</td>
									<td><span className={`admin-pill ${user.isActive && !user.isBanned ? 'succeeded' : 'failed'}`}>{user.isBanned ? 'BANNED' : (user.isActive ? 'ACTIVE' : 'INACTIVE')}</span></td>
									<td>
										<button
											className="btn btn-secondary btn-sm"
											onClick={() => handleBanToggle(user)}
											disabled={isSelf}
										>
											{user.isBanned ? 'Unban' : 'Ban'}
										</button>
									</td>
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
