import { useState } from 'react';
import { useShows } from '@/hooks/useShows';
import { EventCategory } from '@/data/events';
import { Link } from 'react-router-dom';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const categories: { label: string; value: EventCategory | 'all' }[] = [
  { label: 'All Events', value: 'all' },
  { label: 'Movies', value: 'movies' },
  { label: 'Concerts', value: 'concerts' },
  { label: 'Sports', value: 'sports' },
  { label: 'Theater', value: 'theater' },
  { label: 'Comedy', value: 'comedy' },
];

interface ShowsResponse {
  events: any[]; // Replace 'any' with your actual Event type if possible
  isFallbackData: boolean;
}

const Events = () => {
  const { data, isLoading } = useShows();
  const [activeCategory, setActiveCategory] = useState<'all' | EventCategory>('all');

  const events = (data as any)?.events ?? [];
  const isShowingDemoData = (data as any)?.isFallbackData ?? false;

  const filteredEvents =
    activeCategory === 'all'
      ? events
      : events.filter(event => event.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isShowingDemoData && (
        <Alert className="mb-6" variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Unable to connect to server. Showing demo events so you can still explore the UI.
          </AlertDescription>
        </Alert>
      )}

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-2">All Events</h1>
      <p className="text-muted-foreground mb-6">
        Discover movies and live events happening near you
      </p>

      {/* Categories */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm transition ${activeCategory === cat.value
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center text-muted-foreground mt-20">
          No events found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEvents.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group rounded-xl overflow-hidden bg-card hover:shadow-xl transition"
            >
              {/* Image */}
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1">
                  {event.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  {event.genre}
                </p>

                <div className="flex items-center justify-between mt-3 text-sm">
                  <span>₹{event.price?.min ?? 'N/A'}</span>
                  <span>⭐ {event.rating ? event.rating.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
