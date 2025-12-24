# Chatwoot Customer Support Setup

This directory contains the configuration for self-hosted Chatwoot customer support system.

## Overview

Chatwoot provides:
- Live chat widget for your frontend
- Ticketing system
- Multi-channel support (email, website, social media)
- Team inbox
- Canned responses
- Reports and analytics
- Mobile apps for support team

## Prerequisites

1. **Upstash Redis Account** (Free tier)
   - Sign up at https://upstash.com/
   - Create a Redis database
   - Get connection URL and password

2. **Resend API Key** (Already configured)
   - Used for sending email notifications

## Setup Instructions

### 1. Create Upstash Redis Database

1. Go to https://upstash.com/ and sign up
2. Click "Create Database"
3. Select:
   - **Type**: Regional (free)
   - **Region**: Choose closest to Oregon (e.g., US-West-1)
   - **Name**: chatwoot-redis
4. Click "Create"
5. Copy the connection details:
   - **Redis URL**: `redis://default:[password]@[host]:[port]`
   - **Password**: The password from the URL

### 2. Deploy Chatwoot to Render

#### Option A: Via Render Dashboard (Recommended)

1. Go to Render Dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml`
5. Review and apply

#### Option B: Update Existing Blueprint

1. Push updated `render.yaml` to GitHub
2. Render will automatically detect changes
3. Approve the update in Render Dashboard

### 3. Configure Environment Variables

After deployment, add these environment variables in Render Dashboard for the `visual-tool-chatwoot` service:

**Required:**
- `REDIS_URL`: Your Upstash Redis URL (format: `redis://default:[password]@[host]:[port]`)
- `REDIS_PASSWORD`: Your Upstash Redis password
- `MAILER_SENDER_EMAIL`: Your verified Resend email (e.g., `support@yourdomain.com`)
- `SMTP_PASSWORD`: Your Resend API key

**Optional (for advanced features):**
- `FACEBOOK_APP_ID`: For Facebook integration
- `FACEBOOK_APP_SECRET`: For Facebook integration
- `TWITTER_APP_ID`: For Twitter integration
- `TWITTER_CONSUMER_KEY`: For Twitter integration
- `TWITTER_CONSUMER_SECRET`: For Twitter integration

### 4. Initial Chatwoot Setup

1. Once deployed, visit: `https://visual-tool-chatwoot.onrender.com`
2. Create your admin account:
   - Full Name
   - Email
   - Password
3. Complete the onboarding wizard:
   - Set up your first inbox
   - Configure website channel
   - Get your widget code

### 5. Add Chat Widget to Frontend

After setting up your inbox in Chatwoot:

1. Go to Settings → Inboxes → Your Inbox → Configuration
2. Copy the widget script code
3. Add to your frontend's `index.html` or main layout:

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
        websiteToken: 'YOUR_WEBSITE_TOKEN',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>
