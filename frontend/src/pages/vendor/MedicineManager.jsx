import React, { useState } from 'react';
import styles from './MedicineManager.module.css';

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

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h1 className={styles.title}>Product Management</h1>
					<p className={styles.subtitle}>Manage your medicine catalog and inventory</p>
				</div>
				<button className={styles.addButton} onClick={() => setShowAddForm(true)}>
					+ Add Product
				</button>
			</div>

			{/* Filters */}
			<div className={styles.filterBar}>
				<div className={styles.filterGroup}>
					<span className={styles.filterLabel}>Category:</span>
					{['all', ...categories].map(cat => (
						<button
							key={cat}
							className={filterCategory === cat ? styles.filterButtonActive : styles.filterButton}
							onClick={() => setFilterCategory(cat)}
						>
							{cat === 'all' ? 'All' : cat}
						</button>
					))}
				</div>
				<div className={styles.filterGroup}>
					<span className={styles.filterLabel}>Stock:</span>
					{['all', 'in-stock', 'out-of-stock'].map(status => (
						<button
							key={status}
							className={filterStatus === status ? styles.filterButtonActive : styles.filterButton}
							onClick={() => setFilterStatus(status)}
						>
							{status === 'all' ? 'All' : status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
						</button>
					))}
				</div>
			</div>

			{/* Medicines Table */}
			<div className={styles.section}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th className={styles.tableHeader}>Product Name</th>
							<th className={styles.tableHeader}>Category</th>
							<th className={styles.tableHeader}>Stock</th>
							<th className={styles.tableHeader}>Price</th>
							<th className={styles.tableHeader}>Margin</th>
							<th className={styles.tableHeader}>Status</th>
							<th className={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredMedicines.map(medicine => (
							<tr key={medicine.id} className={styles.tableRow}>
								<td className={styles.tableCell}>
									<strong>{medicine.name}</strong>
								</td>
								<td className={styles.tableCell}>{medicine.category}</td>
								<td className={styles.tableCell}>
									<strong>{medicine.stock} units</strong>
								</td>
								<td className={styles.tableCell}>
									<strong>₹{medicine.price}</strong>
								</td>
								<td className={styles.tableCell}>
									<strong style={{ color: medicine.margin > 40 ? 'var(--success)' : 'var(--warning)' }}>
										{medicine.margin}%
									</strong>
								</td>
								<td className={styles.tableCell}>
									<div
										className={styles.statusBadge}
										style={{
											backgroundColor: medicine.stock > 0 ? 'var(--success)' : 'var(--error)'
										}}
									>
										{medicine.stock > 0 ? '✓ In Stock' : '✗ Out'}
									</div>
								</td>
								<td className={styles.tableCell}>
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
			<div className={showAddForm ? `${styles.modalOverlay} ${styles.modalActive}` : styles.modalOverlay}>
				<div className={styles.modal}>
					<div className={styles.modalHeader}>
						<div>Add New Product</div>
						<button
							className={styles.closeButton}
							onClick={() => setShowAddForm(false)}
						>
							✕
						</button>
					</div>

					<div className={styles.formGrid}>
						<div className={styles.formGroup}>
						<label className={styles.label}>Product Name</label>
						<input
							type="text"
							className={styles.input}
								placeholder="e.g., Paracetamol 500mg"
								value={newMedicine.name}
								onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label}>Manufacturer</label>
							<input
								type="text"
								className={styles.input}
								placeholder="e.g., Cipla Ltd"
								value={newMedicine.manufacturer}
								onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label}>Category</label>
							<select
								className={styles.select}
								value={newMedicine.category}
								onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
							>
								{categories.map(cat => (
									<option key={cat} value={cat}>{cat}</option>
								))}
							</select>
						</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Initial Stock</label>
								<input
									type="number"
									className={styles.input}
								placeholder="0"
								value={newMedicine.stock}
								onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
							/>
						</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Selling Price (₹)</label>
						<input
							type="number"
							className={styles.input}
								placeholder="0.00"
								step="0.01"
								value={newMedicine.price}
								onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label}>Cost Price (₹)</label>
							<input
								type="number"
								className={styles.input}
								placeholder="0.00"
								step="0.01"
								value={newMedicine.costPrice}
								onChange={(e) => setNewMedicine({ ...newMedicine, costPrice: e.target.value })}
							/>
						</div>
					</div>

						<div className={styles.formGridFull}>
							<div className={styles.formGroup}>
						<label className={styles.label}>Description</label>
						<textarea
							className={styles.textarea}
								placeholder="Product description..."
								value={newMedicine.description}
								onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
							/>
						</div>
					</div>

				<div className={styles.actionButtons}>
						<button className={`${styles.button} ${styles.secondaryButton}`} onClick={() => setShowAddForm(false)}>
							Cancel
						</button>
						<button className={`${styles.button} ${styles.primaryButton}`} onClick={handleAddMedicine}>
							Add Product
						</button>
					</div>
				</div>
			</div>

			{/* Edit Medicine Modal */}
			<div className={selectedMedicine ? `${styles.modalOverlay} ${styles.modalActive}` : styles.modalOverlay}>
				{selectedMedicine && (
					<div className={styles.modal}>
						<div className={styles.modalHeader}>
							<div>Edit Product</div>
							<button
								className={styles.closeButton}
								onClick={() => setSelectedMedicine(null)}
							>
								✕
							</button>
						</div>

						<div className={styles.formGrid} style={{ marginBottom: '1.5rem' }}>
							<div className={styles.formGroup}>
								<label className={styles.label}>Product Name</label>
								<input type="text" className={styles.input} value={selectedMedicine.name} disabled />
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Category</label>
								<input type="text" className={styles.input} value={selectedMedicine.category} disabled />
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Stock</label>
								<input type="number" className={styles.input} value={selectedMedicine.stock} disabled />
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Price</label>
								<input type="number" className={styles.input} value={selectedMedicine.price} disabled />
							</div>
						</div>

						<div className={styles.actionButtons}>
							<button className={`${styles.button} ${styles.dangerButton}`} onClick={() => {
								deleteMedicine(selectedMedicine.id);
							}}>
								Delete Product
							</button>
							<button className={`${styles.button} ${styles.secondaryButton}`} onClick={() => setSelectedMedicine(null)}>
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
