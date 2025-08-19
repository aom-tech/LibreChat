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

### 1. Adding a New Fixed-Cost Service

```javascript
// In your service file (e.g., VideoGenerator.js)
const { spendTokens } = require('~/models/spendTokens');

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

    // Charge fixed amount
    await spendTokens(txMetadata, {
      promptTokens: 0,
      completionTokens: 10000, // Your fixed cost
    });
    
    logger.info('[VideoGenerator] Successfully charged 10000 video tokens');
  }
} catch (error) {
  logger.error('[VideoGenerator] Error spending video tokens:', error);
}
```

### 2. Adding Token Multiplier for New Model

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

### 3. Key Implementation Considerations

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

### 4. Common Pitfalls and Solutions

#### Pitfall 1: Double Token Deduction
**Problem**: Both the LLM and the tool charge tokens for the same request.
**Solution**: Use different `creditType` for different services. LLMs use 'text', tools use their specific type.

#### Pitfall 2: Using Default Rate
**Problem**: Forgetting to add model to `tokenValues` results in 6x multiplier.
**Solution**: Always add your model with appropriate multipliers (use 1 for fixed-cost services).

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

### 5. Testing Token Deduction

1. **Enable Debug Logging**: Watch for these log messages:
```
[YourService] Token charge parameters: {...}
[spendTokens] conversationId: xxx | Context: your_context | Token usage: {...}
[spendTokens] Transaction data record against balance: {...}
```

2. **Verify Correct Credit Type**: Check that the right credit type is being deducted
3. **Check Multipliers**: Ensure the rate matches your configuration

### 6. Balance Check Integration

For services that need to check balance before operation:

```javascript
const { check } = require('~/models/balanceMethods');

const balanceCheck = await check({
  user: userId,
  model: 'your-model',
  endpoint: endpoint,
  tokenType: 'prompt',
  amount: 1000, // Your fixed cost
});

if (!balanceCheck.canSpend) {
  throw new Error('Insufficient credits');
}
```

## Summary

The key to proper balance management is:
1. **Explicit Credit Types**: Always specify which credit type to use
2. **Fixed Multipliers**: Use multiplier of 1 for fixed-cost services
3. **Proper Timing**: Charge tokens immediately after successful operation
4. **Error Handling**: Log but don't block on token charging failures
5. **Request Context**: Ensure tools have access to user and conversation data

This system allows for flexible pricing models while maintaining clear separation between different service types.