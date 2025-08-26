import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
// Use local QueryKeys since we're having build issues
const QueryKeys = {
  user: 'user',
};

// Types for billing microservice
export interface BillingPlan {
  _id: string;
  name: string;
  price: number; // in kopecks
  interval: 'monthly' | 'yearly' | 'weekly' | 'daily';
  active: boolean;
  metadata: {
    tokens?: number;
    images?: number;
    presentations?: number;
    videoSeconds?: number;
    features?: {
      presentations?: boolean;
      videos?: boolean;
      support?: string;
    };
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BillingSubscription {
  _id: string;
  userId: string;
  planId: string;
  plan?: BillingPlan;
  status: 'active' | 'trialing' | 'canceled' | 'expired';
  startedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSubscriptionResponse {
  subscription: BillingSubscription;
  success: boolean;
  isSubscriptionActive: boolean;
}

// Legacy types for compatibility
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

// Get billing API URL from environment
const getBillingApiUrl = () => {
  // In development, use proxy path
  if (import.meta.env.DEV) {
    return '/billing-api';
  }
  // In production, use full URL
  return import.meta.env.VITE_BILLING_API_URL;
};

// Helper to make requests to billing service using axios
const billingFetch = async (
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  },
) => {
  const baseUrl = getBillingApiUrl();
  const url = `${baseUrl}/api/v1/billing${path}`;

  console.log('[Billing API] Request:', url);

  try {
    const response = await axios({
      url,
      method: options?.method || 'GET',
      data: options?.data,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Billing API] Error:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.message || `Billing API error: ${error.message}`);
    }
    throw error;
  }
};

// Get subscription plans
export const useGetSubscriptionPlans = () => {
  return useQuery<BillingPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      try {
        const response = await billingFetch('/plans');
        console.log('[Billing API] Plans response:', response);
        // API returns array of plans directly or in activePlans property
        return response.activePlans || response;
      } catch (error) {
        console.error('[Billing API] Failed to fetch plans:', error);
        // Re-throw the error to let React Query handle it
        throw error;
      }
    },
    retry: 2, // Try 2 more times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

// Get user subscription status
export const useGetSubscriptionStatus = () => {
  return useQuery<{ subscription: SubscriptionStatus }>({
    queryKey: [QueryKeys.user, 'subscription'],
    queryFn: async () => {
      try {
        const response: BillingSubscriptionResponse = await billingFetch('/subscription');
        const billingSubscription = response.subscription;
        console.log('[Billing API] Subscription response:', billingSubscription);

        // Convert billing subscription to legacy format
        const subscription: SubscriptionStatus = {
          isActive:
            billingSubscription.status === 'active' || billingSubscription.status === 'trialing',
          tier: billingSubscription.plan?.name,
          expiresAt: billingSubscription.expiresAt,
          features: {
            presentations: billingSubscription.plan?.metadata?.features?.presentations || false,
            videos: billingSubscription.plan?.metadata?.features?.videos || false,
          },
        };

        return { subscription };
      } catch (error) {
        console.error('[Billing API] Failed to fetch subscription:', error);
        // Return inactive subscription on error
        return {
          subscription: {
            isActive: false,
          },
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Reduce retries for billing service
  });
};

// Create checkout session (stub - redirects to external payment)
export const useCreateCheckoutSession = () => {
  return useMutation<{ redirectUrl: string }, Error, { planId: string }>({
    mutationFn: async (data) => {
      // For now, construct payment URL directly
      // In future, this should call billing API to create session
      const paymentUrl = import.meta.env.VITE_PAYMENT_URL || 'https://payment.example.com';
      const redirectUrl = `${paymentUrl}/checkout?planId=${data.planId}&returnUrl=${encodeURIComponent(
        window.location.origin,
      )}`;

      return { redirectUrl };
    },
    onSuccess: (data) => {
      // Redirect to external payment
      window.location.href = data.redirectUrl;
    },
  });
};

// Cancel subscription (stub - shows contact support message)
export const useCancelSubscription = () => {
  return useMutation<{ message: string }, Error>({
    mutationFn: async () => {
      // Stub implementation - no actual API call
      return {
        message: 'Please contact support at support@example.com to cancel your subscription.',
      };
    },
  });
};

// Activate subscription (dev only - stub)
export const useActivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; subscription: SubscriptionStatus },
    Error,
    { tier: string }
  >({
    mutationFn: async (data) => {
      // Stub implementation for development
      console.log('[Dev] Activating subscription with tier:', data.tier);
      return {
        message: 'Subscription activated (dev mode)',
        subscription: {
          isActive: true,
          tier: data.tier,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          features: {
            presentations: data.tier !== 'basic',
            videos: data.tier === 'enterprise',
          },
        },
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user, 'subscription'] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.user] });
    },
  });
};
