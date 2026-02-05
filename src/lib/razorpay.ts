 // Razorpay Key ID from environment
 const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
 
 // Declare Razorpay on window
 declare global {
   interface Window {
     Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
   }
 }
 
 interface RazorpayOptions {
   key: string;
   amount: number;
   currency: string;
   name: string;
   description: string;
   order_id: string;
   handler: (response: RazorpayResponse) => void;
   prefill?: {
     name?: string;
     email?: string;
     contact?: string;
   };
   theme?: {
     color?: string;
   };
   modal?: {
     ondismiss?: () => void;
   };
 }
 
 interface RazorpayInstance {
   open: () => void;
   close: () => void;
 }
 
 export interface RazorpayResponse {
   razorpay_payment_id: string;
   razorpay_order_id: string;
   razorpay_signature: string;
 }
 
 export interface RazorpayOrderData {
   orderId: string;
   amount: number;
   currency: string;
 }
 
 // Load Razorpay script dynamically
 export const loadRazorpayScript = (): Promise<boolean> => {
   return new Promise((resolve) => {
     if (window.Razorpay) {
       resolve(true);
       return;
     }
 
     const script = document.createElement('script');
     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
     script.onload = () => resolve(true);
     script.onerror = () => resolve(false);
     document.body.appendChild(script);
   });
 };
 
 // Open Razorpay checkout modal
 export const openRazorpayCheckout = (
   orderData: RazorpayOrderData,
   userInfo: { name?: string; email?: string; phone?: string },
   movieTitle: string,
   onSuccess: (response: RazorpayResponse) => void,
   onDismiss?: () => void
 ): void => {
   if (!window.Razorpay) {
     console.error('Razorpay script not loaded');
     return;
   }
 
   const options: RazorpayOptions = {
     key: RAZORPAY_KEY_ID,
     amount: orderData.amount,
     currency: orderData.currency,
     name: 'EventHub',
     description: `Tickets for ${movieTitle}`,
     order_id: orderData.orderId,
     handler: onSuccess,
     prefill: {
       name: userInfo.name,
       email: userInfo.email,
       contact: userInfo.phone,
     },
     theme: {
       color: '#E11D48', // Primary color
     },
     modal: {
       ondismiss: onDismiss,
     },
   };
 
   const razorpay = new window.Razorpay(options);
   razorpay.open();
 };