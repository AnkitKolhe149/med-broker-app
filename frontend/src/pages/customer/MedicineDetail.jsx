import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
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

	// Sample medicines database - will be replaced with API
	const medicinesDB = [
		{
			id: 1,
			name: 'Paracetamol 500mg',
			category: 'Analgesics',
			retailPrice: 45.00,
			wholesalePrice: 35.00,
			vendor: 'PharmaCorp India',
			vendorId: 1,
			inStock: true,
			composition: 'Paracetamol 500mg',
			manufacturer: 'PharmaCorp India Ltd.',
			dosage: '500mg tablet',
			usage: 'Relief from fever, mild to moderate pain',
			packSize: '10 tablets',
			expiry: '12/2025',
			batchNo: 'PC-2024-001',
			registrationNo: 'DL-2023-ABC123',
			description: 'Paracetamol is an analgesic and antipyretic drug used to treat mild to moderate pain and fever. It works by reducing the production of prostaglandins which cause pain and fever in the body.',
			sideEffects: 'Rare side effects may include rash, allergic reactions. In case of overdose, seek medical help immediately.',
			precautions: 'Do not exceed the recommended dose. Not recommended for patients with liver disease.',
			storage: 'Store below 25°C in a dry place. Keep away from children.',
			warnings: 'This medicine is available over-the-counter. If symptoms persist, consult a doctor.'
		},
		{
			id: 2,
			name: 'Amoxicillin 250mg',
			category: 'Antibiotics',
			retailPrice: 120.00,
			wholesalePrice: 90.00,
			vendor: 'MediSupply Ltd',
			vendorId: 2,
			inStock: true,
			composition: 'Amoxicillin Trihydrate 250mg',
			manufacturer: 'MediSupply Ltd.',
			dosage: '250mg capsule',
			usage: 'Treatment of bacterial infections',
			packSize: '10 capsules (Blister Pack)',
			expiry: '06/2025',
			batchNo: 'MS-2024-045',
			registrationNo: 'DL-2023-XYZ789',
			description: 'Amoxicillin is a beta-lactam antibiotic used to treat various bacterial infections including ear infections, strep throat, urinary tract infections, and pneumonia.',
			sideEffects: 'Common: Diarrhea, nausea, vomiting. Allergic reactions may occur in penicillin-sensitive patients.',
			precautions: 'Do not use if allergic to penicillin. Complete the full course of treatment as prescribed.',
			storage: 'Store below 25°C. Keep away from sunlight. Keep out of reach of children.',
			warnings: 'Prescription required. May cause allergic reactions in susceptible individuals.'
		},
		{
			id: 3,
			name: 'Cetirizine 10mg',
			category: 'Antihistamines',
			retailPrice: 25.00,
			wholesalePrice: 18.00,
			vendor: 'HealthPlus Pharma',
			vendorId: 3,
			inStock: true,
			composition: 'Cetirizine Hydrochloride 10mg',
			manufacturer: 'HealthPlus Pharma Ltd.',
			dosage: '10mg tablet',
			usage: 'Relief from allergies and allergy symptoms',
			packSize: '20 tablets',
			expiry: '09/2025',
			batchNo: 'HP-2024-012',
			registrationNo: 'DL-2023-DEF456',
			description: 'Cetirizine is a second-generation antihistamine used to relieve allergy symptoms including sneezing, runny nose, watery eyes, and itching caused by allergies.',
			sideEffects: 'Drowsiness, dry mouth, fatigue. Severe side effects are rare.',
			precautions: 'Do not consume alcohol while on this medication. May cause drowsiness.',
			storage: 'Store below 25°C in a dry place. Use within 6 months of opening the packet.',
			warnings: 'Available over-the-counter. Do not exceed recommended dose.'
		},
		{
			id: 4,
			name: 'Omeprazole 20mg',
			category: 'Antacids',
			retailPrice: 85.00,
			wholesalePrice: 65.00,
			vendor: 'PharmaCorp India',
			vendorId: 1,
			inStock: true,
			composition: 'Omeprazole 20mg',
			manufacturer: 'PharmaCorp India Ltd.',
			dosage: '20mg capsule',
			usage: 'Treatment of acid reflux and GERD',
			packSize: '15 capsules (Blister Pack)',
			expiry: '08/2025',
			batchNo: 'PC-2024-089',
			registrationNo: 'DL-2023-GHI789',
			description: 'Omeprazole is a proton pump inhibitor used to reduce stomach acid and treat conditions like gastroesophageal reflux disease (GERD), peptic ulcers, and acid-related dyspepsia.',
			sideEffects: 'Headache, diarrhea, abdominal pain. Long-term use may affect calcium absorption.',
			precautions: 'Take 30-60 minutes before meals. Do not exceed 40mg per day without medical consultation.',
			storage: 'Store below 25°C. Protect from light and moisture.',
			warnings: 'Prescription or doctor recommendation required. Do not use for more than 2 weeks without medical advice.'
		},
		{
			id: 5,
			name: 'Metformin 500mg',
			category: 'Antidiabetics',
			retailPrice: 60.00,
			wholesalePrice: 45.00,
			vendor: 'DiabeCare Inc',
			vendorId: 4,
			inStock: true,
			composition: 'Metformin Hydrochloride 500mg',
			manufacturer: 'DiabeCare Inc.',
			dosage: '500mg tablet',
			usage: 'Management of type 2 diabetes',
			packSize: '30 tablets',
			expiry: '11/2025',
			batchNo: 'DC-2024-034',
			registrationNo: 'DL-2023-JKL123',
			description: 'Metformin is a first-line medication for type 2 diabetes management. It helps lower blood sugar levels by reducing glucose production in the liver and improving insulin resistance.',
			sideEffects: 'Nausea, vomiting, diarrhea, abdominal pain. Usually subside after a few weeks.',
			precautions: 'Regular kidney function monitoring required. Do not use if allergic to metformin.',
			storage: 'Store below 25°C in a cool, dry place. Keep away from moisture.',
			warnings: 'Prescription required. Do not stop taking without consulting your doctor.'
		},
		{
			id: 6,
			name: 'Atorvastatin 10mg',
			category: 'Cardiovascular',
			retailPrice: 95.00,
			wholesalePrice: 72.00,
			vendor: 'CardioPharma',
			vendorId: 5,
			inStock: false,
			composition: 'Atorvastatin Calcium 10mg',
			manufacturer: 'CardioPharma Ltd.',
			dosage: '10mg tablet',
			usage: 'Cholesterol management and cardiovascular protection',
			packSize: '20 tablets (Blister Pack)',
			expiry: '10/2025',
			batchNo: 'CP-2024-056',
			registrationNo: 'DL-2023-MNO456',
			description: 'Atorvastatin is a statin used to reduce cholesterol levels and decrease the risk of heart disease. It works by inhibiting HMG-CoA reductase, an enzyme essential for cholesterol production.',
			sideEffects: 'Muscle pain, weakness, liver enzyme elevation. Severe effects are rare.',
			precautions: 'Regular liver function tests recommended. Avoid grapefruit juice while on this medication.',
			storage: 'Store below 25°C. Protect from light.',
			warnings: 'Prescription required. Not recommended during pregnancy.'
		}
	];

	useEffect(() => {
		loadMedicineData();
	}, []);

	const loadMedicineData = async () => {
		try {
			const med = medicinesDB.find(m => m.id === parseInt(id));
			if (med) {
				setMedicine(med);
			} else {
				// Medicine not found
				navigate('/customer/catalog');
			}
		} catch (error) {
			console.error('Failed to load medicine:', error);
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
				user?.customer?.buyerType || 'RETAIL'
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
					<span className={styles.medicineEmoji}>💊</span>
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
									<p className={styles.priceValue}>₹{displayPrice.toFixed(2)}</p>
									{user?.customer?.buyerType === 'WHOLESALE' && (
										<p className={styles.savingsInfo}>
											Save ₹{savings.toFixed(2)} ({savingsPercent}%)
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
