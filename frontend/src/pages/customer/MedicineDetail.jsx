import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import medicineService from '../../services/medicine.service';
import styles from './MedicineDetail.module.css';

function MedicineDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToCart } = useCart();
	const { user } = useUser();
	const [medicine, setMedicine] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [loading, setLoading] = useState(true);
	const [addedToCart, setAddedToCart] = useState(false);
	const currencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);

	useEffect(() => {
		loadMedicineData();
	}, [id]);

	const loadMedicineData = async () => {
		try {
			setLoading(true);
			const med = await medicineService.getMedicineById(id);

			if (!med) {
				navigate('/customer/catalog');
				return;
			}

			setMedicine({
				...med,
				manufacturer: med.brand || med.vendor || 'N/A',
				dosage: med.dosageForm || 'Standard dosage',
				usage: 'Use as directed by your healthcare professional.',
				packSize: 'Standard pack',
				expiry: 'Check package',
				batchNo: 'N/A',
				registrationNo: 'N/A',
				sideEffects: 'Consult a doctor or pharmacist for complete side effect information.',
				precautions: 'Follow prescription and dosage instructions carefully.',
				storage: 'Store in a cool, dry place away from direct sunlight.',
				warnings: 'Read label instructions before use.'
			});
		} catch (error) {
			console.error('Failed to load medicine:', error);
			navigate('/customer/catalog');
		} finally {
			setLoading(false);
		}
	};


	const handleAddToCart = () => {
		if (medicine) {
			addToCart(
				medicine,
				quantity,
				medicine.retailPrice,
				medicine.wholesalePrice,
				user?.customer?.buyerType || 'RETAIL',
				currencyCode
			);
			setAddedToCart(true);
			setTimeout(() => setAddedToCart(false), 2000);
		}
	};

	const handleBuyNow = () => {
		handleAddToCart();
		setTimeout(() => navigate('/customer/checkout'), 500);
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading medicine details...</p>
			</div>
		);
	}

	if (!medicine) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Medicine not found.</p>
			</div>
		);
	}

	const displayPrice = user?.customer?.buyerType === 'WHOLESALE' ? medicine.wholesalePrice : medicine.retailPrice;
	const savings = medicine.retailPrice - medicine.wholesalePrice;
	const savingsPercent = ((savings / medicine.retailPrice) * 100).toFixed(0);

	return (
		<main className="page">
			<div className="container">
				{/* Navigation & Header */}
				<div className={styles.headerNav}>
					<button 
						onClick={() => navigate('/customer/catalog')}
						className={styles.backButton}
					>
						← Back to Catalog
					</button>
				</div>

				<div className={styles.mainContent}>
					{/* Left: Medicine Info */}
					<section className="section" style={{ padding: '2rem' }}>
						<div className={styles.medicineImagePlaceholder}>
							{medicine.imageUrl ? (
								<img src={medicine.imageUrl} alt={medicine.name} className={styles.medicineImage} />
							) : (
								<span className={styles.medicineEmoji}>💊</span>
							)}
						</div>

						<div className={styles.basicInfo}>
							<h1 className={styles.medicineName}>{medicine.name}</h1>
							<div className={styles.badges}>
								<span className={styles.categoryBadge}>{medicine.category}</span>
								{user?.customer?.buyerType === 'WHOLESALE' && (
									<span className={styles.categoryBadge} style={{ backgroundColor: 'var(--warning)' }}>
										WHOLESALE
									</span>
								)}
							</div>

							<div className={styles.vendorInfo}>
								<p className={styles.vendorLabel}>Vendor:</p>
								<p className={styles.vendorName}>{medicine.vendor}</p>
							</div>

							<div className={styles.stockStatus}>
								{medicine.inStock ? (
									<span className={styles.inStock}>✓ In Stock</span>
								) : (
									<span className={styles.outOfStock}>✗ Out of Stock</span>
								)}
							</div>

							{/* Pricing */}
							<div className={styles.pricing}>
								<div className={styles.priceCard}>
									<p className={styles.priceLabel}>Price</p>
									<p className={styles.priceValue}>{formatPrice(displayPrice)}</p>
									{user?.customer?.buyerType === 'WHOLESALE' && (
										<p className={styles.savingsInfo}>
											Save {formatPrice(savings)} ({savingsPercent}%)
										</p>
									)}
								</div>
							</div>

							{/* Quantity Selector */}
							{medicine.inStock && (
								<div className={styles.quantitySelector}>
									<label className={styles.quantityLabel}>Quantity</label>
									<div className={styles.quantityControls}>
										<button 
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											className={styles.quantityButton}
										>
											−
										</button>
										<input
											type="number"
											min="1"
											value={quantity}
											onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
											className={styles.quantityInput}
										/>
										<button 
											onClick={() => setQuantity(quantity + 1)}
											className={styles.quantityButton}
										>
											+
										</button>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							{medicine.inStock && (
								<div className={styles.actionButtons}>
									<button 
										onClick={handleAddToCart}
										className={styles.addToCartButton}
									>
										🛒 Add to Cart
									</button>
									{addedToCart && (
										<span className={styles.successMessage}>✓ Added to cart!</span>
									)}
								</div>
							)}
						</div>
					</section>

					{/* Right: Detailed Info */}
					<div className={styles.rightSection}>
						{/* Composition & Details */}
					<section className="section">
							<h2 className={styles.cardTitle}>Composition & Details</h2>
							<table className={styles.infoTable}>
								<tbody>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Composition:</td>
										<td className={styles.infoValue}>{medicine.composition}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Manufacturer:</td>
										<td className={styles.infoValue}>{medicine.manufacturer}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Dosage Form:</td>
										<td className={styles.infoValue}>{medicine.dosage}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Pack Size:</td>
										<td className={styles.infoValue}>{medicine.packSize}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Batch No:</td>
										<td className={styles.infoValue}>{medicine.batchNo}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Expiry Date:</td>
										<td className={styles.infoValue}>{medicine.expiry}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Registration No:</td>
										<td className={styles.infoValue}>{medicine.registrationNo}</td>
									</tr>
									<tr className={styles.infoRow}>
										<td className={styles.infoLabel}>Storage:</td>
										<td className={styles.infoValue}>{medicine.storage}</td>
									</tr>
								</tbody>
							</table>
					</section>

					{/* Description */}
					<section className="section">
							<h2 className={styles.cardTitle}>About This Medicine</h2>
							<p className={styles.description}>{medicine.description}</p>

							<h3 className={styles.subTitle}>Usage</h3>
							<p className={styles.description}>{medicine.usage}</p>
					</section>

					{/* Side Effects & Precautions */}
					<section className="section">
							<h2 className={styles.cardTitle}>Important Information</h2>
							
							<h3 className={styles.subTitle}>Possible Side Effects</h3>
							<p className={styles.description}>{medicine.sideEffects}</p>

							<h3 className={styles.subTitle}>Precautions</h3>
							<p className={styles.description}>{medicine.precautions}</p>

							<h3 className={styles.subTitle}>Warnings</h3>
							<p className={styles.description}>{medicine.warnings}</p>
					</section>

					{/* Disclaimer */}
					<div className={styles.disclaimer}>
						<p>⚠️ <strong>Disclaimer:</strong> This information is for educational purposes only. Always consult a healthcare professional before starting any medication. This product is registered with relevant drug authorities.</p>
					</div>
				</div>
			</div>
		</div>
	</main>
	);
}
export default MedicineDetail;
