# Subscription Plans Documentation

## Overview

LibreChat offers two subscription tiers designed to meet different user needs, from professional AI usage to advanced multimedia generation capabilities.

## Available Plans

### Pro Plan
**Price:** 2,999 ₽/month

**Includes:**
- 1,000,000 text tokens per month
- 100 AI-generated images per month
- 20 AI presentations per month
- Access to all AI models
- Priority support
- API access

**Best for:** Professionals, content creators, and small teams who need generous AI usage limits for text and basic multimedia generation.

### Video Pro Plan
**Price:** 29,999 ₽/month

**Includes everything in Pro, plus:**
- 300 seconds of AI video generation per month
- Advanced multimedia features
- Priority processing queue

**Best for:** Content agencies, video creators, and enterprises requiring full multimedia AI capabilities including video generation.

## Credit System

Each subscription plan includes different types of credits:

### Credit Types
1. **Text Credits** - Used for all text-based AI interactions
2. **Image Credits** - Used for AI image generation
3. **Presentation Credits** - Used for AI presentation creation
4. **Video Credits** - Used for AI video generation (Video Pro only)

### Credit Usage by Model

#### Text Models
- GPT-4: Standard token rates
- Claude: Standard token rates
- Other LLMs: Varies by model

#### Special Services
- Flux Image Generation: 1,000 credits per image
- Slidespeak Presentations: 1,000 credits per presentation
- Veo/Veo2 Video Generation: 1,000 credits per request

## Billing System

### Payment Processing
- Monthly recurring billing
- Automatic renewal
- Secure payment processing via external payment gateway

### Subscription Management
- Upgrade/downgrade between plans anytime
- Changes take effect immediately
- Prorated billing for mid-cycle changes

### Cancellation Policy
- Cancel anytime through customer support
- Access continues until end of billing period
- No refunds for partial months

## API Integration

### Subscription Status Check
```javascript
GET /api/v1/billing/subscription
```

Returns current subscription status including:
- Active/inactive status
- Current plan tier
- Remaining credits
- Renewal date

### Plan Information
```javascript
GET /api/v1/billing/plans
```

Returns available subscription plans with:
- Plan details and pricing
- Credit allocations
- Feature availability

## Fallback System

When the billing service is unavailable, the system displays standard fallback plans to ensure users can always view subscription options. These fallback plans reflect the standard pricing and features but may not include promotional offers.

## Technical Implementation

### Frontend Components
- `Paywall.tsx` - Subscription plan selection interface
- `SubscriptionButton.tsx` - Upgrade prompt for non-subscribed users
- `SubscriptionGuard.tsx` - Access control based on subscription status

### Backend Services
- Billing microservice handles all subscription operations
- Main API integrates with billing service for credit tracking
- Transaction logging for usage analytics

## FAQ

### How do credits reset?
Credits reset on your monthly billing date. Unused credits do not roll over to the next month.

### Can I purchase additional credits?
Currently, additional credits beyond your plan allocation are not available. Consider upgrading to a higher tier if you need more credits.

### What happens when I run out of credits?
When you exhaust your monthly credits, AI services will be temporarily unavailable until your next billing cycle or plan upgrade.

### How do I change my subscription?
Contact customer support at support@example.com to modify your subscription plan.

### Is there a free trial?
All plans include a 7-day free trial period. You can cancel anytime during the trial without charges.

## Support

For subscription-related inquiries:
- Email: support@example.com
- Response time: Within 24 hours
- Priority support for Pro and Video Pro subscribers