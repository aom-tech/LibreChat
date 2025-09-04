import { useState, useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { useToastContext } from '~/Providers';
import store from '~/store';

interface UseReferralLinkReturn {
  referralLink: string;
  referralCode: string;
  copyToClipboard: () => Promise<void>;
  shareUrl: (platform: 'twitter' | 'facebook' | 'linkedin') => string;
}

export const useReferralLink = (): UseReferralLinkReturn => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const [copying, setCopying] = useState(false);

  // Generate simple referral code based on user data
  const referralCode = useMemo(() => {
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
  }, [user?.personalReferralCode, user?.id, user?._id, user?.email]);

  const referralLink = useMemo(() => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${baseUrl}/register?ref=${referralCode}`;
  }, [referralCode]);

  const copyToClipboard = useCallback(async () => {
    if (copying || !referralLink) return;

    setCopying(true);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }

      showToast({
        message: 'Referral link copied to clipboard!',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast({
        message: 'Failed to copy link. Please try selecting and copying manually.',
        status: 'error',
      });
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  }, [referralLink, copying, showToast]);

  const shareUrl = useCallback(
    (platform: 'twitter' | 'facebook' | 'linkedin'): string => {
      if (!referralLink) return '#';

      const text = 'Join me on this amazing platform!';
      const encodedText = encodeURIComponent(text);
      const encodedUrl = encodeURIComponent(referralLink);

      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      };

      return shareUrls[platform];
    },
    [referralLink],
  );

  return {
    referralLink,
    referralCode,
    copyToClipboard,
    shareUrl,
  };
};

export default useReferralLink;
