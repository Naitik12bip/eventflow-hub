// TMDB helpers
export const TMDB_IMAGE_BASE_URL =
  import.meta.env.VITE_TMDB_IMAGE_BASE_URL ||
  'https://image.tmdb.org/t/p/w500';

export const getTMDBImageUrl = (path: string | null) => {
  if (!path) return '/placeholder.svg';
  if (/^https?:\/\//.test(path)) return path;
  return `${TMDB_IMAGE_BASE_URL}${path}`;
};