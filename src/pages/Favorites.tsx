 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useUser } from '@clerk/clerk-react';
 import { Layout } from '@/components/Layout';
 import { Heart, Ticket } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 const Favorites = () => {
   const navigate = useNavigate();
   const { user, isLoaded } = useUser();
 
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
             My Favorites
           </h1>
           <p className="text-muted-foreground">
             Movies and events you've saved for later
           </p>
         </div>
 
         {/* Empty State - Favorites would need backend integration */}
         <div className="text-center py-20">
           <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
           <h2 className="text-xl font-semibold text-foreground mb-2">
             No favorites yet
           </h2>
           <p className="text-muted-foreground mb-6 max-w-md mx-auto">
             Start adding favorites by clicking the heart icon on any event or movie.
             This feature requires your backend's /api/user/favorites endpoint.
           </p>
           <Button onClick={() => navigate('/events')} className="btn-primary">
             <Ticket className="w-4 h-4 mr-2" />
             Browse Events
           </Button>
         </div>
       </div>
     </Layout>
   );
 };
 
 export default Favorites;