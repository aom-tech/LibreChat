export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  price: number;
  tokenCredits: number;
  features: {
    presentations: boolean;
    videos: boolean;
  };
  name: string;
  description: string;
}

export interface SubscriptionConfig {
  enabled: boolean;
  plans: Record<SubscriptionTier, Omit<SubscriptionPlan, 'tier'>>;
}

export interface CheckoutSession {
  userId: string;
  planTier: SubscriptionTier;
  sessionId: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}