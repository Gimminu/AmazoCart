export const COUNTRY_METADATA = {
  US: { locale: 'en-US', currency: 'USD', flag: '🇺🇸', translationKey: 'stats.market.US' },
  UK: { locale: 'en-GB', currency: 'GBP', flag: '🇬🇧', translationKey: 'stats.market.UK' },
  CA: { locale: 'fr-CA', currency: 'CAD', flag: '🇨🇦', translationKey: 'stats.market.CA' },
  IN: { locale: 'hi-IN', currency: 'INR', flag: '🇮🇳', translationKey: 'stats.market.IN' }
} as const;

export type CountryCode = keyof typeof COUNTRY_METADATA;

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'fr-CA', label: 'Français (Canada)' },
  { code: 'hi-IN', label: 'हिंदी (भारत)' }
];
