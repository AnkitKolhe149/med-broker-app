import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';

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
				<div style={styles.headerNav}>
					<button 
						onClick={() => navigate('/customer/catalog')}
						style={styles.backButton}
					>
						← Back to Catalog
					</button>
				</div>

				<div style={styles.mainContent}>
					{/* Left: Medicine Info */}
					<section className="section" style={{ padding: '2rem' }}>
						<div style={styles.medicineImagePlaceholder}>
					<span style={styles.medicineEmoji}>💊</span>
						</div>

						<div style={styles.basicInfo}>
							<h1 style={styles.medicineName}>{medicine.name}</h1>
							<div style={styles.badges}>
								<span style={styles.categoryBadge}>{medicine.category}</span>
								{user?.customer?.buyerType === 'WHOLESALE' && (
									<span style={{ ...styles.categoryBadge, backgroundColor: 'var(--warning)' }}>
										WHOLESALE
									</span>
								)}
							</div>

							<div style={styles.vendorInfo}>
								<p style={styles.vendorLabel}>Vendor:</p>
								<p style={styles.vendorName}>{medicine.vendor}</p>
							</div>

							<div style={styles.stockStatus}>
								{medicine.inStock ? (
									<span style={styles.inStock}>✓ In Stock</span>
								) : (
									<span style={styles.outOfStock}>✗ Out of Stock</span>
								)}
							</div>

							{/* Pricing */}
							<div style={styles.pricing}>
								<div style={styles.priceCard}>
									<p style={styles.priceLabel}>Price</p>
									<p style={styles.priceValue}>₹{displayPrice.toFixed(2)}</p>
									{user?.customer?.buyerType === 'WHOLESALE' && (
										<p style={styles.savingsInfo}>
											Save ₹{savings.toFixed(2)} ({savingsPercent}%)
										</p>
									)}
								</div>
							</div>

							{/* Quantity Selector */}
							{medicine.inStock && (
								<div style={styles.quantitySelector}>
									<label style={styles.quantityLabel}>Quantity</label>
									<div style={styles.quantityControls}>
										<button 
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											style={styles.quantityButton}
										>
											−
										</button>
										<input
											type="number"
											min="1"
											value={quantity}
											onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
											style={styles.quantityInput}
										/>
										<button 
											onClick={() => setQuantity(quantity + 1)}
											style={styles.quantityButton}
										>
											+
										</button>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							{medicine.inStock && (
								<div style={styles.actionButtons}>
									<button 
										onClick={handleAddToCart}
										style={styles.addToCartButton}
									>
										🛒 Add to Cart
									</button>
									{addedToCart && (
										<span style={styles.successMessage}>✓ Added to cart!</span>
									)}
								</div>
							)}
						</div>
					</section>

					{/* Right: Detailed Info */}
					<div style={styles.rightSection}>
						{/* Composition & Details */}
					<section className="section">
							<h2 style={styles.cardTitle}>Composition & Details</h2>
							<table style={styles.infoTable}>
								<tbody>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Composition:</td>
										<td style={styles.infoValue}>{medicine.composition}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Manufacturer:</td>
										<td style={styles.infoValue}>{medicine.manufacturer}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Dosage Form:</td>
										<td style={styles.infoValue}>{medicine.dosage}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Pack Size:</td>
										<td style={styles.infoValue}>{medicine.packSize}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Batch No:</td>
										<td style={styles.infoValue}>{medicine.batchNo}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Expiry Date:</td>
										<td style={styles.infoValue}>{medicine.expiry}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Registration No:</td>
										<td style={styles.infoValue}>{medicine.registrationNo}</td>
									</tr>
									<tr style={styles.infoRow}>
										<td style={styles.infoLabel}>Storage:</td>
										<td style={styles.infoValue}>{medicine.storage}</td>
									</tr>
								</tbody>
							</table>
					</section>

					{/* Description */}
					<section className="section">
							<h2 style={styles.cardTitle}>About This Medicine</h2>
							<p style={styles.description}>{medicine.description}</p>

							<h3 style={styles.subTitle}>Usage</h3>
							<p style={styles.description}>{medicine.usage}</p>
					</section>

					{/* Side Effects & Precautions */}
					<section className="section">
							<h2 style={styles.cardTitle}>Important Information</h2>
							
							<h3 style={styles.subTitle}>Possible Side Effects</h3>
							<p style={styles.description}>{medicine.sideEffects}</p>

							<h3 style={styles.subTitle}>Precautions</h3>
							<p style={styles.description}>{medicine.precautions}</p>

							<h3 style={styles.subTitle}>Warnings</h3>
							<p style={styles.description}>{medicine.warnings}</p>
					</section>

					{/* Disclaimer */}
					<div style={styles.disclaimer}>
						<p>⚠️ <strong>Disclaimer:</strong> This information is for educational purposes only. Always consult a healthcare professional before starting any medication. This product is registered with relevant drug authorities.</p>
					</div>
				</div>
			</div>
		</div>
	</main>
	);
}

