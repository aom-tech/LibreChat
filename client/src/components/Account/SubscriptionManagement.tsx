import React from 'react';
import { CreditCard, AlertCircle, Calendar, Package } from 'lucide-react';
import { useGetSubscriptionStatus, useCancelSubscription } from '~/data-provider/subscription';
import { Button, Card, CardContent, CardHeader, CardTitle } from '~/components/ui';
import { useToast } from '~/hooks';

const SubscriptionManagement: React.FC = () => {
  const { data: subscriptionData, isLoading } = useGetSubscriptionStatus();
  const cancelMutation = useCancelSubscription();
  const { showToast } = useToast();

  const handleCancelSubscription = async () => {
    try {
      const result = await cancelMutation.mutateAsync();
      showToast({
        message: result.message,
        status: 'info',
      });
    } catch (error) {
      showToast({
        message: 'Failed to process cancellation request.',
        status: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptionData?.subscription;
  const isActive = subscription?.isActive || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Plan</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.tier || 'Active'}
              </span>
            </div>

            {subscription.expiresAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Renews on</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-medium">Need to cancel your subscription?</p>
                  <p className="mt-1">
                    Please contact our support team at{' '}
                    <a 
                      href="mailto:support@example.com" 
                      className="underline hover:no-underline"
                    >
                      support@example.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCancelSubscription}
              variant="outline"
              className="w-full"
              disabled={cancelMutation.isLoading}
            >
              {cancelMutation.isLoading ? 'Processing...' : 'Contact Support to Cancel'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No active subscription
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;