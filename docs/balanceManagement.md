# Balance Management System Documentation

## Overview
LibreChat uses a multi-credit system that supports different types of tokens/credits for different services:
- `text` - for text generation (LLMs like Claude, GPT, etc.)
- `image` - for image generation (Flux, DALL-E, etc.)
- `presentation` - for presentation generation
- `video` - for video generation

## Architecture

### 1. Credit Types and Balance Structure

The balance is stored in the `Balance` model with the following structure:
```javascript
{
  user: ObjectId,
  tokenCredits: Number, // Legacy field for backward compatibility
  availableCredits: {
    text: Number,
    image: Number,
    presentation: Number,
    video: Number
  }
}
```

### 2. Token Multipliers

Token costs are calculated using multipliers defined in `/api/models/tx.js`:

```javascript
const tokenValues = {
  'flux': { prompt: 1, completion: 1 }, // Fixed rate for image generation
  'claude-3-sonnet': { prompt: 3, completion: 15 },
  'gpt-4o': { prompt: 2.5, completion: 10 },
  // ... other models
}
```

**Important**: If a model is not defined in `tokenValues`, it will use `defaultRate = 6`.

### 3. Transaction Flow

#### For Regular Text Models (Claude, GPT, etc.)
1. Token usage is tracked during the conversation
2. After completion, `spendTokens()` or `spendStructuredTokens()` is called
3. The system calculates: `cost = tokens * multiplier`
4. Credits are deducted from `availableCredits.text`

#### For Fixed-Cost Services (Images, Videos, Presentations)
1. Service completes successfully (e.g., image generated)
2. Call `spendTokens()` with fixed amount and specific `creditType`
3. Credits are deducted from the appropriate credit type

## Implementation Guide

### 1. Define Fixed Costs

First, add your service cost to `/api/models/tx.js`:

```javascript
const FIXED_SERVICE_COSTS = {
  FLUX_IMAGE: 1000,      // Cost per image generation
  PRESENTATION: 5000,    // Cost per presentation
  VIDEO: 10000,          // Cost per video
  YOUR_SERVICE: 2000,    // Add your service cost
};
```

### 2. Adding a New Fixed-Cost Service

```javascript
// In your service file (e.g., VideoGenerator.js)
const { spendTokens } = require('~/models/spendTokens');
const { FIXED_SERVICE_COSTS } = require('~/models/tx');
const { Balance } = require('~/db/models');

// Check balance before operation
const balanceDoc = await Balance.findOne({ user: userId }).lean();
const videoBalance = balanceDoc?.availableCredits?.video || 0;

if (videoBalance < FIXED_SERVICE_COSTS.VIDEO) {
  return `Insufficient video credits. You have ${videoBalance} but need ${FIXED_SERVICE_COSTS.VIDEO}`;
}

// After successful generation
try {
  const userId = this.userId || this.req?.user?.id;
  const conversationId = this.conversationId || this.req?.body?.conversationId;
  const endpoint = this.endpoint || this.req?.body?.endpoint || 'agents';
  
  if (userId && conversationId) {
    const txMetadata = {
      user: userId,
      conversationId: conversationId,
      context: 'video_generation', // Unique context
      endpoint: endpoint,
      endpointTokenConfig: this.endpointTokenConfig,
      model: 'video-generator', // Your model name
      creditType: 'video', // Credit type to deduct from
    };

    // Charge fixed amount from constants
    await spendTokens(txMetadata, {
      promptTokens: 0,
      completionTokens: FIXED_SERVICE_COSTS.VIDEO,
    });
    
    logger.info(`[VideoGenerator] Successfully charged ${FIXED_SERVICE_COSTS.VIDEO} video tokens`);
  }
} catch (error) {
  logger.error('[VideoGenerator] Error spending video tokens:', error);
}
```

### 3. Adding Token Multiplier for New Model

In `/api/models/tx.js`:

```javascript
const tokenValues = Object.assign(
  {
    'flux': { prompt: 1, completion: 1 },
    'video-generator': { prompt: 1, completion: 1 }, // Add your model
    'presentation-ai': { prompt: 1, completion: 1 },
    // ... other models
  },
  // ...
);
```

### 4. Key Implementation Considerations

#### Tool Integration
When creating tools that need to charge tokens:

