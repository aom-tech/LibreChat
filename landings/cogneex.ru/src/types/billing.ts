export interface Credits {
  text: number;
  image: number;
  presentation: number;
  video: number;
}

export interface PlanMetadata {
  description: string;
  features: string[];
}

export interface BillingPlan {
  _id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'once';
  metadata: PlanMetadata;
  active: boolean;
  credits: Credits;
  paymentLink: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface BillingPlansResponse {
  success: boolean;
  activePlans: BillingPlan[];
}