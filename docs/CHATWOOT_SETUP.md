# Chatwoot Customer Support - Quick Setup Guide

This guide will help you set up Chatwoot customer support system with Upstash Redis (free tier).

## Overview

**What you're setting up:**
- Chatwoot (self-hosted customer support platform)
- Upstash Redis (free tier - 10,000 commands/day)
- PostgreSQL database (Render Starter - $7/month)
- Chatwoot web service (Render Starter - $7/month)

**Total cost: $14/month** (both databases already needed for your app)

## Step 1: Create Upstash Redis Account

1. Go to https://upstash.com/
2. Sign up with GitHub or email
3. Click "Create Database"
4. Configure:
   - **Name**: `chatwoot-redis`
   - **Type**: Regional (free)
   - **Region**: `us-west-1` (closest to Oregon)
   - **Eviction**: No eviction
5. Click "Create"

## Step 2: Get Redis Connection Details

After creating the database:

1. Click on your database name
2. Scroll to "REST API" section
3. Copy these values:
   - **Endpoint**: `redis://default:[password]@[host]:[port]`
   - **Password**: The password from the URL

**Example format:**
```
REDIS_URL: redis://default:AXkxAAIjcDEyMzQ1Njc4OTBhYmNkZWY@us1-example-12345.upstash.io:6379
REDIS_PASSWORD: AXkxAAIjcDEyMzQ1Njc4OTBhYmNkZWY
```

## Step 3: Deploy to Render

### Option A: New Deployment (First Time)

1. Push code to GitHub:
```bash
git add .
git commit -m "Add Chatwoot customer support"
git push origin main
```

2. Go to Render Dashboard → New → Blueprint
3. Select your repository
4. Render will detect `render.yaml` and show all services
5. Click "Apply"

### Option B: Update Existing Deployment

1. Push code to GitHub (same as above)
2. Render will automatically detect the updated `render.yaml`
3. Go to Render Dashboard → Blueprints → Your Blueprint
4. Click "Sync" to apply changes

## Step 4: Configure Environment Variables

After deployment starts, add environment variables:

1. Go to Render Dashboard
2. Find `visual-tool-chatwoot` service
3. Click "Environment" tab
4. Add these variables:

**Required:**
- `REDIS_URL`: Your Upstash Redis URL (from Step 2)
- `REDIS_PASSWORD`: Your Upstash Redis password (from Step 2)
- `MAILER_SENDER_EMAIL`: `support@yourdomain.com` (must be verified in Resend)
- `SMTP_PASSWORD`: Your Resend API key (same as backend)

5. Click "Save Changes"
6. Service will automatically redeploy

## Step 5: Initial Chatwoot Setup

1. Wait for deployment to complete (check Render Dashboard)
2. Visit: `https://visual-tool-chatwoot.onrender.com`
3. Create admin account:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Password**: Strong password (save this!)
4. Click "Create Account"

## Step 6: Set Up Your First Inbox

After logging in:

1. Click "Add Inbox" or go to Settings → Inboxes
2. Select "Website"
3. Configure:
   - **Channel Name**: "Website Chat"
   - **Website Domain**: `visual-tool-frontend.onrender.com` (or your domain)
   - **Widget Color**: Choose your brand color
