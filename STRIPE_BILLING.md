# Stripe Recurring Billing - How It Works

## Overview

Your app uses Stripe to handle all recurring billing automatically. Stripe manages the entire payment lifecycle, and your app stays in sync through webhooks.

---

## 🔄 Automatic Recurring Billing

### What Stripe Handles Automatically:

1. **Monthly Charges** - Bills customers on their subscription anniversary date
2. **Payment Processing** - Charges the saved payment method
3. **Retry Logic** - Automatically retries failed payments (configurable in Stripe Dashboard)
4. **Email Notifications** - Sends receipts, payment reminders, and failure notices
5. **Proration** - Handles upgrades/downgrades mid-cycle
6. **Tax Calculation** - Can integrate with Stripe Tax (optional)

### What You Don't Need to Do:

- ❌ Schedule cron jobs to charge customers
- ❌ Store credit card information (PCI compliance handled by Stripe)
- ❌ Send payment receipts (Stripe sends them automatically)
- ❌ Handle payment retries (Stripe does this automatically)

---

## 📡 How Your App Knows Payment Status

Your app uses **Stripe Webhooks** to stay synchronized with payment events in real-time.

### Webhook Events You're Handling:

#### 1. `checkout.session.completed`
**When:** Initial payment succeeds  
**What happens:**
- User is upgraded to Pro/Team tier
- Subscription record created in database
- User gets unlimited diagrams immediately

**Code:** `handleCheckoutCompleted()` in `subscriptions.service.ts:150`

#### 2. `customer.subscription.updated`
**When:** Every monthly renewal OR subscription changes  
**What happens:**
- Updates `currentPeriodStart` and `currentPeriodEnd` dates
- Syncs subscription status (active, past_due, canceled)
- Updates tier if user upgraded/downgraded

**Code:** `handleSubscriptionUpdated()` in `subscriptions.service.ts:172`

#### 3. `invoice.payment_failed`
**When:** Payment fails (expired card, insufficient funds, etc.)  
**What happens:**
- Subscription status set to `PAST_DUE`
- User immediately loses access to paid features
- Treated as free tier (3 diagram limit)

**Code:** `handlePaymentFailed()` in `subscriptions.service.ts:205`

#### 4. `customer.subscription.deleted`
**When:** Subscription canceled or expires after failed payments  
**What happens:**
- User downgraded to `FREE` tier
- Subscription status set to `CANCELED`
- User limited to 3 diagrams

**Code:** `handleSubscriptionDeleted()` in `subscriptions.service.ts:191`

---

## 💳 Payment Lifecycle Example

### Happy Path (Successful Recurring Payment):

```
Month 1:
  User clicks "Upgrade to Pro" ($9/month)
  → Stripe Checkout page opens
  → User enters card details
  → Payment succeeds
  → checkout.session.completed webhook fires
  → Your DB: tier='pro', status='active'
  → User gets unlimited diagrams ✅

Month 2 (30 days later):
  Stripe automatically charges $9
  → Payment succeeds
  → customer.subscription.updated webhook fires
  → Your DB: currentPeriodEnd updated to Month 3
  → User continues with Pro access ✅

Month 3, 4, 5... (continues automatically)
```

### Failed Payment Path:

```
Month 3:
  Stripe attempts to charge $9
  → Payment fails (card expired)
  → invoice.payment_failed webhook fires
  → Your DB: status='past_due'
  → User immediately loses Pro features ❌
  → User limited to 3 diagrams
  → Stripe sends email to user about failed payment

  Stripe automatically retries (configurable):
    - Retry 1: 3 days later
    - Retry 2: 5 days later
    - Retry 3: 7 days later
    - Final attempt: 7 days later

  If all retries fail:
  → customer.subscription.deleted webhook fires
  → Your DB: tier='free', status='canceled'
  → User permanently downgraded to free tier

  If user updates card and payment succeeds:
  → customer.subscription.updated webhook fires
  → Your DB: status='active'
  → User regains Pro access ✅
```

---

