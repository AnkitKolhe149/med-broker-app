import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

/**
 * Healthcare-Compliant Medicine Catalog
 * 
 * Design Principles:
 * - Clarity & Safety first (no aggressive marketing)
 * - Fast discovery with powerful filtering
 * - Trusted, professional presentation
 * - Accessibility-first approach
 * - Scalable architecture
 */
function Catalog() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { addToCart } = useCart();
	const { user } = useUser();
	const { showSuccess } = useNotification();
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;
	
	// Search & Filter State
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [availabilityFilter, setAvailabilityFilter] = useState('all');
	const [prescriptionFilter, setPrescriptionFilter] = useState('all');
	const [sortBy, setSortBy] = useState('relevance');
	const [minPrice, setMinPrice] = useState(0);
	const [maxPrice, setMaxPrice] = useState(500);
	const [filterWidth, setFilterWidth] = useState(350);
	const [isResizing, setIsResizing] = useState(false);
	const [showMobileFilters, setShowMobileFilters] = useState(false);

	useEffect(() => {
		// Simulated API call - Replace with real API in production
		const fetchMedicines = async () => {
			setLoading(true);
			try {
				// Simulate network delay
				await new Promise(resolve => setTimeout(resolve, 800));
				
				// Sample medicine data
				const medicineData = [
					{
						id: 1,
						name: 'Paracetamol 500mg',
						category: 'Analgesics',
						composition: 'Paracetamol',
						brand: 'Paracare',
						dosageForm: 'Tablet',
						retailPrice: 45.00,
						wholesalePrice: 36.00,
						popularity: 92,
						addedAt: '2024-01-12',
						requiresPrescription: false,
						vendor: 'PharmaCorp India',
						inStock: true,
						stockLevel: 245
					},
					{
						id: 2,
						name: 'Amoxicillin 250mg',
						category: 'Antibiotics',
						composition: 'Amoxicillin Trihydrate',
						brand: 'MediSupply',
						dosageForm: 'Capsule',
						retailPrice: 120.00,
						wholesalePrice: 98.00,
						popularity: 78,
						addedAt: '2024-01-08',
						requiresPrescription: true,
						vendor: 'MediSupply Ltd',
						inStock: true,
						stockLevel: 152
					},
					{
						id: 3,
						name: 'Cetirizine 10mg',
						category: 'Antihistamines',
						composition: 'Cetirizine Hydrochloride',
						brand: 'AllerFree',
						dosageForm: 'Tablet',
						retailPrice: 25.00,
						wholesalePrice: 20.00,
						popularity: 85,
						addedAt: '2024-01-05',
						requiresPrescription: false,
						vendor: 'HealthPlus Pharma',
						inStock: true,
						stockLevel: 389
					},
					{
						id: 4,
						name: 'Omeprazole 20mg',
						category: 'Antacids',
						composition: 'Omeprazole',
						brand: 'AcidGuard',
						dosageForm: 'Capsule',
						retailPrice: 85.00,
						wholesalePrice: 70.00,
						popularity: 74,
						addedAt: '2024-01-02',
						requiresPrescription: true,
						vendor: 'PharmaCorp India',
						inStock: true,
						stockLevel: 98
					},
					{
						id: 5,
						name: 'Metformin 500mg',
						category: 'Antidiabetics',
						composition: 'Metformin Hydrochloride',
						brand: 'DiabeCare',
						dosageForm: 'Tablet',
						retailPrice: 60.00,
						wholesalePrice: 49.00,
						popularity: 88,
						addedAt: '2023-12-29',
						requiresPrescription: true,
						vendor: 'DiabeCare Inc',
						inStock: true,
						stockLevel: 267
					},
					{
						id: 6,
						name: 'Atorvastatin 10mg',
						category: 'Cardiovascular',
						composition: 'Atorvastatin Calcium',
						brand: 'CardioPharma',
						dosageForm: 'Tablet',
						retailPrice: 95.00,
						wholesalePrice: 78.00,
						popularity: 69,
						addedAt: '2023-12-22',
						requiresPrescription: true,
						vendor: 'CardioPharma',
						inStock: false,
						stockLevel: 0
					},
					{
						id: 7,
						name: 'Ibuprofen 400mg',
						category: 'Analgesics',
						composition: 'Ibuprofen',
						brand: 'PainFree',
						dosageForm: 'Tablet',
						retailPrice: 55.00,
						wholesalePrice: 44.00,
						popularity: 81,
						addedAt: '2023-12-18',
						requiresPrescription: false,
						vendor: 'PharmaCorp India',
						inStock: true,
						stockLevel: 178
					},
					{
						id: 8,
						name: 'Lisinopril 10mg',
						category: 'Cardiovascular',
						composition: 'Lisinopril',
						brand: 'HeartCare',
						dosageForm: 'Tablet',
						retailPrice: 110.00,
						wholesalePrice: 88.00,
						popularity: 76,
						addedAt: '2023-12-10',
						requiresPrescription: true,
						vendor: 'HealthPlus Pharma',
						inStock: true,
						stockLevel: 134
					},
					{
						id: 9,
						name: 'Levothyroxine 50mcg',
						category: 'Endocrine',
						composition: 'Levothyroxine Sodium',
						brand: 'ThyroidCare',
						dosageForm: 'Tablet',
						retailPrice: 80.00,
						wholesalePrice: 65.00,
						popularity: 72,
						addedAt: '2023-12-05',
						requiresPrescription: true,
						vendor: 'DiabeCare Inc',
						inStock: true,
						stockLevel: 201
					},
					{
						id: 10,
						name: 'Aspirin 75mg',
						category: 'Cardiovascular',
						composition: 'Acetylsalicylic Acid',
						brand: 'CardioShield',
						dosageForm: 'Tablet',
						retailPrice: 40.00,
						wholesalePrice: 32.00,
						popularity: 84,
						addedAt: '2023-11-28',
						requiresPrescription: false,
						vendor: 'CardioPharma',
						inStock: true,
						stockLevel: 421
					},
					{
						id: 11,
						name: 'Calcium Carbonate 500mg',
						category: 'Supplements',
						composition: 'Calcium Carbonate',
						brand: 'BoneHealth',
						dosageForm: 'Tablet',
						retailPrice: 35.00,
						wholesalePrice: 28.00,
						popularity: 70,
						addedAt: '2023-11-20',
						requiresPrescription: false,
						vendor: 'PharmaCorp India',
						inStock: true,
						stockLevel: 356
					},
					{
						id: 12,
						name: 'Multivitamin Complex',
						category: 'Supplements',
						composition: 'Vitamins A,B,C,D,E',
						brand: 'VitaNutrition',
						dosageForm: 'Capsule',
						retailPrice: 75.00,
						wholesalePrice: 60.00,
						popularity: 79,
						addedAt: '2023-11-15',
						requiresPrescription: false,
						vendor: 'MediSupply Ltd',
						inStock: true,
						stockLevel: 198
					}
				];
				
				setMedicines(medicineData);
			} catch (error) {
				console.error('Failed to load medicines:', error);
			} finally {
				setLoading(false);
			}
		};
		
		fetchMedicines();
	}, []);

	useEffect(() => {
		const query = searchParams.get('search') || '';
		setSearchQuery(query);
	}, [searchParams]);

	// Available filter options (derived from data)
	const categories = useMemo(() => {
		const unique = new Set(medicines.map(medicine => medicine.category));
		return ['all', ...Array.from(unique)].sort();
	}, [medicines]);

	// Core filtering & sorting logic
	const filteredMedicines = useMemo(() => {
		let list = [...medicines];

		// Search across multiple fields for better discoverability
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			list = list.filter(medicine => (
				medicine.name.toLowerCase().includes(query)
				|| medicine.category.toLowerCase().includes(query)
				|| medicine.vendor.toLowerCase().includes(query)
				|| medicine.composition.toLowerCase().includes(query)
				|| medicine.brand.toLowerCase().includes(query)
				|| medicine.dosageForm.toLowerCase().includes(query)
			));
		}

		// Filter by category
		if (categoryFilter !== 'all') {
			list = list.filter(medicine => medicine.category === categoryFilter);
		}

		// Filter by stock availability
		if (availabilityFilter !== 'all') {
			const inStock = availabilityFilter === 'in-stock';
			list = list.filter(medicine => medicine.inStock === inStock);
		}

		// Filter by prescription requirement
		if (prescriptionFilter !== 'all') {
			const requiresPrescription = prescriptionFilter === 'required';
			list = list.filter(medicine => Boolean(medicine.requiresPrescription) === requiresPrescription);
		}

		// Price range filtering (buyer-type aware)
		const buyerType = user?.customer?.buyerType || 'RETAIL';
		const priceField = buyerType === 'WHOLESALE' ? 'wholesalePrice' : 'retailPrice';
		
		// Filter by price range (sliders always have values)
		list = list.filter(medicine => {
			const price = medicine[priceField];
			return price >= minPrice && price <= maxPrice;
		});

		// Sorting logic (never aggressive, always helpful)
		if (sortBy === 'price-asc') {
			list.sort((a, b) => a[priceField] - b[priceField]);
		} else if (sortBy === 'price-desc') {
			list.sort((a, b) => b[priceField] - a[priceField]);
		} else if (sortBy === 'name-asc') {
			list.sort((a, b) => a.name.localeCompare(b.name));
		} else if (sortBy === 'popularity') {
			list.sort((a, b) => b.popularity - a.popularity);
		} else if (sortBy === 'recent') {
			list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
		}
		// 'relevance' is default (no additional sorting)

		return list;
	}, [medicines, searchQuery, categoryFilter, availabilityFilter, prescriptionFilter, sortBy, minPrice, maxPrice, user?.customer?.buyerType]);

	// Pagination logic
	const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
	const paginatedMedicines = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredMedicines.slice(startIndex, endIndex);
	}, [filteredMedicines, currentPage]);

	// Helper functions
	const buyerType = user?.customer?.buyerType || 'RETAIL';
	const getDisplayPrice = (medicine) => (
		buyerType === 'WHOLESALE' ? medicine.wholesalePrice : medicine.retailPrice
	);

	// Get pricing tier label for transparency
	const getPricingTier = () => {
		if (buyerType === 'WHOLESALE') return '(Wholesale)';
		return '';
	};

	// Get stock status with professional language (no aggressive urgency)
	const getStockStatus = (medicine) => {
		if (!medicine.inStock) return 'Out of stock';
		if (medicine.stockLevel > 50) return 'In stock';
		if (medicine.stockLevel > 20) return 'Limited stock';
		return 'Low stock';
	};

	// Event handlers
	const handleAddToCart = (medicine) => {
		addToCart(
			medicine,
			1,
			medicine.retailPrice,
			medicine.wholesalePrice,
			buyerType
		);
		showSuccess(`${medicine.name} added to cart`);
	};

	const handleSearchChange = (e) => {
		const query = e.target.value;
		setSearchQuery(query);
		setCurrentPage(1); // Reset pagination on search
	};

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		setSearching(false);
		setCurrentPage(1);
	};

	const handleFilterChange = () => {
		setCurrentPage(1); // Reset pagination when filters change
	};

	const handleSortChange = (newSort) => {
		setSortBy(newSort);
		setCurrentPage(1);
	};

	const handleClearAllFilters = () => {
		setSearchQuery('');
		setCategoryFilter('all');
		setAvailabilityFilter('all');
		setPrescriptionFilter('all');
		setSortBy('relevance');
		setMinPrice(0);
		setMaxPrice(500);
		setCurrentPage(1);
	};

	const handleMouseDown = (e) => {
		e.preventDefault();
		setIsResizing(true);
	};

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isResizing) return;
			const newWidth = e.clientX - 100; // Offset for padding
			if (newWidth >= 200 && newWidth <= 500) {
				setFilterWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		} else {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isResizing]);

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// Loading state
	if (loading) {
		return (
			<main className="page">
				<div className="container">
					<div style={styles.loadingContainer}>
						<div style={styles.skeleton} />
						<div style={styles.skeleton} />
						<div style={styles.skeletonSmall} />
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="page">
			<div className="container">
				{/* PAGE HEADER */}
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">Medicine Catalog</h1>
						<p className="section-subtitle">Safe, transparent, and fast medicine discovery from verified vendors</p>
					</div>
				</div>

				{/* SEARCH BAR - TOP OF PAGE */}
				<div style={styles.topSearchContainer}>
					<form onSubmit={handleSearchSubmit} style={styles.topSearchForm}>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>🔍</span>
							<input
								type="text"
								placeholder="Search by medicine name, brand, salt composition, category..."
								value={searchQuery}
								onChange={handleSearchChange}
								style={styles.topSearchInput}
								aria-label="Search medicines"
							/>
						</div>
						<button type="submit" style={styles.topSearchButton}>
							Search
						</button>
					</form>
					
					{/* Mobile Filter Toggle Button */}
					<button 
						className="mobileFilterToggle"
						onClick={() => setShowMobileFilters(!showMobileFilters)}
						style={{
							display: 'none',
							padding: '0.75rem 1.5rem',
							background: 'var(--primary-color)',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '1rem',
							fontWeight: '500',
							cursor: 'pointer',
							marginTop: '1rem',
							width: '100%'
						}}
					>
						{showMobileFilters ? '✕ Close Filters' : '🔽 Show Filters'}
					</button>
				</div>

				{/* TWO-COLUMN LAYOUT: FILTERS (LEFT) + MEDICINES (RIGHT) */}
				<div className="layoutContainer" style={{
					...styles.layoutContainer,
					gridTemplateColumns: `${filterWidth}px 1fr`
				}}>
					
					{/* ===== LEFT SIDEBAR: FILTERS (FIXED) ===== */}
					<aside className={`filterSidebar ${showMobileFilters ? 'show' : ''}`} style={{
						...styles.filterSidebar,
						width: `${filterWidth}px`
					}}>
						{/* Mobile close button */}
						<button 
							className="mobileFilterClose"
							onClick={() => setShowMobileFilters(false)}
							style={{
								display: 'none',
								position: 'sticky',
								top: 0,
								right: 0,
								marginLeft: 'auto',
								marginBottom: '1rem',
								padding: '0.5rem 1rem',
								background: 'var(--primary-color)',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '1rem',
								fontWeight: '500',
								cursor: 'pointer',
								zIndex: 10
							}}
						>
							✕ Close
						</button>
						
						<section className="section" style={styles.filterContent}>

							{/* FILTERS HEADER */}
							<div style={styles.filtersHeader}>
								<h3 style={styles.filtersSectionTitle}>Refine Your Search</h3>
								{(categoryFilter !== 'all' || availabilityFilter !== 'all' || prescriptionFilter !== 'all' || minPrice !== 0 || maxPrice !== 500 || sortBy !== 'relevance') && (
									<button
										onClick={handleClearAllFilters}
										style={styles.clearFiltersButton}
										aria-label="Clear all filters"
									>
										Clear All
									</button>
								)}
							</div>

							{/* CATEGORY FILTER */}
							<div style={styles.filterGroup}>
								<label style={styles.filterGroupLabel}>Category</label>
								<select
									value={categoryFilter}
									onChange={(e) => {
										setCategoryFilter(e.target.value);
										handleFilterChange();
									}}
									style={styles.filterSelect}
									aria-label="Filter by medicine category"
								>
									{categories.map(cat => (
										<option key={cat} value={cat}>
											{cat === 'all' ? 'All Categories' : cat}
										</option>
									))}
								</select>
							</div>

							{/* PRICE RANGE FILTER */}
							<div style={styles.filterGroup}>
								<label style={styles.filterGroupLabel}>Price Range (₹)</label>
								<div style={styles.priceDisplay}>
									<span style={styles.filterPriceValue}>₹{minPrice}</span>
									<span style={styles.priceSeparator}>—</span>
									<span style={styles.filterPriceValue}>₹{maxPrice}</span>
								</div>
								<div style={styles.sliderContainer}>
									<label style={styles.sliderLabel}>Min: ₹{minPrice}</label>
									<input
										type="range"
										min="0"
										max="500"
										step="5"
										value={minPrice}
										onChange={(e) => {
											const value = Number(e.target.value);
											if (value <= maxPrice) {
												setMinPrice(value);
												handleFilterChange();
											}
										}}
										style={styles.priceSlider}
										aria-label="Minimum price slider"
									/>
								</div>
								<div style={styles.sliderContainer}>
									<label style={styles.sliderLabel}>Max: ₹{maxPrice}</label>
									<input
										type="range"
										min="0"
										max="500"
										step="5"
										value={maxPrice}
										onChange={(e) => {
											const value = Number(e.target.value);
											if (value >= minPrice) {
												setMaxPrice(value);
												handleFilterChange();
											}
										}}
										style={styles.priceSlider}
										aria-label="Maximum price slider"
									/>
								</div>
							</div>

							{/* AVAILABILITY FILTER */}
							<div style={styles.filterGroup}>
								<label style={styles.filterGroupLabel}>Availability</label>
								<select
									value={availabilityFilter}
									onChange={(e) => {
										setAvailabilityFilter(e.target.value);
										handleFilterChange();
									}}
									style={styles.filterSelect}
									aria-label="Filter by stock availability"
								>
									<option value="all">All Items</option>
									<option value="in-stock">In Stock Only</option>
									<option value="out-of-stock">Out of Stock</option>
								</select>
							</div>

							{/* PRESCRIPTION FILTER */}
							<div style={styles.filterGroup}>
								<label style={styles.filterGroupLabel}>Prescription Required</label>
								<select
									value={prescriptionFilter}
									onChange={(e) => {
										setPrescriptionFilter(e.target.value);
										handleFilterChange();
									}}
									style={styles.filterSelect}
									aria-label="Filter by prescription requirement"
								>
									<option value="all">All Medicines</option>
									<option value="not-required">No Prescription</option>
									<option value="required">Prescription Required</option>
								</select>
								<p style={styles.filterHint}>
									Prescription-required medicines will require verification during checkout
								</p>
							</div>

							{/* SORT OPTIONS */}
							<div style={styles.filterGroup}>
								<label style={styles.filterGroupLabel}>Sort By</label>
								<select
									value={sortBy}
									onChange={(e) => handleSortChange(e.target.value)}
									style={styles.filterSelect}
									aria-label="Sort medicines"
								>
									<option value="relevance">Relevance</option>
									<option value="price-asc">Price: Low to High</option>
									<option value="price-desc">Price: High to Low</option>
									<option value="name-asc">Name: A to Z</option>
									<option value="popularity">Most Popular</option>
									<option value="recent">Recently Added</option>
								</select>
							</div>

							{/* BUYER TYPE INFO */}
							<div style={styles.infoBox}>
								<p style={styles.infoText}>
									<strong>Pricing:</strong> You are viewing <strong>{buyerType}</strong> pricing.
									{buyerType === 'WHOLESALE' && ' Wholesale discounts applied automatically.'}
								</p>
							</div>
						</section>

						{/* RESIZE HANDLE */}
						<div 
							className="resizeHandle"
							onMouseDown={handleMouseDown}
							style={{
								...styles.resizeHandle,
								cursor: isResizing ? 'col-resize' : 'col-resize',
								backgroundColor: isResizing ? 'var(--primary)' : 'var(--border)'
							}}
							title="Drag to resize filter panel"
						>
							<div style={styles.resizeHandleIcon}>⋮</div>
						</div>
					</aside>

					{/* ===== RIGHT SECTION: MEDICINES LISTING ===== */}
					<section style={styles.mainContent}>
						{/* RESULTS HEADER */}
						<div style={styles.resultsHeader}>
							<div>
								<h2 style={styles.resultsTitle}>
									{filteredMedicines.length} {filteredMedicines.length === 1 ? 'medicine' : 'medicines'} found
								</h2>
								{searchQuery && (
									<p style={styles.resultsSubtitle}>
										Showing results for "{searchQuery}"
									</p>
								)}
							</div>
						</div>

						{/* MEDICINES GRID */}
						{paginatedMedicines.length > 0 ? (
							<>
								<div className="section-grid medicinesGrid" style={styles.medicinesGrid}>
									{paginatedMedicines.map(medicine => (
										<article key={medicine.id} style={styles.medicineCard}>
											{/* HEADER: NAME + CATEGORY */}
											<div style={styles.cardHeader}>
												<h3 style={styles.medicineName}>{medicine.name}</h3>
												<span style={styles.categoryBadge}>{medicine.category}</span>
											</div>

											{/* COMPOSITION & DOSAGE */}
											<div style={styles.cardMeta}>
												<p style={styles.compositionLabel}>
													<strong>Composition:</strong> {medicine.composition}
												</p>
												<p style={styles.dosageLabel}>
													<strong>Dosage Form:</strong> {medicine.dosageForm}
												</p>
												<p style={styles.brandLabel}>
													<strong>Brand:</strong> {medicine.brand}
												</p>
											</div>

											{/* BADGES: PRESCRIPTION, STOCK STATUS */}
											<div style={styles.badgesRow}>
												{medicine.requiresPrescription && (
													<span style={styles.rxBadge}>★ Prescription</span>
												)}
												<span style={{
													...styles.stockBadge,
													backgroundColor: medicine.inStock ? 'var(--success-light)' : 'var(--error-light)',
													color: medicine.inStock ? 'var(--success)' : 'var(--error)'
												}}>
													{getStockStatus(medicine)}
												</span>
											</div>

											{/* PRICING */}
											<div style={styles.pricingSection}>
												<p style={styles.priceLabel}>Price {getPricingTier()}</p>
												<p style={styles.priceValue}>₹{getDisplayPrice(medicine).toFixed(2)}</p>
											</div>

											{/* ACTIONS */}
											<div style={styles.cardActions}>
												<button
													onClick={() => navigate(`/customer/medicine/${medicine.id}`)}
													style={styles.detailsButton}
													aria-label={`View details for ${medicine.name}`}
												>
													📋 Details
												</button>
												<button
													onClick={() => handleAddToCart(medicine)}
													disabled={!medicine.inStock}
													style={{
														...styles.addToCartButton,
														opacity: medicine.inStock ? 1 : 0.5,
														cursor: medicine.inStock ? 'pointer' : 'not-allowed'
													}}
													aria-label={medicine.inStock ? `Add ${medicine.name} to cart` : `${medicine.name} is out of stock`}
												>
													{medicine.inStock ? '🛒 Add to Cart' : 'Out of Stock'}
												</button>
											</div>

											{/* VENDOR INFO - SMALL TEXT */}
											<p style={styles.vendorInfo}>Sold by {medicine.vendor}</p>
										</article>
									))}
								</div>

								{/* PAGINATION */}
								{totalPages > 1 && (
									<div style={styles.paginationContainer}>
										<button
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 1}
											style={styles.paginationButton}
											aria-label="Previous page"
										>
											← Previous
										</button>

										<div style={styles.pageNumbers}>
											{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
												<button
													key={page}
													onClick={() => handlePageChange(page)}
													style={{
														...styles.pageNumber,
														backgroundColor: currentPage === page ? 'var(--primary)' : 'transparent',
														color: currentPage === page ? 'white' : 'var(--text-primary)',
														fontWeight: currentPage === page ? '600' : '400'
													}}
													aria-label={`Go to page ${page}`}
													aria-current={currentPage === page ? 'page' : undefined}
												>
													{page}
												</button>
											))}
										</div>

										<button
											onClick={() => handlePageChange(currentPage + 1)}
											disabled={currentPage === totalPages}
											style={styles.paginationButton}
											aria-label="Next page"
										>
											Next →
										</button>
									</div>
								)}
							</>
						) : (
							/* EMPTY STATE */
							<div style={styles.emptyState}>
								<div style={styles.emptyIcon}>🔍</div>
								<h3 style={styles.emptyTitle}>No medicines found</h3>
								<p style={styles.emptyDescription}>
									{searchQuery
										? `No results for "${searchQuery}". Try different keywords.`
										: 'Try adjusting your filters to find what you need.'}
								</p>
								<button
									onClick={handleClearAllFilters}
									style={styles.resetButton}
									aria-label="Reset all filters and search"
								>
									Reset Filters & Search
								</button>
								<a href="/customer/catalog" style={styles.backLink}>
									← Back to all medicines
								</a>
							</div>
						)}
					</section>
				</div>

				{/* INFORMATIONAL FOOTER */}
				<div style={styles.infoFooter}>
					<p style={styles.infoTitle}>📋 How to Use This Catalog</p>
					<ul style={styles.infoList}>
						<li><strong>Search:</strong> Use medicine name, brand, salt name, or dosage form</li>
						<li><strong>Filter:</strong> Narrow by category, price, availability, or prescription status</li>
						<li><strong>View Details:</strong> Click any medicine to see composition, vendor info, and patient guidance</li>
						<li><strong>Pricing:</strong> Prices shown are your {buyerType} pricing and finalized at checkout</li>
						<li><strong>Prescriptions:</strong> Medicines marked with ★ require verification before delivery</li>
					</ul>
				</div>
			</div>
		</main>
	);
}

