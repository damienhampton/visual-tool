# Admin System Quick Start Guide

## Prerequisites

- Backend server running on `http://localhost:3000`
- PostgreSQL database configured and running
- At least one user account created in the system

## Step 1: Create Your First Admin User

You need to manually grant admin access to a user in the database:

```sql
-- Connect to your PostgreSQL database
psql -U your_username -d your_database_name

-- Grant admin access to a user (replace with actual email)
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, name, "isAdmin" FROM users WHERE "isAdmin" = true;
```

## Step 2: Start the Admin Frontend

```bash
# Navigate to admin frontend directory
cd admin-frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The admin panel will be available at: `http://localhost:5173`

## Step 3: Login

1. Open `http://localhost:5173` in your browser
2. You'll be redirected to the login page
3. Enter your admin user credentials (email and password)
4. Click "Sign In"

If login is successful, you'll be redirected to the admin dashboard.

## Step 4: Explore the Admin Panel

### Dashboard (`/`)
- View real-time statistics
- See revenue and user growth charts
- Check top users and recent signups

### Users (`/users`)
- Browse all users
- Search by name or email
- Filter by type (All, Admins, Registered, Guests)
- Click the gear icon to manage a user:
  - Override subscription tier
  - Grant/revoke admin access
  - Delete user

### Subscriptions (`/subscriptions`)
- View all subscriptions
- Filter by status or tier
- Cancel active subscriptions

### Diagrams (`/diagrams`)
- Browse all diagrams
- Search by title
- Delete diagrams

### Audit Logs (`/audit-logs`)
- View all admin actions
- Filter by action type or target type
- See detailed metadata for each action

## Troubleshooting

### "Admin access required" error
- Ensure the user has `isAdmin = true` in the database
- Verify you're logged in with the correct account
- Check the JWT token is valid

### Cannot connect to backend
- Verify backend is running on `http://localhost:3000`
- Check `.env` file in `admin-frontend/` has correct `VITE_API_URL`
- Ensure CORS is configured properly in the backend

### Login fails
- Verify the user exists in the database
- Check the password is correct
- Ensure the user has `isAdmin = true`

## Environment Configuration

Create or update `admin-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

For production, update this to your production API URL.

## Testing Admin Features

### Test User Management
1. Go to Users page
2. Search for a user
3. Click the gear icon to open management modal
4. Try changing subscription tier (Free → Pro → Team)
5. Toggle admin access on/off
6. Check Audit Logs to see your actions logged

### Test Subscription Management
1. Create a test subscription (via main app or manual override)
2. Go to Subscriptions page
3. Filter by tier or status
4. Try canceling a subscription
5. Verify the change in the database

### Test Diagram Management
1. Create a test diagram (via main app)
2. Go to Diagrams page
3. Search for the diagram
4. Delete it
5. Check Audit Logs for the deletion record

## Production Deployment

### Backend
The admin module is already integrated. No additional deployment needed.

### Frontend
1. Build the admin frontend:
   ```bash
   cd admin-frontend
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting service

3. Set up subdomain (e.g., `admin.yourdomain.com`)

4. Configure production environment variables:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```

5. Update backend CORS to allow the admin subdomain

## Security Best Practices

1. **Use strong passwords** for admin accounts
2. **Limit admin access** to trusted personnel only
3. **Monitor audit logs** regularly for suspicious activity
4. **Use HTTPS** in production
5. **Consider IP whitelisting** for additional security
6. **Implement 2FA** for admin accounts (future enhancement)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the backend logs
3. Verify database connection
4. Review the PHASE4_SUMMARY.md for detailed documentation
