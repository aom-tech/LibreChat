import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from './data-service';
import { QueryKeys } from 'librechat-data-provider';

export interface SubscriptionPlan {
  name: string;
  price: number;
  tokenCredits: number;
  features: {
    presentations: boolean;
    videos: boolean;
  };
  description: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier?: string;
  expiresAt?: string;
  features?: {
    presentations: boolean;
    videos: boolean;
  };
}

export interface CheckoutSession {
  id: string;
  tier: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  checkoutUrl: string;
}

// Get subscription plans
export const useGetSubscriptionPlans = () => {
  return useQuery<{ plans: Record<string, SubscriptionPlan> }>({
    queryKey: ['subscriptionPlans'],
    queryFn: () => dataService.get('/api/subscription/plans'),
  });
};

// Get user subscription status
export const useGetSubscriptionStatus = () => {
  return useQuery<{ subscription: SubscriptionStatus }>({
    queryKey: [QueryKeys.user, 'subscription'],
    queryFn: () => dataService.get('/api/subscription/status'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create checkout session
export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation<{ session: CheckoutSession }, Error, { tier: string }>({
    mutationFn: (data) => dataService.post('/api/subscription/checkout', data),
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
    mutationFn: () => dataService.post('/api/subscription/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
    },
  });
};

// Activate subscription (dev only)
export const useActivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; subscription: SubscriptionStatus }, Error, { tier: string }>({
    mutationFn: (data) => dataService.post('/api/subscription/activate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user] });
    },
  });
};