```

Replace `YOUR_WEBSITE_TOKEN` with the token from Chatwoot.

### 6. Configure Email Channel (Optional)

To receive support emails in Chatwoot:

1. In Chatwoot, go to Settings → Inboxes → Add Inbox
2. Select "Email"
3. Configure:
   - **Email**: support@yourdomain.com
   - **IMAP Settings**: Use your email provider's IMAP settings
   - Or use email forwarding to Chatwoot's email address

## Usage

### Accessing Chatwoot Dashboard

- **URL**: https://visual-tool-chatwoot.onrender.com
- **Login**: Use the admin account you created during setup

### Managing Conversations

1. **Live Chat**: Conversations appear in real-time in the dashboard
2. **Tickets**: Email conversations are converted to tickets
3. **Assignments**: Assign conversations to team members
4. **Labels**: Organize conversations with labels
5. **Canned Responses**: Create quick replies for common questions

### Adding Team Members

1. Go to Settings → Agents
2. Click "Add Agent"
3. Enter email and select role:
   - **Administrator**: Full access
   - **Agent**: Can handle conversations
4. Agent receives invitation email

### Creating Canned Responses

1. Go to Settings → Canned Responses
2. Click "Add Canned Response"
3. Create templates for common questions:
   - Greeting messages
   - FAQ answers
   - Closing messages

### Setting Up Automation

1. Go to Settings → Automation
2. Create rules for:
   - Auto-assignment based on keywords
   - Auto-responses for common queries
   - Escalation rules
   - SLA management

## Cost Breakdown

**Free Tier (Current Setup):**
- Chatwoot: Free (self-hosted)
- Upstash Redis: Free (10,000 commands/day)
- PostgreSQL: $7/month (Render Starter)
- Chatwoot Web Service: $7/month (Render Starter)
- **Total: $14/month**

**If you exceed Upstash free tier:**
- Upgrade to Render Redis: $7/month
- **Total: $21/month**

## Monitoring

### Health Check

Chatwoot includes a health check endpoint at `/` that Render monitors automatically.

### Logs

View logs in Render Dashboard:
1. Go to visual-tool-chatwoot service
2. Click "Logs" tab
3. Monitor for errors or issues

### Redis Usage

Monitor Upstash Redis usage:
1. Go to Upstash Dashboard
2. View metrics for your database
3. Check command count vs. free tier limit (10,000/day)

## Troubleshooting

### Chatwoot Not Loading

1. Check Render service status (should be green)
2. Check logs for errors
3. Verify all environment variables are set
4. Ensure database is running

### Redis Connection Issues

1. Verify `REDIS_URL` format is correct
2. Check `REDIS_PASSWORD` matches Upstash
3. Ensure Upstash database is active
4. Check Upstash dashboard for connection errors

### Email Not Sending

1. Verify `SMTP_PASSWORD` is your Resend API key
2. Check `MAILER_SENDER_EMAIL` is verified in Resend
3. View Resend dashboard for email logs
4. Check Chatwoot logs for SMTP errors

### Widget Not Appearing

1. Verify widget script is in your frontend HTML
2. Check `websiteToken` is correct
3. Ensure `baseUrl` points to your Chatwoot URL
4. Check browser console for JavaScript errors
5. Verify CORS settings in Chatwoot (Settings → Account → Domain)

### Slow Performance

1. Check Upstash Redis metrics (may be hitting limits)
2. Consider upgrading to Render Redis ($7/mo)
3. Upgrade Chatwoot service to Standard plan ($25/mo)
4. Optimize database queries

## Upgrading

### To Chatwoot Cloud ($19/mo)

If self-hosting becomes too much maintenance:

1. Sign up at https://www.chatwoot.com/
2. Export your data from self-hosted instance
3. Import to cloud instance
4. Update widget code in frontend
5. Decommission self-hosted services

### To Render Redis

If you exceed Upstash free tier:

1. Add Redis service in `render.yaml`:
```yaml
- type: redis
  name: chatwoot-redis
  plan: starter
  region: oregon
```

2. Update Chatwoot environment variables:
   - Remove `REDIS_URL` and `REDIS_PASSWORD`
   - Add `REDIS_URL` from Render Redis connection

## Support Resources

- **Chatwoot Docs**: https://www.chatwoot.com/docs
- **Chatwoot Community**: https://github.com/chatwoot/chatwoot/discussions
- **Upstash Docs**: https://docs.upstash.com/redis
- **Render Docs**: https://render.com/docs

## Security Best Practices

1. **Use strong passwords** for admin accounts
2. **Enable 2FA** for admin accounts (if available)
3. **Limit agent access** - only give access to necessary team members
4. **Regular backups** - Render provides automatic database backups
5. **Monitor logs** for suspicious activity
6. **Keep Chatwoot updated** - Pull latest Docker image periodically
7. **Use HTTPS only** - Render provides automatic SSL

## Next Steps

1. ✅ Deploy Chatwoot to Render
2. ✅ Set up Upstash Redis
3. ✅ Configure environment variables
4. ✅ Create admin account
5. ✅ Set up first inbox
6. ✅ Add widget to frontend
7. ⬜ Create canned responses
8. ⬜ Add team members
9. ⬜ Set up automation rules
10. ⬜ Configure email channel
11. ⬜ Train support team
12. ⬜ Monitor usage and performance
