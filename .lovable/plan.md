
# Complete Implementation Plan: Dummy Data + Razorpay Payment Integration

## Overview

This plan implements three major changes:
1. Add your dummy data file and use it instead of live API data
2. Fix the build error in `CommunityEvents.tsx`
3. Implement complete Razorpay payment integration using Supabase Edge Functions (since you're using Lovable Cloud)

---

## Part 1: Add Dummy Data & Fix Build Error

### 1.1 Create Dummy Data File

Create `src/data/dummyData.ts` with:
- `dummyShowsData` - Movie/show listings
- `dummyCastsData` - Cast information
- `dummyTrailers` - Trailer data
- `dummyDateTimeData` - Available show times
- `dummyBookingData` - Sample bookings

This data will be converted to match your existing `Event` interface format.

### 1.2 Update useShows Hook

Modify `src/hooks/useShows.ts` to:
- Import dummy data instead of calling API
- Return dummy data directly (no network calls)
- Keep the same interface (`ShowsQueryResult`) for compatibility

### 1.3 Update useMovieDetails Hook

Modify `src/hooks/useMovieDetails.ts` to:
- Use dummy data for movie details
- Map `dummyShowsData` to `MovieDetails` format
- Use `dummyDateTimeData` for show times

### 1.4 Fix CommunityEvents.tsx Build Error

The error occurs because `useShows()` returns `ShowsQueryResult` (an object) but the code tries to cast it as `any[]`. 

Fix: Extract `events` from the data object properly:
```typescript
const { data, isLoading, isError } = useShows();
const events = data?.events || [];
```

---

## Part 2: Razorpay Payment Integration (Backend)

Since you're using Lovable Cloud, we'll create Supabase Edge Functions for the backend. Your external MERN backend is not reachable from the cloud preview, so this is the production-ready approach.

### 2.1 Create Payment Configuration

You'll need to provide:
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID (publishable, safe to expose in frontend)
- `RAZORPAY_KEY_SECRET` - Your Razorpay Secret Key (stored securely in Supabase secrets)

### 2.2 Create Edge Function: `create-razorpay-order`

**Endpoint**: POST `/functions/v1/create-razorpay-order`

**Purpose**: Create a Razorpay order for ticket purchase

**Input**:
```typescript
{
  eventId: string;      // Movie/event ID
  showId: string;       // Show time ID
  seatIds: string[];    // Selected seat IDs
  ticketPrice: number;  // Price per ticket
}
```

**Process**:
1. Validate user is authenticated
2. Calculate total amount server-side (never trust frontend prices)
3. Create Razorpay order via their API
4. Store pending booking in `bookings` table with status `pending`
5. Return order_id and amount

**Output**:
```typescript
{
  orderId: string;
  amount: number;      // Amount in paise
  currency: string;    // "INR"
  bookingId: string;   // Database booking ID
}
```

### 2.3 Create Edge Function: `verify-razorpay-payment`

**Endpoint**: POST `/functions/v1/verify-razorpay-payment`

**Purpose**: Verify Razorpay payment signature and confirm booking

**Input**:
```typescript
{
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId: string;
}
```

**Process**:
1. Verify signature using HMAC SHA256
2. If valid:
   - Update booking status to `confirmed`
   - Mark seats as booked
   - Create payment record
   - Create tickets
3. If invalid:
   - Update booking status to `failed`
   - Release seats

**Output**:
```typescript
{
  success: boolean;
  message: string;
  bookingId?: string;
}
```

### 2.4 Database Schema Updates

Create/update tables for payments:

```sql
-- Payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  booking_id UUID REFERENCES bookings(id),
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);
```

---

## Part 3: Razorpay Payment Integration (Frontend)

### 3.1 Update Razorpay Configuration

Already exists at `src/lib/razorpay.ts` - will add:
- Better error handling
- TypeScript improvements
- Support for calling Supabase edge functions

### 3.2 Create Payment Hooks

Update `src/hooks/useBookings.ts`:
- `useCreateRazorpayOrder` - Call edge function to create order
- `useVerifyRazorpayPayment` - Call edge function to verify payment
- Use Supabase client instead of axios for authentication

### 3.3 Update Checkout Page

Modify `src/pages/Checkout.tsx`:
- Replace MERN backend calls with Supabase edge function calls
- Handle Razorpay checkout flow
- Show success/error states
- Navigate to confirmation page

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/data/dummyData.ts` | Create | Dummy data from your assets.js |
| `src/hooks/useShows.ts` | Modify | Use dummy data instead of API |
| `src/hooks/useMovieDetails.ts` | Modify | Use dummy data for movie details |
| `src/pages/CommunityEvents.tsx` | Modify | Fix TypeScript build error |
| `supabase/functions/create-razorpay-order/index.ts` | Create | Edge function for order creation |
| `supabase/functions/verify-razorpay-payment/index.ts` | Create | Edge function for payment verification |
| `src/hooks/useBookings.ts` | Modify | Use Supabase edge functions |
| `src/pages/Checkout.tsx` | Modify | Integrate with new payment flow |

---

## Database Migration

```sql
-- Create payments table for Razorpay integration
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Environment Variables Needed

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_RAZORPAY_KEY_ID` | Frontend (.env) | Razorpay Key ID (publishable) |
| `RAZORPAY_KEY_SECRET` | Supabase Secrets | Razorpay Secret Key (private) |

---

## Security Considerations

1. **Never trust frontend prices** - Calculate totals server-side
2. **Always verify payment signature** - Use HMAC SHA256 with secret key
3. **Atomic transactions** - Update booking + seats + payment together
4. **RLS policies** - Users can only see their own data
5. **Service role key** - Only used in edge functions for admin operations

---

## Testing Flow

After implementation:
1. Browse events (uses dummy data)
2. Select movie → Select show time → Select seats
3. Click "Book Now" → Checkout page
4. Fill contact info → Click "Pay"
5. Razorpay modal opens
6. Complete test payment (use Razorpay test cards)
7. Payment verified → Booking confirmed
8. View booking in "My Bookings"

---

## Next Step Required

Before I can implement the Razorpay integration, you need to provide:

1. **RAZORPAY_KEY_ID** - I'll add this to the frontend code
2. **RAZORPAY_KEY_SECRET** - I'll request this via Supabase secrets tool

Do you want me to:
1. Start implementation with just dummy data first?
2. Proceed with full Razorpay integration (you'll need to provide keys)?
