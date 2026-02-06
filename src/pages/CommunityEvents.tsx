import { Link } from 'react-router-dom';
import { Loader2, Info, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useShows } from '@/hooks/useShows';

const CommunityEvents = () => {
  const { data, isLoading, isError } = useShows();
  const events = (data as any[]) || [];
  const freeEvents = events.filter((event) => event.price?.min === 0);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Unable to connect to server. Please check your backend connection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Community Events
        </h1>
        <p className="text-muted-foreground">Browse free events from your community.</p>
      </div>

      {freeEvents.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No free community events are available right now. Check back soon.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {freeEvents.map((event) => (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="group rounded-xl overflow-hidden bg-card hover:shadow-xl transition"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{event.genre}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="font-medium text-green-600">Free</span>
                  <span className="text-muted-foreground">
                    ⭐ {event.rating !== undefined ? event.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityEvents;
