import { useWindowDimensions } from 'react-native';

export function useAdminLayout() {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile: width < 700,
    isTablet: width >= 700 && width < 1024,
    isDesktop: width >= 1024,
  };
}
