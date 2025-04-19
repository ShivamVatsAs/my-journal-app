// src/pages/HomePage.jsx
// The main landing page of the application.

import React from 'react';
// Ensure useAppContext is correctly imported from your context file path
import { useAppContext } from '../context/AppContext';
// Ensure lucide-react icons are installed and imported
import { Feather, Bot } from 'lucide-react';

// --- Simplified Shadcn UI Inspired Components ---
// NOTE: In a larger application, these UI components (Button, Card, etc.)
// would typically reside in a dedicated 'ui' folder (e.g., src/components/ui/)
// and be imported here. For simplicity in this example, they are defined locally.
const Button = ({ children, onClick, variant = 'default', className = '', ...props }) => {
  // Base styles for all buttons
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  // Variant styles mapping to CSS variables (defined in index.css)
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90", // Uses --primary color
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", // Uses --secondary color
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground", // Added ghost variant for potential use
  };
  // Combine base, variant, and any additional classes passed via props
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className} px-4 py-2`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

// Card component structure using Tailwind classes
const Card = ({ children, className = '', ...props }) => {
  // Uses card-related CSS variables for background/text color defined in index.css
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>{children}</div>;
};
const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>;
};
const CardTitle = ({ children, className = '', ...props }) => {
  // Uses primary color variable for the title text, defined in index.css
  // Added dark mode color variant for better contrast
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight text-primary dark:text-pink-400 ${className}`} {...props}>{children}</h3>;
};
const CardDescription = ({ children, className = '', ...props }) => {
  // Uses muted color variable for description text, defined in index.css
  return <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>;
};
const CardContent = ({ children, className = '', ...props }) => {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>;
};
// --- End Simplified Components ---


/**
 * HomePage Component: Displays navigation buttons to other pages.
 */
const HomePage = () => {
  // Get the function to update the current page from context
  const { setCurrentPage } = useAppContext();

  return (
    // Main container with gradient background and centering styles
    // Uses Tailwind gradient classes and flex utilities
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-950 p-6 text-center">
       {/* Card component for styling the central content */}
       {/* Added shadow-xl and backdrop-blur for better visual effect */}
       {/* Uses card background/foreground variables from index.css */}
       <Card className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl dark:shadow-pink-900/20">
         {/* Card Header with title and description */}
         <CardHeader>
           {/* CardTitle uses primary color */}
           <CardTitle>Our Digital Space</CardTitle>
           {/* CardDescription uses muted color */}
           <CardDescription>Journal your thoughts or chat with our AI assistant.</CardDescription>
         </CardHeader>
         {/* Card Content with navigation buttons */}
         <CardContent className="flex flex-col space-y-4">
            {/* Button to navigate to the Journal page (Primary Style) */}
            <Button
              onClick={() => setCurrentPage('journal')} // Set page state to 'journal' on click
              className="w-full py-3 text-lg" // Styling for the button size/text
              variant="default" // Explicitly use default (primary pink) variant
            >
              <Feather className="mr-2 h-5 w-5" /> Write Journal Entry
            </Button>
            {/* Button to navigate to the AI Assistant page (Secondary Style) */}
            <Button
              onClick={() => setCurrentPage('ai')} // Set page state to 'ai' on click
              variant="secondary" // Use the secondary (purple) style
              // Added opacity for secondary button effect, adjust as needed
              className="w-full py-3 text-lg bg-opacity-80 dark:bg-opacity-70 hover:bg-opacity-100 dark:hover:bg-opacity-80"
            >
               <Bot className="mr-2 h-5 w-5" /> Ask AI Assistant
            </Button>
         </CardContent>
       </Card>
       {/* Simple footer using muted text color */}
       <footer className="mt-8 text-xs text-muted-foreground">
          Made with love - {new Date().getFullYear()}
       </footer>
    </div>
  );
};

// Export the component for use in App.jsx
export default HomePage;
