import React from 'react';
import { CreditCard, AlertCircle, Calendar, Package } from 'lucide-react';
import { useToastContext, Button } from '@librechat/client';
import { useGetSubscriptionStatus, useCancelSubscription } from '~/data-provider/subscription';
import { useLocalize } from '~/hooks';

const SubscriptionManagement: React.FC = () => {
  const { data: subscriptionData, isLoading } = useGetSubscriptionStatus();
  const cancelMutation = useCancelSubscription();
  const { showToast } = useToastContext();
  const localize = useLocalize();

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
      <div className="rounded-lg border bg-white dark:bg-gray-800">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const subscription = subscriptionData?.subscription;
  const isActive = subscription?.isActive || false;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800">
      <div className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="h-5 w-5" />
          {localize('com_ui_subscription')}
        </h3>
      </div>
      <div className="px-6 pb-6">
        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{localize('com_ui_subscription_plan')}</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {subscription?.tier || localize('com_ui_subscription_active')}
              </span>
            </div>

            {subscription?.expiresAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{localize('com_ui_subscription_renews_on')}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {subscription.expiresAt && new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-medium">{localize('com_ui_subscription_need_cancel')}</p>
                  <p className="mt-1">
                    {localize('com_ui_subscription_contact_support')}{' '}
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
              {cancelMutation.isLoading 
                ? localize('com_ui_paywall_processing') 
                : localize('com_ui_subscription_contact_support_cancel')
              }
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {localize('com_ui_subscription_no_active')}
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              {localize('com_ui_subscription_view_plans')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;