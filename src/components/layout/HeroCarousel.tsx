import { Link } from 'react-router-dom';
import hero from './res/black-friday-1898114_1280.jpg';

export default function HeroCarousel() {
  return (
    <div className="relative h-[320px] sm:h-[360px] md:h-[420px] w-full bg-holidayBurgundy rounded mb-4 overflow-hidden">
      <img src={hero} alt="hero" className="w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
    </div>
  );
}
