
# Frontend Integration Plan: Connect to Your MERN Backend

## Summary

This plan modifies your Lovable frontend to work with your local MERN backend running at `http://localhost:3000`. I'll replace Supabase authentication with Clerk, update all data fetching to call your Express APIs, and integrate the full Razorpay payment flow.

---

## Your Backend API Endpoints (Reference)

Based on your repository, here are the endpoints the frontend will call:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/show/all` | GET | Get all shows (movies with upcoming showtimes) |
| `/api/show/:movieId` | GET | Get movie details + available showtimes |
| `/api/booking/seats/:showId` | GET | Get occupied seats for a show |
| `/api/booking/create` | POST | Create booking (requires auth) |
| `/api/payment/create-order` | POST | Create Razorpay order |
| `/api/payment/verify-payment` | POST | Verify payment signature |
| `/api/user/bookings` | GET | Get user's bookings (requires auth) |
| `/api/user/update-favorite` | POST | Toggle favorite movie |
| `/api/user/favorites` | GET | Get user's favorites |

---

## Implementation Phases

### Phase 1: Core Setup

**1.1 Install Dependencies**
- Add `axios` for API calls
- Add `@clerk/clerk-react` for authentication
- Load Razorpay script dynamically

**1.2 Create API Configuration (`src/lib/api.ts`)**
- Configure axios with base URL pointing to `http://localhost:3000/api`
- Add request interceptor to attach Clerk auth token
- Add response interceptor for error handling

**1.3 Create Clerk Provider (`src/providers/ClerkProvider.tsx`)**
- Wrap app with ClerkProvider using your publishable key
- Handle loading and error states

**1.4 Update Main Entry (`src/main.tsx`)**
- Wrap App with ClerkProvider

---

### Phase 2: Authentication Migration

**2.1 Replace Auth Page (`src/pages/Auth.tsx`)**
- Replace Supabase auth with Clerk's `<SignIn />` and `<SignUp />` components
- Style to match your dark theme

**2.2 Update Header (`src/components/Header.tsx`)**
- Replace `supabase.auth` with Clerk's `useUser()` and `useClerk()` hooks
- Update sign-out logic to use `signOut()` from Clerk
- Display user name/email from Clerk user object

---

### Phase 3: Data Fetching Integration

**3.1 Create Custom Hooks**

**`src/hooks/useShows.ts`**
- Fetch movies from `/api/show/all`
- Map TMDB movie data to your event card format
- Return loading, error, and data states

**`src/hooks/useMovieDetails.ts`**
- Fetch single movie + showtimes from `/api/show/:movieId`
- Return movie details, dateTime object with available shows

**`src/hooks/useOccupiedSeats.ts`**
- Fetch occupied seats for a specific showId
- Used by SeatSelector component

**`src/hooks/useBookings.ts`**
- Create booking mutation
- Fetch user bookings query
- Uses Clerk auth token

**3.2 Update Events Page (`src/pages/Events.tsx`)**
- Replace static `events` data with `useShows()` hook
- Add loading skeleton UI
- Handle empty states

**3.3 Update Event Detail Page (`src/pages/EventDetail.tsx`)**
- Fetch movie details using `useMovieDetails(movieId)`
- Display TMDB movie poster using image URL prefix
- Show available dates and times from backend
- Add date/time selection before seat selection

**3.4 Update Seat Selector (`src/components/SeatSelector.tsx`)**
- Accept `showId` prop to fetch occupied seats
- Replace random generation with real occupied data from `/api/booking/seats/:showId`
- Use `showPrice` from backend instead of hardcoded prices

---

### Phase 4: Booking & Payment Flow

**4.1 Create Razorpay Helper (`src/lib/razorpay.ts`)**
- Load Razorpay script dynamically
- Helper function to open Razorpay checkout modal

**4.2 Update Checkout Page (`src/pages/Checkout.tsx`)**
- Remove Supabase edge function call
- Call `/api/booking/create` with showId and selected seats
- Receive Razorpay order from response
- Open Razorpay checkout modal with order details
- On payment success, call `/api/payment/verify-payment`
- Show success/failure based on verification

