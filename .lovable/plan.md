

# Fix Frontend Loading Issue & Backend Alignment

## Problem Identified

The Events page is stuck loading indefinitely because:

1. **API Response Structure Mismatch**: Your backend returns `{ success: true, shows: [...] }` but the frontend expects the response to be a direct array `BackendShow[]`
2. **Backend Route File Error**: Your `showRoutes.js` file incorrectly contains `userRouter` code instead of show routes
3. **API Path Issue**: Frontend calls `/show/all` but there's a potential route registration issue on backend

---

## Issue 1: Backend `showRoutes.js` is Wrong (CRITICAL)

Your current `server/routes/showRoutes.js` contains:
```javascript
// WRONG - This is user routes code!
import { getFavorites, getUserBookings, updateFavorite } from "../controllers/userController.js";
const userRouter = express.Router();
userRouter.get('/bookings', getUserBookings)
...
export default userRouter;
```

**You need to fix this file** to:
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

---

## Issue 2: Frontend API Response Handling

Your backend `getShows` controller returns:
```javascript
res.json({ success: true, shows: Array.from(uniqueShows) })
```

But the frontend `useShows.ts` expects a direct array:
```typescript
const res = await api.get<BackendShow[]>('/show/all');
return res.data.map(mapShowToEvent);  // This fails because res.data = { success, shows }
```

**Frontend Fix**: Update `useShows.ts` to handle the wrapped response:
```typescript
interface ShowsResponse {
  success: boolean;
  shows: BackendShow[];
}

const res = await api.get<ShowsResponse>('/show/all');
if (!res.data.success) throw new Error('Failed to fetch shows');
return res.data.shows.map(mapShowToEvent);
```

---

## Issue 3: Backend Response Data Structure

Your `getShows` controller returns movies (from the populate), not the full show objects with movie data embedded. Looking at your code:

```javascript
const uniqueShows = new Set(shows.map(show => show.movie))
res.json({success: true, shows: Array.from(uniqueShows)})
```

This returns just the **Movie** objects, not **Show** objects with movie data. The frontend expects:
```typescript
{
  _id: string;         // show ID
  showDateTime: string;
  showPrice: number;
  occupiedSeats: string[];
  movie: { ... }       // nested movie object
}
```

But backend sends just the Movie object directly.

**Backend Fix Required** - Update `showController.js`:
```javascript
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    // Group shows by movie to avoid duplicates but keep show data
    const movieShowsMap = new Map();
    shows.forEach(show => {
      const movieId = show.movie._id.toString();
      if (!movieShowsMap.has(movieId)) {
        movieShowsMap.set(movieId, {
          _id: show._id,
          movieId: show.movie._id,
          showDateTime: show.showDateTime,
          showPrice: show.showPrice,
          occupiedSeats: show.occupiedSeats,
          movie: show.movie
        });
      }
    });

    res.json({ success: true, shows: Array.from(movieShowsMap.values()) });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
```

---

## Issue 4: Movie Details API Response

Your `getShow` (single movie) returns:
```javascript
res.json({ success: true, movie, dateTime })
```

But frontend `useMovieDetails.ts` expects:
```typescript
{ movie: {...}, shows: [...] }  // Not dateTime!
```

**Backend Fix Required** - Update `getShow` in `showController.js`:
```javascript
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } });
    const movie = await Movie.findById(movieId);

    // Return shows array instead of dateTime object
    const formattedShows = shows.map(show => ({
      _id: show._id,
      movieId: show.movie,
      showDateTime: show.showDateTime,
      showPrice: show.showPrice,
      occupiedSeats: show.occupiedSeats
    }));

    res.json({ success: true, movie, shows: formattedShows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
```

---

## Summary of Required Changes

### Backend Changes (Your MERN repo)

| File | Change |
|------|--------|
| `routes/showRoutes.js` | **Replace entire file** - currently has wrong user routes code |
| `controllers/showController.js` | Update `getShows` to return show objects with movie data, not just movies |
| `controllers/showController.js` | Update `getShow` to return `shows` array instead of `dateTime` object |

### Frontend Changes (This Lovable project)

| File | Change |
|------|--------|
| `src/hooks/useShows.ts` | Handle wrapped API response `{ success, shows }` |
| `src/hooks/useMovieDetails.ts` | Handle wrapped API response `{ success, movie, shows }` |

---

## Complete Backend Fix Instructions

### Step 1: Fix `showRoutes.js`

Replace the entire contents of `server/routes/showRoutes.js` with:

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

### Step 2: Update `getShows` in `showController.js`

```javascript
// API to get all shows from the database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    // Group shows by movie, keeping show data
    const movieShowsMap = new Map();
    shows.forEach(show => {
      if (!show.movie) return; // Skip if no movie
      const movieId = show.movie._id.toString();
      if (!movieShowsMap.has(movieId)) {
        movieShowsMap.set(movieId, {
          _id: show._id,
          movieId: show.movie._id,
          showDateTime: show.showDateTime,
          showPrice: show.showPrice,
          occupiedSeats: show.occupiedSeats || [],
          movie: {
            id: show.movie._id,
            title: show.movie.title,
            overview: show.movie.overview,
            poster_path: show.movie.poster_path,
            vote_average: show.movie.vote_average,
            runtime: show.movie.runtime,
            genres: show.movie.genres,
            release_date: show.movie.release_date
          }
        });
      }
    });

    res.json({ success: true, shows: Array.from(movieShowsMap.values()) });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
```

### Step 3: Update `getShow` in `showController.js`

```javascript
// API to get a single movie with its shows
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } });
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.json({ success: false, message: 'Movie not found' });
    }

    const formattedShows = shows.map(show => ({
      _id: show._id,
      movieId: show.movie,
      showDateTime: show.showDateTime,
      showPrice: show.showPrice,
      occupiedSeats: show.occupiedSeats || []
    }));

    res.json({ success: true, movie, shows: formattedShows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
```

---

## Frontend Changes I'll Make

1. Update `src/hooks/useShows.ts` to:
   - Handle `{ success, shows }` response wrapper
   - Add error handling for failed responses

2. Update `src/hooks/useMovieDetails.ts` to:
   - Handle `{ success, movie, shows }` response wrapper
   - Add error handling

---

## Testing After Fixes

1. Start your MongoDB
2. Start your MERN backend: `npm run dev` (should be on port 3000)
3. Check CORS is configured for the Lovable preview URL
4. The Events page should load movies from your database

