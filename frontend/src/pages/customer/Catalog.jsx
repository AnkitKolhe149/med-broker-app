import React, { useMemo, useState, useEffect, useReducer } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Search, Star } from 'lucide-react';
import { formatCurrency as formatCurrencyValue, getCurrencySymbol as getCurrencySymbolByCode } from '../../utils/currency';
import medicineService from '../../services/medicine.service';
import styles from './Catalog.module.css';
import { catalogReducer, initialCatalogState, CATALOG_ACTIONS } from './catalogReducer';

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
	const location = useLocation();
	const { addToCart } = useCart();
	const { user } = useUser();
	const { showSuccess, showError } = useNotification();
	const { currency: userCurrency } = useCurrency();
	const [viewerCurrency, setViewerCurrency] = useState(userCurrency || 'USD');
	const [apiPagination, setApiPagination] = useState({ totalPages: 1, total: 0 });
	
	// Consolidated state management with useReducer
	const [state, dispatch] = useReducer(catalogReducer, initialCatalogState);
	const {
		searchQuery,
		categoryFilter,
		availabilityFilter,
		prescriptionFilter,
		sortBy,
		minPrice,
		maxPrice,
		currentPage,
		filterWidth,
		isResizing,
		showMobileFilters,
		medicines,
		loading,
		searching
	} = state;
	const activeSearchParam = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);
	
	const itemsPerPage = 12;
	const getBrandLabel = (medicine) => medicine.brand || medicine.vendor || 'Unbranded';

	useEffect(() => {
		const fetchMedicines = async () => {
			const isInitialLoad = currentPage === 1 && medicines.length === 0;
			dispatch({ type: CATALOG_ACTIONS.SET_LOADING, payload: isInitialLoad });
			dispatch({ type: CATALOG_ACTIONS.SET_SEARCHING, payload: !isInitialLoad });
			try {
				const result = await medicineService.getMedicines({
					page: currentPage,
					limit: itemsPerPage,
					search: searchQuery || undefined
				});

				if (result.success) {
					dispatch({ type: CATALOG_ACTIONS.SET_MEDICINES, payload: result.medicines });
					setApiPagination({
						totalPages: result.pagination?.totalPages || 1,
						total: result.pagination?.total || 0
					});
					if (result.currency) {
						setViewerCurrency(result.currency);
					}

					if ((result.pagination?.totalPages || 1) > currentPage) {
						medicineService.prefetchMedicines({
							page: currentPage + 1,
							limit: itemsPerPage,
							search: searchQuery || undefined
						});
					}
				} else {
					console.error('Failed to fetch medicines:', result.error);
					showError('Failed to load medicines from server');
				}
			} catch (error) {
				console.error('Failed to load medicines:', error);
				showError('Error loading medicines');
			} finally {
				dispatch({ type: CATALOG_ACTIONS.SET_LOADING, payload: false });
				dispatch({ type: CATALOG_ACTIONS.SET_SEARCHING, payload: false });
			}
		};
		
		fetchMedicines();
	}, [currentPage, itemsPerPage, searchQuery]);

	useEffect(() => {
		if (activeSearchParam !== searchQuery) {
			dispatch({ type: CATALOG_ACTIONS.SET_SEARCH_QUERY, payload: activeSearchParam });
		}
	}, [activeSearchParam, searchQuery]);

	// Available filter options (derived from data)
	const categories = useMemo(() => {
		const unique = new Set(medicines.map((medicine) => getBrandLabel(medicine)));
		return ['all', ...Array.from(unique)].sort();
	}, [medicines]);

	// Core filtering & sorting logic
	const filteredMedicines = useMemo(() => {
		let list = [...medicines];

		// Filter by category
		if (categoryFilter !== 'all') {
			list = list.filter((medicine) => getBrandLabel(medicine) === categoryFilter);
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

	// API-driven pagination to avoid double-slicing already paginated results.
	const totalPages = apiPagination.totalPages;

	// Helper functions
	const buyerType = user?.customer?.buyerType || 'RETAIL';
	const minPricePercent = (minPrice / 500) * 100;
	const maxPricePercent = (maxPrice / 500) * 100;
	const getDisplayPrice = (medicine) => {
		return buyerType === 'WHOLESALE' ? medicine.wholesalePrice : medicine.retailPrice;
	};

	const getStockStatusTone = (medicine) => {
		if (!medicine.inStock) return 'out';
		if (medicine.stockLevel > 50) return 'good';
		if (medicine.stockLevel > 20) return 'warn';
		return 'low';
	};

	const formatDisplayPrice = (value) => formatCurrencyValue(value, viewerCurrency, true);
	// Get pricing tier label for transparency
	const getPricingTier = () => {
		if (buyerType === 'WHOLESALE') return '(Wholesale)';
		return '(Retail)';
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
			buyerType,
			medicine.currencyCode || viewerCurrency,
			'standard',
			medicine.bulkPrice,
			medicine.bulkMinQty
		);
		showSuccess(`${medicine.name} added to cart`);
	};

	const handleSortChange = (newSort) => {
		dispatch({ type: CATALOG_ACTIONS.SET_SORT_BY, payload: newSort });
		dispatch({ type: CATALOG_ACTIONS.SET_CURRENT_PAGE, payload: 1 });
	};

	const handleClearAllFilters = () => {
		dispatch({ type: CATALOG_ACTIONS.RESET_FILTERS });
	};

	const handleMouseDown = (e) => {
		e.preventDefault();
		dispatch({ type: CATALOG_ACTIONS.SET_IS_RESIZING, payload: true });
	};

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isResizing) return;
			const newWidth = e.clientX - 100; // Offset for padding
			if (newWidth >= 200 && newWidth <= 500) {
				dispatch({ type: CATALOG_ACTIONS.SET_FILTER_WIDTH, payload: newWidth });
			}
		};

		const handleMouseUp = () => {
			dispatch({ type: CATALOG_ACTIONS.SET_IS_RESIZING, payload: false });
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
		dispatch({ type: CATALOG_ACTIONS.SET_CURRENT_PAGE, payload: newPage });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// Loading state
	if (loading) {
		return (
			<main className="page">
				<div className="container">
					<div className={styles.loadingContainer}>
						<div className={styles.skeleton} />
						<div className={styles.skeleton} />
						<div className={styles.skeletonSmall} />
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className={`page ${styles.catalogPage}`}>
			<div className="container">
				{/* Mobile Filter Toggle Button */}
				<button 
					className="mobileFilterToggle"
					onClick={() => dispatch({ type: CATALOG_ACTIONS.SET_SHOW_MOBILE_FILTERS, payload: !showMobileFilters })}
					style={{
						display: 'none',
						padding: '0.75rem 1.5rem',
						background: 'var(--primary)',
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
					{showMobileFilters ? 'Close Filters' : 'Show Filters'}
				</button>

				{/* TWO-COLUMN LAYOUT: FILTERS (LEFT) + MEDICINES (RIGHT) */}
				<div
					className={styles.layoutContainer}
					style={{ '--filter-width': `${filterWidth}px` }}
				>

					{/* ===== LEFT SIDEBAR: FILTERS (DRAWER ON MOBILE) ===== */}
					<aside
						className={styles.filterSidebar}
						style={{ left: showMobileFilters ? '0' : undefined }}
					>
						<button
							className="mobileFilterClose"
							onClick={() => dispatch({ type: CATALOG_ACTIONS.SET_SHOW_MOBILE_FILTERS, payload: false })}
							style={{
								display: 'none',
								position: 'sticky',
								top: 0,
								right: 0,
								marginLeft: 'auto',
								marginBottom: '1rem',
								padding: '0.5rem 1rem',
								background: 'var(--primary)',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '1rem',
								fontWeight: '500',
								cursor: 'pointer',
								zIndex: 10
							}}
						>
							Close
						</button>

						<section className={styles.filterContent}>
							<div className={styles.filtersHeader}>
								<h3 className={styles.filtersSectionTitle}>Refine Your Search</h3>
								{(categoryFilter !== 'all' || availabilityFilter !== 'all' || prescriptionFilter !== 'all' || minPrice !== 0 || maxPrice !== 500 || sortBy !== 'relevance') && (
									<button
										onClick={handleClearAllFilters}
										className={styles.clearFiltersButton}
										aria-label="Clear all filters"
									>
										Clear All
									</button>
								)}
							</div>

							<div className={styles.filterGroup}>
								<label className={styles.filterGroupLabel}>Category</label>
								<select
									value={categoryFilter}
									onChange={(e) => dispatch({ type: CATALOG_ACTIONS.SET_CATEGORY_FILTER, payload: e.target.value })}
									className={styles.filterSelect}
									aria-label="Filter by medicine category"
								>
									{categories.map((cat) => (
										<option key={cat} value={cat}>
											{cat === 'all' ? 'All Categories' : cat}
										</option>
									))}
								</select>
							</div>

							<div className={styles.filterGroup}>
								<label className={styles.filterGroupLabel}>Price Range ({getCurrencySymbolByCode(viewerCurrency)})</label>
								<div className={styles.priceDisplay}>
									<span className={styles.filterPriceValue}>{formatDisplayPrice(minPrice)}</span>
									<span className={styles.priceSeparator}>-</span>
									<span className={styles.filterPriceValue}>{formatDisplayPrice(maxPrice)}</span>
								</div>
								<div className={styles.rangeSliderContainer}>
									<div className={styles.rangeSliderTrack} />
									<div
										className={styles.rangeSliderHighlight}
										style={{
											left: `${minPricePercent}%`,
											width: `${Math.max(maxPricePercent - minPricePercent, 0)}%`
										}}
									/>
									<input
										type="range"
										min="0"
										max="500"
										step="5"
										value={minPrice}
										onChange={(e) => {
											const value = Number(e.target.value);
											if (value <= maxPrice) dispatch({ type: CATALOG_ACTIONS.SET_MIN_PRICE, payload: value });
										}}
										className={`${styles.priceRangeInput} ${styles.minThumb}`}
										aria-label="Minimum price"
									/>
									<input
										type="range"
										min="0"
										max="500"
										step="5"
										value={maxPrice}
										onChange={(e) => {
											const value = Number(e.target.value);
											if (value >= minPrice) dispatch({ type: CATALOG_ACTIONS.SET_MAX_PRICE, payload: value });
										}}
										className={`${styles.priceRangeInput} ${styles.maxThumb}`}
										aria-label="Maximum price"
									/>
								</div>
								<div className={styles.sliderValuesRow}>
									<span className={styles.sliderValueLabel}>Min: {formatDisplayPrice(minPrice)}</span>
									<span className={styles.sliderValueLabel}>Max: {formatDisplayPrice(maxPrice)}</span>
								</div>
							</div>

							<div className={styles.filterGroup}>
								<label className={styles.filterGroupLabel}>Availability</label>
								<select
									value={availabilityFilter}
									onChange={(e) => dispatch({ type: CATALOG_ACTIONS.SET_AVAILABILITY_FILTER, payload: e.target.value })}
									className={styles.filterSelect}
									aria-label="Filter by stock availability"
								>
									<option value="all">All Items</option>
									<option value="in-stock">In Stock Only</option>
									<option value="out-of-stock">Out of Stock</option>
								</select>
							</div>

							<div className={styles.filterGroup}>
								<label className={styles.filterGroupLabel}>Prescription Required</label>
								<select
									value={prescriptionFilter}
									onChange={(e) => dispatch({ type: CATALOG_ACTIONS.SET_PRESCRIPTION_FILTER, payload: e.target.value })}
									className={styles.filterSelect}
									aria-label="Filter by prescription requirement"
								>
									<option value="all">All Medicines</option>
									<option value="not-required">No Prescription</option>
									<option value="required">Prescription Required</option>
								</select>
								<p className={styles.filterHint}>Prescription-required medicines will require verification during checkout</p>
							</div>

							<div className={styles.filterGroup}>
								<label className={styles.filterGroupLabel}>Sort By</label>
								<select
									value={sortBy}
									onChange={(e) => handleSortChange(e.target.value)}
									className={styles.filterSelect}
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

							<div className={styles.infoBox}>
								<p className={styles.infoText}>
									<strong>Pricing:</strong> You are viewing <strong>{buyerType}</strong> pricing.
									{buyerType === 'WHOLESALE' && ' Wholesale discounts applied automatically.'}
								</p>
							</div>
						</section>

						<div
							className={styles.resizeHandle}
							onMouseDown={handleMouseDown}
							style={{
								cursor: 'col-resize',
								backgroundColor: isResizing ? 'var(--primary)' : 'var(--border)'
							}}
							title="Drag to resize filter panel"
						>
							<div className={styles.resizeHandleIcon}>...</div>
						</div>
					</aside>

					{/* Filter drawer backdrop - allows closing filter when tapped */}
					<div 
						className={styles.filterBackdrop}
						style={{
							display: showMobileFilters ? 'block' : 'none',
							opacity: showMobileFilters ? 1 : 0
						}}
						onClick={() => dispatch({ type: CATALOG_ACTIONS.SET_SHOW_MOBILE_FILTERS, payload: false })}
						aria-label="Close filter panel"
						role="button"
						tabIndex="0"
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								dispatch({ type: CATALOG_ACTIONS.SET_SHOW_MOBILE_FILTERS, payload: false });
							}
						}}
					/>

					{/* ===== RIGHT SECTION: MEDICINES LISTING ===== */}
					<section className={styles.mainContent}>
						<div className={styles.resultsHeaderCompact}>
							<div>
								<h2 className={styles.resultsTitle}>
									{filteredMedicines.length} {filteredMedicines.length === 1 ? 'medicine' : 'medicines'} found
								</h2>
								{searchQuery && <p className={styles.resultsSubtitle}>Showing results for "{searchQuery}"</p>}
								{searching && <p className={styles.resultsSubtitle}>Updating results...</p>}
							</div>
						</div>

						{/* ACTIVE FILTERS DISPLAY */}
						<div className="activeFiltersBadges" style={{
							display: (categoryFilter !== 'all' || availabilityFilter !== 'all' || prescriptionFilter !== 'all' || minPrice !== 0 || maxPrice !== 500) ? 'flex' : 'none'
						}}>
							{categoryFilter !== 'all' && (
								<span className="filterBadge">
									Category: {categoryFilter}
							<button onClick={() => { dispatch({ type: CATALOG_ACTIONS.SET_CATEGORY_FILTER, payload: 'all' }); }}>×</button>
								</span>
							)}
							{availabilityFilter !== 'all' && (
								<span className="filterBadge">
									{availabilityFilter === 'in-stock' ? 'In Stock' : 'Out of Stock'}
							<button onClick={() => { dispatch({ type: CATALOG_ACTIONS.SET_AVAILABILITY_FILTER, payload: 'all' }); }}>×</button>
								</span>
							)}
							{prescriptionFilter !== 'all' && (
								<span className="filterBadge">
									{prescriptionFilter === 'required' ? 'Prescription Only' : 'No Prescription'}
							<button onClick={() => { dispatch({ type: CATALOG_ACTIONS.SET_PRESCRIPTION_FILTER, payload: 'all' }); }}>×</button>
								</span>
							)}
							{(minPrice !== 0 || maxPrice !== 500) && (
								<span className="filterBadge">
								{formatDisplayPrice(minPrice)}-{formatDisplayPrice(maxPrice)}
							<button onClick={() => { dispatch({ type: CATALOG_ACTIONS.RESET_PRICE_RANGE }); }}>×</button>
								</span>
							)}
							{(categoryFilter !== 'all' || availabilityFilter !== 'all' || prescriptionFilter !== 'all' || minPrice !== 0 || maxPrice !== 500) && (
								<button 
									className="clearAllFiltersBtn"
									onClick={handleClearAllFilters}
								>
									Clear All Filters
								</button>
							)}
						</div>

						{/* RESULTS HEADER */}
						{/* MEDICINES GRID */}
						{loading ? (
							/* LOADING STATE */
							<div className="skeletonGrid">
								{[...Array(6)].map((_, i) => (
									<div key={i} className="skeletonCard">
										<div className="skeletonLine title"></div>
										<div className="skeletonLine text"></div>
										<div className="skeletonLine text"></div>
										<div className="skeletonLine text" style={{ width: '60%' }}></div>
										<div className="skeletonButton"></div>
									</div>
								))}
							</div>
						) : filteredMedicines.length > 0 ? (
							<>
								<div className={styles.medicinesGrid}>
									{filteredMedicines.map(medicine => (
									<article key={medicine.id} className={styles.medicineCard}>
										<div className={styles.cardImageWrap}>
											<div className={styles.cardOverlayRow}>
												<span className={styles.ratingBadge}><Star size={14} strokeWidth={1.75} fill="currentColor" /> {Math.min(5, Math.max(3.8, (medicine.popularity / 20)).toFixed(1))}</span>
												<span className={`${styles.stockPill} ${styles[`stockTone-${getStockStatusTone(medicine)}`]}`}>{getStockStatus(medicine)}</span>
											</div>
											{medicine.imageUrl ? (
												<img src={medicine.imageUrl} alt={medicine.name} className={styles.cardImage} loading="lazy" />
											) : (
												<div className={styles.cardImageFallback}>No image</div>
											)}
										</div>
										{/* HEADER: NAME + CATEGORY */}
										<div className={styles.cardHeader}>
											<h3 className={styles.medicineName}>{medicine.name}</h3>
											<span className={styles.categoryBadge}>{getBrandLabel(medicine)}</span>
											</div>

											{/* BADGES: PRESCRIPTION, STOCK STATUS */}
										<div className={styles.badgesRow}>
											{medicine.requiresPrescription && (
												<span className={styles.rxBadge}>Rx Prescription</span>
												)}
											</div>

											{/* PRICING */}
										<div className={styles.pricingSection}>
											<p className={styles.priceLabel}>Price {getPricingTier()}</p>
											<p className={styles.priceValue}>{formatDisplayPrice(getDisplayPrice(medicine))}</p>
											</div>

											{/* ACTIONS */}
										<div className={styles.cardActions}>
											<button
												onClick={() => navigate(`/customer/medicine/${medicine.id}`)}
												className={styles.detailsButton}
													aria-label={`View details for ${medicine.name}`}
												>
													Details
												</button>
												<button
													onClick={() => handleAddToCart(medicine)}
													disabled={!medicine.inStock}
												className={styles.addToCartButton}
												style={{
														opacity: medicine.inStock ? 1 : 0.5,
														cursor: medicine.inStock ? 'pointer' : 'not-allowed'
													}}
													aria-label={medicine.inStock ? `Add ${medicine.name} to cart` : `${medicine.name} is out of stock`}
												>
													{medicine.inStock ? 'Add to Cart' : 'Out of Stock'}
												</button>
											</div>

										</article>
									))}
								</div>

								{/* PAGINATION */}
								{totalPages > 1 && (
									<div className={styles.paginationContainer}>
										<button
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 1}
											className={styles.paginationButton}
											aria-label="Previous page"
										>
											Previous
										</button>

										<div className={styles.pageNumbers}>
											{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
												<button
													key={page}
													onClick={() => handlePageChange(page)}
													className={styles.pageNumber}
													style={{
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
											className={styles.paginationButton}
											aria-label="Next page"
										>
											Next
										</button>
									</div>
								)}
							</>
						) : (
							/* EMPTY STATE */
							<div className="emptyState">
							<div className="emptyStateIcon"><Search size={30} strokeWidth={1.75} /></div>
								<h3>No medicines found</h3>
								<p>
									{searchQuery
										? `No results for "${searchQuery}". Try different keywords or adjust your filters.`
										: 'Try adjusting your filters to find what you need.'}
								</p>
								<button
									onClick={handleClearAllFilters}
									aria-label="Reset all filters and search"
								>
									Clear All Filters & Search
								</button>
							</div>
						)}
					</section>
				</div>

			</div>
		</main>
	);
}

export default Catalog;
