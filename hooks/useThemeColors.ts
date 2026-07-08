import { Colors, ColorSet } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';

export function useThemeColors(): ColorSet {
  const { settings } = useSettings();
  return settings.isDarkMode ? Colors.dark : Colors.light;
}
