import React from 'react';
import HeroCarousel from '../components/layout/HeroCarousel';
import ProductRow from '../components/products/ProductRow';
import { useTranslation } from 'react-i18next';
import BestSellerRow from '../components/products/BestSellerRow';
import { useNavigate } from 'react-router-dom';
import CountryStatsBoard from '../components/insights/CountryStatsBoard';

const promoCards = [
  {
    title: 'Bluetooth calling smartwatch starts at ₩39,900',
    cta: 'Shop now',
    image: 'https://m.media-amazon.com/images/I/81eM15lVcJL._AC_UL1500_.jpg',
    category: 'electronics',
    query: 'smartwatch'
  },
  {
    title: 'Up to 60% off | Styles for men',
    links: ['Clothing', 'Footwear', 'Watches', 'Bags & luggage'],
    cta: 'See all offers',
    category: 'Clothing'
  },
  {
    title: 'Holiday travel gifts',
    image: 'https://m.media-amazon.com/images/I/71AvQd3VzqL._AC_UL1500_.jpg',
    cta: 'Shop now',
    category: 'electronics',
    query: 'phone'
  },
  {
    title: 'Deals on accessories',
    links: ['Headphones', 'Speakers', 'Chargers', 'Cables'],
    cta: 'See all offers',
    category: 'electronics',
    query: 'accessories'
  }
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = (card: typeof promoCards[number]) => {
    if (card.category) {
      navigate(`/category/${encodeURIComponent(card.category)}`);
    } else if (card.query) {
      navigate(`/search?q=${encodeURIComponent(card.query)}`);
    }
  };
  return (
    <div className="space-y-4">
      <HeroCarousel />
      <CountryStatsBoard />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {promoCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded shadow-product border border-gray-100 p-3 flex flex-col gap-2.5 min-h-[220px]">
            <h3 className="text-lg font-semibold">{card.title}</h3>
            {card.image && (
              <img src={card.image} alt={card.title} className="w-full h-28 object-contain" />
            )}
            {card.links && (
              <div className="grid grid-cols-2 gap-1.5 text-sm text-gray-800">
                {card.links.map(link => <span key={link} className="hover:underline cursor-pointer">{link}</span>)}
              </div>
            )}
            <button
              onClick={() => handleCardClick(card)}
              className="text-amazonBlue text-sm font-medium hover:underline w-fit"
            >
              {card.cta}
            </button>
          </div>
        ))}
      </div>

      <BestSellerRow />
      <ProductRow title="Today's Deals" query={{ limit: 12, sort: 'popular' }} />
      <ProductRow title={t('home.popular')} query={{ limit: 12, sort: 'popular' }} />
      <ProductRow title={t('home.highRated')} query={{ limit: 12, sort: 'rating' }} />
      <ProductRow title={t('home.budget')} query={{ limit: 12, sort: 'price-low' }} />
    </div>
  );
}
