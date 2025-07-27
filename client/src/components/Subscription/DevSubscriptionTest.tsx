import React from 'react';
import { useGetSubscriptionStatus, useActivateSubscription } from '~/data-provider';
import { Button } from '~/components/ui';
import { useToast } from '~/hooks';

const DevSubscriptionTest: React.FC = () => {
  const { data: statusData, refetch } = useGetSubscriptionStatus();
  const activateMutation = useActivateSubscription();
  const { showToast } = useToast();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleActivate = async (tier: string) => {
    try {
      await activateMutation.mutateAsync({ tier });
      showToast({ message: `${tier} subscription activated!`, status: 'success' });
      refetch();
    } catch (error) {
      showToast({ message: 'Failed to activate subscription', status: 'error' });
    }
  };

  const subscription = statusData?.subscription;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <h3 className="mb-2 text-sm font-semibold">Dev: Subscription Test</h3>
      <div className="mb-3 text-xs">
        <p>Status: {subscription?.isActive ? 'Active' : 'Inactive'}</p>
        {subscription?.tier && <p>Tier: {subscription.tier}</p>}
        {subscription?.expiresAt && (
          <p>Expires: {new Date(subscription.expiresAt).toLocaleDateString()}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Button
          size="xs"
          onClick={() => handleActivate('basic')}
          disabled={activateMutation.isLoading}
        >
          Activate Basic
        </Button>
        <Button
          size="xs"
          onClick={() => handleActivate('pro')}
          disabled={activateMutation.isLoading}
        >
          Activate Pro
        </Button>
        <Button
          size="xs"
          onClick={() => handleActivate('enterprise')}
          disabled={activateMutation.isLoading}
        >
          Activate Enterprise
        </Button>
      </div>
    </div>
  );
};

export default DevSubscriptionTest;