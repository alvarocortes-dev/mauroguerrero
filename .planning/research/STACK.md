# Technology Stack Research

**Project:** Photography Portfolio with Admin CMS (Next.js 16)
**Researched:** 2026-02-12
**Confidence:** HIGH for core libraries, MEDIUM for layout editor patterns

## Recommended Stack

### Photo Viewer / Lightbox Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **react-photo-view** | ^1.2.7 | Image viewer with zoom/pan/rotation | Zero dependencies, 7KB gzipped. Native gesture support (drag, pinch-to-zoom, two-finger zoom). Spring animations. SSR-compatible. Actively maintained. Lightweight memory footprint (only 3 images in DOM). Perfect fit for Cloudinary integration. |
| **react-photoswipe-gallery** | ^4.0.0 | Alternative: modern gallery with swipe/touch | PhotoSwipe v5 wrapper. Better for multi-image galleries with navigation. Touch-first design. Responsive mobile-optimized. Use if you need full-screen swipe navigation between photos. |

### Grid Layout Editor (12-Column Responsive)

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **react-grid-layout** | ^2.2.2 | Draggable/resizable 12-column grid system | Complete TypeScript rewrite. Hooks-based API (useContainerWidth, useGridLayout, useResponsiveLayout). Native 12-column support via gridConfig prop. Responsive breakpoints per column. Server-side rendering support. Custom constraints system for validation (aspect ratio locks, snap-to-grid). React 18+ compatible. |

### Email Delivery (Resend + Templates)

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| **resend** | ^6.9.2 | Email API SDK for Next.js | Latest Node.js SDK. Works with App Router. Zero config integration with next/server actions. Supports React component templates. Built by team that created React Email. No spam filter issues when properly configured. |
| **react-email** | Latest | Email template components | TSX/JSX email components with dark mode. Supports all major email clients (Gmail, Outlook, Apple Mail, Yahoo). Reduces responsive email complexity. Works seamlessly with Resend. Designed specifically for React workflows. |

### Supporting Libraries (Existing Stack Compatible)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@dnd-kit/core** | ^6.3.1 (existing) | Grid drag-drop foundation | Already in your stack. Use for grid item reordering if needed. Compatible with react-grid-layout. |
| **framer-motion** | ^12.31.0 (existing) | Lightbox zoom animations | Smooth transitions for photo viewer open/close. Pan animations. |
| **zustand** | ^5.0.11 (existing) | State for layout editor | Grid layout state management. Photo viewer modal state. Email form state. |

## Installation

```bash
# Photo viewer (choose one)
npm install react-photo-view

# OR for gallery-first approach
npm install photoswipe react-photoswipe-gallery

# Grid layout editor
npm install react-grid-layout

# Email delivery
npm install resend @react-email/components

# Optional: Email development tools
npm install -D @react-email/render
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Chosen |
|----------|-------------|-------------|---------|
| **Lightbox** | react-photo-view | react-image-lightbox | Unmaintained for 2+ years, no active updates |
| **Lightbox** | react-photo-view | react-spring-lightbox | More complex, higher bundle size (needs react-spring), overkill for photo portfolio |
| **Lightbox** | react-photoswipe-gallery | Custom Canvas Viewer | Rewriting zoom/pan/touch correctly is 100+ hours, prone to bugs |
| **Grid Editor** | react-grid-layout v2 | Craft.js | Craft.js is headless - requires building entire editor UI. Only choose if building complex page builder product. |
| **Grid Editor** | react-grid-layout v2 | Material UI Grid | MUI Grid is layout-only, not editable. No drag/resize. Only for static responsive layouts. |
| **Grid Editor** | react-grid-layout v2 | Puck Editor | Newer but less mature. Good for content blocks, not ideal for photo grid layout. |
| **Email API** | Resend | AWS SES | More complex setup, requires email verification, higher latency. Resend is simpler. |
| **Email API** | Resend | SendGrid | SendGrid works, but Resend has React Email integration out of the box. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-image-lightbox | Last update 2021. Unmaintained. Bugs not fixed. Missing modern gesture support. | react-photo-view or react-photoswipe-gallery |
| Custom lightbox with canvas | You'll spend weeks debugging touch events, zoom math, animations, mobile edge cases. Prone to memory leaks on large galleries. | react-photo-view (7KB, production-ready, well-tested) |
| Material UI Grid for editor | MUI Grid is not interactive. Not designed for drag/resize. Only good for static responsive layouts. | react-grid-layout for interactive, editable grids |
| Nodemailer for contact form | Server-side complexity, requires SMTP config, rate-limiting problems. Email ends up in spam. | Resend (handles deliverability, templates, etc.) |
| Plain HTML email | Impossible to maintain responsive layout across clients (Gmail, Outlook, Apple Mail). Will look broken. | react-email (component-based, tested across clients) |

## Version Compatibility

| Package | Required Peer Deps | Notes |
|---------|-------------------|-------|
| react-photo-view@1.2.7 | React 16.8+ | Your React 19 is fully compatible. Zero other dependencies. |
| react-photoswipe-gallery@4.0.0 | photoswipe@5.x | Must use PhotoSwipe v5 (v1 of gallery uses PhotoSwipe v4). |
| react-grid-layout@2.2.2 | React 18+ | React 19 should work (treated as React 18.x semantics). Uses hooks only. |
| resend@6.9.2 | Node.js 14+ | Works with Next.js App Router. No peer dependencies. |
| @react-email/components | React 16.8+ | Uses standard React patterns. Zero dependencies. |

## Configuration Examples

### Photo Viewer with react-photo-view

```typescript
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

