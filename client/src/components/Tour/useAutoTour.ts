import { useEffect } from 'react';
import { useTour } from '@reactour/tour';
import { useAuthContext } from '~/hooks';

const TOUR_COMPLETED_KEY = 'librechat_tour_completed';

export const useAutoTour = () => {
  const { setIsOpen } = useTour();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) return;

    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    
    if (!tourCompleted) {
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      }, 1000);
    }
  }, [isAuthenticated, setIsOpen]);
};