const styles = {
	// LOADING STATE
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
		padding: '2rem'
	},
	skeleton: {
		height: '200px',
		backgroundColor: 'var(--surface)',
		borderRadius: 'var(--radius)',
		animation: 'pulse 1.5s ease-in-out infinite'
	},
	skeletonSmall: {
		height: '50px',
		backgroundColor: 'var(--surface)',
		borderRadius: 'var(--radius)',
		animation: 'pulse 1.5s ease-in-out infinite'
	},

	// LAYOUT
	layoutContainer: {
		display: 'grid',
		gap: '1.5rem',
		marginTop: '1.5rem',
		width: '100%',
		maxWidth: '100%',
		alignItems: 'start'
	},
	filterSidebar: {
		display: 'flex',
		flexDirection: 'column',
		position: 'sticky',
		top: '20px',
		backgroundColor: 'var(--surface)',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		userSelect: 'none',
		maxHeight: 'calc(100vh - 40px)',
		overflowY: 'auto',
		boxShadow: 'var(--shadow-md)'
	},
	mainContent: {
		display: 'flex',
		flexDirection: 'column',
		minWidth: 0,
		width: '100%'
	},

	// TOP SEARCH BAR
	topSearchContainer: {
		marginTop: '1.5rem',
		marginBottom: '1.5rem',
		width: '100%'
	},
	topSearchForm: {
		display: 'flex',
		gap: '1rem',
		maxWidth: '100%',
		backgroundColor: 'white',
		border: '2px solid var(--primary)',
		borderRadius: 'var(--radius-lg)',
		padding: '0.75rem 1rem',
		boxShadow: 'var(--shadow-md)',
		transition: 'all 0.2s'
	},
	topSearchInput: {
		flex: 1,
		padding: '0.5rem',
		border: 'none',
		fontSize: '1rem',
		fontFamily: 'inherit',
		outline: 'none',
		backgroundColor: 'transparent'
	},
	topSearchButton: {
		padding: '1rem 2rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontSize: '1rem',
		fontWeight: '600',
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		transition: 'background-color 0.2s',
		boxShadow: 'var(--shadow-sm)',
		':hover': {
			backgroundColor: 'var(--primary-dark)'
		}
	},

	// RESIZE HANDLE
	resizeHandle: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: '10px',
		height: '100%',
		cursor: 'col-resize',
		backgroundColor: 'var(--border)',
		borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
		transition: 'background-color 0.2s ease',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 100
	},
	resizeHandleIcon: {
		color: 'white',
		fontSize: '1.2rem',
		fontWeight: 'bold',
		pointerEvents: 'none'
	},

	// FILTER CONTENT
	filterContent: {
		padding: '1.5rem 1.25rem',
		flex: 1
	},

	// FILTERS SECTION
	filtersHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1.5rem',
		paddingBottom: '1rem',
		borderBottom: '2px solid var(--primary)'
	},
	filtersSectionTitle: {
		fontSize: '1.05rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0
	},
	clearFiltersButton: {
		padding: '0.4rem 0.8rem',
		backgroundColor: 'var(--error-light)',
		color: 'var(--error)',
		border: '1px solid var(--error)',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600',
		cursor: 'pointer',
		transition: 'all 0.2s'
	},

	// FILTER GROUP
	filterGroup: {
		marginBottom: '1.5rem',
		padding: '0.75rem 0'
	},
	filterGroupLabel: {
		display: 'block',
		fontSize: '0.85rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		marginBottom: '0.5rem'
	},
	filterSelect: {
		width: '100%',
		padding: '0.6rem 0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.9rem',
		backgroundColor: 'white',
		color: 'var(--text-primary)',
		cursor: 'pointer',
		transition: 'border-color 0.2s'
	},
	filterHint: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		marginTop: '0.4rem',
		fontStyle: 'italic'
	},

	// PRICE RANGE
	priceDisplay: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '0.75rem',
		padding: '0.75rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)'
	},
	filterPriceValue: {
		fontSize: '0.95rem',
		fontWeight: '700',
		color: 'var(--primary)'
	},
	priceSeparator: {
		color: 'var(--text-secondary)',
		fontWeight: '600'
	},
	sliderContainer: {
		marginBottom: '1rem'
	},
	sliderLabel: {
		display: 'block',
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.5rem',
		fontWeight: '600'
	},
	priceSlider: {
		width: '100%',
		height: '6px',
		borderRadius: 'var(--radius)',
		outline: 'none',
		background: 'linear-gradient(to right, var(--green-200) 0%, var(--primary) 100%)',
		'-webkit-appearance': 'none',
		appearance: 'none',
		cursor: 'pointer'
	},

	// INFO BOX (in sidebar)
	infoBox: {
		backgroundColor: 'var(--primary-light)',
		border: '1px solid var(--green-200)',
		borderRadius: 'var(--radius)',
		padding: '1rem',
		marginTop: '2rem'
	},
	infoText: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		lineHeight: '1.4',
		margin: 0
	},

	// RESULTS SECTION
	resultsHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '1.5rem',
		paddingBottom: '1rem',
		borderBottom: '1px solid var(--border)'
	},
	resultsTitle: {
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0
	},
	resultsSubtitle: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginTop: '0.25rem'
	},

	// MEDICINES GRID
	medicinesGrid: {
		display: 'grid',
		// gridTemplateColumns handled by CSS class for responsive design
		gap: '1.5rem',
		marginBottom: '2rem',
		width: '100%'
	},

	// MEDICINE CARD
	medicineCard: {
		backgroundColor: 'white',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius-lg)',
		padding: '1.5rem',
		boxShadow: 'var(--shadow-sm)',
		display: 'flex',
		flexDirection: 'column',
		transition: 'all 0.2s ease',
		':hover': {
			boxShadow: 'var(--shadow-md)',
			borderColor: 'var(--primary)'
		}
	},
	cardHeader: {
		marginBottom: '0.75rem'
	},
	medicineName: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 0.5rem 0',
		lineHeight: '1.3'
	},
	categoryBadge: {
		display: 'inline-block',
		backgroundColor: 'var(--primary)',
		color: 'white',
		padding: '0.25rem 0.6rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.7rem',
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: '0.5px'
	},

	// CARD METADATA
	cardMeta: {
		fontSize: '0.85rem',
		marginBottom: '1rem',
		paddingBottom: '1rem',
		borderBottom: '1px solid var(--border-light)'
	},
	compositionLabel: {
		margin: '0 0 0.4rem 0',
		color: 'var(--text-secondary)',
		lineHeight: '1.4'
	},
	dosageLabel: {
		margin: '0 0 0.4rem 0',
		color: 'var(--text-secondary)',
		lineHeight: '1.4'
	},
	brandLabel: {
		margin: 0,
		color: 'var(--text-secondary)',
		lineHeight: '1.4'
	},

	// BADGES ROW
	badgesRow: {
		display: 'flex',
		gap: '0.5rem',
		flexWrap: 'wrap',
		marginBottom: '1rem'
	},
	rxBadge: {
		display: 'inline-block',
		backgroundColor: '#FFE4D6',
		color: '#D97706',
		padding: '0.3rem 0.6rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.75rem',
		fontWeight: '600',
		whiteSpace: 'nowrap'
	},
	stockBadge: {
		display: 'inline-block',
		padding: '0.3rem 0.6rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.75rem',
		fontWeight: '600',
		whiteSpace: 'nowrap'
	},

	// PRICING SECTION
	pricingSection: {
		backgroundColor: 'var(--primary-light)',
		border: '1px solid var(--green-200)',
		borderRadius: 'var(--radius)',
		padding: '0.75rem 1rem',
		marginBottom: '1rem'
	},
	priceLabel: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: '0 0 0.25rem 0',
		textTransform: 'uppercase',
		letterSpacing: '0.5px'
	},
	priceValue: {
		fontSize: '1.4rem',
		fontWeight: '700',
		color: 'var(--primary)',
		margin: 0
	},

	// CARD ACTIONS
	cardActions: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '0.75rem'
	},
	detailsButton: {
		flex: 1,
		padding: '0.6rem 0.75rem',
		backgroundColor: 'var(--surface)',
		color: 'var(--text-primary)',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.85rem',
		fontWeight: '600',
		cursor: 'pointer',
		transition: 'all 0.2s',
		whiteSpace: 'nowrap'
	},
	addToCartButton: {
		flex: 1,
		padding: '0.6rem 0.75rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontSize: '0.85rem',
		fontWeight: '600',
		cursor: 'pointer',
		transition: 'background-color 0.2s',
		whiteSpace: 'nowrap'
	},

	// VENDOR INFO
	vendorInfo: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: 0,
		marginTop: 'auto',
		paddingTop: '0.5rem',
		borderTop: '1px solid var(--border-light)'
	},

	// PAGINATION
	paginationContainer: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		gap: '1rem',
		marginTop: '2rem',
		paddingTop: '2rem',
		borderTop: '1px solid var(--border)'
	},
	paginationButton: {
		padding: '0.6rem 1rem',
		backgroundColor: 'white',
		color: 'var(--primary)',
		border: '1px solid var(--primary)',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer',
		transition: 'all 0.2s',
		whiteSpace: 'nowrap'
	},
	pageNumbers: {
		display: 'flex',
		gap: '0.25rem'
	},
	pageNumber: {
		minWidth: '36px',
		height: '36px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontSize: '0.85rem',
		transition: 'all 0.2s'
	},

	// EMPTY STATE
	emptyState: {
		textAlign: 'center',
		backgroundColor: 'white',
		border: '1px dashed var(--border)',
		borderRadius: 'var(--radius-lg)',
		padding: '3rem 2rem'
	},
	emptyIcon: {
		fontSize: '3rem',
		marginBottom: '1rem'
	},
	emptyTitle: {
		fontSize: '1.25rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 0.5rem 0'
	},
	emptyDescription: {
		fontSize: '0.95rem',
		color: 'var(--text-secondary)',
		maxWidth: '400px',
		margin: '0 auto 1.5rem'
	},
	resetButton: {
		display: 'inline-block',
		padding: '0.75rem 1.5rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer',
		marginBottom: '1rem',
		transition: 'background-color 0.2s'
	},
	backLink: {
		display: 'inline-block',
		color: 'var(--primary)',
		textDecoration: 'none',
		fontSize: '0.9rem',
		fontWeight: '500',
		borderBottom: '1px solid var(--primary)',
		transition: 'all 0.2s'
	},

	// INFO FOOTER
	infoFooter: {
		backgroundColor: 'var(--primary-light)',
		border: '1px solid var(--green-200)',
		borderRadius: 'var(--radius-lg)',
		padding: '1.5rem',
		marginTop: '3rem'
	},
	infoTitle: {
		fontSize: '0.95rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0'
	},
	infoList: {
		listStyle: 'none',
		margin: 0,
		padding: 0
	}
};

// Add each list item style
const listItemStyle = {
	fontSize: '0.85rem',
	color: 'var(--text-secondary)',
	marginBottom: '0.5rem',
	lineHeight: '1.4',
	paddingLeft: '0'
};

// Apply to list items via CSS would be better, but for now:
// Update the infoList style to support li elements
styles.infoList = {
	...styles.infoList,
	'& li': listItemStyle
};

export default Catalog;