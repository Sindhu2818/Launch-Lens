import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Warn in production if served over insecure HTTP
if (import.meta.env.PROD && location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.warn('[Security] This page should be served over HTTPS.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
