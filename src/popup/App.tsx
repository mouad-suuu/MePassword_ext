import React from "react";
import { SessionProvider } from "../context/SessionContext";
import { AppRouter } from './routes';
import "./globals.css";
import { ClerkProvider } from "@clerk/chrome-extension";

const PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing CLERK_PUBLISHABLE_KEY environment variable');
}

const App = () => {
  return (
 
      <SessionProvider>
        <div className="min-w-[400px] min-h-96 bg-background text-foreground">
          <AppRouter />
        </div>
      </SessionProvider>

  );
};

export default App;
