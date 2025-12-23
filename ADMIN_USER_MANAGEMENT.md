# Admin User Management Guide

## Manual Subscription Upgrade/Downgrade

The admin app now supports manually upgrading or downgrading user accounts without requiring payment. This is useful for:
- Giving out free Pro/Team accounts for testing
- Rewarding users or partners
- Handling support cases
- Testing subscription features

## How to Use

### Access User Management
1. Log into the admin app at `http://localhost:5174` (or your admin domain)
2. Navigate to the "Users" section from the sidebar
3. Browse or search for the user you want to manage

### Upgrade/Downgrade a User
1. Click the **User Settings** icon (⚙️) next to the user in the table
2. A modal will open showing:
   - User's name and email
   - **Current subscription status** (FREE, PRO, or TEAM with status)
   - Manual subscription override buttons
   - Admin access toggle

3. Click one of the subscription tier buttons:
   - **Free**: Removes any active subscription (downgrades to free tier)
   - **Pro**: Grants Pro tier access ($9/month features)
   - **Team**: Grants Team tier access ($29/month features)

4. Confirm the action in the popup dialog
5. The subscription will be updated immediately

### Features Included

**Free Tier:**
- 3 diagrams maximum
- Guest collaboration (view-only)
- Basic export (PNG)

**Pro Tier:**
- Unlimited diagrams
- Unlimited collaborators
- Real-time collaboration
- Version history (30 days)
- Advanced exports (SVG, JSON)

**Team Tier:**
- Everything in Pro
- Team workspaces
- Admin controls
- Version history (unlimited)
- API access

## Backend Implementation

The feature is implemented via:
- **Endpoint**: `POST /admin/users/:id/subscription-override`
- **Controller**: `backend/src/admin/admin.controller.ts:125-140`
- **Service**: `backend/src/admin/admin.service.ts:332-362`
- **Frontend**: `admin-frontend/src/pages/Users.tsx`

### How It Works

1. When you set a user to **Free**, it removes their subscription record entirely
2. When you set a user to **Pro** or **Team**:
   - Creates or updates their subscription record
   - Sets status to `ACTIVE`
   - Uses `manual_override` as the Stripe customer/subscription ID
   - This bypasses Stripe payment processing

### Audit Logging

All subscription overrides are logged in the audit log with:
- Admin who made the change
- User affected
- New tier assigned
- Timestamp

You can view these in the "Audit Logs" section of the admin app.

## Notes

- Manual overrides do NOT create Stripe subscriptions
- Users with manual overrides will not be charged
- The subscription will remain active until manually changed again
- Manual overrides are marked with `stripeCustomerId: 'manual_override'`
- These subscriptions won't appear in Stripe dashboard