**4.3 Environment Variables**
You'll need to add these to a `.env.local` file (NOT the auto-generated `.env`):
```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cG9saXRlLW1vbmFyY2gtMzguY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
```

---

### Phase 5: Additional Features

**5.1 Create My Bookings Page (`src/pages/MyBookings.tsx`)**
- Protected route (redirects to auth if not signed in)
- Fetch from `/api/user/bookings`
- Display booking history with movie posters, dates, seats

**5.2 Create Favorites Feature**
- Add heart button that calls `/api/user/update-favorite`
- Create Favorites page fetching `/api/user/favorites`

**5.3 Update Routing (`src/App.tsx`)**
- Add `/my-bookings` route
- Add `/favorites` route
- Protected route wrapper for authenticated pages

---

## Backend Changes You Need to Make

### 1. CORS Configuration (Critical!)
Update your `server.js` to allow requests from Lovable:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'https://id-preview--95350e67-f0bf-48f0-90d1-522f7504e5de.lovable.app'
  ],
  credentials: true
}));
```

### 2. Add Show Routes
I noticed your `showRoutes.js` file seems incorrect (it has userRouter code). Make sure it exports the show router with these routes:

```javascript
import express from "express";
import { getNowPlayingMovies, addShow, getShows, getShow } from "../controllers/showController.js";

const showRouter = express.Router();

showRouter.get('/now-playing', getNowPlayingMovies);
showRouter.post('/add', addShow);
showRouter.get('/all', getShows);
showRouter.get('/:movieId', getShow);

export default showRouter;
```

### 3. Ensure MongoDB is Running
Your backend needs MongoDB running locally or via Atlas connection string in your `.env`.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add axios, @clerk/clerk-react |
| `src/lib/api.ts` | Create | Axios configuration with auth interceptor |
| `src/lib/razorpay.ts` | Create | Razorpay checkout helper |
| `src/providers/ClerkProvider.tsx` | Create | Clerk authentication wrapper |
| `src/main.tsx` | Modify | Wrap with ClerkProvider |
| `src/pages/Auth.tsx` | Modify | Replace with Clerk components |
| `src/components/Header.tsx` | Modify | Use Clerk hooks |
| `src/hooks/useShows.ts` | Create | Fetch shows from API |
| `src/hooks/useMovieDetails.ts` | Create | Fetch movie details |
| `src/hooks/useOccupiedSeats.ts` | Create | Fetch seat availability |
| `src/hooks/useBookings.ts` | Create | Booking mutations |
| `src/pages/Events.tsx` | Modify | Use useShows hook |
| `src/pages/EventDetail.tsx` | Modify | Use API data, add date/time picker |
| `src/components/SeatSelector.tsx` | Modify | Fetch real occupied seats |
| `src/pages/Checkout.tsx` | Modify | Full Razorpay integration |
| `src/pages/MyBookings.tsx` | Create | User booking history |
| `src/App.tsx` | Modify | Add new routes |

---

## Data Model Mapping

Your MERN backend uses TMDB movie data. Here's how it maps to the frontend:

| Backend Field | Frontend Display |
|--------------|------------------|
| `movie.title` | Event title |
| `movie.poster_path` | Event image (with TMDB prefix) |
| `movie.backdrop_path` | Hero image |
| `movie.overview` | Event description |
| `movie.vote_average` | Rating |
| `movie.runtime` | Duration |
| `movie.genres[].name` | Genre badge |
| `show.showDateTime` | Date and time |
| `show.showPrice` | Ticket price |
| `show.occupiedSeats` | Reserved seats display |

---

## Testing Checklist

After implementation, verify:

1. Clerk sign-up/sign-in works
2. Movies load on Events page from your backend
3. Movie detail page shows correct showtimes
4. Seat selector shows real occupied seats
5. Booking creates order and opens Razorpay
6. Payment verification updates booking status
7. My Bookings shows user's booking history

---

## Important Notes

- **Local Development**: This setup works for local development only. For production, deploy your backend and update `VITE_API_BASE_URL`.
- **Supabase Remains**: The Supabase integration files remain but won't be used - the frontend will call your MERN backend instead.
- **Razorpay Key**: You'll need to provide your Razorpay Key ID for the frontend checkout modal.
