import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HeroSection } from '@/components/HeroSection';
import { EventCard } from '@/components/EventCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { events, featuredEvents, getEventsByCategory, categories } from '@/data/events';
import { ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
type CategoryId = (typeof categories)[number]['id'] | 'all';
const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const filteredEvents = getEventsByCategory(selectedCategory);

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-12 -mt-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, label: 'Live Events', value: '500+' },
              { icon: TrendingUp, label: 'Tickets Sold', value: '2M+' },
              { icon: Zap, label: 'Cities', value: '50+' },
              { icon: Sparkles, label: 'Happy Customers', value: '1M+' },
            ].map((stat, index) => (
              <div
                key={index}
                className="glass-strong rounded-xl p-4 md:p-6 text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore Events
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From electrifying concerts to thrilling sports matches, discover experiences that move you
            </p>
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={(category) => setSelectedCategory(category as CategoryId)}
          />
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.slice(0, 6).map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>

          {filteredEvents.length > 6 && (
            <div className="text-center mt-12">
              <Link to="/events">
                <Button className="btn-ghost">
                  View All Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Event - Full Width */}
      {featuredEvents[0] && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground">
                🔥 Trending Now
              </h2>
              <Link to="/events" className="text-primary hover:underline flex items-center gap-1">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <EventCard event={featuredEvents[0]} variant="featured" />
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(1).map((category, index) => (
              <Link
                key={category.id}
                to={`/events?category=${category.id}`}
                className="card-interactive p-6 text-center group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-4xl mb-3 block">{category.icon}</span>
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.label}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {events?.filter((e) => e.category === category.id).length} events
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 md:p-16 text-center">
            <div className="hero-glow" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
                Never Miss an Event
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
                Get personalized recommendations, early access to tickets, and exclusive offers delivered straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
                />
                <Button className="bg-background text-primary hover:bg-background/90 px-8 py-4 h-auto font-semibold">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
