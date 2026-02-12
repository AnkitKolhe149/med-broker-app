const convertFromBase = (amount, targetCode, rates) => {
	const normalizedTarget = targetCode.toUpperCase();
	const rate = rates[normalizedTarget];
	if (!rate) {
		return null;
	}

	return amount * rate;
};

module.exports = { convertFromBase };
