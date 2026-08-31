import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./assets/styles/index.css";

// Configure Global TanStack Query Client with optimal caching rules
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes fresh cache (0 unnecessary DB hits)
      gcTime: 1000 * 60 * 60, // 1 hour memory garbage collection
      retry: 1,
      refetchOnWindowFocus: false, // Don't spam backend when switching tabs
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
