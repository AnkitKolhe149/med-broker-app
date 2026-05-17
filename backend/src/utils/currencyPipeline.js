const COUNTRY_TO_CURRENCY = {
  INDIA: 'INR',
  US: 'USD',
  USA: 'USD',
  'UNITED STATES': 'USD',
  UK: 'GBP',
  'UNITED KINGDOM': 'GBP',
  ENGLAND: 'GBP',
  EUROPE: 'EUR',
  FRANCE: 'EUR',
  GERMANY: 'EUR',
  ITALY: 'EUR',
  SPAIN: 'EUR',
  JAPAN: 'JPY',
  CHINA: 'CNY',
  CANADA: 'CAD',
  AUSTRALIA: 'AUD',
  SINGAPORE: 'SGD',
  UAE: 'AED',
  'UNITED ARAB EMIRATES': 'AED',
  'SAUDI ARABIA': 'SAR',
  BRAZIL: 'BRL',
  RUSSIA: 'RUB',
  'SOUTH AFRICA': 'ZAR'
};

const normalizeCurrencyCode = (code, fallback = null) => {
  if (!code || typeof code !== 'string') {
    return fallback;
  }

  const normalized = code.trim().toUpperCase();
  return normalized.length === 3 ? normalized : fallback;
};

const getCurrencyForCountry = (country, fallback = 'INR') => {
  if (!country || typeof country !== 'string') {
    return fallback;
  }

  const normalizedCountry = country.trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[normalizedCountry] || fallback;
};

const convertAmount = ({ amount, fromCurrency, toCurrency, baseCurrency, rates }) => {
  const safeAmount = Number(amount);
  const normalizedFrom = normalizeCurrencyCode(fromCurrency);
  const normalizedTo = normalizeCurrencyCode(toCurrency);
  const normalizedBase = normalizeCurrencyCode(baseCurrency);

  if (!Number.isFinite(safeAmount) || safeAmount < 0 || !normalizedFrom || !normalizedTo || !normalizedBase) {
    return null;
  }

  if (normalizedFrom === normalizedTo) {
    return safeAmount;
  }

  const parsedRates = rates && typeof rates === 'object' ? rates : {};

  // Rates are stored as "1 BASE = rate[TARGET]".
  const toBase = (value, currency) => {
    if (currency === normalizedBase) {
      return value;
    }
    const rate = Number(parsedRates[currency]);
    if (!Number.isFinite(rate) || rate <= 0) {
      return null;
    }
    return value / rate;
  };

  const fromBase = (value, currency) => {
    if (currency === normalizedBase) {
      return value;
    }
    const rate = Number(parsedRates[currency]);
    if (!Number.isFinite(rate) || rate <= 0) {
      return null;
    }
    return value * rate;
  };

  const baseAmount = toBase(safeAmount, normalizedFrom);
  if (baseAmount === null) {
    return null;
  }

  return fromBase(baseAmount, normalizedTo);
};

module.exports = {
  normalizeCurrencyCode,
  getCurrencyForCountry,
  convertAmount
};
