# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Run backend in development mode
npm run backend:dev

# Run frontend in development mode  
npm run frontend:dev

# Run both frontend and backend (in separate terminals)
npm run backend:dev
npm run frontend:dev
```

### Testing
```bash
# Run client tests
npm run test:client

# Run API tests  
npm run test:api

# Run specific test file
npm run test:client -- path/to/test.spec.js

# Run e2e tests
npm run e2e
npm run e2e:headed  # with browser visible
```

### Code Quality
```bash
# Lint code
npm run lint
npm run lint:fix  # auto-fix issues

# Format code
npm run format
```

### Building
```bash
# Build frontend for production
npm run frontend

# Build with Docker
docker-compose build
```

## Architecture Overview

LibreChat is a monorepo using npm workspaces with three main packages:

- **api/** - Express.js backend server
  - Handles authentication (Passport.js with JWT, OAuth, LDAP, SAML)
  - Integrates with AI providers (OpenAI, Anthropic, Google, Azure, AWS Bedrock)
  - MongoDB for data persistence, optional Redis for caching
  - Code Interpreter API for sandboxed code execution
  - MCP (Model Context Protocol) support for agents and tools

- **client/** - React frontend application
  - Built with Vite and TypeScript
  - State management using Recoil
  - API communication via Tanstack Query
  - UI components: Radix UI + Tailwind CSS
  - Internationalization with react-i18next

- **packages/** - Shared packages
  - data-provider: Shared data access layer
  - data-schemas: Type definitions and schemas
  - api: Shared API utilities

## Key Configuration

The application is configured primarily through `librechat.yaml` which controls:
- AI model endpoints and configurations
- Authentication methods and providers
- Feature toggles (agents, bookmarks, multi-conversation)
- Interface customization
- Balance/credit system settings
- Speech/TTS configurations

Environment variables handle sensitive configurations like API keys and database connections.

## Important Development Notes

1. When modifying AI provider integrations, check the `/api/app/clients/` directory
2. Frontend routing is handled in `/client/src/routes/`
3. Shared types and schemas are in `/packages/data-schemas/`
4. Agent and tool implementations are in `/api/server/services/agents/`
5. The application supports Docker deployment with both development and production compose files

## Testing Approach

- Unit tests use Jest for both client and API
- E2E tests use Playwright
- Test files follow the pattern `*.spec.js` or `*.test.js`
- Client tests are in `__tests__` directories within the client folder
- API tests are in `/api/test/`

## Frontend Architecture Details

### Directory Structure
```
client/src/
├── @types/          # TypeScript type definitions
├── a11y/            # Accessibility components
├── common/          # Shared types and constants
├── components/      # React components (feature-based)
│   ├── Auth/        # Authentication components
│   ├── Chat/        # Chat interface components
│   ├── Endpoints/   # Endpoint configuration
│   ├── Nav/         # Navigation components
│   ├── Tour/        # User onboarding tour
│   └── ui/          # Reusable UI components
├── data-provider/   # React Query data layer
├── hooks/           # Custom React hooks
├── locales/         # i18n translations
├── Providers/       # React Context providers
├── routes/          # Route definitions
├── store/           # Recoil state atoms
└── utils/           # Utility functions
```

### State Management (Recoil)

Global state is managed with Recoil atoms organized by domain:

- **User State**: `store/user.ts` - Authentication and user preferences
- **Chat State**: `store/submission.ts` - Active conversation state
- **Settings**: `store/settings.ts` - App configuration
- **Endpoints**: `store/endpoints.ts` - Available AI models
- **Agents**: `store/agents.ts` - Agent configurations

Example atom usage:
```typescript
import { useRecoilState } from 'recoil';
import store from '~/store';

