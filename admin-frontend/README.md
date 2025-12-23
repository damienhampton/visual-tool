# Admin Frontend

Admin panel for the Visual Tool application. Built with React, TypeScript, Vite, and TailwindCSS.

## Features

- **Dashboard**: Real-time analytics and metrics
  - User statistics (total, active, growth rate)
  - Subscription metrics (MRR, ARR, churn rate)
  - Diagram statistics
  - Revenue and user growth charts
  - Top users and recent signups

- **User Management**
  - List, search, and filter users
  - View user details
  - Manual subscription overrides (Free/Pro/Team)
  - Grant/revoke admin access
  - Delete users

- **Subscription Management**
  - View all subscriptions
  - Filter by tier and status
  - Cancel subscriptions
  - View Stripe integration details

- **Diagram Management**
  - Browse all diagrams
  - Search by title
  - View diagram details
  - Delete diagrams

- **Audit Logs**
  - Track all admin actions
  - Filter by action type and target
  - View detailed metadata

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## First Admin User

To create your first admin user, you need to manually set the `isAdmin` flag in the database:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-admin@example.com';
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Charts and visualizations
- **Headless UI** - Accessible UI components
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── Layout.tsx   # Main layout with sidebar
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── lib/            # Utilities and API client
│   └── api.ts
├── pages/          # Page components
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Subscriptions.tsx
│   ├── Diagrams.tsx
│   ├── AuditLogs.tsx
│   └── Login.tsx
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## Authentication

The admin panel uses JWT authentication. Admin users must have `isAdmin: true` in the database. The auth token is stored in localStorage and automatically included in API requests.

## Deployment

For production deployment:

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production API URL
4. Set up a subdomain (e.g., admin.yourdomain.com)
5. Configure CORS on the backend to allow the admin domain

## Security Considerations

- Admin access is protected by JWT authentication
- All admin actions are logged in the audit log
- The backend validates admin status on every request
- Consider adding IP whitelisting for additional security
- Implement two-factor authentication for admin accounts (future enhancement)