## 🛡️ How Your App Enforces Payment Status

### Diagram Creation Check:

Every time a user tries to create a diagram, your app checks:

```typescript
// subscriptions.service.ts:216
async checkDiagramLimit(userId: string) {
  const subscription = await this.getOrCreateSubscription(userId);
  
  // Check BOTH tier AND status
  const isActivePaidTier = 
    subscription.tier !== 'FREE' && 
    subscription.status === 'ACTIVE';
  
  if (isActivePaidTier) {
    return { allowed: true, limit: -1 }; // Unlimited
  } else {
    // Free tier OR payment failed
    const count = await this.diagramRepository.count({ where: { ownerId: userId } });
    return { allowed: count < 3, limit: 3, current: count };
  }
}
```

### Key Point:
**Even if a user has `tier='pro'` in the database, if their `status='past_due'`, they are treated as free tier.**

This ensures users with failed payments immediately lose access to paid features.

---

## 🔧 Stripe Configuration

### Retry Logic (Configurable in Stripe Dashboard):

1. Go to Stripe Dashboard → Settings → Billing
2. Configure "Smart Retries" (recommended)
3. Set retry schedule (default: 3, 5, 7, 7 days)
4. Set when to cancel subscription after failed retries

### Email Notifications (Automatic):

Stripe automatically sends:
- ✅ Payment receipts
- ⚠️ Payment failure notices
- 🔔 Upcoming renewal reminders (optional)
- ❌ Subscription cancellation notices

### Webhook Endpoint:

**Production URL:** `https://yourdomain.com/subscriptions/webhook`  
**Local Development:** Use Stripe CLI to forward webhooks

```bash
stripe listen --forward-to localhost:3000/subscriptions/webhook
```

---

## 📊 Subscription Status Flow

```
┌─────────────┐
│   ACTIVE    │ ← User has paid, full access
└──────┬──────┘
       │
       │ Payment fails
       ↓
┌─────────────┐
│  PAST_DUE   │ ← Payment failed, limited access (treated as free tier)
└──────┬──────┘
       │
       ├─→ Payment succeeds → Back to ACTIVE ✅
       │
       └─→ All retries fail → CANCELED ❌
                              ↓
                        ┌─────────────┐
                        │  CANCELED   │ ← Subscription ended, free tier
                        └─────────────┘
```

---

## ✅ What You've Implemented

- ✅ Stripe SDK integration
- ✅ Checkout session creation
- ✅ Webhook endpoint (`POST /subscriptions/webhook`)
- ✅ Webhook signature verification
- ✅ All 4 critical webhook handlers
- ✅ Subscription status enforcement in diagram limits
- ✅ Billing portal for self-service management
- ✅ Database sync with Stripe

---

## 🚀 Testing Recurring Payments

### Test Mode (Current Setup):

1. Use test card: `4242 4242 4242 4242`
2. Subscribe to Pro plan
3. In Stripe Dashboard → Subscriptions → Find your test subscription
4. Click "..." → "Advance time" to simulate next billing cycle
5. Watch webhooks fire and database update

### Simulate Failed Payment:

1. Use test card: `4000 0000 0000 0341` (always declines)
2. Subscribe to Pro plan
3. Advance time to next billing cycle
4. Payment will fail → `invoice.payment_failed` webhook fires
5. User status changes to `PAST_DUE`
6. User loses Pro access immediately

---

## 📝 Summary

**Yes, Stripe handles everything automatically!**

- ✅ Recurring charges every month
- ✅ Payment retries on failure
- ✅ Email notifications to customers
- ✅ Your app stays in sync via webhooks
- ✅ Users immediately lose access when payment fails
- ✅ Users regain access when payment succeeds

**You don't need to:**
- ❌ Write cron jobs
- ❌ Store credit cards
- ❌ Send emails
- ❌ Handle retries

**Your app just needs to:**
- ✅ Listen to webhooks
- ✅ Update database based on events
- ✅ Check subscription status before granting access

Everything is already implemented and working! 🎉