const [user, setUser] = useRecoilState(store.user);
```

### Data Fetching Patterns

React Query (Tanstack Query) handles all server state:

- **Queries**: `useGet*` naming convention
  - `useGetMessagesByConvoId` - Fetch messages
  - `useGetEndpointsQuery` - Get available endpoints
  - `useGetSearchEnabledQuery` - Check search capability

- **Mutations**: `useCreate*`, `useUpdate*`, `useDelete*`
  - Optimistic updates for better UX
  - Automatic cache invalidation
  - Error handling with toast notifications

### Component Patterns

1. **Feature-based organization**: Components grouped by feature (Chat, Auth, Nav)
2. **Compound components**: Dialog, Dropdown with sub-components
3. **Container/Presentation separation**: Logic in containers, UI in presentation components
4. **Custom hooks for reusable logic**: `useLocalize`, `useAuthRedirect`, `useConversation`

### Key Custom Hooks

- **Chat Hooks** (`hooks/Chat/`):
  - `useTextToSpeech` - TTS functionality
  - `useChatFormInput` - Chat input handling
  - `useMessageHandler` - Message processing

- **SSE Hooks** (`hooks/SSE/`):
  - `useSSE` - Server-sent events handling
  - Real-time message streaming

- **Audio Hooks** (`hooks/Audio/`):
  - `useAudioPlayer` - Audio playback
  - `useAudioRecorder` - Voice recording

### Routing Structure

React Router v6 with nested routes:

```typescript
// Main routes in routes/index.tsx
<Route path="/" element={<Navigate to="/agents" />} />
<Route path="/agents" element={<AgentSelectRoute />} />
<Route path="/c/:conversationId" element={<ChatRoute />} />
<Route path="/search" element={<SearchView />} />
```

Protected routes use `AuthLayout` for authentication checks.

### UI Component Library

Built on Radix UI primitives with Tailwind CSS:

- **Dialog**: Modal dialogs with accessibility
- **Dropdown**: Dropdown menus
- **Switch**: Toggle switches
- **Tabs**: Tab interfaces
- **Toast**: Notification system

All components support dark/light themes via CSS variables.

### Build Configuration (Vite)

Key Vite configurations:
- Module federation for micro-frontend architecture
- PWA support with service worker
- Optimized chunking strategy
- Proxy configuration for API requests
- Environment-specific builds

### Development Tips

1. **Adding new features**: Create feature folder in `components/`
2. **State management**: Add Recoil atoms in `store/`
3. **API integration**: Add queries/mutations in `data-provider/`
4. **Styling**: Use Tailwind classes, extend theme in `tailwind.config.js`
5. **Testing**: Add tests in `__tests__` folders
6. **Translations**: Update locale files in `locales/`

## Backend Architecture Details

### Directory Structure
```
api/
├── app/                    # Core application logic
│   ├── clients/           # AI provider client implementations
│   └── index.js          # App entry point
├── cache/                 # Caching layer (Redis/MongoDB)
├── config/                # Configuration management
├── db/                    # Database connection setup
├── models/                # Business logic for data operations
├── server/                # Express server setup
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route definitions
│   ├── services/         # Business services
│   └── utils/            # Server utilities
├── strategies/            # Passport authentication strategies
└── utils/                 # General utilities
```

### Authentication System

Multiple authentication strategies via Passport.js:

- **JWT**: Bearer token for API access (`strategies/jwtStrategy.js`)
- **Local**: Username/password (`strategies/localStrategy.js`)
- **OAuth**: Google, GitHub, Discord, Facebook, Apple
- **LDAP**: Enterprise directory integration
- **OpenID Connect**: Generic OIDC providers
- **SAML**: Enterprise SSO
- **2FA**: TOTP with backup codes

### API Routes Structure

Organized by feature domain:
```
/api/auth       - Authentication endpoints
/api/agents     - AI agents management
/api/ask        - Chat completion requests
/api/assistants - OpenAI Assistants API
/api/balance    - Token/credit management
/api/convos     - Conversation CRUD
/api/files      - File upload/management
/api/messages   - Message operations
/api/models     - Model listing
/api/endpoints  - Endpoint configuration
/api/mcp        - Model Context Protocol
```

### AI Provider Clients

All clients extend `BaseClient` class:

- **OpenAIClient** (`app/clients/OpenAIClient.js`)
  - OpenAI and Azure OpenAI support
  - Function calling
  - Vision models
  - Assistants API

- **AnthropicClient** (`app/clients/AnthropicClient.js`)
  - Claude models
  - Vision support
  - Tool calling

- **GoogleClient** (`app/clients/GoogleClient.js`)
  - Gemini models
  - Vertex AI support

- **Custom Endpoints** (`app/clients/ChatGPTClient.js`)
  - Generic OpenAI-compatible APIs
  - Custom model configurations

### Database Layer

MongoDB with Mongoose schemas:

- **Core Models** (from `@librechat/data-schemas`):
  - User, Message, Conversation
  - Agent, Action, File
  - Transaction, Balance
  - Role (RBAC)

- **Model Operations** (`models/`):
  - CRUD operations with business logic
  - Query optimization
  - Data validation

### Middleware Stack

Key middleware components:

1. **Rate Limiting** (`middleware/limiters/`)
   - Per-endpoint rate limits
   - User-based throttling
   - Custom limit configurations

2. **Validation** (`middleware/validators/`)
   - Request/response validation
   - Joi schema validation
   - File upload validation

3. **Authentication** (`middleware/auth/`)
   - JWT verification
   - Session management
   - Role-based access control

4. **Security**
   - Ban system checks
   - Content moderation
   - CORS configuration
   - MongoDB injection prevention

### Real-time Communication

Server-Sent Events (SSE) for streaming:

- **StreamResponse** utilities in `server/utils/`
- Token-by-token message streaming
- Error propagation in streams
- Assistant run streaming

### Services Architecture

Core services in `server/services/`:

- **AppService**: Application lifecycle
- **ModelService**: Model configuration
- **FileService**: Multi-storage support (S3, Azure, Firebase, Local)
- **AuthService**: Authentication helpers
- **ToolService**: Agent tool management
- **AssistantService**: OpenAI Assistants
- **ActionService**: Custom actions
- **MCPManager**: MCP server management

### Agent System

Advanced agent capabilities:

- **LangChain Integration**: Custom agents with tools
- **Function Calling**: OpenAI function support
- **Tool Management**: Dynamic tool loading
- **MCP Protocol**: External tool servers
- **Action System**: Custom agent actions

### Error Handling

Comprehensive error management:

- Global error controller (`controllers/ErrorController.js`)
- Stream error handling for SSE
- Validation error formatting
- MongoDB error handling
- Process-level error catching

### Configuration

Flexible configuration system:

- Environment variables (primary)
- `librechat.yaml` configuration
- Dynamic endpoint configuration
- Per-provider settings
- Rate limit customization

### Development Patterns

1. **Service Layer**: Business logic in services
2. **Repository Pattern**: Data access through models
3. **Strategy Pattern**: Auth and storage strategies
4. **Factory Pattern**: Client creation
5. **Middleware Pipeline**: Express middleware chain
6. **Caching Strategy**: Redis/MongoDB caching

### Adding New Features

1. **New AI Provider**: Extend `BaseClient` in `app/clients/`
2. **New Route**: Add to `server/routes/` with middleware
3. **New Service**: Create in `server/services/`
4. **New Auth Strategy**: Add to `strategies/`
5. **Database Model**: Define schema in `@librechat/data-schemas`