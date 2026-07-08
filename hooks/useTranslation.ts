import { t as translate } from '@/constants/translations';

export function useTranslation() {
  return {
    lang: 'es' as const,
    t: (key: string) => translate(key, 'es'),
  };
}
