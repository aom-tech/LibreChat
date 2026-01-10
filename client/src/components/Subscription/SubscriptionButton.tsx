import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '~/utils';
import { useGetSubscriptionStatus } from '~/data-provider/subscription';
import { useLocalize } from '~/hooks';

const SubscriptionButton: React.FC = () => {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: subscriptionData, isLoading } = useGetSubscriptionStatus();

  // Don't show if loading
  if (isLoading) {
    return null;
  }

  const subscription = subscriptionData?.subscription;

  // Only show if user doesn't have an active subscription
  if (!subscription || subscription.isActive) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  return (
    <button
      onClick={handleUpgrade}
      className={cn(
        'group relative flex h-10 items-center gap-2 rounded-lg px-3 py-2',
        'bg-gradient-to-r from-green-500 to-green-600',
        'text-sm font-medium text-white',
        'transition-all duration-200 hover:scale-105 hover:shadow-lg',
        'border border-white/20',
      )}
      aria-label={localize('com_ui_subscription_upgrade')}
    >
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="hidden sm:inline">
        {localize('com_ui_subscription_upgrade_pro') || 'Upgrade to Pro'}
      </span>
      <span className="sm:hidden">{localize('com_ui_subscription_pro') || 'Pro'}</span>

      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-lg bg-white opacity-0 transition-opacity group-hover:opacity-20" />
    </button>
  );
};

export default SubscriptionButton;
