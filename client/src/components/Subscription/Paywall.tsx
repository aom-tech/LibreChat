import React from 'react';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToastContext, Button } from '@librechat/client';
import {
  useGetSubscriptionPlans,
  useCreateCheckoutSession,
  type BillingPlan,
} from '~/data-provider/subscription';
import { useGetUserQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface PlanFeature {
  text: string;
  included: boolean;
}

// Fallback plans when API is unavailable
const getFallbackPlans = (): BillingPlan[] => [
  {
    _id: 'coursegpt_pro_test',
    name: 'Pro',
    price: 299900, // 2999 руб
    interval: 'monthly' as const,
    active: true,
    credits: {
      text: 1000000,
      image: 100,
      presentation: 20,
      video: 0,
    },
    metadata: {
      features: [
        'Priority support',
        'Advanced AI models',
        'Presentation generation',
        'Export to all formats',
      ],
      description: 'Professional AI access with generous limits',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'coursegpt_video_pro_test',
    name: 'Video Pro',
    price: 2999900, // 29999 руб
    interval: 'monthly' as const,
    active: true,
    credits: {
      text: 1000000,
      image: 100,
      presentation: 20,
      video: 300,
    },
    metadata: {
      features: [
        'Everything in Pro',
        'Video generation',
        'Priority support',
        'Early access to new features',
      ],
      description: 'Everything in Pro plus video generation',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const Paywall: React.FC = () => {
  const { showToast } = useToastContext();
  const localize = useLocalize();
  const { data: user } = useGetUserQuery();
  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
    refetch,
  } = useGetSubscriptionPlans();
  const checkoutMutation = useCreateCheckoutSession();

  // Use fallback plans if there's an error
  const isUsingFallback = !!plansError && !plans;
  const displayPlans = plans || (plansError ? getFallbackPlans() : null);

  // Helper to get features for a plan
  const getPlanFeatures = (plan: BillingPlan): PlanFeature[] => {
    // Use new format if available, fallback to legacy format
    const textCredits = plan.credits?.text || plan.metadata?.tokens || 0;
    const imageCredits = plan.credits?.image || (plan.metadata as any)?.images || 0;
    const presentationCredits = plan.credits?.presentation || (plan.metadata as any)?.presentations || 0;
    const videoCredits = plan.credits?.video || (plan.metadata as any)?.videoSeconds || 0;

    const features: PlanFeature[] = [
      {
        text:
          localize('com_ui_paywall_text_tokens', { amount: textCredits.toLocaleString() }) ||
          `${textCredits.toLocaleString()} text credits`,
        included: true,
      },
      {
        text:
          localize('com_ui_paywall_images_per_month', { amount: imageCredits }) ||
          `${imageCredits} image credits per month`,
        included: true,
      },
      {
        text:
          localize('com_ui_paywall_presentations_per_month', { amount: presentationCredits }) ||
          `${presentationCredits} presentation credits per month`,
        included: true,
      },
    ];

    // Add video credits if available
    if (videoCredits > 0) {
      features.push({
        text:
          localize('com_ui_paywall_video_seconds', { amount: videoCredits }) ||
          `${videoCredits} video credits per month`,
        included: true,
      });
    }

    // Add additional features from metadata
    if (Array.isArray(plan.metadata?.features)) {
      plan.metadata.features.forEach((feature) => {
        features.push({
          text: feature,
          included: true,
        });
      });
    } else if (typeof plan.metadata?.features === 'object') {
      // Legacy format compatibility
      features.push({ text: localize('com_ui_paywall_access_all_models'), included: true });
      const support = (plan.metadata.features as any)?.support || 'Basic';
      features.push({ text: localize('com_ui_paywall_support', { level: support }), included: true });
    }

    return features;
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // The mutation will handle the redirect
      await checkoutMutation.mutateAsync({
        planId,
        userId: user?.id,
        email: user?.email,
      });
    } catch (_error) {
      showToast({
        message: localize('com_ui_paywall_error_checkout'),
        status: 'error',
      });
    }
  };

  if (plansLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">{localize('com_ui_paywall_loading')}</p>
        </div>
      </div>
    );
  }

  if (!displayPlans || displayPlans.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {localize('com_ui_paywall_error_loading') || 'Failed to load subscription plans'}
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {localize('com_ui_paywall_contact_support') || 'Please contact support for assistance'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {localize('com_ui_paywall_retry') || 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  // Separate subscriptions and one-time purchases
  const subscriptionPlans = displayPlans
    .filter(plan => plan.interval !== 'once')
    .sort((a, b) => a.price - b.price);
  
  const oneTimePlans = displayPlans
    .filter(plan => plan.interval === 'once')
    .sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isUsingFallback && (
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start">
              <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {localize('com_ui_paywall_showing_default') || 'Showing standard plans'}
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {localize('com_ui_paywall_prices_may_vary') ||
                    'Unable to load current prices. The displayed prices may not be up to date. Please contact support for current pricing.'}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
                  <RefreshCw className="mr-2 h-3 w-3" />
                  {localize('com_ui_paywall_retry') || 'Retry'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {localize('com_ui_paywall_title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {localize('com_ui_paywall_subtitle')}
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
          {subscriptionPlans.map((plan) => {
            const features = getPlanFeatures(plan);
            const isPopular = plan.name === 'Video Pro'; // Video Pro is most popular

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl border ${
                  isPopular ? 'border-green-500 shadow-xl' : 'border-gray-200 dark:border-gray-700'
                } bg-white p-8 dark:bg-gray-800`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-green-500 px-3 py-1 text-center text-sm font-medium text-white">
                    {localize('com_ui_paywall_most_popular')}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {plan.metadata?.description || plan.name}
                  </p>
                  <p className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {/* Currency symbol is not translatable */}
                      {'₽'}
                      {(plan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /
                      {plan.interval === 'monthly'
                        ? localize('com_ui_paywall_per_month')
                        : plan.interval === 'yearly'
                          ? localize('com_ui_paywall_per_year')
                          : plan.interval === 'weekly'
                            ? localize('com_ui_paywall_per_week')
                            : localize('com_ui_paywall_per_day')}
                    </span>
                  </p>
                </div>

                <ul className="mb-8 space-y-4">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                      ) : (
                        <X className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-600'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan._id)}
                  disabled={checkoutMutation.isLoading}
                  className={`w-full ${
                    isPopular
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                  }`}
                >
                  {checkoutMutation.isLoading
                    ? localize('com_ui_paywall_processing')
                    : localize('com_ui_paywall_get_started')}
                </Button>
              </div>
            );
          })}
        </div>

        {/* One-time Purchases Section */}
        {oneTimePlans.length > 0 && (
          <>
            <div className="mx-auto mt-16 max-w-5xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {'One-time Purchases'}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {'Additional credits for your account'}
              </p>
            </div>
            
            <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-3">
              {oneTimePlans.map((plan) => {
                const features = getPlanFeatures(plan);

                return (
                  <div
                    key={plan._id}
                    className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {plan.metadata?.description || plan.name}
                      </p>
                      <p className="mt-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {'₽'}
                          {(plan.price / 100).toFixed(0)}
                        </span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {'one-time'}
                        </span>
                      </p>
                    </div>

                    <ul className="mb-4 space-y-2">
                      {features.slice(0, 4).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(plan._id)}
                      disabled={checkoutMutation.isLoading}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {checkoutMutation.isLoading
                        ? localize('com_ui_paywall_processing')
                        : localize('com_ui_paywall_get_started')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {localize('com_ui_paywall_trial_info')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
