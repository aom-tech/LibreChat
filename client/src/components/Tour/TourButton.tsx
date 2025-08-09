import React from 'react';
import { HelpCircle } from 'lucide-react';
// import { useTourSteps } from './useTourSteps';
import { Button } from '@librechat/client';
import { useTour } from '@reactour/tour';

const TOUR_BUTTON_TEXT = 'Start Tour';

interface TourButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  tourType?: 'agent-selection' | 'main-app' | 'agent';
}

export const TourButton: React.FC<TourButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  className = '',
  tourType = 'main-app',
}) => {
  //   const { startAgentSelectionTour, startMainAppTour, startAgentTour } = useTourSteps();
  const { setIsOpen } = useTour();

  const handleStartTour = () => {
    setIsOpen(true);
    // switch (tourType) {
    //   case 'agent-selection':
    //     startAgentSelectionTour();
    //     break;
    //   case 'agent':
    //     startAgentTour();
    //     break;
    //   default:
    //     startMainAppTour();
    //     break;
    // }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartTour}
      className={`flex items-center gap-2 ${className}`}
      data-tour="tour-button"
      title={TOUR_BUTTON_TEXT}
    >
      <HelpCircle className="h-4 w-4" />
      {size !== 'sm' && size !== 'icon' && <span>{TOUR_BUTTON_TEXT}</span>}
    </Button>
  );
};

export default TourButton;
