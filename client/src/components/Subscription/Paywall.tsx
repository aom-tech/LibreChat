import React from 'react';
import { Check, X } from 'lucide-react';
import { 
  useGetSubscriptionPlans, 
  useCreateCheckoutSession,
  type BillingPlan 
} from '~/data-provider/subscription';
import { Button } from '~/components/ui';
import { useToast } from '~/hooks';

interface PlanFeature {
  text: string;
  included: boolean;
}

const Paywall: React.FC = () => {
  const { showToast } = useToast();
  const { data: plans, isLoading: plansLoading } = useGetSubscriptionPlans();
  const checkoutMutation = useCreateCheckoutSession();

  // Helper to get features for a plan
  const getPlanFeatures = (plan: BillingPlan): PlanFeature[] => {
    const tokens = plan.metadata?.tokens || 0;
    const hasPresentation = plan.metadata?.features?.presentations || false;
    const hasVideo = plan.metadata?.features?.videos || false;
    const support = plan.metadata?.features?.support || 'Basic';

    return [
      { text: `${tokens.toLocaleString()} tokens per month`, included: true },
      { text: 'Access to all AI models', included: true },
      { text: `${support} support`, included: true },
      { text: 'Presentation generation', included: hasPresentation },
      { text: 'Video generation', included: hasVideo },
    ];
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // The mutation will handle the redirect
      await checkoutMutation.mutateAsync({ planId });
    } catch (error) {
      showToast({
        message: 'Failed to create checkout session. Please try again.',
        status: 'error',
      });
    }
  };

  if (plansLoading || !plans) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">Loading plans...</p>
        </div>
      </div>
    );
  }

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Select the plan that best fits your needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {sortedPlans.map((plan, index) => {
            const features = getPlanFeatures(plan);
            const isPopular = index === 1; // Middle plan is usually most popular

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl border ${
                  isPopular
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-800 p-8`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-blue-500 px-3 py-1 text-center text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {plan.metadata?.description || plan.name}
                  </p>
                  <p className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ₽{(plan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/{plan.interval}</span>
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
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                  }`}
                >
                  {checkoutMutation.isLoading ? 'Processing...' : 'Get Started'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Paywall;