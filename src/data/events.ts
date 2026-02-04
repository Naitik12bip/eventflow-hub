export type EventCategory = 'concerts' | 'sports' | 'theater' | 'comedy' | 'festivals' | 'movies';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  city: string;
  date: string;
  time: string;
  image: string;
  price: {
    min: number;
    max: number;
  };
  rating?: number;
  duration?: string;
  featured?: boolean;
  soldOut?: boolean;
  seatsAvailable?: number;
  totalSeats?: number;
  artists?: string[];
  genre?: string;
}

export const categories = [
  { id: 'all', label: 'All Events', icon: '🎭' },
  { id: 'concerts', label: 'Concerts', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'theater', label: 'Theater', icon: '🎪' },
  { id: 'comedy', label: 'Comedy', icon: '😂' },
  { id: 'festivals', label: 'Festivals', icon: '🎉' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
] as const;

export const events: Event[] = [
  // Concerts
  {
    id: 'evt-001',
    title: 'Arijit Singh Live',
    description: 'Experience the soulful melodies of Arijit Singh in an unforgettable night of music. Join thousands of fans as he performs his greatest hits live on stage.',
    category: 'concerts',
    venue: 'DY Patil Stadium',
    city: 'Mumbai',
    date: '2024-03-15',
    time: '19:00',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
    price: { min: 1500, max: 15000 },
    rating: 4.9,
    duration: '3 hours',
    featured: true,
    seatsAvailable: 2500,
    totalSeats: 50000,
    artists: ['Arijit Singh'],
    genre: 'Bollywood',
  },
  {
    id: 'evt-002',
    title: 'Coldplay: Music of the Spheres',
    description: 'Coldplay brings their spectacular world tour to India. Prepare for an explosion of color, music, and unforgettable moments.',
    category: 'concerts',
    venue: 'Jawaharlal Nehru Stadium',
    city: 'Delhi',
    date: '2024-03-22',
    time: '18:30',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop',
    price: { min: 2500, max: 35000 },
    rating: 4.8,
    duration: '2.5 hours',
    featured: true,
    seatsAvailable: 5000,
    totalSeats: 80000,
    artists: ['Coldplay'],
    genre: 'Pop Rock',
  },
  {
    id: 'evt-003',
    title: 'A.R. Rahman Symphony',
    description: 'The Mozart of Madras presents a symphonic journey through decades of iconic music. Orchestra, choir, and pure magic.',
    category: 'concerts',
    venue: 'Phoenix Marketcity',
    city: 'Chennai',
    date: '2024-03-28',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
    price: { min: 2000, max: 20000 },
    rating: 4.9,
    duration: '2.5 hours',
    seatsAvailable: 1800,
    totalSeats: 5000,
    artists: ['A.R. Rahman'],
    genre: 'Fusion',
  },
  // Sports
  {
    id: 'evt-004',
    title: 'IPL 2024: MI vs CSK',
    description: 'The biggest rivalry in cricket! Watch Mumbai Indians take on Chennai Super Kings in this electrifying IPL clash.',
    category: 'sports',
    venue: 'Wankhede Stadium',
    city: 'Mumbai',
    date: '2024-04-05',
    time: '19:30',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop',
    price: { min: 1000, max: 25000 },
    rating: 4.7,
    duration: '4 hours',
    featured: true,
    seatsAvailable: 8000,
    totalSeats: 33000,
    genre: 'Cricket',
  },
  {
    id: 'evt-005',
    title: 'ISL Final 2024',
    description: 'The Indian Super League finals bring together the best football teams for the ultimate showdown.',
    category: 'sports',
    venue: 'Salt Lake Stadium',
    city: 'Kolkata',
    date: '2024-04-12',
    time: '17:00',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
    price: { min: 500, max: 8000 },
    rating: 4.5,
    duration: '3 hours',
    seatsAvailable: 15000,
    totalSeats: 85000,
    genre: 'Football',
  },
  {
    id: 'evt-006',
    title: 'Pro Kabaddi League',
    description: 'Fast-paced action as top kabaddi teams battle for supremacy in this thrilling league match.',
    category: 'sports',
    venue: 'Gachibowli Indoor Stadium',
    city: 'Hyderabad',
    date: '2024-04-18',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1461896836934- voices?w=800&auto=format&fit=crop',
    price: { min: 300, max: 3000 },
    rating: 4.4,
    duration: '2.5 hours',
    seatsAvailable: 4000,
    totalSeats: 6000,
    genre: 'Kabaddi',
  },
  // Theater
  {
    id: 'evt-007',
    title: 'Hamilton - The Musical',
    description: 'The revolutionary Broadway sensation comes to India! Experience the story that changed musical theater forever.',
    category: 'theater',
    venue: 'NCPA',
    city: 'Mumbai',
    date: '2024-04-25',
    time: '19:00',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop',
    price: { min: 3000, max: 15000 },
    rating: 4.9,
    duration: '2 hours 45 min',
    featured: true,
    seatsAvailable: 200,
    totalSeats: 1200,
    genre: 'Musical',
  },
  {
    id: 'evt-008',
    title: 'The Phantom of the Opera',
    description: 'Andrew Lloyd Webber\'s legendary masterpiece. Love, mystery, and unforgettable music beneath the Paris Opera.',
    category: 'theater',
    venue: 'Rangsharda Auditorium',
    city: 'Mumbai',
    date: '2024-05-02',
    time: '18:30',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&auto=format&fit=crop',
    price: { min: 2500, max: 12000 },
    rating: 4.8,
    duration: '2 hours 30 min',
    seatsAvailable: 450,
    totalSeats: 800,
    genre: 'Musical',
  },
  // Comedy
  {
    id: 'evt-009',
    title: 'Zakir Khan Live',
    description: 'Sakht launda returns with all new material! Get ready for an evening of relatable humor and heartfelt stories.',
    category: 'comedy',
    venue: 'JLN Indoor Stadium',
    city: 'Delhi',
    date: '2024-05-10',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&auto=format&fit=crop',
    price: { min: 999, max: 4999 },
    rating: 4.7,
    duration: '2 hours',
    featured: true,
    seatsAvailable: 3500,
    totalSeats: 5000,
    artists: ['Zakir Khan'],
    genre: 'Stand-up',
  },
  {
    id: 'evt-010',
    title: 'Comicstaan Live Tour',
    description: 'Your favorite comics from Comicstaan come together for one explosive night of laughter!',
    category: 'comedy',
    venue: 'Shanmukhananda Hall',
    city: 'Mumbai',
    date: '2024-05-15',
    time: '19:30',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop',
    price: { min: 799, max: 2999 },
    rating: 4.6,
    duration: '2.5 hours',
    seatsAvailable: 800,
    totalSeats: 1500,
    artists: ['Multiple Artists'],
    genre: 'Stand-up',
  },
  // Festivals
  {
    id: 'evt-011',
    title: 'Sunburn Festival 2024',
    description: 'Asia\'s biggest electronic dance music festival returns with an incredible lineup of international DJs.',
    category: 'festivals',
    venue: 'Vagator Beach',
    city: 'Goa',
    date: '2024-12-28',
    time: '14:00',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop',
    price: { min: 4000, max: 25000 },
    rating: 4.6,
    duration: '3 days',
    featured: true,
    seatsAvailable: 20000,
    totalSeats: 100000,
    genre: 'EDM',
  },
  {
    id: 'evt-012',
    title: 'NH7 Weekender',
    description: 'The happiest music festival celebrates indie music with an eclectic mix of genres and artists.',
    category: 'festivals',
    venue: 'Mahalaxmi Lawns',
    city: 'Pune',
    date: '2024-12-01',
    time: '12:00',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop',
    price: { min: 2500, max: 8000 },
    rating: 4.7,
    duration: '2 days',
    seatsAvailable: 10000,
    totalSeats: 30000,
    genre: 'Indie',
  },
  // Movies
  {
    id: 'evt-013',
    title: 'Dune: Part Three - IMAX Premiere',
    description: 'Witness the epic conclusion to the Dune saga on the largest IMAX screens. A cinematic experience like no other.',
    category: 'movies',
    venue: 'PVR IMAX',
    city: 'Mumbai',
    date: '2024-11-15',
    time: '21:00',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
    price: { min: 800, max: 2500 },
    rating: 4.9,
    duration: '2 hours 45 min',
    featured: true,
    seatsAvailable: 150,
    totalSeats: 400,
    genre: 'Sci-Fi',
  },
  {
    id: 'evt-014',
    title: 'Avengers: Secret Wars - Midnight Screening',
    description: 'Be the first to witness Marvel\'s biggest crossover event. Midnight premiere with exclusive merchandise!',
    category: 'movies',
    venue: 'INOX Megaplex',
    city: 'Delhi',
    date: '2024-11-01',
    time: '00:01',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop',
    price: { min: 600, max: 2000 },
    rating: 4.8,
    duration: '3 hours',
    seatsAvailable: 280,
    totalSeats: 350,
    genre: 'Superhero',
  },
  {
    id: 'evt-015',
    title: 'Pushpa 3: The Finale',
    description: 'Allu Arjun returns as Pushpa Raj for the final chapter. Mass action and entertainment guaranteed!',
    category: 'movies',
    venue: 'AMB Cinemas',
    city: 'Hyderabad',
    date: '2024-12-20',
    time: '09:00',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop',
    price: { min: 300, max: 1200 },
    rating: 4.7,
    duration: '2 hours 50 min',
    seatsAvailable: 500,
    totalSeats: 800,
    genre: 'Action',
  },
];

export const featuredEvents = events.filter(e => e.featured);

export const getEventsByCategory = (category: EventCategory | 'all') => {
  if (category === 'all') return events;
  return events.filter(e => e.category === category);
};

export const getEventById = (id: string) => events.find(e => e.id === id);

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
