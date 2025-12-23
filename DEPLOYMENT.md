# Deployment Guide

This guide covers deploying the Visual Tool application to Render with automated CI/CD via CircleCI.

## Architecture Overview

- **Backend**: NestJS API with WebSocket support
- **Frontend**: React user-facing application
- **Admin Frontend**: React admin dashboard
- **Database**: PostgreSQL 16
- **CI/CD**: CircleCI for testing and deployment
- **Hosting**: Render

## Cost Breakdown

### Minimum Production Setup: $14/month
- Backend Web Service (Starter): $7/month
- PostgreSQL (Starter): $7/month
- Frontend Static Site: Free
- Admin Static Site: Free

### Recommended Production Setup: $27/month
- Backend Web Service (Starter): $7/month
- PostgreSQL (Standard): $20/month
- Frontend Static Site: Free
- Admin Static Site: Free

## Prerequisites

1. **GitHub Account** - Code repository
2. **Render Account** - Sign up at https://render.com
3. **CircleCI Account** - Sign up at https://circleci.com
4. **Render API Key** - Generate from Render Dashboard

## Initial Render Setup

### 1. Create Render Account and Connect GitHub

1. Go to https://render.com and sign up
2. Connect your GitHub account
3. Generate an API key:
   - Dashboard → Account Settings → API Keys
   - Create new API key
   - Save it securely (needed for CircleCI)

### 2. Deploy Using render.yaml (Blueprint)

The `render.yaml` file in the root directory defines all services.

**Option A: Deploy via Render Dashboard (Recommended for first deployment)**

1. Go to Render Dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show all services
5. Review the configuration
6. Click "Apply"

**Option B: Deploy via Render CLI**

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render blueprint launch
```

### 3. Configure Environment Variables

After initial deployment, add sensitive environment variables in Render Dashboard:

**Backend Service** (`visual-tool-backend`):
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `STRIPE_PRO_PRICE_ID`: Stripe Pro plan price ID
- `STRIPE_TEAM_PRICE_ID`: Stripe Team plan price ID
- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Your sender email address

**Frontend Service** (`visual-tool-frontend`):
- `VITE_API_URL`: Update to your backend URL (e.g., `https://visual-tool-backend.onrender.com`)

**Admin Service** (`visual-tool-admin`):
- `VITE_API_URL`: Update to your backend URL (e.g., `https://visual-tool-backend.onrender.com`)

### 4. Update Service Names (Optional)

If you want different service names, update `render.yaml`:
- Change `name:` fields for each service
- Update `VITE_API_URL` values to match your backend service name
- Update `APP_URL` in backend to match your frontend service name

### 5. Configure Custom Domains (Optional)

1. Go to each service in Render Dashboard
2. Click "Settings" → "Custom Domain"
3. Add your domain and follow DNS instructions

## CircleCI Setup

### 1. Connect Repository to CircleCI

1. Go to https://circleci.com
2. Sign up/login with GitHub
3. Click "Projects" → "Set Up Project"
4. Select your repository
5. CircleCI will detect `.circleci/config.yml`
6. Click "Set Up Project"

### 2. Add Environment Variables to CircleCI

Go to Project Settings → Environment Variables and add:

**Required:**
- `RENDER_API_KEY`: Your Render API key
- `RENDER_BACKEND_SERVICE_ID`: Backend service ID from Render
- `RENDER_FRONTEND_SERVICE_ID`: Frontend service ID from Render
- `RENDER_ADMIN_SERVICE_ID`: Admin service ID from Render

**To find Service IDs:**
1. Go to Render Dashboard
2. Click on a service
3. Service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXX`
4. Copy the `srv-XXXXX` part

### 3. Verify CircleCI Pipeline

1. Push a commit to `main` branch
2. CircleCI will automatically:
   - Run backend tests (unit + e2e)
   - Run frontend linting and build
   - Run admin linting and build
   - Deploy to Render (only on `main` or `production` branches)

## Deployment Workflow

### Automatic Deployment (via CircleCI)

1. Push code to `main` or `production` branch
2. CircleCI runs all tests
3. If tests pass, CircleCI triggers Render deployment
4. Render rebuilds and deploys all services

### Manual Deployment (via Render Dashboard)

1. Go to Render Dashboard
2. Select a service
3. Click "Manual Deploy" → "Deploy latest commit"

### Manual Deployment (via Render API)

```bash
# Backend
curl -X POST \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  "https://api.render.com/v1/services/YOUR_BACKEND_SERVICE_ID/deploys"

# Frontend
curl -X POST \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  "https://api.render.com/v1/services/YOUR_FRONTEND_SERVICE_ID/deploys"

