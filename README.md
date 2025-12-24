# Visual Tool - C4 Diagramming Application

A collaborative diagramming tool for creating C4 model architecture diagrams with real-time collaboration, version control, and subscription-based access.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 16.x
- **npm** or **yarn**
- **Docker** (optional, for local database)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd visual-tool
   ```

2. **Start PostgreSQL database**
   ```bash
   docker-compose up -d postgres
   ```

3. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run start:dev
   ```

4. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with VITE_API_URL=http://localhost:3000
   npm run dev
   ```

5. **Set up Admin Frontend** (optional)
   ```bash
   cd admin-frontend
   npm install
   cp .env.example .env
   # Edit .env with VITE_API_URL=http://localhost:3000
   npm run dev
   ```

6. **Set up Marketing Site** (optional)
   ```bash
   cd marketing-site
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```

### Access the Applications

- **Frontend (User App)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Panel**: http://localhost:5174
- **Marketing Site**: http://localhost:3001

## 📁 Project Structure

```
visual-tool/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── diagrams/    # Diagram management
│   │   ├── collaboration/ # Real-time WebSocket collaboration
│   │   ├── subscriptions/ # Stripe billing integration
│   │   └── admin/       # Admin operations
│   └── test/            # E2E and unit tests
│
├── frontend/            # React user-facing application
│   └── src/
│       ├── components/  # UI components
│       ├── contexts/    # React contexts (Auth, Collaboration)
│       └── hooks/       # Custom React hooks
│
├── admin-frontend/      # React admin dashboard
│   └── src/
│       ├── pages/       # Dashboard, Users, Subscriptions, etc.
│       └── components/  # Admin UI components
│
├── marketing-site/      # Next.js marketing website
│   └── app/
│       ├── blog/        # MDX blog posts
│       └── pricing/     # Pricing page
│
├── chatwoot/           # Customer support setup
│   ├── Dockerfile
│   └── README.md
│
├── docs/               # Documentation
│   ├── LAUNCH.md       # Pre-launch checklist
│   ├── DEPLOYMENT.md   # Deployment guide
│   ├── TESTING.md      # Testing strategy
│   ├── STRIPE_BILLING.md # Stripe integration guide
│   ├── ADMIN_QUICKSTART.md # Admin panel setup
│   ├── ADMIN_USER_MANAGEMENT.md # User management guide
│   ├── CHATWOOT_SETUP.md # Customer support setup
│   ├── PASSWORD_RESET_AND_INVITATIONS.md # Password reset flow
│   └── PHASE4_SUMMARY.md # Phase 4 completion summary
│
├── PLANNING.md         # Project planning and roadmap
└── README.md           # This file
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL 16 with TypeORM
- **Real-time**: Socket.io + Yjs (CRDT)
- **Authentication**: JWT + Passport.js
- **Payments**: Stripe
- **Email**: Resend

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Diagramming**: React Flow
- **Styling**: TailwindCSS
- **State Management**: React Context + React Query
- **Real-time**: Socket.io-client + Yjs

### Admin
- **Framework**: React 18 + TypeScript
- **UI**: TailwindCSS + Headless UI
- **Charts**: Recharts
- **Data Fetching**: TanStack Query

### Marketing
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Content**: MDX for blog posts
- **Analytics**: Google Analytics

### DevOps
- **CI/CD**: CircleCI
- **Hosting**: Render (backend, frontend, admin) + Vercel (marketing)
- **Database**: PostgreSQL on Render
- **Support**: Chatwoot (self-hosted)

## 🔧 Development

### Running Tests

**Backend Tests:**
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

**Frontend Tests:**
```bash
cd frontend

# Run tests
npm run test

# Watch mode
npm run test:watch
```

### Database Migrations

```bash
cd backend

# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Code Quality

```bash
# Lint backend
cd backend && npm run lint

# Lint frontend
cd frontend && npm run lint

# Lint admin
cd admin-frontend && npm run lint

