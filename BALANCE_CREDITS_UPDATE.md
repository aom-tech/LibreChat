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

### 2. Agent Configuration
Located in `/api/models/tx.js`:

**Credit Type Mapping:**
```javascript
const AGENT_CREDIT_TYPES = {
  'agent_-2vJDJqv7zoHlNeu5VX6f': 'image',
  'agent_srl6222FWjmA0XxeEGgGQ': 'image',
  'agent_b1rpKFVSmmevC7A2hkfLz': 'presentation',
  'agent_p_s8V9FmVfxgHGVIFjOne': 'video',
};
```

**Fixed Cost per Request:**
```javascript
const AGENT_FIXED_COSTS = {
  'agent_-2vJDJqv7zoHlNeu5VX6f': 1000,   // 1000 image credits per request
  'agent_srl6222FWjmA0XxeEGgGQ': 1000,   // 1000 image credits per request
  'agent_b1rpKFVSmmevC7A2hkfLz': 5000,   // 5000 presentation credits per request
  'agent_p_s8V9FmVfxgHGVIFjOne': 10000,  // 10000 video credits per request
};
```

### 3. Logic Updates
- **For Agent Requests**: 
  - Uses `availableCredits[creditType]` based on agent ID
  - Agents with fixed costs deduct a fixed amount regardless of actual token usage
  - Fixed cost is only charged on completion (not on prompt check)
- **For Non-Agent Requests**: Uses legacy `tokenCredits` field with standard token calculation
- **Default**: All unknown agents use `text` credit type with standard token calculation

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
2. For agents with fixed costs:
   - Checks if user has enough balance for the fixed cost (during prompt check)
   - Deducts the fixed amount after completion (regardless of actual token usage)
3. For other agents:
   - Checks balance based on estimated prompt tokens
   - Deducts actual token usage after completion
4. All deductions go to the appropriate `availableCredits` field

## Important Notes
- Legacy `tokenCredits` is still used for non-agent requests
- All credit types including 'text' now use `availableCredits` for agents
- Agents with fixed costs ignore actual token usage from the model
- Fixed costs are defined per agent in `AGENT_FIXED_COSTS` 
- Auto-refill still updates only `tokenCredits` (can be enhanced later if needed)
- Initial balance for all credit types is set to 0

## Configuration
To modify agent costs or add new agents, update these constants in `/api/models/tx.js`:
- `AGENT_CREDIT_TYPES` - Maps agent ID to credit type
- `AGENT_FIXED_COSTS` - Sets fixed cost per request for specific agents