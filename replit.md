# Mikromatter Platform

## Overview

A modern micro-blogging platform called "Mikromatter" that combines Twitter-like social features with a minimalist, content-first design approach. Users can share posts up to 1000 words, interact through likes/reposts/comments, follow other users, and build their network. The application features a clean, dual-theme interface (dark mode primary) with carefully crafted typography and intentional use of vibrant accent colors.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Features Added (November 2025)

### Brand Identity - Mikromatter Logo
- Custom SVG upright figure-8 logo design (inspired by infinity symbol)
- Gradient styling using primary, secondary, and accent theme colors
- Integrated across landing page, sidebar, and all authenticated pages
- Reusable component with configurable text display option
- Location: `client/src/components/mikromatter-logo.tsx`

### Mikromatter of the Day
- Daily rotating content feature showcasing literature, philosophy, and current events
- 8 curated quotes with author attribution and contextual information
- Deterministic rotation based on day-of-year calculation
- Category badges (Literature, Philosophy, Current Events) with icons
- Positioned prominently on home feed above posts
- Location: `client/src/components/matter-of-the-day.tsx`

### Security & Code Quality Improvements
- **SQL Injection Fix**: Changed hashtag filtering from `sql.raw()` to `inArray()` in `server/storage.ts` (line 439)
- **Accessibility**: Added `DialogDescription` to post composer and avatar selector for screen reader support
- **Code Cleanup**: Removed debug console.log statements while preserving essential error logging

### Post Templates (Typeshare-style)
- 10 engagement-focused templates in post composer
- "Hot take", "Unpopular opinion", "Pro tip", "3 lessons", etc.
- Click badge to auto-populate textarea with template structure

### Login Experience
- Quick sign-in header button
- Clear messaging about login options (Google, GitHub, Email)
- "Get Started Free" CTA with login method preview

### Avatar System
- 12 cartoon avatar options (DiceBear: Adventurer, Avataaars, Bottts)
- Custom image upload (5MB max, images only)
- Camera button on profile for easy avatar changes
- Replit Object Storage integration for secure uploads
- Public avatar visibility for social features

### Post Images
- Image upload support for posts (5MB max)
- Replit Object Storage integration with signed URLs
- Image preview/remove UI in post composer
- Full-width image display in post cards

### Hashtags & Trending
- Automatic hashtag extraction from post content (#word pattern)
- Clickable hashtags linking to dedicated hashtag pages
- Trending hashtags sidebar showing top 10 tags with post counts
- Hashtag-specific post feed pages
- Secure parameterized queries for hashtag filtering

### Indie Author Bookclubs (November 2025)
- Community-focused bookclubs centered on indie authors and their works
- Create bookclubs with current book title and author information
- Optional support links for author websites to help users discover and support creators
- Join/leave functionality with role-based access control
- Creator-only delete permissions (creators cannot leave, only delete their clubs)
- Member count tracking and membership status indicators
- Full bookclub detail pages with author information and support links
- Sidebar navigation for easy access to bookclub features
- Locations: 
  - `client/src/pages/bookclubs.tsx` - Bookclub list page
  - `client/src/pages/bookclub-detail.tsx` - Bookclub detail page
  - `client/src/components/create-bookclub-dialog.tsx` - Create dialog with Zod validation
  - `shared/schema.ts` - Bookclub and member schemas
  - `server/storage.ts` - Bookclub CRUD operations
  - `server/routes.ts` - Bookclub API endpoints

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- CSS configured through Tailwind with custom design tokens

**UI Component System:**
- Shadcn/ui component library (New York style variant) built on Radix UI primitives
- Custom design system with theme variables for consistent styling across light/dark modes
- Component variants using class-variance-authority for systematic UI patterns
- Responsive sidebar layout with mobile sheet support

**State Management & Data Fetching:**
- TanStack Query (React Query) for server state management with aggressive caching
- Custom query client configured with `staleTime: Infinity` to minimize refetches
- Optimistic UI updates through query invalidation patterns
- Session-based authentication state managed through React Query

**Design System:**
- Hybrid color palette combining X.com's robust features with micro.blog's minimalism
- Dark mode as primary theme (0 0% 8% background) with vibrant accents (pink primary at 330 85% 60%)
- Typography stack: Inter for UI, JetBrains Mono for metadata
- Custom CSS variables for theme switching and elevation states

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for REST API endpoints
- Session-based authentication using express-session with PostgreSQL storage
- WebSocket server for real-time features (posts, likes, follows)
- Middleware pipeline for request logging and error handling

**Authentication System:**
- Replit Auth integration via OpenID Connect (OIDC)
- Passport.js strategy for authentication flow
- Session cookies with 7-day TTL stored in PostgreSQL
- User profile data synced from Replit identity provider

**API Design:**
- RESTful endpoints following resource-based patterns
- Authentication middleware (`isAuthenticated`) protecting all user routes
- Consistent error handling with 401 redirects for unauthorized access
- Request/response logging with JSON payload capture

**Data Access Layer:**
- Storage interface pattern (`IStorage`) abstracting database operations
- Drizzle ORM for type-safe database queries with PostgreSQL
- Relations-based queries for complex data fetching (posts with authors, user stats)
- Optimized queries using SQL aggregations for counts and status flags

### Database Architecture

**ORM & Schema:**
- Drizzle ORM with Neon serverless PostgreSQL adapter
- WebSocket-based database connections for serverless compatibility
- Schema-first development with TypeScript types generated from Drizzle schema
- Zod validation schemas derived from Drizzle tables

**Core Tables:**
- `users`: Profile data synced from Replit Auth (id, email, name, bio, avatar)
- `posts`: Blog posts with content, timestamps, and author foreign key
- `comments`: Nested comments on posts with author references
- `likes`: User-post like relationships
- `reposts`: User-post repost relationships
- `follows`: User-user follow relationships (follower/following pattern)
- `bookclubs`: Indie author bookclubs with current book, author, and support links
- `bookclub_members`: Junction table for bookclub membership with role (creator/member)
- `sessions`: Express session storage for authentication state

**Data Patterns:**
- Relational schema with foreign keys and cascading deletes
- Many-to-many relationships through junction tables (likes, reposts, follows)
- Computed fields in queries (isLiked, isReposted, isFollowing) based on current user
- Aggregated counts (likes, reposts, comments, followers) using SQL COUNT

### External Dependencies

**Authentication & Identity:**
- Replit Auth (OpenID Connect provider) - User authentication and identity management
- Required environment variables: `REPL_ID`, `ISSUER_URL`, `REPLIT_DOMAINS`

**Database:**
- Neon Serverless PostgreSQL - Primary data store
- Connection via WebSocket protocol using `@neondatabase/serverless`
- Required environment variable: `DATABASE_URL`

**Session Management:**
- connect-pg-simple - PostgreSQL session store for Express
- Stores session data in `sessions` table with automatic expiration

**UI Component Libraries:**
- Radix UI - Headless accessible component primitives (40+ components imported)
- Includes: Dialog, Dropdown, Popover, Toast, Tooltip, Sidebar, and form controls

**Development Tools:**
- @replit/vite-plugin-runtime-error-modal - Development error overlay
- @replit/vite-plugin-cartographer - Code mapping for Replit IDE
- @replit/vite-plugin-dev-banner - Development environment banner

**Utilities:**
- date-fns - Date formatting and manipulation
- nanoid - Unique ID generation
- memoizee - Function memoization for OIDC config caching
- zod - Runtime type validation and schema generation

**Font Delivery:**
- Google Fonts CDN - Inter and JetBrains Mono font families