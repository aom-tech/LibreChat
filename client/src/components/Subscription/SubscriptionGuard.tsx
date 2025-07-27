import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import { useGetSubscriptionStatus } from '~/data-provider';
import Paywall from './Paywall';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();
  const location = useLocation();
  const { data: subscriptionData, isLoading } = useGetSubscriptionStatus();

  // Skip subscription check for certain paths
  const skipPaths = ['/login', '/register', '/logout', '/subscription', '/checkout'];
  const shouldSkip = skipPaths.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    // Check if subscription check is enabled in config
    const checkSubscriptionConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (!config?.subscription?.enabled) {
          // Subscription system not enabled
          return;
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };

    if (isAuthenticated && !shouldSkip) {
      checkSubscriptionConfig();
    }
  }, [isAuthenticated, shouldSkip]);

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

  // Check if user has active subscription
  const subscription = false; //subscriptionData?.subscription;

  // If subscription data exists and user doesn't have active subscription, show paywall
  if (subscription && !subscription.isActive) {
    return <Paywall />;
  }

  // User has active subscription or subscription system is disabled
  return <>{children}</>;
};

export default SubscriptionGuard;
