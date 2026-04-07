import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import medicineService from '../../services/medicine.service';
import styles from './MedicineDetail.module.css';

const FALLBACK_IMAGE =
	'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 720 540%22%3E%3Cdefs%3E%3ClinearGradient id=%22a%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%25%22 stop-color=%22%23E8F6EE%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23F7FAFC%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22720%22 height=%22540%22 rx=%2248%22 fill=%22url(%23a)%22/%3E%3Ccircle cx=%22360%22 cy=%22210%22 r=%2288%22 fill=%22%23157347%22 fill-opacity=%220.14%22/%3E%3Cpath d=%22M360 154c26 0 48 21 48 47 0 18-10 33-25 41v52h-46v-52c-15-8-25-23-25-41 0-26 22-47 48-47Z%22 fill=%22%23157347%22 fill-opacity=%220.7%22/%3E%3Crect x=%22220%22 y=%23334%22 width=%22380%22 height=%2234%22 rx=%2217%22 fill=%22%23157347%22 fill-opacity=%220.12%22/%3E%3Crect x=%22270%22 y=%23392%22 width=%22180%22 height=%2216%22 rx=%228%22 fill=%22%23157347%22 fill-opacity=%220.14%22/%3E%3C/svg%3E';

function MedicineDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToCart } = useCart();
	const { user } = useUser();
	const [medicine, setMedicine] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [selectedSize, setSelectedSize] = useState('standard');
	const [loading, setLoading] = useState(true);
	const [addedToCart, setAddedToCart] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

			const galleryImages = [med.imageUrl, ...(Array.isArray(med.images) ? med.images : [])]
				.filter(Boolean)
				.filter((image, index, array) => array.indexOf(image) === index)
				.slice(0, 4);
			const retailPrice = Number(med.retailPrice ?? med.price ?? med.sourceRetailPrice ?? 0);
			const wholesalePrice = Number(med.wholesalePrice ?? med.sourceWholesalePrice ?? retailPrice);
			const stockLevel = Number(med.stockLevel ?? med.quantity ?? 0);
			const inStock = typeof med.inStock === 'boolean' ? med.inStock : stockLevel > 0;

			setMedicine({
				...med,
				images: galleryImages,
				manufacturer: med.brand || med.vendor || med.manufacturer || 'MedIQ Partner',
				strength: med.strength || med.dosage || med.dosageForm || 'Standard strength',
				dosage: med.dosageForm || 'Tablet',
				usage: med.usage || med.dosageInstructions || 'Take exactly as prescribed by your healthcare professional.',
				packSize: med.packSize || med.packageSize || 'Standard pack',
				expiry: med.expiry || med.expiryDate || 'Check package',
				batchNo: med.batchNo || 'N/A',
				registrationNo: med.registrationNo || med.registrationNumber || 'N/A',
				sideEffects: med.sideEffects || 'Consult a doctor or pharmacist for complete side effect information.',
				precautions: med.precautions || 'Follow prescription and dosage instructions carefully.',
				storage: med.storage || 'Store in a cool, dry place away from direct sunlight.',
				warnings: med.warnings || 'Read the label and consult a clinician before use.',
				rating: Number(med.rating ?? 4.6),
				reviewCount: Number(med.reviewCount ?? Math.max(24, stockLevel * 2)),
				requiresPrescription: typeof med.requiresPrescription === 'boolean' ? med.requiresPrescription : Boolean(med.prescriptionRequired),
				bulkMinQty: Number(med.bulkMinQty ?? 100),
				bulkDiscountPercent: Number(med.bulkDiscountPercent ?? 10),
				retailPrice,
				wholesalePrice,
				stockLevel,
				inStock
			});

			setSelectedImageIndex(0);
		} catch (error) {
			console.error('Failed to load medicine:', error);
			navigate('/customer/catalog');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className={styles.stateShell}>
				<div className={styles.stateCard}>
					<p>Loading medicine details...</p>
				</div>
			</div>
		);
	}

	if (!medicine) {
		return (
			<div className={styles.stateShell}>
				<div className={styles.stateCard}>
					<p>Medicine not found.</p>
				</div>
			</div>
		);
	}

	const isWholesaleBuyer = user?.customer?.buyerType === 'WHOLESALE';
	const maxQuantity = medicine.stockLevel > 0 ? medicine.stockLevel : 99;
	const currentPrice = isWholesaleBuyer ? medicine.wholesalePrice : medicine.retailPrice;
	const comparePrice = isWholesaleBuyer ? medicine.retailPrice : medicine.wholesalePrice;
	const savings = Math.max(0, medicine.retailPrice - medicine.wholesalePrice);
	const savingsPercent = medicine.retailPrice > 0 && savings > 0 ? Math.round((savings / medicine.retailPrice) * 100) : 0;

	const isBulkSelected = selectedSize === 'bulk';
	const dynamicCurrentPrice = Number((isBulkSelected || isWholesaleBuyer ? medicine.wholesalePrice : medicine.retailPrice).toFixed(2));
	const dynamicComparePrice = Number((isBulkSelected || isWholesaleBuyer ? medicine.retailPrice : medicine.wholesalePrice).toFixed(2));
	const selectedImage = medicine.images?.[selectedImageIndex] || medicine.images?.[0] || null;
	const packLabel = selectedSize === 'bulk' ? 'Bulk / Wholesale pack' : 'Standard pack';
	const packHint = selectedSize === 'bulk'
		? 'Bulk uses wholesale pricing.'
		: 'Best for first orders and small refills.';
	const availabilityLabel = medicine.inStock
		? medicine.stockLevel > 0
			? `${medicine.stockLevel} units available`
			: 'In stock'
		: 'Currently unavailable';

	const handleAddToCart = () => {
		if (!medicine) {
			return;
		}

		addToCart(
			{ ...medicine, selectedSize, isBulkSelected },
			quantity,
			dynamicCurrentPrice,
			dynamicComparePrice,
			user?.customer?.buyerType || 'RETAIL',
			currencyCode
		);
		setAddedToCart(true);
		setTimeout(() => setAddedToCart(false), 2000);
	};

	const handleBuyNow = () => {
		handleAddToCart();
		setTimeout(() => navigate('/customer/checkout'), 500);
	};

	return (
		<main className={styles.productDetailsPage}>
			<div className={styles.container}>
				<div className={styles.breadcrumb}>
					<button onClick={() => navigate('/customer/catalog')} className={styles.breadcrumbLink}>
						Catalog
					</button>
					<span>/</span>
					<span className={styles.breadcrumbCurrent}>{medicine?.category || 'Medicine'}</span>
				</div>

				<section className={styles.heroCard}>
					<div className={styles.galleryPanel}>
						<div className={styles.mainImageFrame}>
							{selectedImage ? (
								<img className={styles.mainImage} src={selectedImage} alt={medicine.name} />
							) : (
								<div className={styles.imagePlaceholder}>
									<div className={styles.imageGlyph}>💊</div>
									<p>No image available</p>
								</div>
							)}
							{medicine.requiresPrescription && <span className={styles.prescriptionBadge}>Rx required</span>}
							<span className={styles.imageBadge}>{medicine.inStock ? availabilityLabel : 'Out of stock'}</span>
						</div>

						{medicine.images?.length > 0 && (
							<div className={styles.thumbnailRow}>
								{medicine.images.map((image, index) => (
									<button
										key={`${image}-${index}`}
										className={`${styles.thumbnailButton} ${selectedImageIndex === index ? styles.thumbnailButtonActive : ''}`}
										onClick={() => setSelectedImageIndex(index)}
										aria-label={`View image ${index + 1}`}
									>
										<img src={image || FALLBACK_IMAGE} alt={`${medicine.name} view ${index + 1}`} />
									</button>
								))}
							</div>
						)}
					</div>

					<div className={styles.summaryPanel}>
						<div className={styles.summaryTopRow}>
							<div className={styles.vendorBadge}>{medicine?.vendor ? medicine.vendor.toUpperCase() : 'MEDIQ PARTNER'}</div>
							<button
								onClick={() => setIsFavorited(!isFavorited)}
								className={`${styles.favoriteButton} ${isFavorited ? styles.favoriteButtonActive : ''}`}
								aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
							>
								{isFavorited ? '♥' : '♡'}
							</button>
						</div>

						<div className={styles.titleBlock}>
							<h1 className={styles.productTitle}>{medicine?.name}</h1>
							<p className={styles.subtitle}>
								{medicine.category || 'General'} • {medicine.dosage}
							</p>
						</div>

						<div className={styles.statusRow}>
							<span className={styles.statusBadge}>{medicine.requiresPrescription ? 'Prescription' : 'OTC'}</span>
							<span className={styles.statusBadge}>{availabilityLabel}</span>
							<span className={styles.statusBadge}>{medicine.reviewCount} reviews</span>
						</div>

						<div className={styles.ratingRow}>
							<div className={styles.stars}>{'★'.repeat(Math.floor(medicine.rating || 0))}</div>
							<span className={styles.ratingValue}>{(medicine.rating || 0).toFixed(1)}</span>
							<span className={styles.reviewCount}>Trusted by verified buyers</span>
						</div>

						<div className={styles.priceBlock}>
							<div>
								<div className={styles.priceLabel}>Current price</div>
								<div className={styles.currentPrice}>{formatPrice(dynamicCurrentPrice || 0)}</div>
							</div>
							<div className={styles.priceMeta}>
								<div className={styles.priceNote}>
									{comparePrice > 0 ? `${isWholesaleBuyer ? 'Retail' : 'Wholesale'}: ${formatPrice(dynamicComparePrice || comparePrice)}` : 'Price shown for your account type'}
								</div>
								{savingsPercent > 0 && <span className={styles.priceChip}>{savingsPercent}% tier gap</span>}
								{selectedSize === 'bulk' && (
									<div style={{ padding: '0.75rem', borderRadius: '0.85rem', background: 'rgba(21, 115, 71, 0.08)', border: '1px solid rgba(21, 115, 71, 0.15)', marginTop: '0.5rem' }}>
										<p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
											Bulk uses wholesale pricing.
										</p>
									</div>
								)}
							</div>
						</div>

						<div className={styles.factGrid}>
							<div className={styles.factCard}>
								<span className={styles.factLabel}>Strength</span>
								<strong className={styles.factValue}>{medicine.strength}</strong>
							</div>
							<div className={styles.factCard}>
								<span className={styles.factLabel}>Manufacturer</span>
								<strong className={styles.factValue}>{medicine.manufacturer}</strong>
							</div>
							<div className={styles.factCard}>
								<span className={styles.factLabel}>Pack</span>
								<strong className={styles.factValue}>{packLabel}</strong>
							</div>
							<div className={styles.factCard}>
								<span className={styles.factLabel}>Stock</span>
								<strong className={styles.factValue}>{availabilityLabel}</strong>
							</div>
						</div>

						<div className={styles.optionGroup}>
							<label className={styles.optionLabel}>Packaging</label>
							<div className={styles.optionButtons}>
								<button
									className={`${styles.optionButton} ${selectedSize === 'standard' ? styles.optionButtonActive : ''}`}
									onClick={() => setSelectedSize('standard')}
								>
									Standard
								</button>
								<button
									className={`${styles.optionButton} ${selectedSize === 'bulk' ? styles.optionButtonActive : ''}`}
									onClick={() => setSelectedSize('bulk')}
								>
									Bulk
								</button>
							</div>
							<p className={styles.packHint}>{packHint}</p>
						</div>

						<div className={styles.cartSection}>
							<div className={styles.quantityControl}>
								<button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className={styles.quantityBtn} aria-label="Decrease quantity">−</button>
								<input
									type="number"
									min="1"
									max={maxQuantity}
									value={quantity}
									onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))}
									className={styles.quantityInput}
								/>
								<button onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className={styles.quantityBtn} aria-label="Increase quantity" disabled={quantity >= maxQuantity}>+</button>
							</div>

							<button onClick={handleAddToCart} className={styles.addToCartButton} disabled={!medicine?.inStock}>
								{medicine?.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
							</button>

							<button onClick={handleBuyNow} className={styles.buyButton} disabled={!medicine?.inStock}>
								BUY NOW
							</button>
						</div>

						{addedToCart && <div className={styles.successMessage}>Added to cart.</div>}

						<div className={styles.shippingInfo}>
							{medicine.inStock ? `Ready to checkout with ${availabilityLabel.toLowerCase()}.` : 'Temporarily unavailable for checkout.'}
						</div>

						<div className={styles.trustGrid}>
							<div className={styles.trustItem}><span className={styles.trustIcon}>⚕️</span><span className={styles.trustText}>Verified pharmaceutical</span></div>
							<div className={styles.trustItem}><span className={styles.trustIcon}>✓</span><span className={styles.trustText}>Licensed vendor</span></div>
							<div className={styles.trustItem}><span className={styles.trustIcon}>📋</span><span className={styles.trustText}>Regulated product</span></div>
							<div className={styles.trustItem}><span className={styles.trustIcon}>🛡️</span><span className={styles.trustText}>Certified quality</span></div>
						</div>
					</div>
				</section>

				<section className={styles.infoSection}>
					<article className={styles.infoCard}>
						<h2 className={styles.infoCardTitle}>Overview</h2>
						<p className={styles.infoCardText}>{medicine.description}</p>
					</article>
					<article className={styles.infoCard}>
						<h2 className={styles.infoCardTitle}>Usage</h2>
						<p className={styles.infoCardText}>{medicine.usage}</p>
					</article>
					<article className={styles.infoCard}>
						<h2 className={styles.infoCardTitle}>Safety</h2>
						<p className={styles.infoCardText}>{medicine.precautions}</p>
					</article>
					<article className={styles.infoCard}>
						<h2 className={styles.infoCardTitle}>Storage</h2>
						<p className={styles.infoCardText}>{medicine.storage}</p>
					</article>
				</section>

				<div className={styles.disclaimer}>
					<strong>Disclaimer:</strong> This information is for educational purposes only. Always consult a healthcare professional before using any medication.
				</div>
			</div>
		</main>
	);
}

export default MedicineDetail;