4. Click "Create Website Channel"
5. Copy the **Website Token** (you'll need this for the widget)

## Step 7: Add Chat Widget to Frontend

### For React Frontend

1. Open `frontend/index.html`
2. Add this script before closing `</body>` tag:

```html
<script>
  (function(d,t) {
    var BASE_URL="https://visual-tool-chatwoot.onrender.com";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: 'YOUR_WEBSITE_TOKEN', // Replace with your token from Step 6
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>
```

3. Replace `YOUR_WEBSITE_TOKEN` with the token from Step 6
4. Save and deploy your frontend

### Alternative: Environment Variable Approach

1. Add to frontend `.env`:
```
VITE_CHATWOOT_TOKEN=your_website_token
VITE_CHATWOOT_URL=https://visual-tool-chatwoot.onrender.com
```

2. Create a component or hook to load Chatwoot dynamically

## Step 8: Test the Setup

1. Visit your frontend application
2. Look for the chat widget (usually bottom-right corner)
3. Click the widget and send a test message
4. Check Chatwoot dashboard - you should see the conversation
5. Reply from the dashboard - message should appear in the widget

## Step 9: Configure Team Settings (Optional)

### Add Team Members

1. Go to Settings → Agents
2. Click "Add Agent"
3. Enter email and select role:
   - **Administrator**: Full access
   - **Agent**: Handle conversations only
4. Agent receives invitation email

### Create Canned Responses

1. Go to Settings → Canned Responses
2. Click "Add Canned Response"
3. Create templates for:
   - Welcome message
   - Common questions
   - Closing message

Example:
```
Short Code: /welcome
Content: Hi there! 👋 Thanks for reaching out. How can I help you today?
```

### Set Up Business Hours

1. Go to Settings → Inboxes → Your Inbox → Settings
2. Configure:
   - **Business Hours**: Set your support hours
   - **Auto Assignment**: Enable to distribute conversations
   - **CSAT**: Enable customer satisfaction surveys

## Troubleshooting

### Chatwoot won't load

**Check:**
1. Render service status (should be green)
2. Environment variables are set correctly
3. Database is running
4. Check logs: Render Dashboard → visual-tool-chatwoot → Logs

**Common fix:**
```bash
# Trigger manual redeploy
# Go to Render Dashboard → visual-tool-chatwoot → Manual Deploy
```

### Widget not appearing

**Check:**
1. Widget script is in your HTML
2. `websiteToken` is correct
3. `baseUrl` points to your Chatwoot URL
4. Browser console for errors (F12)
5. CORS settings: Chatwoot Settings → Account → Domain

**Fix CORS:**
1. In Chatwoot, go to Settings → Account Settings
2. Add your frontend domain to allowed domains
3. Save changes

### Redis connection errors

**Check:**
1. `REDIS_URL` format is correct (should start with `redis://`)
2. `REDIS_PASSWORD` matches Upstash
3. Upstash database is active (check dashboard)

**Common issues:**
- Missing `redis://` prefix in URL
- Wrong password
- Upstash database paused (free tier inactivity)

### Email not sending

**Check:**
1. `SMTP_PASSWORD` is your Resend API key
2. `MAILER_SENDER_EMAIL` is verified in Resend
3. Resend dashboard for email logs
4. Chatwoot logs for SMTP errors

## Monitoring Usage

### Upstash Redis

1. Go to Upstash Dashboard
2. Click your database
3. View metrics:
   - **Commands/day**: Should stay under 10,000 (free tier)
   - **Storage**: Should stay under 256MB (free tier)

**If you exceed limits:**
- Upgrade to Upstash paid plan ($10/mo for 100K commands)
- Or switch to Render Redis ($7/mo)

### Chatwoot Performance

Monitor in Render Dashboard:
- **CPU Usage**: Should be under 50% normally
- **Memory**: Should be under 512MB
- **Response Time**: Should be under 1 second

**If performance is slow:**
- Upgrade to Render Standard plan ($25/mo)
- Check Redis connection
- Review database queries

## Cost Summary

**Current Setup (Free + Minimal):**
- Chatwoot: Free (self-hosted)
- Upstash Redis: Free (10K commands/day)
- PostgreSQL: $7/month (Render Starter)
- Chatwoot Service: $7/month (Render Starter)
- **Total: $14/month**

**If you need to scale:**
- Upstash Pro: +$10/month (100K commands/day)
- Render Redis: +$7/month (instead of Upstash)
- Chatwoot Standard: +$18/month (better performance)

## Next Steps

- [ ] Set up Upstash Redis
- [ ] Deploy Chatwoot to Render
- [ ] Configure environment variables
- [ ] Create admin account
- [ ] Set up first inbox
- [ ] Add widget to frontend
- [ ] Test end-to-end
- [ ] Create canned responses
- [ ] Add team members (if applicable)
- [ ] Configure business hours
- [ ] Set up automation rules
- [ ] Monitor usage

## Support Resources

- **Chatwoot Docs**: https://www.chatwoot.com/docs
- **Chatwoot Community**: https://github.com/chatwoot/chatwoot/discussions
- **Upstash Docs**: https://docs.upstash.com/redis
- **Render Docs**: https://render.com/docs

## Need Help?

If you run into issues:
1. Check the detailed README in `/chatwoot/README.md`
2. Review Chatwoot logs in Render Dashboard
3. Check Upstash dashboard for Redis metrics
4. Visit Chatwoot community forums
