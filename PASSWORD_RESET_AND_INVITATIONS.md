# Password Reset & User Invitations Guide

## Overview

This guide covers the password reset flow and admin user invitation features that have been implemented.

## Email Service: Resend

We use **Resend** for sending transactional emails. Resend offers:
- Simple API integration
- 3,000 emails/month free tier
- 100 emails/day on free tier
- Official NestJS support
- React Email template support

### Setup Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to your `.env` file:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:5173
```

**Note:** On free tier, you can only send from `onboarding@resend.dev`. To use your own domain, you need to verify it in Resend dashboard.

## Password Reset Flow

### User Experience

1. User clicks "Forgot password?" on login page
2. Enters their email address
3. Receives email with reset link (valid for 1 hour)
4. Clicks link, enters new password
5. Password is reset, user can login

### Backend Implementation

**Endpoints:**
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

**Database Fields Added:**
- `resetToken` (string, nullable) - Unique token for password reset
- `resetTokenExpiry` (timestamp, nullable) - Token expiration time

**Security Features:**
- Tokens expire after 1 hour
- Tokens are cryptographically random (32 bytes)
- Generic success message to prevent email enumeration
- Guest users cannot reset passwords

### Frontend Implementation

**Components:**
- `ForgotPassword.tsx` - Modal for requesting password reset
- `ResetPassword.tsx` - Page for setting new password
- Integrated into `AuthModal.tsx` with "Forgot password?" link
- URL parameter handling in `App.tsx` for reset tokens

**User Flow:**
1. Click "Forgot password?" in login modal
2. Enter email → receives email
3. Click link in email → opens app with `?token=xxx`
4. Enter new password → success message → redirected to login

## Admin User Invitations

### Features

Admins can invite new users with:
- Custom email and name
- Pre-assigned subscription tier (Free/Pro/Team)
- Optional admin access
- Optional welcome email

### Backend Implementation

**Endpoint:**
- `POST /admin/users/invite` - Invite new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "sendEmail": true,
  "tier": "pro",
  "isAdmin": false
}
```

**Response:**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "tempPassword": "abc123def456" // Only if sendEmail=false
}
```

**Process:**
1. Validates email doesn't already exist
2. Generates random temporary password (16 characters)
3. Creates user account with hashed password
4. Assigns subscription tier if not free
5. Sends welcome email (if enabled) with credentials
6. Logs action in audit log

### Frontend Implementation (Admin App)

**Location:** Admin Users page

**UI Features:**
- "Invite User" button in header
- Modal form with fields:
  - Email (required)
  - Name (required)
  - Subscription Tier (dropdown: Free/Pro/Team)
  - Send welcome email (checkbox, default: true)
  - Grant admin access (checkbox, default: false)

**Behavior:**
- If email sending is enabled → shows success message
- If email sending is disabled → displays temporary password to copy
- Automatically refreshes user list after invitation

### Email Templates

#### Password Reset Email
- Subject: "Reset Your Password"
- Contains reset link with token
- Link expires in 1 hour
- Styled with inline CSS for email clients

#### User Invitation Email
- Subject: "Welcome - Your Account Has Been Created"
- Contains login URL
- Shows temporary password
- Reminds user to change password after first login
- Shows who invited them

## Testing Without Email Service

If `RESEND_API_KEY` is not configured, the email service will:
- Log email details to console
- Not throw errors
- Allow testing without actual email sending

This is useful for local development.

## Database Migration

You need to add the password reset fields to the User table:

```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
```

Or if using TypeORM synchronize, it will auto-create these columns.

## Security Considerations

### Password Reset
- ✅ Tokens expire after 1 hour
- ✅ Tokens are single-use (cleared after reset)
- ✅ Generic messages prevent email enumeration
- ✅ Requires minimum 8 character password
- ✅ Tokens stored in database, not in URL permanently

### User Invitations
- ✅ Only admins can invite users
- ✅ All invitations logged in audit log
- ✅ Temporary passwords are cryptographically random
- ✅ Email validation prevents duplicates
- ✅ Passwords are hashed with bcrypt

## Environment Variables

Add these to your `.env` files:

### Backend (`backend/.env`)
```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Application URLs
APP_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

### Admin Frontend (`admin-frontend/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

## Usage Examples

### Password Reset (User)
1. Go to login page
2. Click "Forgot password?"
3. Enter: `user@example.com`
4. Check email inbox
5. Click reset link
6. Enter new password (min 8 chars)
7. Login with new password

### Invite User (Admin)
1. Login to admin app
2. Go to Users page
3. Click "Invite User"
4. Fill form:
   - Email: `newuser@example.com`
   - Name: `New User`
   - Tier: `Pro`
   - Send email: ✓
   - Admin: ☐
5. Click "Invite User"
6. User receives welcome email with credentials

## Troubleshooting

### Emails not sending
- Check `RESEND_API_KEY` is set correctly
- Verify API key is active in Resend dashboard
- Check console logs for error messages
- Ensure `FROM_EMAIL` is verified domain or use `onboarding@resend.dev`

### Reset link not working
- Check token hasn't expired (1 hour limit)
- Verify `APP_URL` environment variable is correct
- Check browser console for errors
- Ensure token is in URL: `?token=xxx`

### Invitation fails
- Verify user doesn't already exist
- Check admin has proper permissions
- Review audit logs for details
- Check backend console for errors

## API Reference

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

### POST /admin/users/invite
Invite new user (admin only).

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "sendEmail": true,
  "tier": "pro",
  "isAdmin": false
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false
  },
  "tempPassword": "abc123def456" // Only if sendEmail=false
}
```
