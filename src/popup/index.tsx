import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SessionProvider } from "../context/SessionContext";
import { MemoryRouter } from 'react-router-dom';
import { ClerkProvider } from "@clerk/chrome-extension";


const rootElement = document.getElementById("root");

if (!rootElement) {
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY || ''}>
      <MemoryRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
      </ClerkProvider>
    </React.StrictMode>
  );
}
