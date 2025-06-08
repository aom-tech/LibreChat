import { useCallback } from 'react';

declare global {
  interface Window {
    ym: (counterId: string, action: string, goal: string) => void;
  }
}

export const useYandexMetrica = () => {
  const counterId = import.meta.env.SCRIPT_YANDEX_METRICA_ID || '102444444';

  const reachGoal = useCallback(
    (goal: string) => {
      if (typeof window !== 'undefined' && window.ym && counterId) {
        window.ym(counterId, 'reachGoal', goal);
      }
    },
    [counterId],
  );

  return { reachGoal };
};
