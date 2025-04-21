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
  const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';
  console.log(`Using API Base URL: ${API_BASE_URL}`); // Good for debugging

  // --- Functions to Interact with Backend API ---

  /**
   * Sends a new journal entry to the backend API.
   */
  const addJournalEntry = async (entry) => {
    try {
      const response = await fetch(`${API_BASE_URL}/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Backend Error (addJournalEntry):', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      console.log('Entry saved via backend:', data.entry);
      return { success: true, message: data.message || 'Entry saved!', entry: data.entry };
    } catch (error) {
      console.error('Error calling addJournalEntry API:', error);
      return { success: false, message: error.message || 'Network error or backend unavailable.' };
    }
  };

  /**
   * Fetches journal entries for a specific user (and optionally date) from the backend API.
   */
  const getJournalEntries = async (user, date) => {
    try {
      let url = `${API_BASE_URL}/journal/${user}`;
      if (date) {
        url += `?date=${encodeURIComponent(date)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
         console.error('Backend Error (getJournalEntries):', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      console.log(`Fetched ${data.length} entries for ${user}` + (date ? ` on ${date}` : '') + ' from backend.');
      return data;
    } catch (error) {
      console.error('Error calling getJournalEntries API:', error);
      return [];
    }
  };

  /**
   * Sends a query and chat history to the backend AI endpoint.
   * @param {string} query - The user's current query text.
   * @param {string} askingUser - The user making the request ('Shivam' or 'Shreya').
   * @param {Array<{sender: string, text: string}>} chatHistory - The recent chat messages.
   * @returns {Promise<string>} - A promise resolving to the AI's response text.
   */
  const askAI = async (query, askingUser, chatHistory) => { // Added chatHistory parameter
    try {
        const response = await fetch(`${API_BASE_URL}/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the query, asking user, and the chat history
            body: JSON.stringify({ query, askingUser, chatHistory }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Backend Error (askAI):', data);
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        console.log('AI response received from backend.');
        return data.response;

    } catch (error) {
        console.error('Error calling askAI API:', error);
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
    askAI,              // Provide the backend-connected function WITH history parameter
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
