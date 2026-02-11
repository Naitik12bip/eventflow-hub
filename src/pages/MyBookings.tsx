 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useUser } from '@clerk/clerk-react';
 import { Layout } from '@/components/Layout';
 import { useUserBookings } from '@/hooks/useBookings';
 import { formatPrice } from '@/data/events';
 import { Calendar, MapPin, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Badge } from '@/components/ui/badge';
 
 const MyBookings = () => {
   const navigate = useNavigate();
   const { user, isLoaded } = useUser();
   const { data: bookings, isLoading, error } = useUserBookings();
 
   // Redirect to auth if not logged in
   useEffect(() => {
     if (isLoaded && !user) {
       navigate('/auth');
     }
   }, [isLoaded, user, navigate]);
 
   if (!isLoaded || !user) {
     return (
       <Layout>
         <div className="container mx-auto px-4 py-20 flex justify-center">
           <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="mb-8">
           <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
             My Bookings
           </h1>
           <p className="text-muted-foreground">
             View your booking history and upcoming events
           </p>
         </div>
 
         {/* Loading State */}
         {isLoading && (
           <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="glass-strong rounded-2xl p-6">
                 <div className="flex gap-4">
                   <Skeleton className="w-24 h-32 rounded-lg" />
                   <div className="flex-1 space-y-3">
                     <Skeleton className="h-6 w-1/2" />
                     <Skeleton className="h-4 w-1/3" />
                     <Skeleton className="h-4 w-1/4" />
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
 
         {/* Error State */}
         {error && (
           <div className="text-center py-12">
             <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
             <h2 className="text-xl font-semibold text-foreground mb-2">
               Failed to load bookings
             </h2>
             <p className="text-muted-foreground mb-4">
               Please make sure your backend is running and try again.
             </p>
             <Button onClick={() => window.location.reload()}>
               Retry
             </Button>
           </div>
         )}
 
         {/* Empty State */}
         {!isLoading && !error && bookings?.length === 0 && (
           <div className="text-center py-20">
             <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
             <h2 className="text-xl font-semibold text-foreground mb-2">
               No bookings yet
             </h2>
             <p className="text-muted-foreground mb-6">
               Start by browsing our exciting events and book your first ticket!
             </p>
             <Button onClick={() => navigate('/events')} className="btn-primary">
               Browse Events
             </Button>
           </div>
         )}
 
         {/* Bookings List */}
         {!isLoading && bookings && bookings.length > 0 && (
           <div className="space-y-4">
             {bookings.map((booking) => (
               <div
                 key={booking.id}
                 className="glass-strong rounded-2xl p-6 hover:border-primary/30 transition-all"
               >
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Poster */}
                    <img
                      src={booking.eventImage}
                      alt={booking.eventTitle}
                      className="w-24 h-32 rounded-lg object-cover flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-display text-xl font-bold text-foreground">
                          {booking.eventTitle}
                        </h3>
                        <Badge
                          className={
                            booking.status === 'confirmed'
                              ? 'bg-success/20 text-success border-success/30'
                              : booking.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                              : 'bg-destructive/20 text-destructive border-destructive/30'
                          }
                        >
                          {booking.status === 'confirmed' && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {booking.eventTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{booking.eventTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.venue}{booking.city ? `, ${booking.city}` : ''}</span>
                        </div>
                      </div>
 
                     <div className="flex flex-wrap justify-between items-end gap-4 pt-2 border-t border-border/50">
                       <div>
                         <p className="text-sm text-muted-foreground">Seats</p>
                         <p className="font-medium text-foreground">
                           {booking.seats.join(', ')}
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-sm text-muted-foreground">Total</p>
                         <p className="font-display text-xl font-bold text-primary">
                           {formatPrice(booking.totalAmount)}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     </Layout>
   );
 };
 
 export default MyBookings;