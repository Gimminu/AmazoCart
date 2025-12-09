import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';

const makeSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const fallbackCategories = [
  'Electronics',
  'Computers & Accessories',
  'Office Products',
  'Home & Kitchen',
  'Musical Instruments',
  'Home Improvement',
  'Toys & Games',
  'Sports, Fitness & Outdoors',
  'Health & Personal Care',
  'Bags, Wallets and Luggage'
].map((label, idx) => ({ key: `fallback-${idx}`, label, slug: makeSlug(label) }));

export default function CategoryBar() {
  return null;
}
