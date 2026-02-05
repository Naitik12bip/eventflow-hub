 import { createRoot } from "react-dom/client";
 import App from "./App.tsx";
 import "./index.css";
 import { ClerkProvider } from "./providers/ClerkProvider";
 
 createRoot(document.getElementById("root")!).render(
   <ClerkProvider>
     <App />
   </ClerkProvider>
 );