# Format code (if configured)
npm run format
```

## 🎯 Key Features

### User Features
- **C4 Model Diagrams**: Create System Context, Container, Component, and Code diagrams
- **Real-time Collaboration**: Multiple users can edit diagrams simultaneously
- **Version History**: Track changes and restore previous versions
- **Sharing**: Share diagrams with view-only or edit access
- **Export**: Export diagrams as PNG, SVG, or JSON

### Subscription Tiers

**Free Tier**
- 3 diagrams maximum
- Guest collaboration (view-only)
- Basic export (PNG)

**Pro Tier** ($9/month)
- Unlimited diagrams
- Unlimited collaborators
- Real-time collaboration
- Version history (30 days)
- Advanced exports (SVG, JSON)

**Team Tier** ($29/month)
- Everything in Pro
- Team workspaces
- Admin controls
- Version history (unlimited)
- API access

### Admin Features
- Real-time dashboard with analytics
- User management (view, edit, delete)
- Subscription management (upgrade, cancel, refund)
- Diagram management (view, delete)
- Audit logging for all admin actions

## 🔐 Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=visual_tool
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
```

### Admin (.env)
```bash
VITE_API_URL=http://localhost:3000
```

### Marketing (.env.local)
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

## 📚 Documentation

- **[LAUNCH.md](./docs/LAUNCH.md)** - Complete pre-launch checklist and deployment guide
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Detailed deployment instructions for Render and Vercel
- **[PLANNING.md](./PLANNING.md)** - Project planning, roadmap, and feature tracking
- **[TESTING.md](./docs/TESTING.md)** - Testing strategy and guidelines
- **[STRIPE_BILLING.md](./docs/STRIPE_BILLING.md)** - Stripe integration guide
- **[ADMIN_QUICKSTART.md](./docs/ADMIN_QUICKSTART.md)** - Admin panel setup guide
- **[ADMIN_USER_MANAGEMENT.md](./docs/ADMIN_USER_MANAGEMENT.md)** - User management guide
- **[PASSWORD_RESET_AND_INVITATIONS.md](./docs/PASSWORD_RESET_AND_INVITATIONS.md)** - Password reset and invitation flow
- **[CHATWOOT_SETUP.md](./docs/CHATWOOT_SETUP.md)** - Customer support setup

## 🚢 Deployment

### Quick Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Deploy using `render.yaml` blueprint
4. Configure environment variables
5. Set up custom domains

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

### Deploy Marketing Site to Vercel

1. Connect repository to Vercel
2. Set root directory to `marketing-site`
3. Add environment variables
4. Deploy automatically on push to main

## 🧪 Testing Status

**Backend:** 52/58 tests passing (90%)
- ✅ Auth flow (15/15)
- ✅ Diagram CRUD (19/19)
- ✅ WebSocket collaboration (18/18)
- 🟡 Subscriptions (6/13) - TypeORM/SQLite issues
- 🟡 Admin (26/37) - TypeORM/SQLite issues

**Frontend:** Minimal coverage
- ✅ Test infrastructure set up
- 🟡 Component tests needed

## 🐛 Known Issues

1. **WebSocket State**: In-memory state prevents horizontal scaling (needs Redis adapter)
2. **Database Sync**: `synchronize: true` in production is risky (needs proper migrations)
3. **Test Failures**: Some E2E tests fail due to TypeORM/SQLite compatibility

See [PLANNING.md](./PLANNING.md) and [LAUNCH.md](./docs/LAUNCH.md) for detailed issue tracking and solutions.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

### Coding Standards

- Use TypeScript for type safety
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📊 Project Status

**Current Phase:** Pre-Launch

**Completed:**
- ✅ MVP with basic diagramming
- ✅ Real-time collaboration
- ✅ Stripe subscriptions
- ✅ Admin dashboard
- ✅ Marketing site
- ✅ Customer support setup (Chatwoot)
- ✅ CI/CD pipeline

**In Progress:**
- 🔄 Pre-launch checklist (see LAUNCH.md)
- 🔄 Test coverage improvements
- 🔄 Performance optimization

**Next Steps:**
- Finalize product name and domain
- Deploy to production
- Set up monitoring and analytics
- Launch to public

## 💰 Cost Estimate

**Development:** Free (local)

**Production (Minimum):** ~$14-21/month
- Render Backend: $7/month
- PostgreSQL: $7/month
- Chatwoot DB: $7/month
- Static sites: Free
- Vercel: Free tier

See [LAUNCH.md](./docs/LAUNCH.md) for detailed cost breakdown.

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: See `/docs` folder
- **Email**: (to be configured)

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- UI powered by [React](https://react.dev/)
- Diagramming with [React Flow](https://reactflow.dev/)
- Real-time collaboration with [Yjs](https://yjs.dev/)
- Payments by [Stripe](https://stripe.com/)

---

**Last Updated:** December 24, 2024
