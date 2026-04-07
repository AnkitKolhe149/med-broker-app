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

			setMedicine({
				...med,
				images: [med.imageUrl, med.imageUrl, med.imageUrl, med.imageUrl, med.imageUrl, med.imageUrl],
				manufacturer: med.brand || med.vendor || 'N/A',
				strength: med.strength || 'Standard',
				dosage: med.dosageForm || 'Standard dosage',
				usage: 'Use as directed by your healthcare professional.',
				packSize: 'Standard pack',
				expiry: 'Check package',
				batchNo: 'N/A',
				registrationNo: 'N/A',
				sideEffects: 'Consult a doctor or pharmacist for complete side effect information.',
				precautions: 'Follow prescription and dosage instructions carefully.',
				storage: 'Store in a cool, dry place away from direct sunlight.',
				warnings: 'Read label instructions before use.',
				rating: Math.random() > 0.5 ? (4.5 + Math.random() * 0.5) : (3.5 + Math.random() * 1),
				reviewCount: Math.floor(Math.random() * 300) + 50,
				requiresPrescription: Math.random() > 0.7
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
		<main className={styles.productDetailsPage}>
			<div className={styles.container}>
				{/* Breadcrumb Navigation */}
				<div className={styles.breadcrumb}>
					<button onClick={() => navigate('/customer/catalog')} className={styles.breadcrumbLink}>
						Catalog
					</button>
					<span> / </span>
					<span className={styles.breadcrumbCurrent}>{medicine?.category || 'Medicine'}</span>
				</div>

				<div className={styles.productGrid}>
					{/* LEFT: Image Gallery */}
					<section className={styles.gallerySection}>
						{/* Main Image */}
						<div className={styles.mainImage}>
							{medicine?.images?.[selectedImageIndex] ? (
								<img src={medicine.images[selectedImageIndex]} alt={medicine.name} />
							) : (
								<div className={styles.imagePlaceholder}>💊</div>
							)}
							{medicine?.requiresPrescription && (
								<div className={styles.prescriptionBadge}>⚕️ Rx Required</div>
							)}
						</div>

						{/* Thumbnail Gallery */}
						<div className={styles.thumbnailGallery}>
							{medicine?.images?.map((img, idx) => (
								<button
									key={idx}
									className={`${styles.thumbnail} ${selectedImageIndex === idx ? styles.active : ''}`}
									onClick={() => setSelectedImageIndex(idx)}
									aria-label={`View image ${idx + 1}`}
								>
									<img src={img} alt={`${medicine.name} view ${idx + 1}`} />
								</button>
							))}
						</div>
					</section>

					{/* RIGHT: Product Details */}
					<section className={styles.detailsSection}>
						{/* Vendor Badge */}
						<div className={styles.vendorBadge}>
							{medicine?.vendor ? medicine.vendor.toUpperCase() : 'TRUSTED VENDOR'}
						</div>

						{/* Title */}
						<h1 className={styles.productTitle}>{medicine?.name}</h1>

						{/* Rating */}
						<div className={styles.ratingSection}>
							<div className={styles.stars}>
								{'★'.repeat(Math.floor(medicine?.rating || 0))}
								{(medicine?.rating || 0) % 1 !== 0 ? '☆' : ''}
							</div>
							<span className={styles.ratingValue}>{(medicine?.rating || 0).toFixed(1)}</span>
							<span className={styles.reviewCount}>
								{medicine?.reviewCount || 128} reviews
							</span>
						</div>

						{/* Price Section */}
						<div className={styles.priceSection}>
							<div className={styles.priceMain}>
								<span className={styles.currentPrice}>
									{formatPrice(medicine?.retailPrice || 0)}
								</span>
								<span className={styles.originalPrice}>
									{formatPrice((medicine?.retailPrice || 0) * 1.2)}
								</span>
								<span className={styles.discount}>20%</span>
							</div>
						</div>

						{/* Size/Packaging Options */}
						<div className={styles.optionGroup}>
							<label className={styles.optionLabel}>Packaging</label>
							<div className={styles.optionButtons}>
								<button
									className={`${styles.optionButton} ${selectedSize === 'standard' ? styles.selected : ''}`}
									onClick={() => setSelectedSize('standard')}
								>
									Standard
								</button>
								<button
									className={`${styles.optionButton} ${selectedSize === 'bulk' ? styles.selected : ''}`}
									onClick={() => setSelectedSize('bulk')}
								>
									Bulk
								</button>
							</div>
						</div>

						{/* Quantity Selector & Add to Cart */}
						<div className={styles.cartSection}>
							<div className={styles.quantityControl}>
								<button
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
									className={styles.quantityBtn}
									aria-label="Decrease quantity"
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
									className={styles.quantityBtn}
									aria-label="Increase quantity"
								>
									+
								</button>
							</div>

							<button
								onClick={handleAddToCart}
								className={styles.addToCartButton}
								disabled={!medicine?.inStock}
							>
								{medicine?.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
							</button>

							<button
								onClick={() => setIsFavorited(!isFavorited)}
								className={`${styles.wishlistButton} ${isFavorited ? styles.favorited : ''}`}
								aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
							>
								♡
							</button>
						</div>

						{addedToCart && (
							<div className={styles.successMessage}>
								✓ Added to cart!
							</div>
						)}

						{/* Shipping Info */}
						<div className={styles.shippingInfo}>
							📦 Ships for free by next week
						</div>

						{/* Trust Indicators */}
						<div className={styles.trustSection}>
							<div className={styles.trustIcon}>
								<div className={styles.trustIconBg}>⚗️</div>
								<span className={styles.trustLabel}>Verified<br/>Pharmaceutical</span>
							</div>
							<div className={styles.trustIcon}>
								<div className={styles.trustIconBg}>✓</div>
								<span className={styles.trustLabel}>Licensed<br/>Vendor</span>
							</div>
							<div className={styles.trustIcon}>
								<div className={styles.trustIconBg}>📋</div>
								<span className={styles.trustLabel}>Regulated<br/>Product</span>
							</div>
							<div className={styles.trustIcon}>
								<div className={styles.trustIconBg}>🛡️</div>
								<span className={styles.trustLabel}>Certified<br/>Quality</span>
							</div>
						</div>

						{/* Quick Info */}
						<div className={styles.quickInfo}>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>Strength:</span>
								<span className={styles.infoValue}>{medicine?.strength}</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>Manufacturer:</span>
								<span className={styles.infoValue}>{medicine?.manufacturer}</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>Composition:</span>
								<span className={styles.infoValue}>{medicine?.composition}</span>
							</div>
						</div>
					</section>
				</div>

				{/* Expandable Detail Sections */}
				<section className={styles.detailedSection}>
					<DetailAccordion title="Description" content={medicine?.description} />
					<DetailAccordion title="Dosage & Usage" content={medicine?.usage} />
					<DetailAccordion title="Side Effects" content={medicine?.sideEffects} />
					<DetailAccordion title="Precautions" content={medicine?.precautions} />
					<DetailAccordion title="Storage" content={medicine?.storage} />
					<DetailAccordion title="Warranty" content={medicine?.warnings} />
				</section>

				{/* Disclaimer */}
				<div className={styles.disclaimer}>
					<strong>⚠️ Disclaimer:</strong> This information is for educational purposes only. Always consult a healthcare professional before using any medication. This product is registered with relevant pharmaceutical authorities.
				</div>
			</div>
		</main>
	);
}

function DetailAccordion({ title, content }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={`${styles.detailAccordion} ${isOpen ? styles.open : ''}`}>
			<button
				className={styles.accordionHeader}
				onClick={() => setIsOpen(!isOpen)}
			>
				{title}
				<span className={styles.accordionIcon}>{isOpen ? '−' : '+'}</span>
			</button>
			{isOpen && <div className={styles.accordionContent}>{content}</div>}
		</div>
	);
}

export default MedicineDetail;
