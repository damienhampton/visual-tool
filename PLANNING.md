# Planning

## Background and context

I really like Miro as a diagramming too, but I have a few issues with it:
- I want better alignment and structuring options
- I specifically want to be able to create C4 model diagrams
- I want to create hierachical C4 diagrams (e.g. System Context -> Container -> Component -> Code)
- I want to be able to version control my diagrams alongside my code
- I want to be able to generate diagrams from code (e.g. terraform, architecture decision records, etc)
_ I like Structurizr, but it's not a great tool for free-form diagramming

Basically:
- The ease of use of Miro
- The version control and code generation of Structurizr

## Research

1. **Target platform**: Are you envisioning this as a web app, desktop app (Electron), or both?

   ✅ **Decision**: Web app

2. **Tech stack preferences**: Do you have any preferences for frontend framework (React, Vue, Svelte, etc.) or canvas/diagramming libraries (e.g., Fabric.js, Konva, React Flow, tldraw)?

   ### Canvas Library Comparison

   #### Fabric.js
   **Pros:**
   - Mature, battle-tested (10+ years)
   - Excellent object manipulation (select, move, resize, rotate with handles)
   - Built-in serialization to JSON (great for version control)
   - Rich text support, image filters, SVG import/export
   - Large community, good documentation

   **Cons:**
   - Not React-native (requires wrapper/imperative code)
   - Can feel heavy for simple use cases
   - Less suited for node-and-edge diagrams out of the box

   #### Konva
   **Pros:**
   - High-performance canvas rendering with layering system
   - Official React bindings (`react-konva`)
   - Good for complex scenes with many objects
   - Supports animations, transitions, caching
   - JSON serialization built-in

   **Cons:**
   - Lower-level than Fabric (you build more yourself)
   - No built-in connector/edge system for diagrams
   - Less rich object manipulation UI out of the box

   #### React Flow
   **Pros:**
   - Purpose-built for node-based diagrams (flowcharts, architecture diagrams)
   - Native React, declarative API
   - Built-in edges/connectors with routing
   - Handles, minimap, controls, zoom/pan included
   - Active development, good TypeScript support
   - Nodes can contain any React component

   **Cons:**
   - Focused on node graphs—less suited for free-form drawing
   - Customizing edge routing can be tricky
   - Not ideal for arbitrary shapes or image editing

   #### tldraw
   **Pros:**
   - Closest to Miro's UX (free-form whiteboard feel)
   - Modern React architecture, excellent DX
   - Built-in shapes, connectors, selection, undo/redo
   - Collaborative-ready (CRDT-based)
   - Open source with permissive license
   - JSON-based document format (git-friendly)

   **Cons:**
   - Younger project (less battle-tested)
   - Opinionated—customizing deeply may fight the framework
   - Node-based diagramming requires more custom work than React Flow

   #### Recommendation Summary

   | Requirement | Best fit |
   |-------------|----------|
   | Miro-like ease of use | **tldraw** |
   | C4 diagrams (nodes + connectors) | **React Flow** or tldraw |
   | Version control (JSON files) | All support this |
   | Hierarchical drill-down | Custom work needed in any |
   | Code generation/import | Custom work needed in any |

   **Suggestion**: tldraw if you want the Miro feel with free-form diagramming + custom C4 shapes; React Flow if you want a more structured node-graph approach with less free-form drawing.

   **Note on licensing**: tldraw requires $6,000/year for commercial use without watermark. React Flow is MIT licensed (free).

   ✅ **Decision**: React + React Flow (MIT licensed, purpose-built for node diagrams)

3. **Storage/version control approach**: 
   - Should diagrams be saved as JSON/YAML files that can be committed to git?
   - Do you want a local-first approach, or cloud storage with git integration?

   ✅ **Decision**: Phased approach:
   1. Browser storage (localStorage/IndexedDB) first
   2. Add cloud storage
   3. Add export to JSON/YAML + git integration

4. **C4 model specifics**:
   - Do you want strict C4 element types (Person, Software System, Container, Component, Code)?
   - Should the hierarchical navigation be drill-down (click a System to see its Containers) or side-by-side views?

   ✅ **Decision**: Strict C4 element types. Phased approach:
   1. Individual diagrams (System Context, Container, Component, Code as separate views)
   2. Drill-down navigation between levels
   3. Side-by-side views or similar

