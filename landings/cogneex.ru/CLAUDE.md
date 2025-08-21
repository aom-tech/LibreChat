# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev         # Runs on http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Type checking
npm run astro check

# Format code (add prettier if needed)
npm run format
```

## High-Level Architecture

### Project Structure
Landing page for Cogneex.ru AI platform built with Astro.js:
- `/src/components` - Reusable UI components
- `/src/layouts` - Page layouts and templates
- `/src/pages` - Astro pages and API routes
  - `/api` - Server endpoints (form handling)
  - `/legal` - Legal pages (offer, privacy, etc.)
- `/src/styles` - Global styles and Tailwind config
- `/src/utils` - Utility functions
- `/src/types` - TypeScript type definitions
- `/src/lib` - External integrations (Firebase, etc.)
- `/public` - Static assets

### Tech Stack
- **Framework**: Astro.js with SSR
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Animations**: Motion library
- **Forms**: Firebase Firestore + Telegram notifications
- **Optimization**: astro-compress, sitemap generation

### Key Features
1. **Lead Generation Form**: Captures B2B/B2C leads, stores in Firestore, sends to Telegram
2. **Course Creation CTA**: Prominent block promoting AI course creation tools
3. **Pricing Toggle**: Dynamic pricing display for Users/Business segments
4. **Performance**: Optimized for Core Web Vitals (LCP ≤ 2.5s, CLS ≤ 0.1)

### API Routes
- `/api/lead` - POST endpoint for lead form submission
  - Validates with Zod schema
  - Stores in Firestore
  - Triggers Cloud Function for Telegram notification

### Environment Variables
Copy `.env.example` to `.env` and fill in:
- Firebase Admin SDK credentials
- Telegram bot token and chat ID
- reCAPTCHA keys
- Analytics IDs (optional)