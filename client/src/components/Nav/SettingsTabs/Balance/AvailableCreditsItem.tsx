import React from 'react';
import { Label } from '@librechat/client';
import { useLocalize } from '~/hooks';

interface AvailableCreditsItemProps {
  availableCredits?: {
    text: number;
    image: number;
    presentation: number;
    video: number;
  };
}

const AvailableCreditsItem: React.FC<AvailableCreditsItemProps> = ({ availableCredits }) => {
  const localize = useLocalize();

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const creditItems = [
    { key: 'text', label: 'com_nav_credits_text', value: availableCredits?.text },
    { key: 'image', label: 'com_nav_credits_image', value: availableCredits?.image },
    { key: 'presentation', label: 'com_nav_credits_presentation', value: availableCredits?.presentation },
    { key: 'video', label: 'com_nav_credits_video', value: availableCredits?.video },
  ];

  return (
    <div className="space-y-3">
      <Label className="font-medium text-sm">{localize('com_nav_available_credits')}</Label>
      <div className="space-y-2">
        {creditItems.map((item) => (
          <div key={item.key} className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {localize(item.label)}:
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableCreditsItem;