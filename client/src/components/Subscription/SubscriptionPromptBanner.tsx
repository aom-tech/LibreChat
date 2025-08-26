import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@librechat/client';
import { useGetSubscriptionStatus } from '~/data-provider/subscription';
import { useLocalize } from '~/hooks';

interface SubscriptionPromptBannerProps {
  onHeightChange?: (height: number) => void;
}

const SubscriptionPromptBanner: React.FC<SubscriptionPromptBannerProps> = ({ onHeightChange }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: subscriptionData, isLoading } = useGetSubscriptionStatus();

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('subscription-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (onHeightChange && bannerRef.current && !isDismissed) {
      onHeightChange(bannerRef.current.offsetHeight);
    } else if (onHeightChange && isDismissed) {
      onHeightChange(0);
    }
  }, [isDismissed, onHeightChange, subscriptionData]);

  // Don't show if loading, has active subscription, or dismissed
  if (isLoading || isDismissed) {
    return null;
  }

  const subscription = subscriptionData?.subscription;
  
  // Only show if user doesn't have an active subscription
  if (!subscription || subscription.isActive) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('subscription-banner-dismissed', 'true');
    if (onHeightChange) {
      onHeightChange(0);
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  return (
    <div
      ref={bannerRef}
      className="relative z-20 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-4 py-3 shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-semibold text-white">
              {localize('com_ui_subscription_banner_title') || 'Unlock Full Potential'}
            </span>
            <span className="text-xs text-white/90 sm:text-sm">
              {localize('com_ui_subscription_banner_message') || 
               'Get unlimited access to all AI models, faster responses, and priority support'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-white text-purple-600 hover:bg-gray-100 font-medium px-4 py-1.5 text-sm"
          >
            {localize('com_ui_subscription_banner_cta') || 'Upgrade Now'}
          </Button>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPromptBanner;