// src/App.jsx
// The root component that orchestrates page rendering based on global state.

import React from 'react';
import { useAppContext } from './context/AppContext'; // Import the custom hook to access context
import HomePage from './pages/HomePage'; // Import page components
import JournalEntryPage from './pages/JournalEntryPage';
import AiAssistantPage from './pages/AiAssistantPage';

/**
 * App Component: The main application shell.
 * It determines which page component to render based on the `currentPage`
 * state managed by `AppContext`.
 */
function App() {
  // Retrieve the current page state from the global context
  const { currentPage } = useAppContext();

  /**
   * Conditionally renders the active page component.
   * @returns {React.ReactElement} The component for the current page.
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'journal':
        return <JournalEntryPage />; // Render Journal page
      case 'ai':
        return <AiAssistantPage />; // Render AI Assistant page
      case 'home': // Fallthrough for 'home'
      default: // Default to Home page if state is unexpected
        return <HomePage />; // Render Home page
    }
  };

  // Optional: Add logic here to toggle 'dark' class on <html> element
  // based on user preference or system settings for dark mode.
  // Example using system preference:
  // React.useEffect(() => {
  //   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  //   const handleChange = () => document.documentElement.classList.toggle('dark', mediaQuery.matches);
  //   handleChange(); // Initial check
  //   mediaQuery.addEventListener('change', handleChange);
  //   return () => mediaQuery.removeEventListener('change', handleChange);
  // }, []);

  return (
    // Root div with base text styling applied via index.css
    <div className="antialiased">
       {/* Render the currently selected page */}
       {renderPage()}
    </div>
  );
}

export default App; // Export the main App component