const styles = {
	headerNav: {
		marginBottom: '1.5rem',
		width: '100%'
	},
	backButton: {
		background: 'none',
		border: 'none',
		color: 'var(--primary)',
		cursor: 'pointer',
		fontSize: '0.95rem',
		marginBottom: '1.5rem',
		padding: '0.5rem 0',
		fontWeight: '500'
	},
	mainContent: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1.5rem',
		marginBottom: '2rem',
		width: '100%'
	},
	leftSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
		width: '100%',
		overflowX: 'hidden'
	},
	medicineImagePlaceholder: {
		width: '100%',
		aspectRatio: '1',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius-lg)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxShadow: 'var(--shadow-md)'
	},
	medicineEmoji: {
		fontSize: '5rem'
	},
	basicInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	medicineName: {
		fontSize: '1.75rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0
	},
	badges: {
		display: 'flex',
		gap: '0.75rem',
		flexWrap: 'wrap'
	},
	categoryBadge: {
		display: 'inline-block',
		backgroundColor: 'var(--primary)',
		color: 'white',
		padding: '0.4rem 0.8rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600'
	},
	vendorInfo: {
		backgroundColor: 'var(--surface)',
		padding: '1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)'
	},
	vendorLabel: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0 0 0.25rem 0'
	},
	vendorName: {
		fontSize: '1rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	stockStatus: {
		padding: '0.75rem'
	},
	inStock: {
		color: 'var(--success)',
		fontWeight: '600'
	},
	outOfStock: {
		color: 'var(--error)',
		fontWeight: '600'
	},
	pricing: {
		display: 'grid',
		gap: '1rem'
	},
	priceCard: {
		backgroundColor: 'var(--primary-light)',
		padding: '1.25rem',
		borderRadius: 'var(--radius-lg)',
		borderLeft: '4px solid var(--primary)',
		border: '1px solid var(--primary)'
	},
	priceLabel: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0 0 0.5rem 0'
	},
	priceValue: {
		fontSize: '2rem',
		fontWeight: '700',
		color: 'var(--primary)',
		margin: 0
	},
	savingsInfo: {
		fontSize: '0.85rem',
		color: 'var(--success)',
		margin: '0.5rem 0 0 0',
		fontWeight: '500'
	},
	quantitySelector: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	quantityLabel: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	quantityControls: {
		display: 'flex',
		gap: '0.5rem',
		alignItems: 'center'
	},
	quantityButton: {
		width: '40px',
		height: '40px',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)',
		backgroundColor: 'var(--surface)',
		cursor: 'pointer',
		fontSize: '1.2rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		transition: 'all 0.2s'
	},
	quantityInput: {
		flex: 1,
		padding: '0.5rem 0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '1rem',
		textAlign: 'center',
		fontWeight: '600'
	},
	actionButtons: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	addToCartButton: {
		width: '100%',
		padding: '1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius-lg)',
		fontSize: '1rem',
		fontWeight: '600',
		cursor: 'pointer',
		transition: 'background-color 0.2s'
	},
	successMessage: {
		textAlign: 'center',
		color: 'var(--success)',
		fontWeight: '600',
		fontSize: '0.9rem'
	},
	rightSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
		width: '100%',
		overflowX: 'hidden'
	},
	infoCard: {
		backgroundColor: 'white',
		padding: '1.25rem',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)'
	},
	cardTitle: {
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	infoTable: {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: '0.9rem'
	},
	infoRow: {
		borderBottom: '1px solid var(--border-light)'
	},
	infoLabel: {
		fontWeight: '600',
		color: 'var(--text-secondary)',
		padding: '0.75rem 0',
		width: '150px',
		verticalAlign: 'top'
	},
	infoValue: {
		color: 'var(--text-primary)',
		padding: '0.75rem 0 0.75rem 1rem'
	},
	subTitle: {
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '1rem 0 0.5rem 0'
	},
	description: {
		fontSize: '0.9rem',
		lineHeight: '1.6',
		color: 'var(--text-secondary)',
		margin: 0
	},
	disclaimer: {
		backgroundColor: '#FEF3C7',
		border: '1px solid #F59E0B',
		borderRadius: 'var(--radius)',
		padding: '1rem',
		fontSize: '0.85rem',
		color: '#92400E',
		lineHeight: '1.5'
	}
};

export default MedicineDetail;
