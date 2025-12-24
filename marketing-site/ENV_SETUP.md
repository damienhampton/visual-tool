# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root of the marketing-site directory with the following variables:

```bash
# Google Analytics
# Get your GA4 Measurement ID from https://analytics.google.com/
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Application URL (update when deployed)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Your Google Analytics ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use an existing one)
3. Go to Admin → Data Streams → Web
4. Copy your Measurement ID (format: G-XXXXXXXXXX)
5. Paste it into your `.env.local` file

## Development

The `.env.local` file is gitignored and should never be committed. Each developer and deployment environment needs their own copy.

For production deployment on Vercel:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_APP_URL`
4. Redeploy your application
