// src/pages/HomePage.jsx
// The main landing page of the application.

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Feather, Bot } from 'lucide-react';

// --- Simplified Shadcn UI Inspired Components ---
const Button = ({ children, onClick, variant = 'default', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className} px-4 py-2`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }) => {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>{children}</div>;
};
const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>;
};
const CardTitle = ({ children, className = '', ...props }) => {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight text-primary dark:text-pink-400 ${className}`} {...props}>{children}</h3>;
};
const CardDescription = ({ children, className = '', ...props }) => {
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
  const { setCurrentPage } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-950 p-6 text-center">
       <Card className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl dark:shadow-pink-900/20">
         <CardHeader>
           <CardTitle>Our Digital Space</CardTitle>
           <CardDescription>Journal your thoughts or chat with our AI assistant.</CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col space-y-4">
            <Button
              onClick={() => setCurrentPage('journal')}
              className="w-full py-3 text-lg"
              variant="default"
            >
              <Feather className="mr-2 h-5 w-5" /> Write Journal Entry
            </Button>
            <Button
              onClick={() => setCurrentPage('ai')}
              variant="secondary"
              className="w-full py-3 text-lg bg-opacity-80 dark:bg-opacity-70 hover:bg-opacity-100 dark:hover:bg-opacity-80"
            >
               <Bot className="mr-2 h-5 w-5" /> Ask AI Assistant
            </Button>
         </CardContent>
       </Card>

       {/* ***** MODIFIED FOOTER ***** */}
       <footer className="mt-8 text-sm text-foreground dark:text-gray-300 font-medium">
          With love, ❤️ Shrey
       </footer>
       {/* ************************** */}

    </div>
  );
};

export default HomePage;
