export interface BillingPlan {
  _id: string;
  name: string;
  price: number; // in kopecks
  interval: 'day' | 'week' | 'month' | 'year';
  active: boolean;
  metadata: {
    tokens?: number;
    features?: {
      presentations?: boolean;
      videos?: boolean;
      support?: string;
    };
    description?: string;
  };
}

export interface BillingSubscription {
  status: 'active' | 'trialing' | 'canceled' | 'expired';
  expiresAt?: string;
  planId?: string;
  plan?: BillingPlan;
}