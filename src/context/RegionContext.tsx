import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { REGIONS } from '../constants/regions';

type RegionContextValue = {
  country: string;
  setCountry: (id: string) => void;
};

const getInitialCountry = () => {
  if (typeof window === 'undefined') return 'US';
  return localStorage.getItem('amazocart:country') || 'US';
};

const RegionContext = createContext<RegionContextValue>({
  country: 'US',
  setCountry: () => {}
});

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string>(() => getInitialCountry());

  const setCountry = (id: string) => {
    const region = REGIONS.find((r) => r.id === id) ? id : 'US';
    setCountryState(region);
    if (typeof window !== 'undefined') {
      localStorage.setItem('amazocart:country', region);
    }
  };

  // Ensure persisted value is applied on mount if defaults change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('amazocart:country');
    if (saved && saved !== country) {
      setCountryState(saved);
    }
  }, []);

  const value = useMemo(
    () => ({
      country,
      setCountry
    }),
    [country]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  return useContext(RegionContext);
}
