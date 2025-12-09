import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import enGB from './locales/en-GB/translation.json';
import frCA from './locales/fr-CA/translation.json';
import hiIN from './locales/hi-IN/translation.json';

const resources = {
  en: { translation: en },
  'en-GB': { translation: enGB },
  'fr-CA': { translation: frCA },
  'hi-IN': { translation: hiIN }
};

const supportedLanguages = Object.keys(resources);
const storedLng = localStorage.getItem('amazocart:lng');
const initialLng =
  storedLng && supportedLanguages.includes(storedLng) ? storedLng : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export function changeLanguage(lng: string) {
  i18n.changeLanguage(lng);
  localStorage.setItem('amazocart:lng', lng);
}

export default i18n;
