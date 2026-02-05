
# Integration Plan: Connect Lovable Frontend to Your External MERN Backend

## Overview

Your existing MERN backend uses:
- **Express.js** server running on port 3000
- **MongoDB** for data storage
- **Clerk** for authentication
- **Razorpay** for payments
- **TMDB API** for movie data
- **Inngest** for background jobs (payment checks, email notifications)

The current Lovable project uses:
- **Lovable Cloud (Supabase/PostgreSQL)** for database
- **Supabase Auth** for authentication  
- **Edge Functions** for server-side processing

**Key Decision Required**: You have two paths forward:

---

## Option A: Connect Frontend to Your MERN Backend (Recommended if you want to use your existing backend)

This will modify the Lovable frontend to call your external MERN APIs instead of Supabase.

### Frontend Changes Required

1. **Create API Configuration**
   - Add a new file `src/lib/api.ts` with axios configuration pointing to your backend URL
   - Configure axios interceptors for Clerk authentication tokens

2. **Replace Supabase Auth with Clerk**
   - Install `@clerk/clerk-react` package
   - Replace `Auth.tsx` with Clerk's sign-in/sign-up components
   - Update `Header.tsx` to use Clerk's `useUser()` and `useAuth()` hooks
   - Create an `AuthProvider` wrapper using `ClerkProvider`

3. **Update Data Fetching**
   - Modify `Events.tsx` to fetch from `/api/show/all` endpoint
   - Update `EventDetail.tsx` to fetch movie details from `/api/show/:movieId`
   - Update `SeatSelector.tsx` to fetch occupied seats from `/api/booking/seats/:showId`

4. **Update Booking Flow**
   - Modify `Checkout.tsx` to call `/api/booking/create` with Clerk token
   - Handle Razorpay order response and launch Razorpay checkout modal
   - Call `/api/payment/verify-payment` on payment success

5. **Add My Bookings Page**
   - Create new page fetching from `/api/user/bookings`

6. **Add Favorites Feature**
   - Implement favorite toggle calling `/api/user/update-favorite`

### Backend Changes Required for Your MERN Server

1. **CORS Configuration**
   Update `server.js` to allow requests from Lovable's preview and published URLs:
   ```javascript
   app.use(cors({
     origin: [
       'https://id-preview--95350e67-f0bf-48f0-90d1-522f7504e5de.lovable.app',
       'http://localhost:5173',
       // Add your published URL when deployed
     ],
     credentials: true
   }));
   ```

2. **Environment Variables**
   Ensure your backend is deployed (e.g., on Render, Railway, or Vercel) and accessible via HTTPS

3. **Razorpay Webhook**
   Configure Razorpay webhook URL to point to your deployed backend's `/api/payment/webhook` endpoint

---

## Option B: Keep Using Lovable Cloud (Recommended for simplicity)

If you prefer the simpler Supabase-based architecture already built, you would:
- Keep the current Lovable Cloud setup
- Migrate your MERN data model concepts to Supabase tables (already done)
- Use Edge Functions for Razorpay integration
- Add TMDB API integration via Edge Functions

---

## Technical Implementation Details (For Option A)

### Phase 1: Authentication Migration

Files to create/modify:
- `src/lib/api.ts` - Axios instance with base URL and auth interceptor
- `src/providers/AuthProvider.tsx` - Clerk provider wrapper
- `src/main.tsx` - Wrap app with ClerkProvider
- `src/pages/Auth.tsx` - Replace with Clerk SignIn/SignUp
- `src/components/Header.tsx` - Use Clerk hooks for user state

### Phase 2: API Integration

Files to create/modify:
- `src/hooks/useShows.ts` - React Query hook for fetching shows
- `src/hooks/useMovieDetails.ts` - React Query hook for movie details
- `src/hooks/useBookings.ts` - React Query hooks for booking operations
- `src/pages/Events.tsx` - Fetch from MERN API
- `src/pages/EventDetail.tsx` - Fetch movie/show from MERN API
- `src/components/SeatSelector.tsx` - Fetch occupied seats from API

### Phase 3: Payment Integration

Files to create/modify:
- `src/lib/razorpay.ts` - Razorpay checkout helper
- `src/pages/Checkout.tsx` - Full Razorpay integration
- `src/pages/MyBookings.tsx` - User's booking history

### Phase 4: Features

Files to create/modify:
- `src/pages/Favorites.tsx` - User favorites page
- `src/components/FavoriteButton.tsx` - Toggle favorite movies

---

## Data Model Mapping

| MERN Model | Current Supabase Table | Notes |
|------------|----------------------|-------|
| Movie | events | Map TMDB fields to event fields |
| Show | events + seats | Shows are event instances with seat data |
| Booking | bookings | Compatible structure |
| User | profiles | Clerk user synced to profiles |

---

## Environment Variables Needed

For the Lovable frontend to connect to your backend:
```
VITE_BASE_URL=https://your-deployed-backend.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
```

---

## Recommended Next Steps

1. **Deploy your MERN backend** to a cloud service (Render, Railway, Heroku)
2. **Provide the deployed backend URL** so I can configure the frontend
3. **Share your Clerk Publishable Key** for frontend authentication
4. **Confirm which option** you want to proceed with (A or B)

Would you like me to proceed with Option A (connecting to your MERN backend) or Option B (enhancing the current Lovable Cloud setup)?