# Admin
curl -X POST \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  "https://api.render.com/v1/services/YOUR_ADMIN_SERVICE_ID/deploys"
```

## Database Management

### Accessing the Database

**Via Render Dashboard:**
1. Go to your database service
2. Click "Connect" → "External Connection"
3. Use provided connection string with any PostgreSQL client

**Connection String Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Running Migrations

Migrations run automatically on backend deployment via TypeORM's `synchronize` option.

**For production, disable auto-sync and use migrations:**

1. Update `backend/src/app.module.ts`:
```typescript
synchronize: false, // Change from true
migrations: ['dist/migrations/*.js'],
migrationsRun: true,
```

2. Generate migrations:
```bash
cd backend
npm run typeorm migration:generate -- -n MigrationName
```

3. Migrations will run automatically on next deployment

### Database Backups

- **Starter Plan**: 4-day backup retention
- **Standard Plan**: 7-day backup retention
- **Pro Plans**: 14-30 day retention

Restore from Render Dashboard → Database → Backups

## Monitoring and Logs

### View Logs

**Render Dashboard:**
1. Go to service
2. Click "Logs" tab
3. Real-time logs with filtering

**Render CLI:**
```bash
render logs -s visual-tool-backend
render logs -s visual-tool-frontend
render logs -s visual-tool-admin
```

### Health Checks

Backend includes health check at `/` endpoint. Render automatically monitors it.

### Metrics

Available in Render Dashboard:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

## Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.onrender.com/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret
5. Add to Render environment variables as `STRIPE_WEBHOOK_SECRET`

## Email Configuration (Resend)

1. Sign up at https://resend.com
2. Verify your domain
3. Generate API key
4. Add to Render environment variables:
   - `RESEND_API_KEY`
   - `FROM_EMAIL` (must be from verified domain)

## Troubleshooting

### Build Failures

**Check build logs in Render Dashboard:**
- Ensure all dependencies are in `package.json`
- Verify build commands in `render.yaml`
- Check for TypeScript errors

**Common fixes:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

**Verify environment variables:**
- Check `DATABASE_*` variables in backend service
- Ensure database is in same region as backend
- Check database is running (green status)

### WebSocket Connection Issues

**Ensure proper CORS configuration:**
- Backend must allow frontend origin
- Check `APP_URL` environment variable
- Verify WebSocket port is not blocked

### Deployment Not Triggering

**CircleCI:**
- Check CircleCI build status
- Verify all tests pass
- Check environment variables are set
- Ensure branch is `main` or `production`

**Render:**
- Check auto-deploy is enabled
- Verify webhook is configured
- Check service status

## Scaling

### Vertical Scaling (More Resources)

Upgrade service plans in Render Dashboard:
- **Backend**: Starter → Standard → Pro
- **Database**: Starter → Standard → Pro

### Horizontal Scaling (More Instances)

Available on Pro plans and above:
1. Go to service settings
2. Increase instance count
3. Render handles load balancing automatically

### Database Scaling

1. Upgrade database plan
2. For major upgrades, may require migration:
   - Create new database
   - Dump and restore data
   - Update connection string

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate API keys** regularly
3. **Use strong JWT secrets** - Let Render generate them
4. **Enable HTTPS only** - Render provides free SSL
5. **Set up IP allowlisting** for admin dashboard (optional)
6. **Monitor logs** for suspicious activity
7. **Keep dependencies updated** - Run `npm audit` regularly

## Rollback Procedure

### Via Render Dashboard

1. Go to service
2. Click "Deploys" tab
3. Find previous successful deploy
4. Click "Rollback to this version"

### Via Git

1. Revert commit:
```bash
git revert HEAD
git push origin main
```

2. CircleCI will automatically deploy reverted version

## Cost Optimization

### Development/Staging Environment

Create separate services with free/starter plans:
- Use free PostgreSQL for staging (if available)
- Use Render preview environments for PRs
- Spin down services when not in use

### Production Optimization

- Monitor usage in Render Dashboard
- Upgrade only services that need it
- Use CDN for static assets (Render includes this)
- Optimize database queries to reduce load

## Support and Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **CircleCI Docs**: https://circleci.com/docs
- **Render Community**: https://community.render.com

## Quick Reference

### Service URLs (Update with your actual URLs)

- **Backend**: https://visual-tool-backend.onrender.com
- **Frontend**: https://visual-tool-frontend.onrender.com
- **Admin**: https://visual-tool-admin.onrender.com

### Important Files

- `render.yaml` - Render service configuration
- `.circleci/config.yml` - CI/CD pipeline
- `backend/.env.example` - Environment variable template
- `docker-compose.yml` - Local development setup

### Common Commands

```bash
# Local development
docker-compose up -d

# Run tests
cd backend && npm test
cd backend && npm run test:e2e

# Build for production
cd backend && npm run build
cd frontend && npm run build
cd admin-frontend && npm run build

# View Render logs
render logs -s visual-tool-backend --tail

# Trigger manual deploy
render deploy -s visual-tool-backend
```
