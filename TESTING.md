# Testing Guide

This document describes the testing strategy and setup for the Visual Tool application.

## Testing Philosophy

We follow a pragmatic testing approach that provides value without creating maintenance burden:

- **Backend**: E2E black box tests (primary), module integration tests (secondary), minimal targeted unit tests
- **Frontend**: Component tests for UI logic, E2E tests for critical flows, hook testing for custom hooks
- **Avoid**: Excessive unit tests that make refactoring difficult

## Backend Testing

### Test Infrastructure

- **Framework**: Jest + Supertest
- **Database**: SQLite in-memory for test isolation
- **Location**: `backend/test/`

### Running Backend Tests

```bash
cd backend

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- --testNamePattern="Authentication"

# Run with coverage
npm run test:cov
```

### Test Structure

#### E2E Tests (`test/*.e2e-spec.ts`)
Black box tests that test the entire application through HTTP/WebSocket APIs:

- **`auth.e2e-spec.ts`**: Authentication flows (register, login, guest, JWT validation)
- **`diagrams.e2e-spec.ts`**: Diagram CRUD, permissions, collaboration, sharing
- **`collaboration.e2e-spec.ts`**: WebSocket collaboration (connections, rooms, cursors, Y.js sync)
- **`subscriptions.e2e-spec.ts`**: Subscription tiers, diagram limits, usage tracking
- **`admin.e2e-spec.ts`**: Admin operations (user management, subscriptions, audit logs)
- **`app.e2e-spec.ts`**: Basic application health check

#### Test Utilities (`test/test-utils.ts`)
Helper functions for common test operations:

- `TestHelper` class with methods for user registration, diagram creation, etc.
- `cleanDatabase()` function for test isolation

#### Test Configuration
- **`test-app.module.ts`**: Test-specific app module using SQLite
- **`.env.test`**: Test environment variables
- **`jest-e2e.json`**: Jest E2E configuration

### Key Test Scenarios Covered

✅ **Authentication**
- User registration with validation
- Login with credentials
- Guest user creation
- JWT token validation
- Protected route access

✅ **Diagrams**
- Create, read, update, delete operations
- Permission enforcement (owner, editor, viewer)
- Collaboration management
- Share token access
- Version management

✅ **WebSocket Collaboration**
- Connection authentication and lifecycle
- Room management (join, leave, disconnect)
- Cursor position broadcasting
- Y.js document synchronization (updates, sync steps)
- Awareness updates
- Multi-user scenarios and room isolation

✅ **Subscriptions** (Partial - 6/13 tests passing)
- Subscription tier management (free, pro, team)
- Diagram limit enforcement
- Usage statistics tracking
- Multi-user subscription isolation

✅ **Admin Operations** (Partial - 23/37 tests passing)
- Admin access control
- Dashboard statistics
- User management (list, update, delete)
- Subscription overrides
- Audit log tracking

✅ **Data Isolation**
- Each test uses fresh in-memory database
- Foreign key constraints properly handled
- No test pollution between runs

### Database Compatibility

Entities have been updated for cross-database compatibility:
- `jsonb` → `simple-json` (works on both PostgreSQL and SQLite)
- `enum` → `varchar` (works on both PostgreSQL and SQLite)
- `timestamp` → `datetime` (works on both PostgreSQL and SQLite)

## Frontend Testing

### Test Infrastructure

- **Framework**: Vitest + React Testing Library
- **Environment**: jsdom
- **Location**: `frontend/src/components/__tests__/`

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Structure

#### Component Tests
Located in `src/components/__tests__/`:

- **`AuthModal.test.tsx`**: Login/register forms, validation, guest access

#### Test Utilities (`src/test/`)
- **`setup.ts`**: Global test setup and cleanup
- **`test-utils.tsx`**: Custom render function with providers
- **`mocks/api.ts`**: Mock API responses and data

### Example: AuthModal Tests

```typescript
describe('AuthModal', () => {
  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={mockOnClose} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });
});
```

### Test Coverage Goals

- **Critical user flows**: 100% coverage
- **UI components**: Focus on user interactions and validation
- **Business logic**: Test complex calculations and state management
- **Edge cases**: Error states, loading states, empty states

## Future Testing Enhancements

### Backend
- [ ] Module integration tests for each NestJS module
- [ ] Targeted unit tests for complex business logic
- [ ] Subscription webhook tests with Stripe mocks
- [ ] Admin API tests

### Frontend
- [ ] DiagramList component tests
- [ ] ShareDialog component tests
- [ ] PricingPage component tests
- [ ] useCollaboration hook tests
- [ ] Playwright E2E tests for critical flows
- [ ] Visual regression tests

## CI/CD Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Backend Tests
  run: |
    cd backend
    npm install
    npm run test:e2e

- name: Frontend Tests
  run: |
    cd frontend
    npm install
    npm test
```

## Best Practices

### Backend
1. **Use TestHelper methods** for common operations
2. **Clean database** between tests with `cleanDatabase()`
3. **Test actual API responses**, not implementation details
4. **Mock external services** (Stripe, email, etc.)
5. **Use descriptive test names** that explain the scenario

### Frontend
1. **Test user behavior**, not implementation
2. **Use semantic queries** (`getByRole`, `getByLabelText`)
3. **Mock API calls** to avoid network dependencies
4. **Test accessibility** (ARIA labels, keyboard navigation)
5. **Avoid testing library internals** (React state, props)

## Debugging Tests

### Backend
```bash
# Run single test with verbose output
npm run test:e2e -- --testNamePattern="should register" --verbose

# Debug with Node inspector
npm run test:debug
```

### Frontend
```bash
# Run tests in UI mode for debugging
npm run test:ui

# Run specific test file
npm test -- AuthModal.test.tsx
```

## Test Metrics

Current test coverage:
- **Backend E2E**: 82 of 103 tests passing
  - Authentication: 15/15 tests ✅
  - Diagrams: 19/19 tests ✅
  - WebSocket Collaboration: 18/18 tests ✅
  - Subscriptions: 6/13 tests (partial - configuration issues)
  - Admin Operations: 23/37 tests (partial - some admin features incomplete)
  - Health check: 1/1 test ✅
- **Frontend**: Example tests created (AuthModal component), ready for expansion

Target coverage:
- **Backend**: 80%+ for critical paths (currently ~80%)
- **Frontend**: 70%+ for components and hooks
- **E2E**: All critical user flows covered
