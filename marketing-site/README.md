# 26 Diagrams - Marketing Site

Marketing and promotional website for 26 Diagrams, a C4 model architecture diagramming tool.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **Analytics**: Google Analytics (via @next/third-parties)
- **CMS**: MDX for blog posts (file-based)
- **Hosting**: Vercel (recommended)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the environment variables and configure them:

```bash
cp .env.local .env.local.mine
```

Then edit `.env.local.mine` with your values. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

Required variables:
- `NEXT_PUBLIC_GA_ID` - Google Analytics Measurement ID
- `NEXT_PUBLIC_APP_URL` - URL of the main application

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Project Structure

```
marketing-site/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── pricing/           # Pricing page
│   ├── features/          # Features page
│   ├── blog/              # Blog listing and posts
│   └── layout.tsx         # Root layout with header/footer
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Site header
│   └── footer.tsx        # Site footer
├── content/              # MDX blog posts (to be created)
└── lib/                  # Utility functions
```

## Adding Blog Posts

Blog posts are written in MDX format and stored in the `content/blog/` directory.

Example post structure:
```mdx
---
title: "Your Post Title"
description: "Brief description"
date: "2024-12-24"
tags: ["Tutorial", "C4 Model"]
---

Your content here...
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The site can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Self-hosted with Node.js

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [MDX Documentation](https://mdxjs.com)
