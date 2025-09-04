import React, { useState } from 'react';
import { Link, Copy, Check } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

interface QuickCopyReferralButtonProps {
  showLabel?: boolean;
  variant?: 'icon' | 'compact' | 'full';
  className?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const QuickCopyReferralButton: React.FC<QuickCopyReferralButtonProps> = ({
  showLabel = true,
  variant = 'compact',
  className = '',
  tooltipPosition = 'bottom',
}) => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const localize = useLocalize();
  const [copying, setCopying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate simple referral code
  const generateReferralCode = () => {
    if (user?.personalReferralCode) {
      return user.personalReferralCode;
    }
    
    const userId = user?.id || user?._id;
    if (userId) {
      return userId.slice(-8).toUpperCase();
    }
    
    if (user?.email) {
      const hash = user.email
        .split('')
        .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
      return Math.abs(hash).toString(36).slice(0, 8).toUpperCase();
    }
    
    return 'DEMO123';
  };

  const referralCode = generateReferralCode();
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copying) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast({ message: localize('com_ui_referral_copied_success'), status: 'success' });
    } catch (error) {
      showToast({ message: localize('com_ui_referral_copy_failed'), status: 'error' });
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  const getTooltipClasses = () => {
    const base = 'absolute z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap pointer-events-none transition-opacity';
    const positions = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };
    return cn(base, positions[tooltipPosition]);
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleCopy}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={cn(
            'rounded-lg p-2 transition-all',
            'hover:bg-surface-tertiary',
            copying && 'text-green-600 dark:text-green-400',
            className
          )}
          aria-label={localize('com_ui_referral_copy_title')}
        >
          {copying ? (
            <Check className="h-4 w-4 animate-pulse" />
          ) : (
            <Link className="h-4 w-4" />
          )}
        </button>
        {showTooltip && (
          <div className={getTooltipClasses()}>
            {localize('com_ui_referral_copy_title')}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2',
          'transition-all hover:bg-surface-tertiary',
          copying && 'text-green-600 dark:text-green-400',
          className
        )}
      >
        {copying ? (
          <Check className="h-4 w-4" />
        ) : (
          <Link className="h-4 w-4" />
        )}
        {showLabel && (
          <span className="text-sm">
            {copying ? localize('com_ui_referral_copied') : localize('com_ui_referral_copy_link')}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center justify-between w-full rounded-lg px-4 py-3',
        'transition-all hover:bg-surface-tertiary',
        'border border-border-light dark:border-border-dark',
        copying && 'border-green-500 bg-green-50 dark:bg-green-900/10',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'rounded-full p-2',
          'bg-surface-primary',
          copying && 'bg-green-100 dark:bg-green-900/20'
        )}>
          {copying ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Link className="h-4 w-4" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">
            {copying ? localize('com_ui_referral_copied_success') : localize('com_ui_referral_copy_link')}
          </p>
          <p className="text-xs text-text-secondary">
            {localize('com_ui_referral_code')}: {referralCode}
          </p>
        </div>
      </div>
      <Copy className={cn(
        'h-4 w-4 text-text-secondary',
        copying && 'text-green-600 dark:text-green-400'
      )} />
    </button>
  );
};

export default QuickCopyReferralButton;