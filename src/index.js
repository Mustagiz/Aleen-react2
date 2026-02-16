import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './print.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
