import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Copy, Link, Gift } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

const ReferralProgram: React.FC = () => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const localize = useLocalize();
  const [copying, setCopying] = useState(false);

  // Generate a simple referral code based on user ID or email
  const generateReferralCode = () => {
    if (user?.personalReferralCode) {
      return user.personalReferralCode;
    }

    const userId = user?.id || user?._id;
    if (userId) {
      // Simple hash-like generation from user ID
      return userId.slice(-8).toUpperCase();
    }

    if (user?.email) {
      // Generate from email hash
      const hash = user.email
        .split('')
        .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
      return Math.abs(hash).toString(36).slice(0, 8).toUpperCase();
    }

    return 'DEMO123'; // Fallback
  };

  const referralCode = generateReferralCode();
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = async () => {
    if (copying) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast({ message: localize('com_ui_referral_copied_success'), status: 'success' });
    } catch (error) {
      showToast({ message: localize('com_ui_referral_copy_failed'), status: 'error' });
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="dark:border-border-dark border-b border-border-light pb-3">
        <h3 className="text-lg font-semibold">{localize('com_ui_referral_program')}</h3>
        <p className="text-sm text-text-secondary">{localize('com_ui_referral_share_link')}</p>
      </div>

      <div className="dark:border-border-dark rounded-lg border border-border-light bg-surface-secondary p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
            <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-medium">{localize('com_ui_referral_your_link')}</h4>
            <p className="text-xs text-text-secondary">{localize('com_ui_referral_code')}: {referralCode}</p>
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          <div className="dark:border-border-dark flex-1 rounded-md border border-border-light bg-surface-primary px-3 py-2">
            <span className="truncate font-mono text-sm">{referralLink}</span>
          </div>
          <button
            onClick={copyToClipboard}
            className={cn(
              'rounded-md p-2 transition-all',
              'hover:bg-surface-secondary',
              copying && 'text-green-600 dark:text-green-400',
            )}
            title={localize('com_ui_referral_copy_title')}
          >
            {copying ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          onClick={copyToClipboard}
          className={cn(
            'w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white',
            'transition-colors hover:bg-green-700',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={copying}
        >
          <div className="flex items-center justify-center gap-2">
            <Link className="h-4 w-4" />
            <span>{copying ? localize('com_ui_referral_copied') : localize('com_ui_referral_copy_link')}</span>
          </div>
        </button>
      </div>

      <div className="dark:border-border-dark rounded-lg border border-border-light bg-blue-50 p-3 dark:bg-blue-900/10">
        <h4 className="mb-1 text-sm font-medium">{localize('com_ui_referral_how_it_works')}</h4>
        <ul className="space-y-1 text-xs text-text-secondary">
          <li>• {localize('com_ui_referral_step1')}</li>
          <li>• {localize('com_ui_referral_step2')}</li>
          <li>• {localize('com_ui_referral_step3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralProgram;
