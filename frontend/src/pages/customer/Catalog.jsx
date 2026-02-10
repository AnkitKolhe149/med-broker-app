import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth.service';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';

function Catalog() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { addToCart } = useCart();
	const { user } = useUser();
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [availabilityFilter, setAvailabilityFilter] = useState('all');
	const [prescriptionFilter, setPrescriptionFilter] = useState('all');
	const [sortBy, setSortBy] = useState('relevance');
	const [minPrice, setMinPrice] = useState('');
	const [maxPrice, setMaxPrice] = useState('');

	useEffect(() => {
		// Sample medicine data - will be replaced with API call
		setMedicines([
			{
				id: 1,
				name: 'Paracetamol 500mg',
				category: 'Analgesics',
				composition: 'Paracetamol',
				brand: 'Paracare',
				retailPrice: 45.00,
				wholesalePrice: 36.00,
				popularity: 92,
				addedAt: '2024-01-12',
				requiresPrescription: false,
				vendor: 'PharmaCorp India',
				inStock: true
			},
			{
				id: 2,
				name: 'Amoxicillin 250mg',
				category: 'Antibiotics',
				composition: 'Amoxicillin Trihydrate',
				brand: 'MediSupply',
				retailPrice: 120.00,
				wholesalePrice: 98.00,
				popularity: 78,
				addedAt: '2024-01-08',
				requiresPrescription: true,
				vendor: 'MediSupply Ltd',
				inStock: true
			},
			{
				id: 3,
				name: 'Cetirizine 10mg',
				category: 'Antihistamines',
				composition: 'Cetirizine Hydrochloride',
				brand: 'AllerFree',
				retailPrice: 25.00,
				wholesalePrice: 20.00,
				popularity: 85,
				addedAt: '2024-01-05',
				requiresPrescription: false,
				vendor: 'HealthPlus Pharma',
				inStock: true
			},
			{
				id: 4,
				name: 'Omeprazole 20mg',
				category: 'Antacids',
				composition: 'Omeprazole',
				brand: 'AcidGuard',
				retailPrice: 85.00,
				wholesalePrice: 70.00,
				popularity: 74,
				addedAt: '2024-01-02',
				requiresPrescription: true,
				vendor: 'PharmaCorp India',
				inStock: true
			},
			{
				id: 5,
				name: 'Metformin 500mg',
				category: 'Antidiabetics',
				composition: 'Metformin Hydrochloride',
				brand: 'DiabeCare',
				retailPrice: 60.00,
				wholesalePrice: 49.00,
				popularity: 88,
				addedAt: '2023-12-29',
				requiresPrescription: true,
				vendor: 'DiabeCare Inc',
				inStock: true
			},
			{
				id: 6,
				name: 'Atorvastatin 10mg',
				category: 'Cardiovascular',
				composition: 'Atorvastatin Calcium',
				brand: 'CardioPharma',
				retailPrice: 95.00,
				wholesalePrice: 78.00,
				popularity: 69,
				addedAt: '2023-12-22',
				requiresPrescription: true,
				vendor: 'CardioPharma',
				inStock: false
			}
		]);
		setLoading(false);
	}, []);

	useEffect(() => {
		const query = searchParams.get('search') || '';
		setSearchQuery(query);
	}, [searchParams]);

	const categories = useMemo(() => {
		const unique = new Set(medicines.map(medicine => medicine.category));
		return ['all', ...Array.from(unique)];
	}, [medicines]);

	const filteredMedicines = useMemo(() => {
		let list = [...medicines];

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			list = list.filter(medicine => (
				medicine.name.toLowerCase().includes(query)
				|| medicine.category.toLowerCase().includes(query)
				|| medicine.vendor.toLowerCase().includes(query)
				|| medicine.composition.toLowerCase().includes(query)
				|| medicine.brand.toLowerCase().includes(query)
			));
		}

		if (categoryFilter !== 'all') {
			list = list.filter(medicine => medicine.category === categoryFilter);
		}

		if (availabilityFilter !== 'all') {
			const inStock = availabilityFilter === 'in-stock';
			list = list.filter(medicine => medicine.inStock === inStock);
		}

		if (prescriptionFilter !== 'all') {
			const requiresPrescription = prescriptionFilter === 'required';
			list = list.filter(medicine => Boolean(medicine.requiresPrescription) === requiresPrescription);
		}

		if (minPrice) {
			const min = Number(minPrice);
			if (!Number.isNaN(min)) {
				list = list.filter(medicine => medicine.retailPrice >= min);
			}
		}

		if (maxPrice) {
			const max = Number(maxPrice);
			if (!Number.isNaN(max)) {
				list = list.filter(medicine => medicine.retailPrice <= max);
			}
		}

		if (sortBy === 'price-asc') {
			list.sort((a, b) => a.retailPrice - b.retailPrice);
		}
		if (sortBy === 'price-desc') {
			list.sort((a, b) => b.retailPrice - a.retailPrice);
		}
		if (sortBy === 'name-asc') {
			list.sort((a, b) => a.name.localeCompare(b.name));
		}
		if (sortBy === 'popularity') {
			list.sort((a, b) => b.popularity - a.popularity);
		}
		if (sortBy === 'recent') {
			list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
		}

		return list;
	}, [medicines, searchQuery, categoryFilter, availabilityFilter, prescriptionFilter, sortBy, minPrice, maxPrice]);

	const buyerType = user?.customer?.buyerType || 'RETAIL';
	const getDisplayPrice = (medicine) => (
		buyerType === 'WHOLESALE' ? medicine.wholesalePrice : medicine.retailPrice
	);

	const handleAddToCart = (medicine) => {
		addToCart(
			medicine,
			1,
			medicine.retailPrice,
			medicine.wholesalePrice,
			buyerType
		);
	};

	const handleSearchSubmit = (event) => {
		event.preventDefault();
		if (searchQuery.trim()) {
			setSearchParams({ search: searchQuery.trim() });
		} else {
			setSearchParams({});
		}
	};

	const handleClearFilters = () => {
		setSearchQuery('');
		setCategoryFilter('all');
		setAvailabilityFilter('all');
		setPrescriptionFilter('all');
		setSortBy('relevance');
		setMinPrice('');
		setMaxPrice('');
		setSearchParams({});
	};

	const handleLogout = () => {
		authService.logout();
		navigate('/login');
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<p>Loading catalog...</p>
			</div>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
					<div>
						<h1 className="section-title">Medicine Catalog</h1>
						<p className="section-subtitle">Browse and order medicines from verified vendors</p>
					</div>
					<div style={{ display: 'flex', gap: '0.75rem' }}>
						<button className="button-outline" onClick={() => navigate('/customer/dashboard')}>Dashboard</button>
						<button className="button-outline" onClick={handleLogout}>Logout</button>
					</div>
				</div>

				<div style={styles.filterPanel}>
					<form onSubmit={handleSearchSubmit} style={styles.searchRow}>
						<input
							type="text"
							placeholder="Search medicines, brands, salts"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							style={styles.searchInput}
						/>
						<button type="submit" className="button" style={styles.searchButton}>Search</button>
					</form>

					<div style={styles.filtersRow}>
						<div style={styles.filterGroup}>
							<label style={styles.filterLabel}>Category</label>
							<select
								value={categoryFilter}
								onChange={(event) => setCategoryFilter(event.target.value)}
								style={styles.select}
							>
								{categories.map(category => (
									<option key={category} value={category}>
										{category === 'all' ? 'All Categories' : category}
									</option>
								))}
							</select>
						</div>

						<div style={styles.filterGroup}>
							<label style={styles.filterLabel}>Availability</label>
							<select
								value={availabilityFilter}
								onChange={(event) => setAvailabilityFilter(event.target.value)}
								style={styles.select}
							>
								<option value="all">All</option>
								<option value="in-stock">In Stock</option>
								<option value="out-of-stock">Out of Stock</option>
							</select>
						</div>

						<div style={styles.filterGroup}>
							<label style={styles.filterLabel}>Prescription</label>
							<select
								value={prescriptionFilter}
								onChange={(event) => setPrescriptionFilter(event.target.value)}
								style={styles.select}
							>
								<option value="all">All</option>
								<option value="required">Required</option>
								<option value="not-required">Not Required</option>
							</select>
							<p style={styles.filterHint}>Future scope</p>
						</div>

						<div style={styles.filterGroup}>
							<label style={styles.filterLabel}>Price Range</label>
							<div style={styles.priceInputs}>
								<input
									type="number"
									min="0"
									placeholder="Min"
									value={minPrice}
									onChange={(event) => setMinPrice(event.target.value)}
									style={styles.priceInput}
								/>
								<input
									type="number"
									min="0"
									placeholder="Max"
									value={maxPrice}
									onChange={(event) => setMaxPrice(event.target.value)}
									style={styles.priceInput}
								/>
							</div>
						</div>

						<div style={styles.filterGroup}>
							<label style={styles.filterLabel}>Sort By</label>
							<select
								value={sortBy}
								onChange={(event) => setSortBy(event.target.value)}
								style={styles.select}
							>
								<option value="relevance">Relevance</option>
								<option value="price-asc">Price: Low to High</option>
								<option value="price-desc">Price: High to Low</option>
								<option value="name-asc">Name: A to Z</option>
								<option value="popularity">Popularity</option>
								<option value="recent">Recently Added</option>
							</select>
						</div>

						<div style={styles.filterActions}>
							<button type="button" className="button-outline" onClick={handleClearFilters}>
								Clear Filters
							</button>
							<span style={styles.resultCount}>{filteredMedicines.length} items</span>
						</div>
					</div>
				</div>

				<div className="grid grid-3">
					{filteredMedicines.map(medicine => (
						<div key={medicine.id} className="card">
							<div style={{ marginBottom: '1rem' }}>
								<h3 style={{ marginBottom: '0.5rem' }}>{medicine.name}</h3>
								<span className="badge">{medicine.category}</span>
							</div>
							<p className="section-subtitle">Brand: {medicine.brand}</p>
							<p className="section-subtitle">Composition: {medicine.composition}</p>
							<p className="section-subtitle">Vendor: {medicine.vendor}</p>
							<div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<strong style={{ fontSize: '1.25rem', color: '#1E88E5' }}>₹{getDisplayPrice(medicine).toFixed(2)}</strong>
								{medicine.inStock ? (
									<div style={styles.cardActions}>
										<button
											className="button-outline"
											onClick={() => navigate(`/customer/medicine/${medicine.id}`)}
										>
											View Details
										</button>
										<button
											className="button"
											onClick={() => handleAddToCart(medicine)}
										>
											Add to Cart
										</button>
									</div>
								) : (
									<span className="badge badge-error">Out of Stock</span>
								)}
							</div>
						</div>
					))}
				</div>

				{filteredMedicines.length === 0 && (
					<div style={styles.emptyState}>
						<h3 style={styles.emptyTitle}>No medicines found</h3>
						<p style={styles.emptyText}>Try adjusting your search or filters to find what you need.</p>
						<button className="button-outline" onClick={handleClearFilters}>Reset Filters</button>
					</div>
				)}

				<div className="alert alert-info" style={{ marginTop: '2rem' }}>
					<strong>ℹ️ Demo Mode</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
						This is sample catalog data. Real medicine data will be loaded from the API once vendors add their inventory.
					</p>
				</div>
			</div>
		</main>
	);
}

