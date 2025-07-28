import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';

// Re-define types locally since we're using external service
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

// Get subscription API URL from environment
const getSubscriptionApiUrl = () => {
  // In development, use proxy path
  if (import.meta.env.DEV) {
    return '/subscription-api';
  }
  // In production, use full URL
  return import.meta.env.VITE_SUBSCRIPTION_API_URL || '/subscription-api';
};

// Helper to make requests to subscription service
const subscriptionFetch = async (path: string, options?: RequestInit) => {
  const baseUrl = getSubscriptionApiUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Include auth token if available
      ...(localStorage.getItem('token') && {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Subscription API error: ${response.statusText}`);
  }

  return response.json();
};

// Get subscription plans
export const useGetSubscriptionPlans = () => {
  return useQuery<{ plans: Record<string, SubscriptionPlan> }>({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionFetch('/plans'),
  });
};

// Get user subscription status
export const useGetSubscriptionStatus = () => {
  return useQuery<{ subscription: SubscriptionStatus }>({
    queryKey: [QueryKeys.user, 'subscription'],
    queryFn: () => subscriptionFetch('/status'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create checkout session
export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation<{ session: CheckoutSession }, Error, { tier: string }>({
    mutationFn: (data) => subscriptionFetch('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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
    mutationFn: () => subscriptionFetch('/cancel', {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
    },
  });
};

// Activate subscription (dev only)
export const useActivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; subscription: SubscriptionStatus }, Error, { tier: string }>({
    mutationFn: (data) => subscriptionFetch('/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user] });
    },
  });
};