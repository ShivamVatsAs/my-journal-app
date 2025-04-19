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
  // Journal entries state is removed here, as data will be fetched on demand from backend.
  // You could add caching here later if needed.

  // --- Backend API Base URL ---
  // Make sure this matches the port your server is running on (from server.js)
  const API_BASE_URL = 'http://localhost:5001/api'; // Using port 5001 from server.js

  // --- Functions to Interact with Backend API ---

  /**
   * Sends a new journal entry to the backend API.
   * @param {object} entry - The journal entry object { user, date, text }.
   * @returns {Promise<{success: boolean, message?: string, entry?: object}>} - Result from the backend.
   */
  const addJournalEntry = async (entry) => {
    try {
      // Make a POST request to the backend endpoint
      // **** FIX: Changed '/entries' to '/journal' to match server.js ****
      const response = await fetch(`${API_BASE_URL}/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Indicate we're sending JSON data
        },
        // Convert the entry object to a JSON string for the request body
        body: JSON.stringify(entry),
      });

      // Parse the JSON response from the backend
      const data = await response.json();

      // Check if the request was successful (status code 2xx)
      if (!response.ok) {
        console.error('Backend Error (addJournalEntry):', data);
        // Throw an error with the message from the backend, or a default message
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Entry saved via backend:', data.entry);
      // Return the success status and message from the backend response
      // Make sure backend sends { success: true, ... } on status 201
      // Currently server.js sends { success: true, entry: newEntry } which is good.
      return { success: true, message: data.message || 'Entry saved!', entry: data.entry };

    } catch (error) {
      // Handle network errors or errors thrown from the response check
      console.error('Error calling addJournalEntry API:', error);
      // Return a failure status and the error message
      return { success: false, message: error.message || 'Network error or backend unavailable.' };
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
      // Construct the URL, adding the date as a query parameter if provided
      // **** FIX: Changed '/entries/' to '/journal/' to match server.js ****
      let url = `${API_BASE_URL}/journal/${user}`;
      if (date) {
        // Ensure the date is properly URL-encoded if needed, though YYYY-MM-DD is usually safe
        url += `?date=${encodeURIComponent(date)}`; // Added encodeURIComponent just in case
      }

      // Make a GET request to the backend endpoint
      const response = await fetch(url);
      // Parse the JSON response
      const data = await response.json();

      // Check if the request was successful
      if (!response.ok) {
         console.error('Backend Error (getJournalEntries):', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`Fetched ${data.length} entries for ${user}` + (date ? ` on ${date}` : '') + ' from backend.');
      // Return the array of entries received from the backend
      return data;

    } catch (error) {
      // Handle network errors or errors from the response check
      console.error('Error calling getJournalEntries API:', error);
      // Return an empty array in case of error to prevent crashes in components expecting an array
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
    try {
        // Make a POST request to the backend AI endpoint
         // **** FIX: Changed '/askAI' to '/ai' to match server.js ****
        const response = await fetch(`${API_BASE_URL}/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the query and asking user in the request body
            body: JSON.stringify({ query, askingUser }),
        });

        // Parse the JSON response
        const data = await response.json();

        // Check if the request was successful
        if (!response.ok) {
            console.error('Backend Error (askAI):', data);
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        console.log('AI response received from backend.');
        // Return the AI's response text from the backend data (ensure server.js sends { response: ... })
        return data.response;

    } catch (error) {
        // Handle network errors or errors from the response check
        console.error('Error calling askAI API:', error);
        // Return a user-friendly error message
        return `Sorry, I couldn't connect to the AI assistant right now. (${error.message || 'Network error or backend unavailable.'})`;
    }
  };

  // --- Context Value ---
  // The value object contains the state and the functions that now interact with the backend.
  const value = {
    currentPage,
    setCurrentPage,
    currentUser,
    setCurrentUser,
    addJournalEntry,    // Provide the backend-connected function
    getJournalEntries,  // Provide the backend-connected function
    askAI,              // Provide the backend-connected function
  };

  // Return the Provider component, passing the value to its children.
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Custom Hook for easy context consumption ---
// This hook simplifies accessing the context value in consumer components.
export const useAppContext = () => {
  const context = useContext(AppContext);
  // Ensure the hook is used within a component wrapped by AppProvider
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};