1. **Pass Request Object**: Always ensure `req` is passed to your tool
```javascript
const toolOptions = {
  yourTool: {
    req: options.req, // Critical for accessing user and conversation
    // ... other options
  }
};
```

2. **Get User and Conversation IDs**: 
```javascript
const userId = this.userId || this.req?.user?.id;
const conversationId = this.conversationId || this.req?.body?.conversationId;
```

3. **Handle Missing Data Gracefully**:
```javascript
if (!userId || !conversationId) {
  logger.warn('[YourTool] Missing userId or conversationId, cannot charge tokens');
  // Continue with generation but log the issue
}
```

### 5. Common Pitfalls and Solutions

#### Pitfall 1: Double Token Deduction
**Problem**: Both the LLM and the tool charge tokens for the same request.
**Solution**: Use different `creditType` for different services. LLMs use 'text', tools use their specific type.

#### Pitfall 2: Using Default Rate
**Problem**: Forgetting to add model to `tokenValues` results in 6x multiplier.
**Solution**: Always add your model with appropriate multipliers (use 1 for fixed-cost services).

**Critical for Custom Credits**: When using custom credit types (image, presentation, video), ALWAYS add the model/server name to `tokenValues` with multiplier 1. Otherwise, your fixed costs will be multiplied by 6!

#### Pitfall 3: Early Returns Skipping Token Charge
**Problem**: Token charging code after early returns never executes.
**Solution**: Place token charging immediately after successful operation, before any returns.

```javascript
// GOOD
const result = await generateImage();
await chargeTokens(); // Charge immediately after success
if (this.isAgent) {
  return formatForAgent(result);
}
return formatNormally(result);

// BAD
const result = await generateImage();
if (this.isAgent) {
  return formatForAgent(result); // Early return skips charging!
}
await chargeTokens(); // Never reached for agents
```

#### Pitfall 4: Agent-Based Credit Type Selection
**Problem**: System automatically selects credit type based on agent ID.
**Solution**: Always explicitly specify `creditType` in your `spendTokens` call.

### 6. Testing Token Deduction

1. **Enable Debug Logging**: Watch for these log messages:
```
[YourService] Token charge parameters: {...}
[spendTokens] conversationId: xxx | Context: your_context | Token usage: {...}
[spendTokens] Transaction data record against balance: {...}
```

2. **Verify Correct Credit Type**: Check that the right credit type is being deducted
3. **Check Multipliers**: Ensure the rate matches your configuration

### 7. Balance Check Integration

For services that need to check balance before operation:

#### Option 1: Direct Balance Check (Recommended for Fixed-Cost Services)
```javascript
const { Balance } = require('~/db/models');

// Check specific credit type directly
const balanceDoc = await Balance.findOne({ user: userId }).lean();
if (!balanceDoc) {
  return 'Unable to verify balance';
}

const imageBalance = balanceDoc.availableCredits?.image || 0;
const requiredCredits = 1000;

if (imageBalance < requiredCredits) {
  return `Insufficient image credits. You have ${imageBalance} credits but need ${requiredCredits}`;
}
```

#### Option 2: Using Balance Check Method (For Dynamic Cost Calculation)
```javascript
const { check } = require('~/models/balanceMethods');

const balanceCheck = await check({
  user: userId,
  model: 'your-model',
  endpoint: endpoint,
  tokenType: 'prompt',
  amount: 1000, // Your cost
});

if (!balanceCheck.canSpend) {
  throw new Error('Insufficient credits');
}
```

**Note**: The `check` method currently always uses 'text' credit type. For non-text services, use direct balance check.

## Summary

The key to proper balance management is:
1. **Explicit Credit Types**: Always specify which credit type to use
2. **Fixed Multipliers**: Use multiplier of 1 for fixed-cost services
3. **Proper Timing**: Charge tokens immediately after successful operation
4. **Error Handling**: Log but don't block on token charging failures
5. **Request Context**: Ensure tools have access to user and conversation data

This system allows for flexible pricing models while maintaining clear separation between different service types.

## OpenAI Image Tools Integration

OpenAI Image tools (`image_gen_oai` and `image_edit_oai`) are integrated with the balance system:

