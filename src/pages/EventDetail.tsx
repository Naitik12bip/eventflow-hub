import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SeatSelector } from '@/components/SeatSelector';
import { getEventById, formatPrice, formatDate } from '@/data/events';
import { useMovieDetails, ShowTime } from '@/hooks/useMovieDetails';
import { useOccupiedSeats } from '@/hooks/useOccupiedSeats';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Users,
  Share2,
  Heart,
  ChevronRight,
  Ticket,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SelectedSeat {
  id: string;
  row: string;
  number: number;
  type: 'standard' | 'premium' | 'vip';
  price: number;
  status: 'available' | 'selected' | 'reserved';
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowTime | null>(null);

  // Try to fetch from API first (for movies)
  const { data: movieDetails, isLoading: isLoadingMovie } = useMovieDetails(id);

  // Fetch occupied seats for selected show
  const { data: occupiedSeats } = useOccupiedSeats(selectedShow?.id);

  // Fallback to static event data
  const staticEvent = getEventById(id || '');

  // Determine which data to use
  const event = useMemo(() => {
    if (movieDetails) {
      return {
        id: movieDetails.id.toString(),
        title: movieDetails.title,
        description: movieDetails.description,
        category: 'movies' as const,
        venue: 'Cinema Hall',
        city: 'Your City',
        date: movieDetails.shows[0]?.formattedDate || '',
        time: movieDetails.shows[0]?.formattedTime || '',
        image: movieDetails.image,
        price: {
          min: movieDetails.shows[0]?.price || 500,
          max: (movieDetails.shows[0]?.price || 500) * 4,
        },
        rating: movieDetails.rating,
        duration: movieDetails.duration,
        featured: movieDetails.rating >= 7.5,
        seatsAvailable: 96 - (occupiedSeats?.length || 0),
        totalSeats: 96,
        genre: movieDetails.genres[0] || 'Movie',
        artists: [],
      };
    }
    return staticEvent;
  }, [movieDetails, staticEvent, occupiedSeats]);

  // Loading state
  if (isLoadingMovie) {
    return (
      <Layout>
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-strong rounded-2xl p-6 md:p-8 space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-2xl p-6 space-y-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }


  // Handle show selection for movies
  const handleShowSelect = (show: ShowTime) => {
    setSelectedShow(show);
    setSelectedSeats([]);
  };

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Event Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </div>
      </Layout>
    );
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    // Store booking data and navigate to checkout
    const bookingData = {
      event,
      showId: selectedShow?.id,
      seats: selectedSeats,
      total: selectedSeats.reduce((acc, s) => acc + s.price, 0),
    };
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    navigate('/checkout');
  };

  const handleShare = async () => {
    const sharePayload = {
      title: event.title,
      text: event.description,
      url: window.location.href,
  };
     };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharePayload.url);
        toast.success('Link copied to clipboard!');
        return;
      }

      toast.error('Sharing is not supported on this device.');
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Unable to share the event right now.');
    }
};

  const totalAmount = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="glass hover:bg-card/80"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`glass hover:bg-card/80 ${isFavorite ? 'text-accent' : ''}`}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info Card */}
            <div className="glass-strong rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
                  {event.category}
                </Badge>
                {event.featured && (
                  <Badge className="bg-gradient-accent text-accent-foreground border-0">
                    🔥 Featured
                  </Badge>
                )}
                {event.genre && (
                  <Badge variant="outline" className="border-border/50">
                    {event.genre}
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {event.title}
              </h1>

              {event.artists && event.artists.length > 0 && (
                <p className="text-xl text-muted-foreground">
                  {event.artists.join(' • ')}
                </p>
              )}

              <div className="flex flex-wrap gap-6">
                {event.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <span className="font-semibold">{event.rating}</span>
                    <span className="text-muted-foreground">(2.5k reviews)</span>
                  </div>
                )}
                {event.duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    <span>{event.duration}</span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Date & Time</p>
                    <p className="font-semibold text-foreground">
                      {formatDate(event.date)}
                    </p>
                    <p className="text-muted-foreground">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Venue</p>
                    <p className="font-semibold text-foreground">{event.venue}</p>
                    <p className="text-muted-foreground">{event.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="seats" className="w-full">
              <TabsList className="w-full bg-card/50 border border-border/50">
                <TabsTrigger value="seats" className="flex-1">
                  <Ticket className="w-4 h-4 mr-2" />
                  Select Seats
                </TabsTrigger>
                <TabsTrigger value="about" className="flex-1">
                  <Info className="w-4 h-4 mr-2" />
                  About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seats" className="mt-6">
                <div className="glass-strong rounded-2xl p-6">
                  {/* Show Time Selection for Movies */}
                  {movieDetails && movieDetails.shows.length > 0 && (
                    <div className="mb-8">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                        Select Show Time
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {movieDetails.shows.map((show) => (
                          <button
                            key={show.id}
                            onClick={() => handleShowSelect(show)}
                            className={`px-4 py-3 rounded-lg border transition-all ${selectedShow?.id === show.id
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-border/50 bg-muted/30 text-foreground hover:border-primary/50'
                              }`}
                          >
                            <p className="font-medium">{show.formattedDate}</p>
                            <p className="text-sm text-muted-foreground">{show.formattedTime}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seat Selector */}
                  {(!movieDetails || selectedShow) ? (
                    <SeatSelector
                      onSeatsChange={setSelectedSeats}
                      occupiedSeats={occupiedSeats || []}
                      showPrice={selectedShow?.price}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Please select a show time to view available seats</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <div className="glass-strong rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      About This Event
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      Venue Information
                    </h3>
                    <p className="text-muted-foreground">
                      {event.venue}, {event.city}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      Terms & Conditions
                    </h3>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Entry is subject to valid ID proof</li>
                      <li>• No refunds or exchanges on purchased tickets</li>
                      <li>• Outside food and beverages are not allowed</li>
                      <li>• Photography may be restricted during the event</li>
                      <li>• Arrive 30 minutes before the event starts</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 glass-strong rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <span className="text-muted-foreground">Starting from</span>
                <span className="font-display text-2xl font-bold text-primary">
                  {formatPrice(event.price.min)}
                </span>
              </div>

              {event.seatsAvailable && event.totalSeats && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Availability
                    </span>
                    <span className="text-success font-medium">
                      {event.seatsAvailable.toLocaleString()} left
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all"
                      style={{
                        width: `${((event.totalSeats - event.seatsAvailable) / event.totalSeats) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(((event.totalSeats - event.seatsAvailable) / event.totalSeats) * 100)}% sold
                  </p>
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/50 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected Seats</span>
                    <span className="text-foreground font-medium">
                      {selectedSeats.map((s) => s.id).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tickets</span>
                    <span className="text-foreground font-medium">
                      {selectedSeats.length} × seat
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Convenience Fee</span>
                    <span className="text-foreground font-medium">
                      {formatPrice(Math.round(totalAmount * 0.05))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border/50">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-display text-xl font-bold text-primary">
                      {formatPrice(Math.round(totalAmount * 1.05))}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full btn-primary h-14 text-lg"
                onClick={handleBooking}
                disabled={selectedSeats.length === 0}
              >
                {selectedSeats.length > 0 ? (
                  <>
                    Proceed to Payment
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  'Select Seats to Continue'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;
