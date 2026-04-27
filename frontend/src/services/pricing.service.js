const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePackageType = () => {
	return 'standard';
};

/**
	* PRICING TIER SYSTEM (2-Tier Architecture)
	* 
	* This system implements two pricing tiers:
	* 
	* TIER 0 - RETAIL: For consumer buyers (buyerType = RETAIL)
	*   → Uses: retailPrice
	*   → No restrictions
	* 
	* TIER 1 - WHOLESALE: For B2B buyers (buyerType = WHOLESALE)
	*   → Uses: wholesalePrice (falls back to retailPrice)
	*   → Requires: GSTIN verification
	*   → Applies: Always, with no volume thresholds
	* 
	* Price Fallback Chain (ensures no null prices):
	*   wholesalePrice → retailPrice
	*   This ensures if medicine doesn't have both prices set,
	*   system will calculate a sensible price.
 */

const pricingService = {
	/**
	 * Resolve the unit price based on buyer type, quantity, and package type
	 * Returns the appropriate price tier for the given parameters
	 */
	resolveUnitPrice: ({
		buyerType = 'RETAIL',
		retailPrice = 0,
		wholesalePrice = retailPrice
	}) => {
		// Tier 0: Retail price (base)
		const retail = toNumber(retailPrice, 0);
		
		// Tier 1: Wholesale price (falls back to retail)
		const wholesale = toNumber(wholesalePrice, retail);
		
		const normalizedBuyerType = String(buyerType).toUpperCase();

		// RETAIL BUYER: Always use Tier 0
		if (normalizedBuyerType !== 'WHOLESALE') {
			return retail;
		}

		// WHOLESALE BUYER: Always use Tier 1
		return wholesale;
	},

	/**
	 * Map raw medicine data to standardized pricing object
	 * Normalizes field names and applies fallback chain
	 */
	mapMedicinePricing: (medicine = {}) => {
		const retailPrice = toNumber(medicine.retailPrice || medicine.priceCents, 0);
		const wholesalePrice = toNumber(medicine.wholesalePrice || medicine.wholesalePriceCents, retailPrice);

		return {
			retailPrice,
			wholesalePrice
		};
	},

	/**
	 * Recalculate cart item price when quantity or package type changes
	 * Returns updated item with new base price
	 */
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
