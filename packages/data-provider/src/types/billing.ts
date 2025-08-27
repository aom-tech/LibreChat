export interface BillingPlan {
  _id: string;
  name: string;
  price: number; // in kopecks
  interval: 'monthly' | 'yearly' | 'weekly' | 'daily';
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