// src/pages/JournalEntryPage.jsx
// Page for users to write and save their daily journal entries.

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext'; // Import context hook
import UserSwitcher from '../components/UserSwitcher'; // Import user selection component
import { Home, Save, Loader2 } from 'lucide-react'; // Import icons (added Loader2 for saving state)

// --- Simplified Shadcn UI Inspired Components ---
// NOTE: See comment in UserSwitcher.jsx about component location in larger apps.
const Button = ({ children, onClick, variant = 'default', className = '', disabled, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

const Textarea = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

const Card = ({ children, className = '', ...props }) => {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>{children}</div>;
};
const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>;
};
const CardTitle = ({ children, className = '', ...props }) => {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>;
};
const CardDescription = ({ children, className = '', ...props }) => {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>;
};
const CardContent = ({ children, className = '', ...props }) => {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>;
};
const CardFooter = ({ children, className = '', ...props }) => {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>{children}</div>;
};
// --- End Simplified Components ---


/**
 * JournalEntryPage Component: Allows selected user to write and save an entry.
 */
const JournalEntryPage = () => {
  // Get context values: page navigation, current user, and the simulated save action
  const { setCurrentPage, currentUser, addJournalEntry } = useAppContext();
  // State for the text area content
  const [entryText, setEntryText] = useState('');
  // State to track if the entry is currently being saved (for button disabling and loading indicator)
  const [isSaving, setIsSaving] = useState(false);
  // State for displaying feedback messages (e.g., success, error)
  const [message, setMessage] = useState('');

  /**
   * Handles the save button click.
   * Validates input, calls the simulated backend function, and updates state.
   */
  const handleSave = async () => {
    // Basic validation: ensure the text area is not empty
    if (!entryText.trim()) {
        setMessage('Please write something before saving.');
        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        return; // Stop execution if validation fails
    }

    setIsSaving(true); // Set saving state to true (disables button, shows loader)
    setMessage(''); // Clear any previous messages
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    // Prepare the entry object to be sent (simulated)
    const entry = {
        user: currentUser, // Use the currently selected user
        date: today,
        text: entryText,
    };

    try {
        // Call the simulated async function from context to save the entry
        const result = await addJournalEntry(entry);
        // Check the simulated response
        if (result.success) {
            setMessage('Entry saved successfully!');
            setEntryText(''); // Clear the text area on successful save
        } else {
            // This part might not be reached if the simulation always returns success
            setMessage('Failed to save entry. Please try again.');
        }
    } catch (error) {
        // Handle potential errors during the simulated save process
        console.error("Error saving entry:", error);
        setMessage('An error occurred while saving. Please try again.');
    } finally {
        // This block runs regardless of success or failure
        setIsSaving(false); // Set saving state back to false
        // Clear the feedback message after a delay
        setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    // Main container with gradient background
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-800 dark:to-purple-950 p-6">
        {/* Card container for the journal form */}
        <Card className="w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm mt-10 shadow-lg dark:shadow-pink-900/10">
            {/* Card Header */}
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary dark:text-pink-400">Daily Journal</CardTitle>
                <CardDescription>How was your day, {currentUser}?</CardDescription>
            </CardHeader>
            {/* Card Content */}
            <CardContent className="space-y-4">
                {/* User selection dropdown */}
                <UserSwitcher />
                {/* Text area for journal entry */}
                <Textarea
                    placeholder={`Write about your day, ${currentUser}...`}
                    value={entryText} // Controlled component
                    onChange={(e) => setEntryText(e.target.value)} // Update state on change
                    rows={10} // Set number of visible rows
                    className="focus:border-primary focus:ring-primary" // Custom focus style
                    disabled={isSaving} // Disable textarea while saving
                />
                {/* Display feedback message if present */}
                {message && (
                    <p className={`text-sm font-medium ${message.includes('Failed') || message.includes('error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {message}
                    </p>
                )}
            </CardContent>
            {/* Card Footer with action buttons */}
            <CardFooter className="flex justify-between items-center">
                 {/* Button to navigate back home */}
                 <Button
                    onClick={() => setCurrentPage('home')}
                    variant="outline" // Use outline style
                    disabled={isSaving} // Disable if saving
                 >
                    <Home className="mr-2 h-4 w-4" /> Back Home
                 </Button>
                 {/* Button to save the entry */}
                 <Button onClick={handleSave} disabled={isSaving}>
                    {/* Show loading spinner if saving, otherwise show Save icon */}
                    {isSaving ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Loading spinner icon
                    ) : (
                        <Save className="mr-2 h-4 w-4" /> // Save icon
                    )}
                    {/* Change button text based on saving state */}
                    {isSaving ? 'Saving...' : 'Save Entry'}
                 </Button>
            </CardFooter>
        </Card>
    </div>
  );
};

export default JournalEntryPage; // Export the component
