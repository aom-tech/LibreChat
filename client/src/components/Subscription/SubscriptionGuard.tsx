import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetSubscriptionStatus } from '~/data-provider/subscription';
import Paywall from './Paywall';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const location = useLocation();
  const { data: subscriptionData, isLoading, error } = useGetSubscriptionStatus();

  // Skip subscription check for certain paths
  const skipPaths = ['/login', '/register', '/logout', '/subscription', '/checkout'];
  const shouldSkip = skipPaths.some((path) => location.pathname.startsWith(path));

  console.log('[SubscriptionGuard] Debug:', {
    isAuthenticated,
    shouldSkip,
    pathname: location.pathname,
    isLoading,
    subscriptionData,
    error,
    user: user?.email,
  });

  // No need to check main API config anymore since subscription is a separate service
  // The subscription service will handle its own availability

  // If not authenticated, let auth guard handle it
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Skip check for certain paths
  if (shouldSkip) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Error state - if subscription service is down, allow access
  if (error) {
    console.error('[SubscriptionGuard] Error checking subscription:', error);
    console.log('[SubscriptionGuard] Allowing access due to service error');
    return <>{children}</>;
  }

  // Check if user has active subscription
  const subscription = subscriptionData?.subscription;
  console.log('[SubscriptionGuard] Subscription check:', {
    subscription,
    isActive: subscription?.isActive,
    showPaywall: subscription && !subscription.isActive,
  });

  // If subscription data exists and user doesn't have active subscription, show paywall
  if (subscription && !subscription.isActive) {
    console.log('[SubscriptionGuard] Showing paywall - no active subscription');
    return <Paywall />;
  }

  // User has active subscription or subscription system is disabled
  console.log('[SubscriptionGuard] Allowing access - subscription active or system disabled');
  return <>{children}</>;
};

export default SubscriptionGuard;
