 import axios, { AxiosError } from 'axios';
 
 // API base URL - defaults to localhost for local development
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
 
 // Create axios instance
 export const api = axios.create({
   baseURL: API_BASE_URL,
   headers: {
     'Content-Type': 'application/json',
   },
   withCredentials: true,
 });
 
 // Store for Clerk's getToken function
 let getTokenFunction: (() => Promise<string | null>) | null = null;
 
 // Function to set the token getter from Clerk
 export const setTokenGetter = (getter: () => Promise<string | null>) => {
   getTokenFunction = getter;
 };
 
 // Request interceptor to attach auth token
 api.interceptors.request.use(
   async (config) => {
     if (getTokenFunction) {
       const token = await getTokenFunction();
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
     }
     return config;
   },
   (error) => {
     return Promise.reject(error);
   }
 );
 
 // Response interceptor for error handling
 api.interceptors.response.use(
   (response) => response,
   (error: AxiosError) => {
     if (error.response?.status === 401) {
       // Handle unauthorized - could redirect to login
       console.error('Unauthorized request - please sign in');
     } else if (error.response?.status === 403) {
       console.error('Forbidden - you do not have permission');
     } else if (error.response?.status === 500) {
       console.error('Server error - please try again later');
     }
     return Promise.reject(error);
   }
 );
 
 // TMDB Image base URL
 export const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original';
 
 // Helper to build TMDB image URL
 export const getTMDBImageUrl = (path: string | null) => {
   if (!path) return '/placeholder.svg';
   return `${TMDB_IMAGE_BASE_URL}${path}`;
 };
 
 export default api;