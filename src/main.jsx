// src/main.jsx
// The entry point for the React application.

import React from 'react';
import ReactDOM from 'react-dom/client'; // Import the new React 18 root API client
import App from './App.jsx'; // Import the main App component
import { AppProvider } from './context/AppContext.jsx'; // Import the context provider
import './index.css';

// Get the root DOM element where the React app will be mounted
const rootElement = document.getElementById('root');

// Create a React root using the new concurrent mode API
const root = ReactDOM.createRoot(rootElement);

// Render the application within the root
root.render(
  // StrictMode helps identify potential problems in an application
  <React.StrictMode>
    {/* Wrap the entire App component with the AppProvider */}
    {/* This makes the global context available to all components within App */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