const styles = {
	filterPanel: {
		backgroundColor: 'white',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius-lg)',
		padding: '1.5rem',
		marginBottom: '2rem',
		boxShadow: 'var(--shadow-sm)'
	},
	searchRow: {
		display: 'flex',
		gap: '0.75rem',
		marginBottom: '1.5rem'
	},
	searchInput: {
		flex: 1,
		padding: '0.75rem 1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)',
		fontSize: '0.95rem'
	},
	searchButton: {
		padding: '0.75rem 1.5rem'
	},
	filtersRow: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
		gap: '1rem',
		alignItems: 'end'
	},
	filterGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	filterLabel: {
		fontSize: '0.85rem',
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	filterHint: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		marginTop: '0.25rem'
	},
	select: {
		padding: '0.6rem 0.75rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem',
		backgroundColor: 'white'
	},
	priceInputs: {
		display: 'flex',
		gap: '0.5rem'
	},
	priceInput: {
		width: '100%',
		padding: '0.6rem 0.75rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem'
	},
	filterActions: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '0.75rem',
		flexWrap: 'wrap'
	},
	cardActions: {
		display: 'flex',
		gap: '0.5rem',
		flexWrap: 'wrap',
		justifyContent: 'flex-end'
	},
	resultCount: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)'
	},
	emptyState: {
		backgroundColor: 'white',
		border: '1px dashed var(--border)',
		borderRadius: 'var(--radius-lg)',
		padding: '2rem',
		textAlign: 'center',
		marginTop: '2rem'
	},
	emptyTitle: {
		marginBottom: '0.5rem',
		color: 'var(--text-primary)'
	},
	emptyText: {
		marginBottom: '1rem',
		color: 'var(--text-secondary)'
	}
};

export default Catalog;