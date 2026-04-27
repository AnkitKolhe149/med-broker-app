import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatCurrency } from '../../utils/currency';
import styles from './Favorites.module.css';

function Favorites() {
	const navigate = useNavigate();
	const { currency } = useCurrency();
	const { favorites, removeFavorite } = useFavorites();
	const currencyCode = currency || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);

	return (
		<main className="page">
			<div className="container">
				<div className={styles.header}>
					<div>
						<p className={styles.kicker}>Saved items</p>
						<h1 className={styles.title}>Your Favorites</h1>
					</div>
					<button className="button-outline" onClick={() => navigate('/customer/catalog')}>
						Browse medicines
					</button>
				</div>

				{favorites.length === 0 ? (
					<section className={styles.emptyState}>
						<h2>No favorites yet</h2>
						<p>Use the heart icon on a medicine detail page to save items here.</p>
					</section>
				) : (
					<section className={styles.grid}>
						{favorites.map((item) => (
							<article key={item.medicineId} className={styles.card}>
								<div className={styles.imageWrap}>
									{item.imageUrl ? (
										<img src={item.imageUrl} alt={item.name} />
									) : (
										<div className={styles.placeholder}>No image</div>
									)}
								</div>
								<div className={styles.content}>
									<p className={styles.category}>{item.category}</p>
									<h2 className={styles.name}>{item.name}</h2>
									<p className={styles.vendor}>{item.vendor}</p>
									<p className={styles.price}>{formatPrice(item.retailPrice)}</p>
									<div className={styles.actions}>
										<button className="button" onClick={() => navigate(`/customer/medicine/${item.inventoryId || item.medicineId}`)}>
											View details
										</button>
										<button className="button-outline" onClick={() => removeFavorite(item.medicineId)}>
											Remove
										</button>
									</div>
								</div>
							</article>
						))}
					</section>
				)}
			</div>
		</main>
	);
}

export default Favorites;