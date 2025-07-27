import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type { SubscriptionPlan, SubscriptionStatus, CheckoutSession } from 'librechat-data-provider';

// Get subscription plans
export const useGetSubscriptionPlans = () => {
  return useQuery<{ plans: Record<string, SubscriptionPlan> }>({
    queryKey: ['subscriptionPlans'],
    queryFn: () => dataService.getSubscriptionPlans(),
  });
};

// Get user subscription status
export const useGetSubscriptionStatus = () => {
  return useQuery<{ subscription: SubscriptionStatus }>({
    queryKey: [QueryKeys.user, 'subscription'],
    queryFn: () => dataService.getSubscriptionStatus(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create checkout session
export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation<{ session: CheckoutSession }, Error, { tier: string }>({
    mutationFn: (data) => dataService.createCheckoutSession(data),
    onSuccess: () => {
      // Invalidate subscription status after checkout
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; subscription: SubscriptionStatus }, Error>({
    mutationFn: () => dataService.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
    },
  });
};

// Activate subscription (dev only)
export const useActivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; subscription: SubscriptionStatus }, Error, { tier: string }>({
    mutationFn: (data) => dataService.activateSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user] });
    },
  });
};