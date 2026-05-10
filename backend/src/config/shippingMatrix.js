const AVG_WEIGHT_GRAMS = 75;

const COUNTRIES = [
  'IN', 'LK', 'BD', 'NP', 'BT',
  'AE', 'SA', 'SG', 'MY', 'TH', 'QA', 'OM', 'KW',
  'GB', 'DE', 'FR', 'IT', 'ES',
  'US', 'CA',
  'KE', 'ZA',
  'AU', 'NZ',
  'JP',
  'BR'
];

const COUNTRY_ZONE = {
  IN: 'SOUTH_ASIA',
  LK: 'SOUTH_ASIA',
  BD: 'SOUTH_ASIA',
  NP: 'SOUTH_ASIA',
  BT: 'SOUTH_ASIA',
  AE: 'GCC',
  SA: 'GCC',
  SG: 'SEA',
  MY: 'SEA',
  TH: 'SEA',
  JP: 'SEA',
  QA: 'GCC',
  OM: 'GCC',
  KW: 'GCC',
  GB: 'EUROPE',
  DE: 'EUROPE',
  FR: 'EUROPE',
  IT: 'EUROPE',
  ES: 'EUROPE',
  US: 'N_AMERICA',
  CA: 'N_AMERICA',
  KE: 'AFRICA',
  ZA: 'AFRICA',
  AU: 'OCEANIA',
  NZ: 'OCEANIA',
  BR: 'S_AMERICA'
};

const ZONE_LANE_DEFAULTS = {
  SOUTH_ASIA: { baseFee: 140, ratePerKg: 115, distanceMultiplier: 1.0, minCharge: 170 },
  GCC: { baseFee: 260, ratePerKg: 180, distanceMultiplier: 1.3, minCharge: 320 },
  SEA: { baseFee: 220, ratePerKg: 165, distanceMultiplier: 1.2, minCharge: 280 },
  EUROPE: { baseFee: 410, ratePerKg: 255, distanceMultiplier: 1.7, minCharge: 500 },
  N_AMERICA: { baseFee: 460, ratePerKg: 280, distanceMultiplier: 1.85, minCharge: 560 },
  AFRICA: { baseFee: 300, ratePerKg: 205, distanceMultiplier: 1.45, minCharge: 370 },
  OCEANIA: { baseFee: 430, ratePerKg: 265, distanceMultiplier: 1.78, minCharge: 530 },
  S_AMERICA: { baseFee: 480, ratePerKg: 290, distanceMultiplier: 1.95, minCharge: 590 }
};

const INTER_ZONE_MULTIPLIER = {
  SOUTH_ASIA: { SOUTH_ASIA: 1.0, GCC: 1.25, SEA: 1.2, EUROPE: 1.65, N_AMERICA: 1.85, AFRICA: 1.45, OCEANIA: 1.75, S_AMERICA: 2.05 },
  GCC: { SOUTH_ASIA: 1.2, GCC: 1.0, SEA: 1.22, EUROPE: 1.35, N_AMERICA: 1.6, AFRICA: 1.28, OCEANIA: 1.62, S_AMERICA: 1.9 },
  SEA: { SOUTH_ASIA: 1.18, GCC: 1.25, SEA: 1.0, EUROPE: 1.58, N_AMERICA: 1.8, AFRICA: 1.5, OCEANIA: 1.35, S_AMERICA: 1.95 },
  EUROPE: { SOUTH_ASIA: 1.62, GCC: 1.33, SEA: 1.55, EUROPE: 1.0, N_AMERICA: 1.38, AFRICA: 1.25, OCEANIA: 1.65, S_AMERICA: 1.5 },
  N_AMERICA: { SOUTH_ASIA: 1.82, GCC: 1.58, SEA: 1.75, EUROPE: 1.35, N_AMERICA: 1.0, AFRICA: 1.52, OCEANIA: 1.42, S_AMERICA: 1.28 },
  AFRICA: { SOUTH_ASIA: 1.42, GCC: 1.26, SEA: 1.46, EUROPE: 1.24, N_AMERICA: 1.5, AFRICA: 1.0, OCEANIA: 1.58, S_AMERICA: 1.44 },
  OCEANIA: { SOUTH_ASIA: 1.72, GCC: 1.58, SEA: 1.34, EUROPE: 1.62, N_AMERICA: 1.4, AFRICA: 1.56, OCEANIA: 1.0, S_AMERICA: 1.68 },
  S_AMERICA: { SOUTH_ASIA: 2.0, GCC: 1.86, SEA: 1.9, EUROPE: 1.48, N_AMERICA: 1.24, AFRICA: 1.42, OCEANIA: 1.66, S_AMERICA: 1.0 }
};

