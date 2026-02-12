const { prisma } = require("../../database/prisma");

const getLatestRates = async (baseCode) => {
  const normalizedBase = baseCode.toUpperCase();
  return prisma.exchangeRate.findUnique({
    where: { baseCode: normalizedBase }
  });
};

const convertFromBase = (amount, targetCode, rates) => {
  const normalizedTarget = targetCode.toUpperCase();
  const rate = rates[normalizedTarget];
  if (!rate) {
    return null;
  }

  return amount * rate;
};

module.exports = { getLatestRates, convertFromBase };
