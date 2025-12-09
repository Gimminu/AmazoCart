import { useRegion } from '../context/RegionContext';

export function useUserRegion() {
  const { country, setCountry } = useRegion();
  return { country, setCountry };
}
