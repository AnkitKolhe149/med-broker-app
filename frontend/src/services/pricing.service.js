const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePackageType = (value) => {
	const normalized = String(value || 'standard').toLowerCase();
	return normalized === 'bulk' ? 'bulk' : 'standard';
};

const pricingService = {
	resolveUnitPrice: ({
		buyerType = 'RETAIL',
		quantity = 1,
		packageType = 'standard',
		retailPrice = 0,
		wholesalePrice = retailPrice,
		bulkPrice = wholesalePrice,
		bulkMinQty = 1
	}) => {
		const normalizedPackage = normalizePackageType(packageType);
		const qty = Math.max(1, toNumber(quantity, 1));
		const minQty = Math.max(1, toNumber(bulkMinQty, 1));
		const retail = toNumber(retailPrice, 0);
		const wholesale = toNumber(wholesalePrice, retail);
		const bulk = toNumber(bulkPrice, wholesale);

		if (normalizedPackage === 'bulk') {
			return bulk;
		}

		if (String(buyerType).toUpperCase() === 'WHOLESALE') {
			return qty >= minQty ? bulk : wholesale;
		}

		return retail;
	},

	mapMedicinePricing: (medicine = {}) => {
		const retailPrice = toNumber(medicine.retailPrice, 0);
		const wholesalePrice = toNumber(medicine.wholesalePrice, retailPrice);
		const bulkPrice = toNumber(medicine.bulkPrice, wholesalePrice);
		const bulkMinQty = Math.max(1, toNumber(medicine.bulkMinQty, 1));

		return {
			retailPrice,
			wholesalePrice,
			bulkPrice,
			bulkMinQty
		};
	},

	repriceCartItem: ({ cartItem, medicinePricing, buyerType, quantity, packageType }) => {
		const nextQuantity = Math.max(1, toNumber(quantity, cartItem.quantity || 1));
		const nextPackageType = normalizePackageType(packageType || cartItem.packageType || 'standard');

		const unitPrice = pricingService.resolveUnitPrice({
			buyerType,
			quantity: nextQuantity,
			packageType: nextPackageType,
			...medicinePricing
		});

		return {
			...cartItem,
			quantity: nextQuantity,
			packageType: nextPackageType,
			...medicinePricing,
			basePrice: unitPrice
		};
	}
};

export default pricingService;
