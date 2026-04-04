import React, { useEffect, useMemo, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useNotification } from '../../context/NotificationContext';
import inventoryService from '../../services/inventory.service';
import styles from './MedicineManager.module.css';

function VendorMedicineManager() {
	const { showSuccess, showError } = useNotification();
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [uploadingId, setUploadingId] = useState(null);
	const [savingStock, setSavingStock] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [selectedMedicine, setSelectedMedicine] = useState(null);
	const [stockDraft, setStockDraft] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [uploadFile, setUploadFile] = useState(null);
	const [newMedicine, setNewMedicine] = useState({
		name: '',
		stock: '',
		price: '',
		description: ''
	});

	useEffect(() => {
		const loadInventory = async () => {
			try {
				setLoading(true);
				const result = await inventoryService.getInventory({ page: 1, limit: 100 });
				setMedicines((result.items || []).map((item) => ({
					id: item.id,
					medicineId: item.medicineId,
					name: item.medicine?.name || 'Unknown medicine',
					description: item.medicine?.description || '',
					stock: item.quantity || 0,
					price: Number(((item.medicine?.priceCents || 0) / 100).toFixed(2)),
					imageUrl: item.imageUrl || null
				})));
			} catch (error) {
				console.error('Failed to load inventory', error);
				showError(error?.response?.data?.message || 'Failed to load inventory');
			} finally {
				setLoading(false);
			}
		};

		loadInventory();
	}, []);

	const handleAddMedicine = async () => {
		if (!newMedicine.name || !newMedicine.price || !newMedicine.stock) {
			showError('Please enter medicine name, price, and initial stock');
			return;
		}

		try {
			setSubmitting(true);
			const payload = {
				name: newMedicine.name.trim(),
				description: newMedicine.description?.trim() || null,
				priceCents: Math.round(Number(newMedicine.price) * 100),
				quantity: Number(newMedicine.stock)
			};

			const inventory = await inventoryService.addMedicineToInventory(payload);
			const mapped = {
				id: inventory.id,
				medicineId: inventory.medicineId,
				name: inventory.medicine?.name || payload.name,
				description: inventory.medicine?.description || payload.description || '',
				stock: inventory.quantity || payload.quantity,
				price: Number((((inventory.medicine?.priceCents) || payload.priceCents) / 100).toFixed(2)),
				imageUrl: inventory.imageUrl || null
			};

			setMedicines((prev) => {
				const idx = prev.findIndex((m) => m.id === mapped.id);
				if (idx >= 0) {
					const updated = [...prev];
					updated[idx] = mapped;
					return updated;
				}
				return [mapped, ...prev];
			});

			setNewMedicine({ name: '', stock: '', price: '', description: '' });
			setShowAddForm(false);
			showSuccess('Medicine added to inventory');
		} catch (error) {
			console.error('Failed to add medicine', error);
			showError(error?.response?.data?.message || 'Failed to add medicine');
		} finally {
			setSubmitting(false);
		}
	};

	const deleteMedicine = async (id) => {
		try {
			await inventoryService.deleteInventoryItem(id);
			setMedicines((prev) => prev.filter((m) => m.id !== id));
			setSelectedMedicine(null);
			showSuccess('Product deleted successfully');
		} catch (error) {
			console.error('Failed to delete product', error);
			showError(error?.response?.data?.message || 'Failed to delete product');
		}
	};

	const handleUploadImage = async () => {
		if (!selectedMedicine || !uploadFile) {
			showError('Please select an image file first');
			return;
		}

		try {
			setUploadingId(selectedMedicine.id);
			const result = await inventoryService.uploadMedicineImage(selectedMedicine.id, uploadFile);
			setMedicines((prev) => prev.map((m) => (
				m.id === selectedMedicine.id ? { ...m, imageUrl: result.imageUrl } : m
			)));
			setSelectedMedicine((prev) => (prev ? { ...prev, imageUrl: result.imageUrl } : prev));
			setUploadFile(null);
			showSuccess('Medicine image uploaded');
		} catch (error) {
			console.error('Failed to upload image', error);
			showError(error?.response?.data?.message || 'Failed to upload image');
		} finally {
			setUploadingId(null);
		}
	};

	const handleSaveStock = async () => {
		if (!selectedMedicine) return;

		const normalizedQuantity = Number.parseInt(stockDraft, 10);
		if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
			showError('Stock must be a non-negative whole number');
			return;
		}

		try {
			setSavingStock(true);
			const updated = await inventoryService.updateInventoryItem(selectedMedicine.id, {
				quantity: normalizedQuantity
			});

			setMedicines((prev) => prev.map((m) => (
				m.id === selectedMedicine.id
					? { ...m, stock: updated.quantity }
					: m
			)));

			setSelectedMedicine((prev) => (
				prev ? { ...prev, stock: updated.quantity } : prev
			));
			setStockDraft(String(updated.quantity));
			showSuccess('Stock updated successfully');
		} catch (error) {
			console.error('Failed to update stock', error);
			showError(error?.response?.data?.message || 'Failed to update stock');
		} finally {
			setSavingStock(false);
		}
	};

	const filteredMedicines = useMemo(() => medicines.filter((m) => {
		if (filterStatus === 'in-stock' && m.stock === 0) return false;
		if (filterStatus === 'out-of-stock' && m.stock > 0) return false;
		return true;
	}), [medicines, filterStatus]);

	return (
		<div className={styles.container}>
			<VendorPageShell
				title="Product Management"
				subtitle="Manage your medicine catalog and inventory"
				actions={(
					<button className={styles.addButton} onClick={() => setShowAddForm(true)} disabled={submitting}>
						+ Add Product
					</button>
				)}
			>

			{/* Filters */}
			<div className={styles.filterBar}>
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
				{loading ? (
					<div className={styles.loadingState}>Loading inventory...</div>
				) : (
				<table className={styles.table}>
					<thead>
						<tr>
							<th className={styles.tableHeader}>Image</th>
							<th className={styles.tableHeader}>Product Name</th>
							<th className={styles.tableHeader}>Stock</th>
							<th className={styles.tableHeader}>Price</th>
							<th className={styles.tableHeader}>Status</th>
							<th className={styles.tableHeader}>Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredMedicines.map(medicine => (
							<tr key={medicine.id} className={styles.tableRow}>
								<td className={styles.tableCell}>
									{medicine.imageUrl ? (
										<img src={medicine.imageUrl} alt={medicine.name} className={styles.thumbnailImage} />
									) : (
										<div className={styles.thumbnailPlaceholder}>No image</div>
									)}
								</td>
								<td className={styles.tableCell}>
									<strong>{medicine.name}</strong>
								</td>
								<td className={styles.tableCell}>
									<strong>{medicine.stock} units</strong>
								</td>
								<td className={styles.tableCell}>
									<strong>₹{medicine.price}</strong>
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
										className={styles.editButton}
										onClick={() => {
											setSelectedMedicine(medicine);
											setStockDraft(String(medicine.stock));
										}}
									>
										Edit
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				)}
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
						<button className={`${styles.button} ${styles.secondaryButton}`} onClick={() => setShowAddForm(false)} disabled={submitting}>
							Cancel
						</button>
						<button className={`${styles.button} ${styles.primaryButton}`} onClick={handleAddMedicine} disabled={submitting}>
							{submitting ? 'Adding...' : 'Add Product'}
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
								<label className={styles.label}>Description</label>
								<textarea className={styles.textarea} value={selectedMedicine.description || ''} disabled />
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Stock</label>
								<input
									type="number"
									className={styles.input}
									value={stockDraft}
									onChange={(e) => setStockDraft(e.target.value)}
									min="0"
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>Price</label>
								<input type="number" className={styles.input} value={selectedMedicine.price} disabled />
							</div>
						</div>


						<div className={styles.formGridFull}>
							<div className={styles.formGroup}>
								<label className={styles.label}>Medicine Image</label>
								{selectedMedicine.imageUrl ? (
									<img src={selectedMedicine.imageUrl} alt={selectedMedicine.name} className={styles.previewImage} />
								) : (
									<div className={styles.previewPlaceholder}>No image uploaded</div>
								)}
								<input
									type="file"
									accept="image/*"
									className={styles.input}
									onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
								/>
								<button
									type="button"
									className={`${styles.button} ${styles.primaryButton}`}
									onClick={handleUploadImage}
									disabled={!uploadFile || uploadingId === selectedMedicine.id}
								>
									{uploadingId === selectedMedicine.id ? 'Uploading...' : 'Upload Image'}
								</button>
							</div>
						</div>

						<div className={styles.actionButtons}>
							<button
								className={`${styles.button} ${styles.primaryButton}`}
								onClick={handleSaveStock}
								disabled={savingStock}
							>
								{savingStock ? 'Saving...' : 'Save Stock'}
							</button>
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
			</VendorPageShell>
		</div>
	);
}

export default VendorMedicineManager;
