 import { ClerkProvider as BaseClerkProvider, useAuth } from '@clerk/clerk-react';
 import { ReactNode, useEffect } from 'react';
 import { setTokenGetter } from '@/lib/api';
 
 // Clerk publishable key from environment
 const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_cG9saXRlLW1vbmFyY2gtMzguY2xlcmsuYWNjb3VudHMuZGV2JA';
 
 if (!CLERK_PUBLISHABLE_KEY) {
   console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
 }
 
 // Component to set up the API token getter
 const TokenSetup = ({ children }: { children: ReactNode }) => {
   const { getToken } = useAuth();
 
   useEffect(() => {
     // Set the token getter for API calls
     setTokenGetter(async () => {
       try {
         return await getToken();
       } catch {
         return null;
       }
     });
   }, [getToken]);
 
   return <>{children}</>;
 };
 
 interface ClerkProviderProps {
   children: ReactNode;
 }
 
 export const ClerkProvider = ({ children }: ClerkProviderProps) => {
   return (
     <BaseClerkProvider 
       publishableKey={CLERK_PUBLISHABLE_KEY}
       appearance={{
         variables: {
           colorPrimary: '#E11D48',
           colorBackground: '#0A0A0A',
           colorText: '#FAFAFA',
           colorInputBackground: '#1A1A1A',
           colorInputText: '#FAFAFA',
           borderRadius: '0.75rem',
         },
         elements: {
           card: 'bg-card border border-border shadow-xl',
           headerTitle: 'text-foreground',
           headerSubtitle: 'text-muted-foreground',
           socialButtonsBlockButton: 'bg-muted hover:bg-muted/80 border-border',
           formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
           footerActionLink: 'text-primary hover:text-primary/80',
           formFieldInput: 'bg-muted border-border focus:border-primary',
           formFieldLabel: 'text-foreground',
           dividerLine: 'bg-border',
           dividerText: 'text-muted-foreground',
         },
       }}
     >
       <TokenSetup>
         {children}
       </TokenSetup>
     </BaseClerkProvider>
   );
 };