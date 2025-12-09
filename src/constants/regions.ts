export type Region = {
  id: string;
  flag: string;
  currency: string;
};

export const REGIONS: Region[] = [
  { id: 'US', flag: '🇺🇸', currency: 'USD' },
  { id: 'UK', flag: '🇬🇧', currency: 'GBP' },
  { id: 'CA', flag: '🇨🇦', currency: 'CAD' },
  { id: 'IN', flag: '🇮🇳', currency: 'INR' }
];

export const REGION_MAP = Object.fromEntries(REGIONS.map((region) => [region.id, region]));
