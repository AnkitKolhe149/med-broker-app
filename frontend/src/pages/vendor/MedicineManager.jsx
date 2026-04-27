import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import { convertPrice, formatCurrency, getCurrencySymbol } from '../../utils/currency';
import inventoryService from '../../services/inventory.service';
import vendorService from '../../services/vendor.service';
import styles from './MedicineManager.module.css';
import { Check, X, AlertCircle, Trash2, ImagePlus } from 'lucide-react';

function VendorMedicineManager() {
	const location = useLocation();
	const { currency, exchangeRates, convert } = useCurrency();
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
	const [uploadFiles, setUploadFiles] = useState([]);
	const [vendorStatus, setVendorStatus] = useState('VERIFIED'); // Default to verified to avoid flicker
	const currencySymbol = getCurrencySymbol(currency);
	const formatMoney = (value) => formatCurrency(convert(value, 'INR'), currency, true);
	const toBaseAmount = (value) => convertPrice(value, currency, 'INR', exchangeRates);
	const [newMedicine, setNewMedicine] = useState({
		name: '',
		stock: '',
		price: '',
		wholesalePrice: '',
		bulkMinQty: '',
		bulkPrice: '',
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
					price: Number(convert((item.medicine?.priceCents || 0) / 100, 'INR').toFixed(2)),
					wholesalePrice: Number(convert((((item.medicine?.wholesalePriceCents ?? item.medicine?.priceCents) || 0) / 100), 'INR').toFixed(2)),
					bulkMinQty: item.medicine?.bulkMinQty || null,
					bulkPrice: Number(convert((((item.medicine?.bulkPriceCents ?? item.medicine?.wholesalePriceCents ?? item.medicine?.priceCents) || 0) / 100), 'INR').toFixed(2)),
					imageUrl: item.imageUrl || item.imageUrls?.[0] || null,
					imageUrls: Array.isArray(item.imageUrls)
						? item.imageUrls
						: item.imageUrl
							? [item.imageUrl]
							: []
				})));
			} catch (error) {
				console.error('Failed to load inventory', error);
				showError(error?.response?.data?.message || 'Failed to load inventory');
			} finally {
				setLoading(false);
			}
		};

		const loadVendorStatus = async () => {
			try {
				const profile = await vendorService.getProfile();
				setVendorStatus(profile.verificationStatus || 'PENDING');
			} catch (error) {
				console.error('Failed to load vendor status', error);
			}
		};

		loadInventory();
		loadVendorStatus();

		// Handle deep linking from Analytics
		if (location.state?.selectedMedicineId && medicines.length > 0) {
			const medicine = medicines.find(m => m.id === location.state.selectedMedicineId || m.medicineId === location.state.selectedMedicineId);
			if (medicine) {
				setSelectedMedicine(medicine);
				setStockDraft(String(medicine.stock));
				// Clear location state to prevent re-opening on refresh
				window.history.replaceState({}, document.title);
			}
		}
	}, [location.state, medicines.length]);

	const handleAddMedicine = async () => {
		if (!newMedicine.name || !newMedicine.price || !newMedicine.stock) {
			showError('Please enter medicine name, retail price, and initial stock');
			return;
		}

		if (newMedicine.wholesalePrice && Number(newMedicine.wholesalePrice) > Number(newMedicine.price)) {
			showError('Wholesale price cannot be higher than retail price');
			return;
		}

		if (newMedicine.bulkPrice && Number(newMedicine.bulkPrice) > Number(newMedicine.wholesalePrice || newMedicine.price)) {
			showError('Bulk price should be less than or equal to wholesale price');
			return;
		}

		try {
			setSubmitting(true);
			const retailPriceCents = Math.round(toBaseAmount(Number(newMedicine.price)) * 100);
			const wholesalePriceCents = Math.round(toBaseAmount(Number((newMedicine.wholesalePrice || newMedicine.price))) * 100);
			const bulkPriceCents = Math.round(toBaseAmount(Number((newMedicine.bulkPrice || newMedicine.wholesalePrice || newMedicine.price))) * 100);
			const normalizedBulkMinQty = newMedicine.bulkMinQty ? Math.max(1, Number.parseInt(newMedicine.bulkMinQty, 10) || 1) : null;
			const payload = {
				name: newMedicine.name.trim(),
				description: newMedicine.description?.trim() || null,
				priceCents: retailPriceCents,
				wholesalePriceCents,
				bulkPriceCents,
				bulkMinQty: normalizedBulkMinQty,
				quantity: Number(newMedicine.stock)
			};

			const inventory = await inventoryService.addMedicineToInventory(payload);
			
			// If images are selected, upload them now
			let finalImageUrls = [];
			let finalImageUrl = null;
			
			if (uploadFiles.length > 0) {
				try {
					const uploadResult = await inventoryService.uploadMedicineImage(inventory.id, uploadFiles);
					finalImageUrls = uploadResult.imageUrls || [];
					finalImageUrl = uploadResult.imageUrl || null;
				} catch (uploadError) {
					console.error('Failed to upload initial images', uploadError);
					showError('Medicine added but image upload failed');
				}
			}

			const mapped = {
				id: inventory.id,
				medicineId: inventory.medicineId,
				name: inventory.medicine?.name || payload.name,
				description: inventory.medicine?.description || payload.description || '',
				stock: inventory.quantity || payload.quantity,
				price: Number(convert((((inventory.medicine?.priceCents) || payload.priceCents) / 100), 'INR').toFixed(2)),
				wholesalePrice: Number(convert((((inventory.medicine?.wholesalePriceCents) || payload.wholesalePriceCents) / 100), 'INR').toFixed(2)),
				bulkMinQty: inventory.medicine?.bulkMinQty || payload.bulkMinQty,
											bulkPrice: Number(convert((((inventory.medicine?.bulkPriceCents) || payload.bulkPriceCents) / 100), 'INR').toFixed(2)),
											imageUrl: finalImageUrl || inventory.imageUrl || inventory.imageUrls?.[0] || null,
											imageUrls: finalImageUrls.length > 0 ? finalImageUrls : (Array.isArray(inventory.imageUrls)
												? inventory.imageUrls
												: inventory.imageUrl
													? [inventory.imageUrl]
													: [])
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

			setNewMedicine({
				name: '',
				stock: '',
				price: '',
				wholesalePrice: '',
				bulkMinQty: '',
				bulkPrice: '',
				description: ''
			});
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
			setUploadFiles([]);
			showSuccess('Product deleted successfully');
		} catch (error) {
			console.error('Failed to delete product', error);
			showError(error?.response?.data?.message || 'Failed to delete product');
		}
	};

	const handleUploadImage = async () => {
		if (!selectedMedicine || uploadFiles.length === 0) {
			showError('Please select at least one image file first');
			return;
		}

		if (uploadFiles.length > 4) {
			showError('You can upload up to 4 images at once');
			return;
		}

		try {
			setUploadingId(selectedMedicine.id);
			const result = await inventoryService.uploadMedicineImage(selectedMedicine.id, uploadFiles);
			setMedicines((prev) => prev.map((m) => (
				m.id === selectedMedicine.id
					? {
						...m,
						imageUrl: result.imageUrl,
						imageUrls: Array.isArray(result.imageUrls) ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : [])
					}
					: m
			)));
			setSelectedMedicine((prev) => (prev ? {
				...prev,
				imageUrl: result.imageUrl,
				imageUrls: Array.isArray(result.imageUrls) ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : [])
			} : prev));
			setUploadFiles([]);
			showSuccess('Medicine images uploaded');
		} catch (error) {
			console.error('Failed to upload image', error);
			showError(error?.response?.data?.message || 'Failed to upload image');
		} finally {
			setUploadingId(null);
		}
	};

	const handleDeleteImage = async (imageUrl) => {
		if (!selectedMedicine) return;

		try {
			setUploadingId(selectedMedicine.id);
			const result = await inventoryService.deleteMedicineImage(selectedMedicine.id, imageUrl);
			setMedicines((prev) => prev.map((m) => (
				m.id === selectedMedicine.id
					? {
						...m,
						imageUrl: result.imageUrl,
						imageUrls: Array.isArray(result.imageUrls) ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : [])
					}
					: m
			)));
			setSelectedMedicine((prev) => (prev ? {
				...prev,
				imageUrl: result.imageUrl,
				imageUrls: Array.isArray(result.imageUrls) ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : [])
			} : prev));
			showSuccess('Medicine image deleted');
		} catch (error) {
			console.error('Failed to delete image', error);
			showError(error?.response?.data?.message || 'Failed to delete image');
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
			
			{vendorStatus !== 'VERIFIED' && (
				<div className={styles.verificationBanner}>
					<AlertCircle className={styles.bannerIcon} size={24} />
					<div className={styles.bannerText}>
						<h4>Profile Verification Pending</h4>
						<p>Your products will be visible to customers once your profile is verified by our team. You can still manage your inventory in the meantime.</p>
					</div>
				</div>
			)}

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
									<strong>{formatMoney(medicine.price)}</strong>
									<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
										Wholesale {formatMoney(medicine.wholesalePrice)} {medicine.bulkMinQty ? `• Bulk ${medicine.bulkMinQty}+ @ ${formatMoney(medicine.bulkPrice)}` : ''}
									</div>
								</td>
								<td className={styles.tableCell}>
									<div
										className={styles.statusBadge}
										style={{
											backgroundColor: medicine.stock > 0 ? 'var(--success)' : 'var(--error)'
										}}
									>
										{medicine.stock > 0 ? <><Check size={12} strokeWidth={2} /> In Stock</> : <><X size={12} strokeWidth={2} /> Out</>}
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
								onClick={() => {
									setShowAddForm(false);
									setUploadFiles([]);
								}}
						>
						<X size={16} />
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
						<label className={styles.label}>Selling Price ({currencySymbol})</label>
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
						<label className={styles.label}>Wholesale Price ({currencySymbol})</label>
						<input
							type="number"
							className={styles.input}
							placeholder="Optional"
							step="0.01"
							value={newMedicine.wholesalePrice}
							onChange={(e) => setNewMedicine({ ...newMedicine, wholesalePrice: e.target.value })}
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Bulk Min Qty</label>
						<input
							type="number"
							className={styles.input}
							placeholder="Optional"
							value={newMedicine.bulkMinQty}
							onChange={(e) => setNewMedicine({ ...newMedicine, bulkMinQty: e.target.value })}
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Bulk Price ({currencySymbol})</label>
						<input
							type="number"
							className={styles.input}
							placeholder="Optional"
							step="0.01"
							value={newMedicine.bulkPrice}
							onChange={(e) => setNewMedicine({ ...newMedicine, bulkPrice: e.target.value })}
						/>
					</div>
					</div>

					<div className={styles.formGridFull}>
						<div className={styles.formGroup}>
							<label className={styles.label}>Product Images (Optional, up to 4)</label>
							<div className={styles.imageSelectionArea}>
								<input
									type="file"
									id="new-product-images"
									accept="image/*"
									multiple
									style={{ display: 'none' }}
									onChange={(e) => {
										const files = Array.from(e.target.files || []).slice(0, 4);
										setUploadFiles(files);
									}}
								/>
								<label htmlFor="new-product-images" className={styles.imageUploadLabel}>
									<ImagePlus size={24} />
									<span>{uploadFiles.length > 0 ? `${uploadFiles.length} images selected` : 'Click to select product images'}</span>
								</label>
								{uploadFiles.length > 0 && (
									<div className={styles.previewStrip}>
										{Array.from(uploadFiles).map((file, idx) => (
											<div key={idx} className={styles.previewContainer}>
												<img src={URL.createObjectURL(file)} alt="preview" className={styles.previewThumb} />
											</div>
										))}
									</div>
								)}
							</div>
						</div>
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
								onClick={() => {
									setSelectedMedicine(null);
									setUploadFiles([]);
								}}
							>
							<X size={16} />
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
								<div className={styles.imageSummary}>
									<span>{(selectedMedicine.imageUrls || []).length || 0} / 4 uploaded</span>
									<span>{uploadFiles.length} selected</span>
								</div>
								{(selectedMedicine.imageUrls || []).length > 0 ? (
									<div className={styles.previewStrip}>
										{(selectedMedicine.imageUrls || []).map((imageUrl, index) => (
											<div key={`${imageUrl}-${index}`} className={styles.previewContainer}>
												<img src={imageUrl} alt={`${selectedMedicine.name} ${index + 1}`} className={styles.previewThumb} />
												<button 
													className={styles.deleteImageIcon}
													onClick={() => handleDeleteImage(imageUrl)}
													disabled={uploadingId === selectedMedicine.id}
													title="Delete image"
												>
													<Trash2 size={14} />
												</button>
											</div>
										))}
									</div>
								) : (
									<div className={styles.previewPlaceholder}>No image uploaded</div>
								)}
								<input
									type="file"
									accept="image/*"
									multiple
									className={styles.input}
									onChange={(e) => {
										const files = Array.from(e.target.files || []).slice(0, 4);
										setUploadFiles(files);
										if ((e.target.files || []).length > 4) {
											showError('You can select a maximum of 4 images');
										}
									}}
								/>
								<button
									type="button"
									className={`${styles.button} ${styles.primaryButton}`}
									onClick={handleUploadImage}
									disabled={uploadFiles.length === 0 || uploadingId === selectedMedicine.id}
								>
									{uploadingId === selectedMedicine.id ? 'Uploading...' : 'Upload Images'}
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
							<button className={`${styles.button} ${styles.secondaryButton}`} onClick={() => {
								setSelectedMedicine(null);
								setUploadFiles([]);
							}}>
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
