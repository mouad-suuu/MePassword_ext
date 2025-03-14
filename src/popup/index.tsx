import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SessionProvider } from "../context/SessionContext";

console.log("Index.tsx is running");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found");
} else {
  console.log("Root element found");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <SessionProvider>
        <App />
      </SessionProvider>
    </React.StrictMode>
  );
}
