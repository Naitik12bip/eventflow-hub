import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Star, Users } from 'lucide-react';
import { Event, formatPrice, formatDate } from '@/data/events';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'featured' | 'compact';
}

export const EventCard = ({ event, variant = 'default' }: EventCardProps) => {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  return (
    <Link
      to={`/event/${event.id}`}
      className={cn(
        'group block card-interactive rounded-xl overflow-hidden',
        isFeatured && 'lg:flex lg:h-80'
      )}
    >
      {/* Image */}
      <div
        className={cn(
          'relative overflow-hidden',
          isFeatured ? 'lg:w-1/2 h-48 lg:h-full' : isCompact ? 'h-32' : 'h-48'
        )}
      >
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 capitalize">
          {event.category}
        </Badge>

        {/* Featured Badge */}
        {event.featured && (
          <Badge className="absolute top-3 right-3 bg-gradient-accent text-accent-foreground border-0">
            🔥 Featured
          </Badge>
        )}

        {/* Sold Out Overlay */}
        {event.soldOut && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-destructive font-bold text-xl">SOLD OUT</span>
          </div>
        )}

        {/* Rating */}
        {event.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-sm font-medium">{event.rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('p-4 space-y-3', isFeatured && 'lg:w-1/2 lg:p-6 lg:flex lg:flex-col lg:justify-center')}>
        <div>
          <h3 className={cn(
            'font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2',
            isFeatured ? 'text-2xl' : isCompact ? 'text-base' : 'text-lg'
          )}>
            {event.title}
          </h3>
          {event.artists && event.artists.length > 0 && !isCompact && (
            <p className="text-muted-foreground text-sm mt-1">
              {event.artists.join(', ')}
            </p>
          )}
        </div>

        {!isCompact && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-primary" />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-primary" />
            {event.time}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-accent" />
          <span>{event.venue}, {event.city}</span>
        </div>

        {event.seatsAvailable && event.totalSeats && !isCompact && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-success" />
            <span className="text-success font-medium">
              {event.seatsAvailable.toLocaleString()} seats left
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full"
                style={{ width: `${((event.totalSeats - event.seatsAvailable) / event.totalSeats) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-sm">
            <span className="text-muted-foreground">Starting at</span>
            <p className="font-display font-bold text-primary text-lg">
              {formatPrice(event.price.min)}
            </p>
          </div>
          <div className="btn-primary text-sm px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            Book Now
          </div>
        </div>
      </div>
    </Link>
  );
};
