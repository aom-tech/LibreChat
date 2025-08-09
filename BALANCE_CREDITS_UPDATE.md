# Balance Credits System Update

## Overview
The balance system has been updated to support multiple credit types instead of just `tokenCredits`. Now agents can use different credit types based on their specific ID.

## Changes Made

### 1. Database Schema Updates
- Added `availableCredits` field to Balance model with sub-fields:
  - `text`: Text generation credits
  - `image`: Image generation credits  
  - `presentation`: Presentation generation credits
  - `video`: Video generation credits

### 2. Agent-to-Credit-Type Mapping
Located in `/api/models/tx.js`:
```javascript
const AGENT_CREDIT_TYPES = {
  'agent_-2vJDJqv7zoHlNeu5VX6f': 'image',
  'agent_srl6222FWjmA0XxeEGgGQ': 'image',
  'agent_b1rpKFVSmmevC7A2hkfLz': 'presentation',
  'agent_p_s8V9FmVfxgHGVIFjOne': 'video',
};
```

### 3. Logic Updates
- **For Agent Requests**: Uses `availableCredits[creditType]` based on agent ID
- **For Non-Agent Requests**: Uses legacy `tokenCredits` field
- **Default**: All unknown agents use `text` credit type

### 4. API Response
The `/api/balance` endpoint now returns:
```json
{
  "tokenCredits": 1000,
  "availableCredits": {
    "text": 0,
    "image": 0,
    "presentation": 0,
    "video": 0
  },
  "autoRefillEnabled": false,
  ...
}
```

### 5. Key Files Modified
- `/packages/data-schemas/src/types/balance.ts` - Added TypeScript types
- `/packages/data-schemas/src/schema/balance.ts` - Updated MongoDB schema
- `/api/models/tx.js` - Added agent-to-credit-type mapping
- `/api/models/balanceMethods.js` - Updated balance checking logic
- `/api/models/Transaction.js` - Updated balance update logic
- `/api/models/spendTokens.js` - Passes agentId for credit type determination
- `/api/app/clients/BaseClient.js` - Passes agentId in balance checks
- `/api/app/clients/OpenAIClient.js` - Passes agentId in token usage recording
- `/api/server/controllers/Balance.js` - Returns availableCredits in API response
- `/api/server/middleware/setBalanceConfig.js` - Initializes availableCredits for new users

## Usage
When an agent makes a request:
1. System determines credit type based on agent ID
2. Checks balance in corresponding `availableCredits` field
3. Deducts tokens from the same field after completion

## Important Notes
- Legacy `tokenCredits` is still used for non-agent requests
- All credit types including 'text' now use `availableCredits` for agents
- Auto-refill still updates only `tokenCredits` (can be enhanced later if needed)
- Initial balance for all credit types is set to 0