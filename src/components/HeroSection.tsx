import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { featuredEvents, formatPrice, formatDate } from '@/data/events';

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  const currentEvent = featuredEvents[currentSlide];

  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
      {/* Background Images */}
      {featuredEvents.map((event, index) => (
        <div
          key={event.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
      ))}

      {/* Hero Glow Effect */}
      <div className="hero-glow" />

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-6 animate-fade-in" key={currentEvent.id}>
          {/* Category Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium capitalize">{currentEvent.category}</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            {currentEvent.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-xl">
            {currentEvent.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>{formatDate(currentEvent.date)} at {currentEvent.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <span>{currentEvent.venue}, {currentEvent.city}</span>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div>
              <span className="text-muted-foreground text-sm">Starting from</span>
              <p className="font-display text-3xl font-bold text-primary">
                {formatPrice(currentEvent.price.min)}
              </p>
            </div>
            <Link to={`/event/${currentEvent.id}`}>
              <Button className="btn-primary h-14 px-8 text-lg">
                <Play className="w-5 h-5 mr-2" />
                Book Tickets
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="btn-ghost h-14 px-8 text-lg">
                Explore All
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-1/2 translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full glass pointer-events-auto hover:bg-primary/20"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full glass pointer-events-auto hover:bg-primary/20"
          onClick={nextSlide}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-primary glow'
                : 'w-2 bg-muted-foreground/50 hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