5. **Code generation priority**: Which integrations matter most initially?
   - Import from Terraform
   - Import from ADRs
   - Export to Structurizr DSL
   - Other (OpenAPI, CloudFormation, etc.)

   ✅ **Decision**: Defer for now. Focus on a sensible semantic data model that can be translated to IaC formats later.

6. **MVP scope**: What's the minimum you'd want for a first usable version? For example:
   - Basic canvas with C4 shapes + connectors
   - Save/load to local JSON files
   - One level of hierarchy

   ✅ **Decision**: MVP includes:
   - Full window canvas with ability to place shapes
   - Add text to shapes
   - Save structure to localStorage

   **Future scope:**
   - Detailed object types (e.g. AWS resources)
   - Object colours, linking
   - User accounts (register/login)
   - Cloud storage

   **Tech stack:**
   - Frontend: React + React Flow
   - Backend: NestJS

7. **Alignment/structuring features**: Can you elaborate on what "better alignment and structuring" means to you? Auto-layout, snap-to-grid, grouping, templates?

   ✅ **Decision**: Snap-to-grid, auto-layout, grouping. Templates deferred for later.

---

## Data Model Design

### Database Schema

#### User
```typescript
{
  id: uuid (PK)
  email?: string (unique, nullable for guests)
  name: string
  passwordHash?: string (nullable for guests)
  isGuest: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Diagram
```typescript
{
  id: uuid (PK)
  title: string
  ownerId: uuid (FK -> User)
  shareToken: string (unique, for guest access)
  isPublic: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### DiagramVersion
```typescript
{
  id: uuid (PK)
  diagramId: uuid (FK -> Diagram)
  version: int
  data: jsonb // Full React Flow state (nodes, edges, viewport)
  createdAt: timestamp
  createdBy: uuid (FK -> User)
}
```

#### DiagramCollaborator
```typescript
{
  id: uuid (PK)
  diagramId: uuid (FK -> Diagram)
  userId: uuid (FK -> User)
  role: enum ('owner', 'editor', 'viewer')
  addedAt: timestamp
}
```

#### ActiveSession (Redis or in-memory)
```typescript
{
  sessionId: uuid
  diagramId: uuid
  userId: uuid
  userName: string
  cursor: { x: number, y: number }
  color: string
  lastSeen: timestamp
}
```

### Diagram Data Structure (JSONB)

Stored in `DiagramVersion.data`:

```typescript
{
  nodes: [
    {
      id: string
      type: 'c4Node'
      position: { x: number, y: number }
      data: {
        label: string
        description?: string
        type: 'person' | 'softwareSystem' | 'container' | 'component'
        color?: string // For future customization
        metadata?: Record<string, any> // Extensible for AWS resources, etc.
      }
    }
  ],
  edges: [
    {
      id: string
      source: string // node id
      target: string // node id
      label?: string
      type?: string
      animated?: boolean
      style?: Record<string, any>
    }
  ],
  viewport: { 
    x: number, 
    y: number, 
    zoom: number 
  }
}
```

### API Endpoints (Planned)

**Auth:**
- `POST /auth/register` - Create user account
- `POST /auth/login` - Login with email/password
- `POST /auth/guest` - Create guest user
- `GET /auth/me` - Get current user

**Diagrams:**
- `POST /diagrams` - Create new diagram
- `GET /diagrams` - List user's diagrams
- `GET /diagrams/:id` - Get diagram by ID
- `PUT /diagrams/:id` - Update diagram metadata
- `DELETE /diagrams/:id` - Delete diagram
- `POST /diagrams/:id/share` - Generate/regenerate share token
- `GET /diagrams/shared/:token` - Access diagram via share token

**Collaboration:**
- `WebSocket /collaboration/:diagramId` - Real-time sync
- `GET /diagrams/:id/collaborators` - List collaborators
- `POST /diagrams/:id/collaborators` - Add collaborator
- `DELETE /diagrams/:id/collaborators/:userId` - Remove collaborator

---

## Task List

### Phase 1: MVP ✅ COMPLETE
- [x] Project setup (React + Vite + TypeScript)
- [x] Install and configure React Flow
- [x] Full-window canvas component
- [x] Basic shape palette (C4 elements: Person, Software System, Container, Component)
- [x] Drag shapes onto canvas
- [x] Add/edit text on shapes
- [x] Save diagram to localStorage
- [x] Load diagram from localStorage
- [x] Basic styling (clean, modern UI)

### Phase 2: Real-Time Collaboration ✅ COMPLETE

#### Tech Stack
- **Backend**: NestJS + WebSockets (socket.io) + Yjs + PostgreSQL
- **Frontend**: Socket.io-client + Yjs + React Flow integration
- **Auth**: JWT + Passport.js (with guest access support)

#### Tasks
- [x] Backend setup
  - [x] NestJS project initialization
  - [x] PostgreSQL database setup
  - [x] Database schema and migrations (User, Diagram, DiagramVersion, DiagramCollaborator)
  - [x] WebSocket gateway with socket.io
  - [x] Yjs WebSocket provider integration (server-side support)
- [x] Authentication
  - [x] User registration/login (JWT)
  - [x] Guest user creation with diagram links
  - [x] Share token generation for diagrams
  - [x] Auth guards and middleware
  - [x] WebSocket JWT authentication
- [x] Diagram persistence
  - [x] Save diagram API endpoint
  - [x] Load diagram API endpoint
  - [x] Diagram versioning/snapshots
  - [x] List user's diagrams
  - [x] Update diagram endpoint
  - [x] Delete diagram endpoint
- [x] Real-time collaboration
  - [x] Yjs document synchronization (WebSocket events)
  - [x] Multi-user editing support (room-based)
  - [x] Cursor position broadcasting
  - [x] User presence indicators (active users list)
  - [x] Cursor rendering with user colors/names
- [x] Sharing & permissions
  - [x] Generate shareable links
  - [x] Permission levels (owner, editor, viewer)
  - [x] Guest access via share token
  - [x] Diagram access control
  - [x] Collaborator management endpoints
- [x] Frontend integration
  - [x] Socket.io client setup
  - [x] WebSocket connection management hook
  - [x] Connect to WebSocket server
  - [x] Implement cursor rendering
  - [x] User presence UI
  - [x] Diagram list/selection UI
  - [x] Authentication UI (login/register/guest)
  - [x] Auto-save diagrams with debouncing

### Phase 3: Subscriptions & Payments ✅ COMPLETE

#### Payment Provider: Stripe
- **Why Stripe**: Best developer experience, comprehensive subscription features, excellent TypeScript/NestJS support
- **Pricing**: 2.9% + $0.30 per transaction, no monthly fees
- **Key Features**: Recurring billing, customer portal, webhooks, test mode, PCI compliance

#### Subscription Tiers
**Free Tier**
- 3 diagrams maximum
- Guest collaboration (view-only)
- Basic export (PNG)
- Community support

**Pro Tier** ($9/month)
- Unlimited diagrams
- Unlimited collaborators
- Real-time collaboration
- Version history (30 days)
- Priority support
- Advanced exports (SVG, JSON)

**Team Tier** ($29/month)
- Everything in Pro
- Team workspaces
- Admin controls
- Version history (unlimited)
- API access
- SSO (future)

#### Tasks
- [x] Backend integration
  - [x] Install Stripe SDK and NestJS Stripe module
  - [x] Create subscription entity and migrations
  - [x] Implement Stripe webhook handlers (payment success, failure, cancellation)
  - [x] Add subscription status checks to diagram endpoints
  - [x] Create subscription management endpoints (create, cancel, update)
  - [x] Implement usage limits (diagram count, collaborator limits)
- [x] Frontend integration
  - [x] Create pricing page component
  - [x] Integrate Stripe Checkout
  - [x] Build subscription management UI (subscription banner)
  - [x] Add upgrade prompts when limits reached
  - [x] Display current plan and usage
  - [x] Implement billing portal link
- [x] Business logic
  - [x] Enforce free tier limits (3 diagrams)
  - [x] Handle subscription lifecycle (trial, active, past_due, canceled)
  - [x] Implement grace periods for failed payments (via webhook handlers)
  - [ ] Add promo code support (future enhancement)
  - [ ] Create admin dashboard for subscription metrics (future enhancement)

#### Alternative Considered
- **Paddle**: Merchant of Record model, handles tax compliance, but higher fees (5% + payment fees) and less flexible

### Phase 4: Admin System & Analytics (PRIORITY)

#### Architecture Decision: Same Backend with Admin Module
**Why:** Shared database access, code reuse, simpler deployment, real-time data, cost-effective

**Structure:**
- Backend: Add admin module to existing NestJS backend
- Frontend: Separate React admin app (admin.yourdomain.com)
- Security: Role-based access control with AdminGuard
- Database: Reuse existing entities and services

#### Core Features

**1. Dashboard & Real-time Analytics**
- User metrics (total, active today/week, growth rate)
- Subscription metrics (free vs paid, MRR, churn rate)
- Diagram statistics (total, created today, average per user)
- Revenue charts (daily, weekly, monthly trends)
- Top users by activity
- Recent signups and upgrades

**2. User Management**
- View all users (paginated, searchable, filterable)
- User details (email, name, signup date, last active, diagrams count)
- Manual subscription override (grant Pro/Team for support/testing)
- Ban/unban users
- Impersonate user (view app as user for support)
- Reset user password
- Delete user account (with confirmation)
- Export user list to CSV

**3. Subscription Management**
- View all subscriptions (filter by tier, status, date range)
- Subscription details (Stripe customer ID, payment history, invoices)
- Manual tier changes (upgrade/downgrade without payment)
- Cancel subscription with reason tracking
- Refund payment (via Stripe API)
- View failed payments and retry history
- Generate and manage promo codes
- Subscription lifecycle reports

**4. Diagram Management**
- Browse all diagrams (with thumbnails/previews)
- Search diagrams by title, owner, or content
- View diagram details (nodes, edges, collaborators)
- Delete inappropriate/spam diagrams
- Export diagram data (JSON)
- View collaboration activity and history
- Diagram usage analytics

**5. Reports & Exports**
- User growth report (signups over time)
- Revenue report (MRR, ARR, churn)
- Subscription conversion funnel
- Diagram creation trends
- Collaboration activity report
- Custom date range filtering
- CSV/Excel export for all reports

**6. System Health & Monitoring**
- Database connection status
- API response times and latency
- Recent error logs with stack traces
- Stripe webhook delivery status
- Background job queue status
- Server resource usage (CPU, memory)

#### Backend Tasks ✅ COMPLETE
- [x] Add `isAdmin` boolean field to User entity
- [x] Create database migration for admin field
- [x] Create AdminGuard for role-based access control
- [x] Create AdminModule with controller and service
- [x] Implement dashboard stats endpoints
  - [x] User statistics (count, growth, active users)
  - [x] Subscription metrics (MRR, churn, conversions)
  - [x] Diagram statistics (total, growth, per user)
  - [x] Revenue analytics (daily, weekly, monthly)
- [x] Implement user management endpoints
  - [x] List users (paginated, searchable, filterable)
  - [x] Get user details with related data
  - [x] Update user (email, name, admin status)
  - [x] Delete user (cascade delete related data)
  - [x] Manual subscription override
- [x] Implement subscription management endpoints
  - [x] List subscriptions with filters
  - [x] Get subscription details with Stripe data
  - [x] Cancel subscription
- [x] Implement diagram management endpoints
  - [x] List diagrams with pagination and search
  - [x] Get diagram details
  - [x] Delete diagram
- [x] Implement reports endpoints
  - [x] User growth report
  - [x] Revenue report
- [x] Add audit logging for admin actions
  - [x] Create AuditLog entity
  - [x] Log all admin actions (who, what, when)
  - [x] Audit log viewer endpoint

#### Frontend Tasks ✅ COMPLETE
- [x] Set up separate admin React app
  - [x] Initialize React + TypeScript + Vite
  - [x] Configure TailwindCSS
  - [x] Set up React Router
  - [x] Configure API client
- [x] Create admin authentication
  - [x] Admin login page
  - [x] Admin auth context
  - [x] Protected routes
- [x] Build dashboard page
  - [x] Real-time stats cards (users, subscriptions, revenue)
  - [x] Revenue chart (line/bar chart)
  - [x] User growth chart
  - [x] Recent activity feed (top users, recent signups)
- [x] Build user management UI
  - [x] User list table (sortable, filterable)
  - [x] User search and filters
  - [x] User detail modal
  - [x] Delete user confirmation
  - [x] Manual subscription override form
- [x] Build subscription management UI
  - [x] Subscription list table
  - [x] Subscription filters (tier, status, date)
  - [x] Cancel subscription dialog
- [x] Build diagram management UI
  - [x] Diagram browser
  - [x] Diagram search and filters
  - [x] Delete diagram confirmation
- [x] Build audit log viewer
  - [x] Audit log table
  - [x] Filter by user, action, date
  - [x] Detail view for each action
- [x] Implement admin navigation and layout
  - [x] Sidebar navigation
  - [x] Header with user info
  - [x] Responsive design

#### Security & Deployment
- [x] Set up admin authentication flow with JWT
- [x] Configure CORS for admin app (backend ready)
- [x] Add admin-specific environment variables
- [ ] Configure admin subdomain (admin.yourdomain.com) - deployment step
- [ ] Add first admin user to seed data - manual SQL step documented
- [ ] Set up separate deployment for admin frontend - deployment step
- [ ] Add IP whitelist for admin access (optional)
- [ ] Implement two-factor authentication for admins (optional)
- [ ] Set up admin session timeout (shorter than regular users) (optional)

#### Technology Stack
- **Backend**: NestJS admin module (same backend)
- **Frontend**: React + TypeScript + Vite
- **UI**: TailwindCSS + Headless UI
- **Charts**: Recharts or Chart.js
- **Tables**: TanStack Table (React Table v8)
- **State Management**: React Query
- **Forms**: React Hook Form + Zod validation

### Phase 5: Testing & Quality Assurance (NEXT PRIORITY)

#### Testing Philosophy
Focus on pragmatic testing that provides value without creating maintenance burden:
- **Backend**: E2E black box tests with in-memory database (primary), module integration tests (secondary), minimal targeted unit tests
- **Frontend**: Component tests for UI logic, E2E tests for critical flows, hook testing for custom hooks
- **Avoid**: Excessive unit tests that make refactoring difficult

#### Backend Testing Strategy

**1. E2E Black Box Tests (Primary Focus)**
- [x] Set up SQLite in-memory database for test isolation
- [x] Create test module configuration
- [x] Implement E2E test suite:
  - [x] Auth flow (register → login → JWT validation)
  - [x] Diagram CRUD with permissions
  - [ ] WebSocket collaboration (connection → updates → cursor tracking)
  - [ ] Subscription webhooks and plan limits
  - [ ] Admin operations (user management → audit logs)

**2. Module Integration Tests**
- [ ] AuthModule tests (password hashing, JWT generation, user creation)
- [ ] DiagramsModule tests (ownership checks, version management, permissions)
- [ ] CollaborationModule tests (Y.js sync, presence tracking)
- [ ] SubscriptionsModule tests (Stripe mocked, plan limit enforcement)
- [ ] AdminModule tests (statistics, user management)

**3. Targeted Unit Tests (Minimal)**
- [ ] Complex business logic only:
  - [ ] Password validation in auth.service
  - [ ] Permission calculations in diagrams.service
  - [ ] Plan limit enforcement in subscriptions.service

**4. Test Infrastructure**
- [x] Configure Jest for unit and integration tests
- [x] Set up test database configuration
- [x] Create test utilities and helpers
- [x] Add test coverage reporting
- [ ] Configure CI/CD test pipeline

#### Frontend Testing Strategy

**1. Component Testing Setup**
- [x] Install Vitest + React Testing Library
- [x] Configure test environment with jsdom
- [x] Set up test utilities and mocks
- [x] Create mock API and WebSocket providers

**2. Component Tests**
- [x] AuthModal (form validation, submission)
- [ ] DiagramList (rendering, filtering, actions)
- [ ] ShareDialog (permission management UI)
- [ ] AccountMenu (subscription display, navigation)
- [ ] PricingPage (plan selection, checkout flow)
- [ ] C4Node (rendering, editing, interactions)

**3. Hook Tests**
- [ ] useCollaboration (connection lifecycle, state updates, cleanup)
- [ ] useAuth (login/logout, token management)

**4. E2E Tests with Playwright (Optional but Recommended)**
- [ ] Install and configure Playwright
- [ ] Implement critical user flows:
  - [ ] Complete signup → create diagram → edit → share
  - [ ] Real-time collaboration between two browser instances
  - [ ] Subscription purchase flow
  - [ ] Admin dashboard operations
- [ ] Set up visual regression testing (optional)

**5. Test Scripts**
- [x] Add test commands to package.json
- [x] Configure test:watch mode
- [x] Set up coverage thresholds
- [ ] Add pre-commit test hooks

#### Technology Stack
- **Backend**: Jest + Supertest + SQLite (in-memory)
- **Frontend**: Vitest + React Testing Library + jsdom
- **E2E**: Playwright
- **Mocking**: Jest mocks for Stripe, external APIs

#### Success Criteria
- [x] All critical user flows covered by E2E tests (auth + diagrams)
- [ ] Each backend module has integration tests
- [x] Key frontend components have unit tests (example created)
- [ ] Tests run in CI/CD pipeline
- [x] Test suite completes in under 2 minutes (currently ~3 seconds)
- [x] No flaky tests (35/35 passing)

### Phase 6: Enhanced Diagramming
- [ ] Connect shapes with edges/arrows (basic connection exists, enhance with labels)
- [ ] Snap-to-grid
- [ ] Object colour customization
- [ ] Grouping elements
- [ ] Auto-layout options
- [ ] Diagram search and filtering
- [ ] Export to PNG/SVG
- [ ] Export to JSON/YAML
- [ ] Import from JSON/YAML

### Phase 7: Scalability & Performance Optimization

#### Scalability Assessment (Dec 2024)

**Current Capacity:**
- ~100-200 concurrent users
- ~10,000 total users
- ~50,000 diagrams
- Admin dashboard breaks at 1,000 users
- ❌ Cannot scale horizontally (in-memory WebSocket state)

**Target Capacity (with fixes):**
- 10,000+ concurrent users
- Millions of total users
- Millions of diagrams
- Admin dashboard works at 100,000+ users
- ✅ Horizontal scaling enabled

#### Critical Issues (Fix before 1,000 users)

**1. WebSocket State Management**
- **Problem**: In-memory room state prevents horizontal scaling
- **Location**: `backend/src/collaboration/collaboration.service.ts:19`
- **Impact**: Cannot run multiple backend instances
- **Solution**: Implement Redis adapter for Socket.io

**2. Database Indexes**
- **Problem**: Missing indexes on frequently queried columns
- **Impact**: Queries slow down exponentially with growth
- **Solution**: Add indexes on:
  - `user.createdAt`, `user.updatedAt`
  - `diagram.createdAt`, `diagram.ownerId`
  - `subscription.status`, `subscription.tier`, `subscription.userId`
  - `diagram_version.diagramId`, `diagram_version.version`
  - `diagram_collaborator.diagramId`, `diagram_collaborator.userId`

**3. N+1 Query Patterns**
- **Problem**: Admin dashboard loads all users with relations into memory
- **Location**: `backend/src/admin/admin.service.ts:163-166`
- **Impact**: Admin dashboard unusable at moderate scale
- **Solution**: Use database aggregation and proper pagination

**4. TypeORM Synchronize**
- **Problem**: `synchronize: true` in production risks data loss
- **Location**: `backend/src/app.module.ts:33`
- **Impact**: Schema changes happen automatically, potential downtime
- **Solution**: Disable synchronize, implement proper migrations

#### Tasks - Priority 1 (Before 1,000 users)

- [ ] **Redis Integration for WebSockets**
  - [ ] Install `@socket.io/redis-adapter` and `redis` packages
  - [ ] Set up Redis connection in NestJS
  - [ ] Configure Socket.io Redis adapter in collaboration gateway
  - [ ] Update collaboration service to use Redis for room state
  - [ ] Add Redis health check
  - [ ] Update docker-compose.yml with Redis service
  - [ ] Test multi-instance deployment with load balancer

- [x] **Database Index Optimization**
  - [x] Create migration for user table indexes
    - [x] Add index on `created_at`
    - [x] Add index on `updated_at`
    - [x] Add index on `email` (already unique indexed)
  - [x] Create migration for diagram table indexes
    - [x] Add index on `created_at`
    - [x] Add index on `owner_id`
    - [x] Add composite index on `owner_id, created_at`
  - [x] Create migration for subscription table indexes
    - [x] Add index on `status`
    - [x] Add index on `tier`
    - [x] Add index on `user_id`
    - [x] Add composite index on `status, tier`
  - [x] Create migration for diagram_version table indexes
    - [x] Add index on `diagram_id`
    - [x] Add composite index on `diagram_id, version`
  - [x] Create migration for diagram_collaborator table indexes
    - [x] Add index on `diagram_id`
    - [x] Add index on `user_id`
    - [x] Add composite index on `diagram_id, user_id`
  - [ ] Run performance tests before/after

- [ ] **Fix N+1 Queries in Admin Service**
  - [ ] Refactor `getTopUsers()` to use database aggregation
    - [ ] Use query builder with COUNT and GROUP BY
    - [ ] Remove in-memory sorting
  - [ ] Refactor `getRevenueChart()` to use database aggregation
    - [ ] Use query builder with date grouping
    - [ ] Remove in-memory map processing
  - [ ] Refactor `getUserGrowthChart()` to use database aggregation
    - [ ] Use query builder with date grouping
    - [ ] Remove in-memory map processing
  - [ ] Add query result caching for dashboard stats
  - [ ] Add pagination to all unbounded queries

- [ ] **Migration System Setup**
  - [ ] Disable `synchronize: true` in app.module.ts
  - [ ] Configure TypeORM migrations in package.json
  - [ ] Generate initial migration from current schema
  - [ ] Create migration for all index additions
  - [ ] Document migration workflow in README
  - [ ] Add migration check to CI/CD pipeline

#### Tasks - Priority 2 (Before 10,000 users)

- [ ] **Caching Layer**
  - [ ] Install Redis caching module for NestJS
  - [ ] Implement cache for dashboard statistics
    - [ ] Cache user counts (TTL: 5 minutes)
    - [ ] Cache subscription metrics (TTL: 5 minutes)
    - [ ] Cache revenue data (TTL: 15 minutes)
  - [ ] Implement cache invalidation on data changes
  - [ ] Add cache hit/miss metrics

- [ ] **Database Connection Pooling**
  - [ ] Configure TypeORM connection pool size
  - [ ] Set min/max connections based on load testing
  - [ ] Add connection pool monitoring
  - [ ] Configure connection timeout settings

- [ ] **Optimize Autosave**
  - [ ] Implement Yjs persistence provider
  - [ ] Replace periodic saves with Yjs document snapshots
  - [ ] Add debouncing for version creation (5 minutes)
  - [ ] Reduce write contention on diagram updates

- [ ] **Read Replicas**
  - [ ] Set up PostgreSQL read replica
  - [ ] Configure TypeORM for read/write splitting
  - [ ] Route admin queries to read replica
  - [ ] Route reporting queries to read replica
  - [ ] Add replica lag monitoring

#### Tasks - Priority 3 (Before 100,000 users)

- [ ] **Separate WebSocket Servers**
  - [ ] Extract collaboration service to separate NestJS app
  - [ ] Configure dedicated WebSocket server instances
  - [ ] Implement sticky sessions for WebSocket connections
  - [ ] Add WebSocket server health checks
  - [ ] Load balance WebSocket connections

- [ ] **CDN Integration**
  - [ ] Configure CDN for static assets
  - [ ] Add cache headers to frontend build
  - [ ] Implement asset versioning/fingerprinting
  - [ ] Add CDN purge on deployments

- [ ] **Database Partitioning**
  - [ ] Implement table partitioning for diagram_versions
    - [ ] Partition by created_at (monthly)
  - [ ] Implement table partitioning for audit_logs
    - [ ] Partition by created_at (monthly)
  - [ ] Archive old partitions to cold storage

- [ ] **Monitoring & Observability**
  - [ ] Set up application performance monitoring (APM)
  - [ ] Add distributed tracing
  - [ ] Implement custom metrics dashboard
  - [ ] Set up alerting for performance degradation
  - [ ] Add query performance logging
  - [ ] Monitor Redis memory usage
  - [ ] Track WebSocket connection counts

#### Performance Testing

- [ ] **Load Testing Setup**
  - [ ] Install k6 or Artillery for load testing
  - [ ] Create test scenarios for:
    - [ ] Concurrent diagram editing
    - [ ] WebSocket connections
    - [ ] Admin dashboard queries
    - [ ] API endpoint throughput
  - [ ] Establish baseline performance metrics
  - [ ] Run load tests after each optimization
  - [ ] Document performance improvements

- [ ] **Benchmarking**
  - [ ] Measure query performance before/after indexes
  - [ ] Measure admin dashboard response times
  - [ ] Measure WebSocket message latency
  - [ ] Measure autosave throughput
  - [ ] Document all benchmarks in PERFORMANCE.md

### Phase 8: Advanced Features
- [ ] Detailed object types (AWS resources, etc.)
- [ ] Drill-down navigation between C4 levels
- [ ] Side-by-side views
- [ ] Templates library
- [ ] Diagram history/version control UI
- [ ] Comments and annotations
- [ ] Git integration
- [ ] Team workspaces
- [ ] SSO integration
