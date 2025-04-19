// src/context/AppContext.jsx
// Manages global application state and interacts with the backend API.

import React, { useState, createContext, useContext } from 'react';

// --- Context Definition ---
const AppContext = createContext();

// --- Provider Component ---
export const AppProvider = ({ children }) => {
  // State for the currently active page ('home', 'journal', 'ai')
  const [currentPage, setCurrentPage] = useState('home');
  // State for the currently selected user ('Shivam', 'Shreya')
  const [currentUser, setCurrentUser] = useState('Shivam');

  // --- Backend API Base URL ---
  // *** FIX: Use import.meta.env.PROD provided by Vite ***
  // import.meta.env.PROD is true when running the production build (vite build)
  // import.meta.env.DEV is true when running the development server (vite)
  const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';

  console.log(`API Base URL set to: ${API_BASE_URL}`); // Add this log for debugging

  // --- Functions to Interact with Backend API ---

  /**
   * Sends a new journal entry to the backend API.
   * @param {object} entry - The journal entry object { user, date, text }.
   * @returns {Promise<{success: boolean, message?: string, entry?: object}>} - Result from the backend.
   */
  const addJournalEntry = async (entry) => {
    console.log(`Attempting to POST to: ${API_BASE_URL}/journal`); // Add log
    try {
      const response = await fetch(`${API_BASE_URL}/journal`, { // Uses the corrected URL logic
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend Error (addJournalEntry):', data, `Status: ${response.status}`); // Log status too
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Entry saved via backend:', data.entry);
      return { success: true, message: data.message || 'Entry saved!', entry: data.entry };

    } catch (error) {
      // Log the specific error encountered during fetch
      console.error('Error calling addJournalEntry API:', error);
      // Make the message more specific if it's a fetch failure
      const errorMessage = (error instanceof TypeError && error.message === 'Failed to fetch')
        ? 'Network error: Could not connect to the API.'
        : error.message || 'An unknown error occurred.';
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Fetches journal entries for a specific user (and optionally date) from the backend API.
   * @param {string} user - The user whose entries to fetch ('Shivam' or 'Shreya').
   * @param {string} [date] - Optional date string (YYYY-MM-DD) to filter entries.
   * @returns {Promise<object[]>} - A promise resolving to an array of matching entries fetched from backend.
   */
  const getJournalEntries = async (user, date) => {
    try {
      let url = `${API_BASE_URL}/journal/${user}`;
      if (date) {
        url += `?date=${encodeURIComponent(date)}`;
      }
      console.log(`Attempting to GET from: ${url}`); // Add log

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
         console.error('Backend Error (getJournalEntries):', data, `Status: ${response.status}`);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`Fetched ${data.length} entries for ${user}` + (date ? ` on ${date}` : '') + ' from backend.');
      return data;

    } catch (error) {
      console.error('Error calling getJournalEntries API:', error);
       const errorMessage = (error instanceof TypeError && error.message === 'Failed to fetch')
        ? 'Network error: Could not connect to the API.'
        : error.message || 'An unknown error occurred.';
       // Maybe return an object indicating error instead of empty array?
       // For now, keeping empty array to avoid breaking components expecting an array.
       // Consider adding error state handling in components using this function.
      return [];
    }
  };

  /**
   * Sends a query to the backend AI endpoint.
   * @param {string} query - The user's query text.
   * @param {string} askingUser - The user making the request ('Shivam' or 'Shreya').
   * @returns {Promise<string>} - A promise resolving to the AI's response text.
   */
  const askAI = async (query, askingUser) => {
     console.log(`Attempting to POST to: ${API_BASE_URL}/ai`); // Add log
    try {
        const response = await fetch(`${API_BASE_URL}/ai`, { // Uses the corrected URL logic
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, askingUser }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Backend Error (askAI):', data, `Status: ${response.status}`);
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        console.log('AI response received from backend.');
        return data.response;

    } catch (error) {
        console.error('Error calling askAI API:', error);
         const errorMessage = (error instanceof TypeError && error.message === 'Failed to fetch')
            ? `Network error: Could not connect to the AI assistant.`
            : error.message || 'An unknown error occurred.';
        return `Sorry, I couldn't connect to the AI assistant right now. (${errorMessage})`;
    }
  };

  // --- Context Value ---
  const value = {
    currentPage,
    setCurrentPage,
    currentUser,
    setCurrentUser,
    addJournalEntry,
    getJournalEntries,
    askAI,
    API_BASE_URL // Expose it if needed for debugging or direct use elsewhere
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Custom Hook ---
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
