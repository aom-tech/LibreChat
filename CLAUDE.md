# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
# Install dependencies (clean install)
npm ci

# Build required packages before first run
npm run build:data-provider
npm run build:data-schemas
npm run build:api

# Run development servers
npm run backend:dev    # Backend with nodemon (port 3080)
npm run frontend:dev   # Frontend with Vite (port 5173)

# Alternative: Run with Bun runtime
npm run b:api         # Backend with Bun
npm run b:client      # Frontend with Bun
```

### Testing
```bash
# Unit tests
npm run test:api      # Backend tests
npm run test:client   # Frontend tests

# E2E tests (requires Playwright)
npx playwright install   # First time setup
npm run e2e             # Run E2E tests
npm run e2e:headed      # Run with browser visible
npm run e2e:debug       # Debug mode
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier
```

### Build for Production
```bash
npm run frontend      # Build entire frontend (packages + client)
npm run backend       # Run backend in production mode
```

## High-Level Architecture

### Project Structure
LibreChat is a monorepo using npm workspaces:
- `/api` - Express.js backend server
- `/client` - React frontend application
- `/packages` - Shared packages:
  - `data-provider` - API client and React Query setup
  - `data-schemas` - TypeScript type definitions
  - `api` - Shared API utilities
  - `client` - Shared UI components

### Backend Architecture
- **Entry Point**: `api/server/index.js` - Express server on port 3080
- **Routes**: Modular structure in `api/server/routes/`
- **Controllers**: Business logic in `api/server/controllers/`
- **Models**: MongoDB schemas in `api/models/`
- **AI Clients**: Provider abstractions in `api/app/clients/`
  - Base client pattern with provider-specific implementations
  - Unified interface for OpenAI, Anthropic, Google, etc.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: 
  - Recoil for client state (atoms in `client/src/store/`)
  - React Query for server state (`packages/data-provider/`)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **API Communication**: Centralized in `packages/data-provider/`

### Authentication System
- **Strategies**: JWT (primary), OAuth2, LDAP, SAML, OpenID
- **Implementation**: Passport.js with custom strategies in `api/strategies/`
- **Middleware**: JWT validation, rate limiting, ban checks

### Database Schema
MongoDB with Mongoose:
- `User` - User accounts with roles and preferences
- `Conversation` - Chat threads with expiration
- `Message` - Individual messages with parent-child relationships
- `File` - Uploaded files and attachments
- `Assistant/Agent` - AI assistant configurations
- `Transaction` - Token usage tracking
- `Balance` - User credit balance with multi-type credits (text, image, presentation, video)

### AI Provider Integration
- **Abstraction**: `BaseClient` class provides unified interface
- **Providers**: OpenAI, Anthropic, Google, Azure, custom endpoints
- **New Providers**: Veo, Veo2 (video generation via MCP)
- **Features**: Streaming, vision support, function calling, plugins
- **Token Management**: Usage tracking and balance management
- **Credit System**: 
  - Multi-type credits: text, image, presentation, video
  - Agent-specific credit consumption
  - Auto-refill functionality with configurable intervals

### Key Patterns
1. **Streaming**: Real-time message streaming with SSE
2. **Plugins**: Extensible plugin system for additional capabilities
3. **Error Handling**: Centralized error controller with API boundaries
4. **Caching**: Redis support with Keyv abstraction
5. **Search**: Meilisearch integration for full-text search

## Development Guidelines

### Before Making Changes
1. Run `npm run update` to sync with latest changes
2. Clear browser localStorage/cookies when testing auth changes
3. Check existing patterns in similar files before implementing new features
4. Review token/credit costs in `api/models/tx.js` for AI provider pricing

### Code Style
- **Linting**: ESLint configuration enforced
- **Formatting**: Prettier for consistent style
- **Imports**: Order by npm packages → types → local imports
- **Naming**: camelCase for files, PascalCase for React components

### Testing Requirements
- Write unit tests for new features
- Ensure all tests pass before submitting changes
- E2E tests for critical user flows

### Common Pitfalls
- Frontend is TypeScript, backend is JavaScript (migration in progress)
- Always build packages before running development servers
- Environment variables must be set in `.env` file
- MongoDB must be running for local development
- Some features require additional services (Redis, Meilisearch)

### Working with AI Providers
- New providers should extend `BaseClient`
- Implement required methods: `sendCompletion`, `getCompletion`
- Handle streaming vs non-streaming responses
- Proper error handling and token counting
- **Special Providers**:
  - `flux` - Image generation (1000 credits per image)
  - `slidespeak-server` - Presentation generation (1000 credits)
  - `veo-mcp`, `veo2-mcp` - Video generation (1000 credits)
  - OpenAI image generation - Uses image credits

### State Management
- Use Recoil atoms for global client state
- React Query for all server data fetching
- Avoid prop drilling - use context or state management
- Optimistic updates for better UX

### API Development
- Follow RESTful conventions
- Use middleware for authentication and validation
- Consistent error response format
- Document new endpoints in route files

### Balance & Credit System
- **Credit Types**: text, image, presentation, video
- **Agent Mapping**: Specific agents consume different credit types (see `api/models/tx.js`)
- **Balance Methods**: Located in `api/models/balanceMethods.js`
- **Auto-refill**: Configurable per-user with interval and amount
- **Token Multipliers**: Different rates for different models and operations