### Configuration
- Uses custom base URL from `IMAGE_GEN_OAI_BASEURL` environment variable
- Model name: `gpt-image-1` (must be added to `tokenValues` with multiplier 1)
- Fixed cost: 1000 image tokens per generation/edit
- Credit type: `image`

### Features
1. **Balance Check**: Verifies sufficient image credits before generation/editing
2. **Fixed Token Deduction**: 1000 tokens from `availableCredits.image`
3. **Error Handling**: Continues operation if token spending fails
4. **Supports Both Tools**:
   - `image_gen_oai`: Generate new images from text
   - `image_edit_oai`: Edit existing images with text prompts

## MCP Tools Integration

MCP (Model Control Protocol) tools can also use the token deduction system. This is implemented in `/api/server/services/MCP.js`.

### Adding Token Deduction to MCP Tools

1. **Identify Tool Type**: Check the tool name or server name to identify if it requires token deduction
```javascript
const isPresentationTool = toolName.toLowerCase().includes('powerpoint') || 
                          toolName.toLowerCase().includes('presentation') ||
                          serverName.toLowerCase().includes('slidespeak');
```

2. **Check Balance Before Execution**: Similar to other services
```javascript
if (isPresentationTool && userId) {
  const balanceDoc = await Balance.findOne({ user: userId }).lean();
  const presentationBalance = balanceDoc.availableCredits?.presentation || 0;
  
  if (presentationBalance < FIXED_SERVICE_COSTS.PRESENTATION) {
    throw new Error(`Insufficient presentation credits...`);
  }
}
```

3. **Charge Tokens After Success**: After the MCP tool executes successfully
```javascript
if (isPresentationTool && userId && conversationId) {
  const txMetadata = {
    user: userId,
    conversationId: conversationId,
    context: 'presentation_generation',
    endpoint: endpoint,
    model: serverName,
    creditType: 'presentation',
  };

  await spendTokens(txMetadata, {
    promptTokens: 0,
    completionTokens: FIXED_SERVICE_COSTS.PRESENTATION,
  });
}
```

### Supported MCP Tools with Token Deduction

- **Presentation Generation**: Any MCP tool with names containing "powerpoint", "presentation", or from "slidespeak" server
  - Costs: 1000 presentation tokens per generation
  - Credit Type: `presentation`

- **Video Generation**: Any MCP tool with names containing "video" or from "veo" servers
  - Costs: 1000 video tokens per 5 seconds of video
  - Credit Type: `video`
  - Duration is extracted from `duration_seconds` parameter
  - Example: 5 second video = 1000 tokens, 10 second video = 2000 tokens, 15 second video = 3000 tokens

### CRITICAL: Adding Token Multipliers for MCP Servers

**⚠️ IMPORTANT**: When implementing token deduction for MCP tools or any custom services, you MUST add the server/model name to `tokenValues` in `/api/models/tx.js` with a multiplier of 1:

```javascript
const tokenValues = Object.assign(
  {
    'flux': { prompt: 1, completion: 1 },
    'slidespeak-server': { prompt: 1, completion: 1 }, // CRITICAL: Add this!
    'veo-mcp': { prompt: 1, completion: 1 },          // For video generation
    'veo2-mcp': { prompt: 1, completion: 1 },         // For video generation v2
    'your-mcp-server': { prompt: 1, completion: 1 },   // For any new MCP server
    // ... other models
  }
);
```

### Video Generation Cost Calculation

For video generation tools, the cost is calculated dynamically based on duration:

```javascript
// Extract duration from tool arguments
const videoDurationSeconds = parseInt(toolArguments.duration_seconds) || 0;

// Calculate cost: 1000 credits per 5 seconds
const videoCost = Math.ceil(videoDurationSeconds / 5) * 1000;

// Examples:
// 1-5 seconds = 1000 tokens
// 6-10 seconds = 2000 tokens
// 11-15 seconds = 3000 tokens
// etc.
```

**Why this is critical**:
- If the model is not in `tokenValues`, it will use `defaultRate = 6`
- This means 1000 tokens will be charged as 6000 tokens!
- Always use multiplier `1` for fixed-cost services

**Example of the problem**:
```
// Without adding to tokenValues:
// Charging 1000 tokens → Actually charges 6000 tokens (1000 * 6)

// After adding to tokenValues with multiplier 1:
// Charging 1000 tokens → Correctly charges 1000 tokens (1000 * 1)
```