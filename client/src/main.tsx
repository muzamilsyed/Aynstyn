import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import faviconImage from "./assets/favicon.png";

// Set favicon dynamically
const setFavicon = (faviconPath: string) => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.setAttribute('rel', 'shortcut icon');
  link.setAttribute('href', faviconPath);
  document.getElementsByTagName('head')[0].appendChild(link);
};

// Using the imported image URL
setFavicon(faviconImage);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);
