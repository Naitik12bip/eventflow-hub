

# Fix Plan: Backend Changes + Button Interactivity

## Summary

There are two related issues:
1. **Backend code needs fixing** - Your `showRoutes.js` contains wrong code
2. **Buttons appear non-functional** - The frontend cannot reach your local backend from Lovable's cloud preview

---

## Part 1: Required Backend Changes

You need to make these changes to your MERN backend code:

### 1.1 Fix `server/routes/showRoutes.js`

Your current file incorrectly contains user routes code. Replace the **entire file** with:

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

### 1.2 Update `server/controllers/showController.js`

**Replace `getShows` function:**
```javascript
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 });

    const movieShowsMap = new Map();
    shows.forEach(show => {
      if (!show.movie) return;
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

**Replace `getShow` function:**
```javascript
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

### 1.3 Update CORS in `server/server.js`

Add Lovable preview URL to allowed origins:
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

---

## Part 2: Why Buttons Appear Non-Functional

### Root Cause
The Lovable preview runs in the cloud at `https://id-preview--95350e67-f0bf-48f0-90d1-522f7504e5de.lovable.app`. It **cannot connect to `localhost:3000`** on your machine because:
- `localhost` refers to the cloud server, not your computer
- There's no network path from the cloud to your local machine

### What This Causes
- API calls to `/show/all` fail (network error)
- The Events page shows infinite loading spinner
- Buttons that depend on API data appear frozen
- Pages that need backend data don't render properly

### Solution Options

**Option A: Deploy your backend (Recommended)**
Deploy your MERN backend to a cloud service:
- **Render** (free tier available) - https://render.com
- **Railway** - https://railway.app
- **Vercel** (for serverless) - https://vercel.com

Then update the `VITE_API_BASE_URL` to your deployed URL.

**Option B: Test locally only**
Run both frontend and backend on your local machine:
1. Clone your Lovable project locally
2. Run `npm run dev` (frontend on localhost:5173)
3. Run your MERN backend (`npm run dev` on localhost:3000)
4. Access http://localhost:5173 in your browser

---

## Part 3: Frontend Improvements (I will implement)

To improve user experience while the backend is not connected:

1. **Add error handling to Events page** - Show "Unable to connect to server" instead of infinite loading
2. **Add timeout to API calls** - Fail fast if server is unreachable
3. **Show mock/demo data** - Allow users to explore the UI even without backend

---

## Summary Checklist

| Task | Who | Status |
|------|-----|--------|
| Fix `showRoutes.js` | You (backend) | Pending |
| Update `getShows` controller | You (backend) | Pending |
| Update `getShow` controller | You (backend) | Pending |
| Add CORS for Lovable URL | You (backend) | Pending |
| Deploy backend to cloud | You | Pending |
| Add error handling UI | Me (frontend) | Will implement |
| Add timeout/fallback | Me (frontend) | Will implement |

---

## Next Steps

1. Make the backend changes listed above
2. Either:
   - Deploy your backend and share the URL, OR
   - Test locally by running both projects on your machine
3. I'll implement better error handling so the UI doesn't appear frozen when the backend is unreachable

