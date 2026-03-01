import React, { useState } from 'react';

function VendorMedicineManager() {
	const [medicines, setMedicines] = useState([
		{
			id: 1,
			name: 'Paracetamol 500mg',
			category: 'Pain & Fever',
			manufacturer: 'Cipla Ltd',
			stock: 450,
			price: 25,
			costPrice: 18,
			margin: 28,
			description: 'Effective pain reliever and fever reducer',
			active: true
		},
		{
			id: 2,
			name: 'Amoxicillin 250mg',
			category: 'Antibiotics',
			manufacturer: 'GSK',
			stock: 280,
			price: 120,
			costPrice: 85,
			margin: 41,
			description: 'Broad-spectrum antibiotic',
			active: true
		},
		{
			id: 3,
			name: 'Cetirizine 10mg',
			category: 'Allergies',
			manufacturer: 'Alembic',
			stock: 600,
			price: 25,
			costPrice: 15,
			margin: 67,
			description: 'Fast-acting allergy relief',
			active: true
		},
		{
			id: 4,
			name: 'Aspirin 100mg',
			category: 'Pain & Fever',
			manufacturer: 'Bayer',
			stock: 0,
			price: 15,
			costPrice: 10,
			margin: 50,
			description: 'Daily aspirin for heart health',
			active: true
		}
	]);

	const [showAddForm, setShowAddForm] = useState(false);
	const [selectedMedicine, setSelectedMedicine] = useState(null);
	const [filterCategory, setFilterCategory] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [newMedicine, setNewMedicine] = useState({
		name: '',
		category: 'Pain & Fever',
		manufacturer: '',
		stock: '',
		price: '',
		costPrice: '',
		description: ''
	});

	const categories = ['Pain & Fever', 'Antibiotics', 'Allergies', 'Vitamins', 'Digestive', 'Cold & Cough'];

	const handleAddMedicine = () => {
		if (newMedicine.name && newMedicine.price) {
			const medicine = {
				id: Math.max(...medicines.map(m => m.id)) + 1,
				...newMedicine,
				stock: parseInt(newMedicine.stock) || 0,
				price: parseFloat(newMedicine.price),
				costPrice: parseFloat(newMedicine.costPrice) || 0,
				margin: newMedicine.costPrice ? Math.round(((newMedicine.price - newMedicine.costPrice) / newMedicine.costPrice) * 100) : 0,
				active: true
			};
			setMedicines([...medicines, medicine]);
			setNewMedicine({
				name: '',
				category: 'Pain & Fever',
				manufacturer: '',
				stock: '',
				price: '',
				costPrice: '',
				description: ''
			});
			setShowAddForm(false);
		}
	};

	const deleteMedicine = (id) => {
		setMedicines(medicines.filter(m => m.id !== id));
		setSelectedMedicine(null);
	};

	const filteredMedicines = medicines.filter(m => {
		if (filterCategory !== 'all' && m.category !== filterCategory) return false;
		if (filterStatus === 'in-stock' && m.stock === 0) return false;
		if (filterStatus === 'out-of-stock' && m.stock > 0) return false;
		return true;
	});

	const styles = {
		container: {
			padding: '2rem',
			backgroundColor: 'var(--surface)',
			minHeight: '100vh'
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '2rem'
		},
		headerLeft: {
			flex: 1
		},
		title: {
			fontSize: '2rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: 0,
			marginBottom: '0.3rem'
		},
		subtitle: {
			fontSize: '0.95rem',
			color: 'var(--text-secondary)',
			margin: 0
		},
		addButton: {
			padding: '0.8rem 1.5rem',
			backgroundColor: 'var(--primary)',
			color: 'white',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		filterBar: {
			display: 'flex',
			gap: '1.5rem',
			marginBottom: '2rem',
			flexWrap: 'wrap'
		},
		filterGroup: {
			display: 'flex',
			gap: '0.5rem'
		},
		filterLabel: {
			fontSize: '0.85rem',
			color: 'var(--text-secondary)',
			fontWeight: '600',
			alignSelf: 'center',
			textTransform: 'uppercase'
		},
		filterButton: {
			padding: '0.5rem 1rem',
			border: '1px solid var(--border)',
			backgroundColor: 'white',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s',
			fontSize: '0.85rem'
		},
		filterButtonActive: {
			padding: '0.5rem 1rem',
			border: 'none',
			backgroundColor: 'var(--primary)',
			color: 'white',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '500',
			transition: 'all 0.2s',
			fontSize: '0.85rem'
		},
		section: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			marginBottom: '2rem',
			overflow: 'hidden'
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse'
		},
		tableHeader: {
			backgroundColor: 'var(--surface)',
			fontWeight: '600',
			color: 'var(--text-primary)',
			padding: '1rem 1.5rem',
			textAlign: 'left',
			borderBottom: '2px solid var(--border)',
			fontSize: '0.9rem'
		},
		tableRow: {
			borderBottom: '1px solid var(--border)',
			transition: 'background-color 0.2s',
			cursor: 'pointer'
		},
		tableCell: {
			padding: '1rem 1.5rem',
			textAlign: 'left',
			fontSize: '0.9rem'
		},
		statusBadge: {
			display: 'inline-block',
			padding: '0.3rem 0.8rem',
			borderRadius: '9999px',
			fontSize: '0.8rem',
			fontWeight: '600',
			color: 'white'
		},
		modalOverlay: {
			display: 'none',
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0,0,0,0.5)',
			zIndex: 1000,
			alignItems: 'center',
			justifyContent: 'center'
		},
		modalActive: {
			display: 'flex'
		},
		modal: {
			backgroundColor: 'white',
			borderRadius: 'var(--radius-lg)',
			padding: '2rem',
			maxWidth: '600px',
			width: '90%',
			maxHeight: '80vh',
			overflow: 'auto',
			boxShadow: 'var(--shadow-lg)'
		},
		modalHeader: {
			fontSize: '1.5rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			marginBottom: '1.5rem',
			paddingBottom: '1rem',
			borderBottom: '1px solid var(--border)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		formGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
			gap: '1.5rem'
		},
		formGridFull: {
			display: 'grid',
			gridTemplateColumns: '1fr',
			gap: '1.5rem'
		},
		formGroup: {
			display: 'flex',
			flexDirection: 'column'
		},
		label: {
			fontSize: '0.85rem',
			fontWeight: '600',
			color: 'var(--text-primary)',
			marginBottom: '0.5rem',
			textTransform: 'uppercase'
		},
		input: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit'
		},
		textarea: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit',
			minHeight: '100px',
			resize: 'vertical'
		},
		select: {
			padding: '0.8rem',
			border: '1px solid var(--border)',
			borderRadius: 'var(--radius)',
			fontSize: '0.95rem',
			fontFamily: 'inherit',
			backgroundColor: 'white'
		},
		actionButtons: {
			display: 'flex',
			gap: '1rem',
			marginTop: '1.5rem'
		},
		button: {
			flex: 1,
			padding: '0.8rem',
			border: 'none',
			borderRadius: 'var(--radius)',
			cursor: 'pointer',
			fontWeight: '600',
			transition: 'all 0.2s'
		},
		primaryButton: {
			backgroundColor: 'var(--primary)',
			color: 'white'
		},
		secondaryButton: {
			backgroundColor: 'white',
			border: '1px solid var(--border)',
			color: 'var(--text-primary)'
		},
		dangerButton: {
			backgroundColor: 'var(--error)',
			color: 'white'
		},
		closeButton: {
			background: 'none',
			border: 'none',
			fontSize: '1.5rem',
			cursor: 'pointer',
			color: 'var(--text-secondary)'
		}
	};

	return (
		<div style={styles.container}>
			{/* Header */}
			<div style={styles.header}>
				<div style={styles.headerLeft}>
					<h1 style={styles.title}>Product Management</h1>
					<p style={styles.subtitle}>Manage your medicine catalog and inventory</p>
				</div>
				<button style={styles.addButton} onClick={() => setShowAddForm(true)}>
					+ Add Product
				</button>
			</div>

			{/* Filters */}
			<div style={styles.filterBar}>
				<div style={styles.filterGroup}>
					<span style={styles.filterLabel}>Category:</span>
					{['all', ...categories].map(cat => (
						<button
							key={cat}
							style={filterCategory === cat ? styles.filterButtonActive : styles.filterButton}
							onClick={() => setFilterCategory(cat)}
						>
							{cat === 'all' ? 'All' : cat}
						</button>
					))}
				</div>
				<div style={styles.filterGroup}>
					<span style={styles.filterLabel}>Stock:</span>
					{['all', 'in-stock', 'out-of-stock'].map(status => (
						<button
							key={status}
							style={filterStatus === status ? styles.filterButtonActive : styles.filterButton}
							onClick={() => setFilterStatus(status)}
						>
							{status === 'all' ? 'All' : status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
						</button>
					))}
				</div>
			</div>

			{/* Medicines Table */}
			<div style={styles.section}>
				<table style={styles.table}>
					<thead>
						<tr>
							<th style={styles.tableHeader}>Product Name</th>
							<th style={styles.tableHeader}>Category</th>
							<th style={styles.tableHeader}>Stock</th>
							<th style={styles.tableHeader}>Price</th>
							<th style={styles.tableHeader}>Margin</th>
							<th style={styles.tableHeader}>Status</th>
							<th style={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredMedicines.map(medicine => (
							<tr key={medicine.id} style={styles.tableRow}>
								<td style={styles.tableCell}>
									<strong>{medicine.name}</strong>
								</td>
								<td style={styles.tableCell}>{medicine.category}</td>
								<td style={styles.tableCell}>
									<strong>{medicine.stock} units</strong>
								</td>
								<td style={styles.tableCell}>
									<strong>₹{medicine.price}</strong>
								</td>
								<td style={styles.tableCell}>
									<strong style={{ color: medicine.margin > 40 ? 'var(--success)' : 'var(--warning)' }}>
										{medicine.margin}%
									</strong>
								</td>
								<td style={styles.tableCell}>
									<div
										style={{
											...styles.statusBadge,
											backgroundColor: medicine.stock > 0 ? 'var(--success)' : 'var(--error)'
										}}
									>
										{medicine.stock > 0 ? '✓ In Stock' : '✗ Out'}
									</div>
								</td>
								<td style={styles.tableCell}>
									<button
										style={{
											padding: '0.4rem 0.8rem',
											backgroundColor: 'var(--primary)',
											color: 'white',
											border: 'none',
											borderRadius: 'var(--radius)',
											cursor: 'pointer',
											fontSize: '0.85rem'
										}}
										onClick={() => setSelectedMedicine(medicine)}
									>
										Edit
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Add Medicine Modal */}
			<div style={showAddForm ? { ...styles.modalOverlay, ...styles.modalActive } : styles.modalOverlay}>
				<div style={styles.modal}>
					<div style={styles.modalHeader}>
						<div>Add New Product</div>
						<button
							style={styles.closeButton}
							onClick={() => setShowAddForm(false)}
						>
							✕
						</button>
					</div>

					<div style={styles.formGrid}>
						<div style={styles.formGroup}>
							<label style={styles.label}>Product Name</label>
							<input
								type="text"
								style={styles.input}
								placeholder="e.g., Paracetamol 500mg"
								value={newMedicine.name}
								onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
							/>
						</div>
						<div style={styles.formGroup}>
							<label style={styles.label}>Manufacturer</label>
							<input
								type="text"
								style={styles.input}
								placeholder="e.g., Cipla Ltd"
								value={newMedicine.manufacturer}
								onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
							/>
						</div>
						<div style={styles.formGroup}>
							<label style={styles.label}>Category</label>
							<select
								style={styles.select}
								value={newMedicine.category}
								onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
							>
								{categories.map(cat => (
									<option key={cat} value={cat}>{cat}</option>
								))}
							</select>
						</div>
						<div style={styles.formGroup}>
							<label style={styles.label}>Initial Stock</label>
							<input
								type="number"
								style={styles.input}
								placeholder="0"
								value={newMedicine.stock}
								onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
							/>
						</div>
						<div style={styles.formGroup}>
							<label style={styles.label}>Selling Price (₹)</label>
							<input
								type="number"
								style={styles.input}
								placeholder="0.00"
								step="0.01"
								value={newMedicine.price}
								onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
							/>
						</div>
						<div style={styles.formGroup}>
							<label style={styles.label}>Cost Price (₹)</label>
							<input
								type="number"
								style={styles.input}
								placeholder="0.00"
								step="0.01"
								value={newMedicine.costPrice}
								onChange={(e) => setNewMedicine({ ...newMedicine, costPrice: e.target.value })}
							/>
						</div>
					</div>

					<div style={styles.formGridFull}>
						<div style={styles.formGroup}>
							<label style={styles.label}>Description</label>
							<textarea
								style={styles.textarea}
								placeholder="Product description..."
								value={newMedicine.description}
								onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
							/>
						</div>
					</div>

					<div style={styles.actionButtons}>
						<button style={{ ...styles.button, ...styles.secondaryButton }} onClick={() => setShowAddForm(false)}>
							Cancel
						</button>
						<button style={{ ...styles.button, ...styles.primaryButton }} onClick={handleAddMedicine}>
							Add Product
						</button>
					</div>
				</div>
			</div>

			{/* Edit Medicine Modal */}
			<div style={selectedMedicine ? { ...styles.modalOverlay, ...styles.modalActive } : styles.modalOverlay}>
				{selectedMedicine && (
					<div style={styles.modal}>
						<div style={styles.modalHeader}>
							<div>Edit Product</div>
							<button
								style={styles.closeButton}
								onClick={() => setSelectedMedicine(null)}
							>
								✕
							</button>
						</div>

						<div style={{ ...styles.formGrid, marginBottom: '1.5rem' }}>
							<div style={styles.formGroup}>
								<label style={styles.label}>Product Name</label>
								<input type="text" style={styles.input} value={selectedMedicine.name} disabled />
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>Category</label>
								<input type="text" style={styles.input} value={selectedMedicine.category} disabled />
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>Stock</label>
								<input type="number" style={styles.input} value={selectedMedicine.stock} disabled />
							</div>
							<div style={styles.formGroup}>
								<label style={styles.label}>Price</label>
								<input type="number" style={styles.input} value={selectedMedicine.price} disabled />
							</div>
						</div>

						<div style={styles.actionButtons}>
							<button style={{ ...styles.button, ...styles.dangerButton }} onClick={() => {
								deleteMedicine(selectedMedicine.id);
							}}>
								Delete Product
							</button>
							<button style={{ ...styles.button, ...styles.secondaryButton }} onClick={() => setSelectedMedicine(null)}>
								Close
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default VendorMedicineManager;
