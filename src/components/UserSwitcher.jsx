// src/components/UserSwitcher.jsx
// A reusable component for selecting the current user.

import React from 'react';
import { useAppContext } from '../context/AppContext'; // Import the custom hook to access context

// --- Simplified Shadcn UI Inspired Select Components ---
// NOTE: In a larger application, these UI components (Select, SelectOption)
// would typically reside in a dedicated 'ui' folder (e.g., src/components/ui/Select.jsx)
// and be imported here. For simplicity in this example, they are defined locally.

/**
 * Basic Select component styled with Tailwind.
 */
const Select = ({ children, value, onChange, className = '', ...props }) => {
    return (
        <select
            value={value}
            onChange={onChange}
            // Styling using Tailwind classes, referencing CSS variables defined in index.css
            className={`flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

/**
 * Basic Option component for the Select.
 */
const SelectOption = ({ children, value, ...props }) => {
    return <option value={value} {...props}>{children}</option>;
};
// --- End Simplified Components ---


/**
 * UserSwitcher Component: Renders a dropdown to switch between 'Shivam' and 'Shreya'.
 */
const UserSwitcher = () => {
  // Get the current user state and the function to update it from the context
  const { currentUser, setCurrentUser } = useAppContext();

  // Handler for when the select value changes
  const handleUserChange = (event) => {
    setCurrentUser(event.target.value); // Update the global currentUser state
  };

  return (
    <div className="mb-4">
      {/* Label for the select dropdown */}
      <label htmlFor="user-select" className="block text-sm font-medium text-muted-foreground mb-1">
        Current User:
      </label>
      {/* The Select dropdown component */}
      <Select
        id="user-select"
        value={currentUser} // Controlled component: value is tied to context state
        onChange={handleUserChange} // Update state on change
        // Apply specific styling for this instance of the Select component
        className="w-full md:w-48 bg-card border-input rounded-md shadow-sm focus:border-primary focus:ring focus:ring-ring focus:ring-opacity-50"
      >
        {/* Options for the select dropdown */}
        <SelectOption value="Shivam">Shivam</SelectOption>
        <SelectOption value="Shreya">Shreya</SelectOption>
      </Select>
    </div>
  );
};

export default UserSwitcher; // Export the component for use in other files
