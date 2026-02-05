 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
 import { Layout } from '@/components/Layout';
 import { Ticket } from 'lucide-react';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 
 const Auth = () => {
   const navigate = useNavigate();
   const { isSignedIn, isLoaded } = useUser();
 
   useEffect(() => {
     // Redirect if already signed in
     if (isLoaded && isSignedIn) {
       navigate('/');
     }
   }, [isLoaded, isSignedIn, navigate]);
 
   if (!isLoaded) {
     return (
       <Layout>
         <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
           <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
         </div>
       </Layout>
     );
   }
 
   return (
     <Layout>
       <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
         <div className="w-full max-w-md">
           <div className="text-center mb-8">
             <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 glow">
               <Ticket className="w-8 h-8 text-primary-foreground" />
             </div>
             <h1 className="font-display text-3xl font-bold text-foreground">
               Welcome to EventHub
             </h1>
             <p className="text-muted-foreground mt-2">
               Sign in to book your favorite events
             </p>
           </div>
 
           <div className="glass-strong rounded-2xl p-6 md:p-8">
             <Tabs defaultValue="signin" className="w-full">
               <TabsList className="w-full bg-muted/50 mb-6">
                 <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                 <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
               </TabsList>
 
               <TabsContent value="signin" className="flex justify-center">
                 <SignIn 
                   routing="hash" 
                   afterSignInUrl="/"
                   appearance={{
                     elements: {
                       rootBox: 'w-full',
                       card: 'bg-transparent shadow-none p-0',
                       headerTitle: 'hidden',
                       headerSubtitle: 'hidden',
                       socialButtonsBlockButton: 'bg-muted hover:bg-muted/80 border-border text-foreground',
                       formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                       footerAction: 'hidden',
                       formFieldInput: 'bg-muted/50 border-border/50 text-foreground',
                       formFieldLabel: 'text-foreground',
                       identityPreviewEditButton: 'text-primary',
                       formFieldInputShowPasswordButton: 'text-muted-foreground',
                     },
                   }}
                 />
               </TabsContent>
 
               <TabsContent value="signup" className="flex justify-center">
                 <SignUp 
                   routing="hash"
                   afterSignUpUrl="/"
                   appearance={{
                     elements: {
                       rootBox: 'w-full',
                       card: 'bg-transparent shadow-none p-0',
                       headerTitle: 'hidden',
                       headerSubtitle: 'hidden',
                       socialButtonsBlockButton: 'bg-muted hover:bg-muted/80 border-border text-foreground',
                       formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                       footerAction: 'hidden',
                       formFieldInput: 'bg-muted/50 border-border/50 text-foreground',
                       formFieldLabel: 'text-foreground',
                       formFieldInputShowPasswordButton: 'text-muted-foreground',
                     },
                   }}
                 />
               </TabsContent>
             </Tabs>
 
             <p className="text-center text-xs text-muted-foreground mt-6">
               By signing up, you agree to our Terms of Service and Privacy Policy
             </p>
           </div>
         </div>
       </div>
     </Layout>
   );
 };
 
 export default Auth;