const COUNTRY_BIAS = {
  IN: 1.0, LK: 0.96, BD: 0.95, NP: 0.94, BT: 0.93,
  AE: 1.02, SA: 1.03, SG: 1.01, MY: 0.99, TH: 0.98, QA: 1.02, OM: 0.99, KW: 1.01,
  GB: 1.03, DE: 1.02, FR: 1.01, IT: 1.0, ES: 0.99,
  US: 1.04, CA: 1.02,
  KE: 0.97, ZA: 0.98,
  AU: 1.03, NZ: 1.01,
  JP: 1.00,
  BR: 1.0
};

const to2 = (value) => Number(value.toFixed(2));
const toInt = (value) => Math.round(value);

const buildLaneRule = (originCountry, destinationCountry) => {
  const originZone = COUNTRY_ZONE[originCountry];
  const destinationZone = COUNTRY_ZONE[destinationCountry];

  if (!originZone || !destinationZone) {
    return null;
  }

  if (originCountry === destinationCountry) {
    return {
      baseFee: 80,
      ratePerKg: 70,
      distanceMultiplier: 0.85,
      minCharge: 95
    };
  }

  const originDefaults = ZONE_LANE_DEFAULTS[originZone];
  const zoneMultiplier = INTER_ZONE_MULTIPLIER[originZone][destinationZone];
  const originBias = COUNTRY_BIAS[originCountry] || 1;
  const destinationBias = COUNTRY_BIAS[destinationCountry] || 1;

  // Directed by design: origin country bias affects base/rate strongly,
  // destination bias affects multiplier/min charge with smaller influence.
  const baseFee = toInt(originDefaults.baseFee * zoneMultiplier * originBias);
  const ratePerKg = toInt(originDefaults.ratePerKg * zoneMultiplier * ((originBias * 0.65) + (destinationBias * 0.35)));
  const distanceMultiplier = to2(originDefaults.distanceMultiplier * zoneMultiplier * ((destinationBias * 0.6) + 0.4));
  const minCharge = toInt(originDefaults.minCharge * zoneMultiplier * ((originBias * 0.5) + (destinationBias * 0.5)));

  return {
    baseFee,
    ratePerKg,
    distanceMultiplier,
    minCharge
  };
};

const SHIPPING_MATRIX = COUNTRIES.reduce((originAcc, originCountry) => {
  const destinationMap = COUNTRIES.reduce((destinationAcc, destinationCountry) => {
    destinationAcc[destinationCountry] = buildLaneRule(originCountry, destinationCountry);
    return destinationAcc;
  }, {});

  originAcc[originCountry] = destinationMap;
  return originAcc;
}, {});

const getLaneRule = (originCountry, destinationCountry) => {
  const origin = String(originCountry || '').toUpperCase().trim();
  const destination = String(destinationCountry || '').toUpperCase().trim();
  return SHIPPING_MATRIX[origin]?.[destination] || null;
};

const calculateWeightKg = (totalQty) => {
  const quantity = Math.max(0, Number(totalQty) || 0);
  return (quantity * AVG_WEIGHT_GRAMS) / 1000;
};

module.exports = {
  AVG_WEIGHT_GRAMS,
  COUNTRIES,
  SHIPPING_MATRIX,
  getLaneRule,
  calculateWeightKg
};
