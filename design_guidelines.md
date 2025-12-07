# Micro Blog Platform Design Guidelines

## Design Approach: Reference-Based Hybrid

**Primary References**: X.com (Twitter) + Micro.blog
**Strategy**: Combine X's robust social features with micro.blog's content-first minimalism

**Key Design Principles**:
- Content clarity over feature density
- Purposeful whitespace without sacrificing functionality
- Clean typography with strategic visual hierarchy
- Restrained color palette with intentional accent usage

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- Background Primary: 0 0% 8% (deep black)
- Background Secondary: 0 0% 12% (card surfaces)
- Background Tertiary: 0 0% 16% (hover states)
- Text Primary: 0 0% 98% (high contrast white)
- Text Secondary: 0 0% 65% (muted text)
- Border: 0 0% 20% (subtle dividers)

**Light Mode**:
- Background Primary: 0 0% 100% (pure white)
- Background Secondary: 330 100% 98% (very light pink tint)
- Text Primary: 0 0% 10% (near black)
- Text Secondary: 0 0% 45% (muted text)

**Brand Colors**:
- Primary: 330 85% 60% (vibrant pink - for CTAs, links, active states)
- Secondary: 210 100% 55% (bright blue - for secondary actions)
- Accent: 50 100% 55% (vibrant yellow - for highlights, notifications)
- Success: 145 65% 45% (green - for likes, confirmations)
- Danger: 0 75% 55% (red - for delete, warnings)

### B. Typography

**Font Stack**:
- Primary: 'Inter', system-ui, -apple-system, sans-serif
- Monospace: 'JetBrains Mono', Consolas, monospace (for usernames, timestamps)

**Scale**:
- Headings: text-2xl to text-3xl, font-bold
- Body: text-base, font-normal (posts, comments)
- Meta: text-sm, font-medium (timestamps, counts)
- Small: text-xs (secondary metadata)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 8, 12, 16
- Micro spacing: p-2, gap-2 (tight elements)
- Component spacing: p-4, gap-4 (cards, buttons)
- Section spacing: p-8, gap-8 (major sections)
- Layout margins: p-12, p-16 (page containers)

**Grid Structure**:
- Desktop: 3-column (sidebar-feed-trending) max-w-7xl
- Tablet: 2-column (sidebar-feed) max-w-5xl  
- Mobile: Single column, full-width with px-4

### D. Component Library

**Navigation**:
- Fixed left sidebar (desktop) with icon-label navigation
- Bottom tab bar (mobile) with 5 core actions
- User menu dropdown (top-right) with profile access

**Post Card**:
- Avatar (48x48) + username + handle + timestamp header
- Post content (280 char limit) with line clamp on feed
- Action bar: Like, Repost, Comment, Share (icon buttons with counts)
- Divider: border-b border-gray-800/30 (dark) or border-gray-200 (light)

**Forms & Inputs**:
- Rounded-xl inputs with subtle borders
- Floating label pattern for post composer
- Character counter (visible at 250+ chars)
- Auto-expanding textarea

**Profile Components**:
- Cover image placeholder (h-32 to h-48)
- Avatar overlay (-mt-12 positioning)
- Bio, location, join date metadata grid
- Stats bar: Posts, Following, Followers (horizontal)
- Tab navigation: Posts, Replies, Likes

**Feed Components**:
- Infinite scroll with "Load more" trigger
- Empty states with illustrations and CTAs
- Loading skeletons matching post card structure
- Pull-to-refresh indicator (mobile)

**Overlays & Modals**:
- Post composer: Full-screen modal (mobile), centered overlay (desktop)
- Image viewer: Backdrop blur with close/navigation
- Confirmation dialogs: Centered, max-w-sm with action buttons

### E. Interactions & Animations

**Minimal, Purposeful Motion**:
- Hover scale: scale-105 on avatars, images
- Button feedback: active:scale-95 with transition-transform
- Page transitions: Fade in/out (duration-200)
- Like animation: Heart pop scale effect (once)
- NO continuous animations, carousels, or parallax

---

## Layout Specifications

### Main Feed Layout
**Three-Column Desktop** (lg:grid-cols-[260px_1fr_340px]):
- Left Sidebar: Navigation menu (sticky)
- Center Feed: Post stream (max-w-2xl)
- Right Sidebar: Trending, Suggestions (sticky)

**Mobile**: Stack to single column, bottom nav bar

### Profile Page Layout
- Full-width header with cover + avatar
- Bio section (max-w-2xl, centered)
- Tabbed content area for posts/activity

### Composer Modal
- Fixed header with "Post" button (top-right)
- Auto-focus textarea with character counter
- Image upload preview grid (up to 4 images)
- Footer: Media buttons, visibility selector

---

## Images

**Hero Section**: None - Start directly with feed/onboarding
**Profile Covers**: 1200x300 placeholder gradients (subtle diagonal)
**Avatars**: 48x48 (feed), 128x128 (profile), rounded-full
**Post Images**: Aspect ratio 16:9 or 1:1, max-w-full, rounded-lg
**Empty States**: Simple illustrations (400x300), centered with message

---

## Accessibility & Quality

- Maintain AA contrast ratios (4.5:1 text, 3:1 UI)
- Focus rings: ring-2 ring-primary ring-offset-2
- Dark mode inputs: bg-gray-800 with text-white
- Responsive touch targets: min-h-12 for all interactive elements
- Semantic HTML: nav, main, article for feed posts

---

**Final Note**: Balance is key - include all social features (following, liking, reposting, commenting) but present them with micro.blog's restraint. Feature-rich without visual clutter.