export function PhotoGallery({ images }: { images: string[] }) {
  return (
    <PhotoProvider>
      {images.map((src) => (
        <PhotoView key={src} src={src}>
          <img src={src} alt="gallery" width="200" />
        </PhotoView>
      ))}
    </PhotoProvider>
  );
}
```

### Grid Layout Editor with 12 Columns

```typescript
import { ReactGridLayout, useContainerWidth } from 'react-grid-layout';

export function LayoutEditor() {
  const { containerRef, width } = useContainerWidth();

  const layout = [
    { x: 0, y: 0, w: 6, h: 4 },
    { x: 6, y: 0, w: 6, h: 4 },
  ];

  return (
    <div ref={containerRef}>
      <ReactGridLayout
        layout={layout}
        gridConfig={{ cols: 12, rowHeight: 30 }}
        containerWidth={width}
        isDraggable
        isResizable
      >
        {/* Grid items */}
      </ReactGridLayout>
    </div>
  );
}
```

### Sending Email with Resend + React Email

```typescript
import { Resend } from 'resend';
import { ContactEmail } from '@/emails/contact-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email, message } = await request.json();

  const result = await resend.emails.send({
    from: 'contact@mauroguerrero.com',
    to: email,
    subject: 'Portfolio Contact Form',
    react: <ContactEmail message={message} />,
  });

  return Response.json(result);
}
```

## Stack Patterns by Context

**If building photo grid editor:**
- Use react-grid-layout v2 for the editor (12 columns, responsive)
- Use react-photo-view for the viewer (when clicking photos)
- Combine: Grid for layout, Photo-view for interaction

**If building contact form only:**
- Use Resend v6+ (minimal setup)
- Use react-email for templates (optional but recommended)
- Deploy as Next.js Server Action (no separate backend)

**If building rich gallery with navigation:**
- Use react-photoswipe-gallery instead (better multi-image UX)
- Pairs well with react-grid-layout for project pages
- Good for "project → photos → navigate between photos" flow

## Recommendation for Your Project

Based on your photography portfolio use case:

1. **Photo Viewer:** react-photo-view (lightweight, perfect for Cloudinary URLs, zero deps)
2. **Grid Editor:** react-grid-layout v2 (production-ready, TypeScript, hooks-based)
3. **Email:** Resend + react-email (modern, React-native, simple)

This stack minimizes dependencies, maximizes compatibility with your React 19/Next.js 16 setup, and provides professional gallery/editor experience.

## Sources

- [react-photo-view Documentation](https://react-photo-view.vercel.app/en-US/docs/getting-started) — Zero-dependency lightbox, verified features
- [react-photoswipe-gallery NPM](https://www.npmjs.com/package/react-photoswipe-gallery) — Version 4.0.0, PhotoSwipe v5 wrapper
- [react-grid-layout GitHub](https://github.com/react-grid-layout/react-grid-layout) — Version 2.2.2, TypeScript rewrite, 12-column support
- [react-grid-layout Releases](https://github.com/react-grid-layout/react-grid-layout/releases) — Latest v2.2.2 (verified 2026-02-12)
- [Resend NPM](https://www.npmjs.com/package/resend) — Version 6.9.2, latest SDK
- [Resend Next.js Documentation](https://resend.com/docs/send-with-nextjs) — App Router integration patterns
- [react-email GitHub](https://github.com/resend/react-email) — Email template components, Resend partnership
- [LogRocket Lightbox Comparison](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/) — Verified alternatives analysis

---

*Stack research for: Photography Portfolio CMS*
*Date: 2026-02-12*
*Confidence: HIGH for core selections, MEDIUM for optional alternatives*
