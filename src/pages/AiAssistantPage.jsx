import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext'; // Import context hook
import UserSwitcher from '../components/UserSwitcher'; // Import user selection component
import { Bot, User, Send, Home, Loader2 } from 'lucide-react'; // Import icons

// --- Simplified Shadcn UI Inspired Components ---
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', disabled, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
   const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10", // Style for icon-only buttons
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', disabled, ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
      {...props}
    />
  );
};

const Card = ({ children, className = '', ...props }) => {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>{children}</div>;
};
const CardHeader = ({ children, className = '', ...props }) => {
  return <div className={`flex flex-col space-y-1.5 p-4 md:p-6 ${className}`} {...props}>{children}</div>;
};
const CardTitle = ({ children, className = '', ...props }) => {
  return <h3 className={`text-xl md:text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>;
};
const CardDescription = ({ children, className = '', ...props }) => {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>;
};
const CardContent = ({ children, className = '', ...props }) => {
  // Added scrollbar styling class
  return <div className={`p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${className}`} {...props}>{children}</div>;
};
const CardFooter = ({ children, className = '', ...props }) => {
  return <div className={`flex items-center p-4 border-t dark:border-gray-700 ${className}`} {...props}>{children}</div>; // Added dark mode border
};
// --- End Simplified Components ---


/**
 * AiAssistantPage Component: Provides a chat interface for the AI.
 */
const AiAssistantPage = () => {
  // Get context values: page navigation, current user, and the simulated AI function
  const { setCurrentPage, currentUser, askAI } = useAppContext();
  // State to store the chat messages array { sender: 'user' | 'ai', text: string }
  const [messages, setMessages] = useState([]);
  // State for the user's input query
  const [inputQuery, setInputQuery] = useState('');
  // State to track if the AI is currently processing a request
  const [isLoading, setIsLoading] = useState(false);
  // Ref to the end of the messages container for auto-scrolling
  const messagesEndRef = useRef(null);

  // Effect to scroll to the bottom whenever the messages array changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Effect to add an initial greeting message from the AI when the component mounts or the user changes
   useEffect(() => {
    setMessages([{ sender: 'ai', text: `Hi ${currentUser}! How can I help you today? Ask about journal entries or chat normally.` }]);
    setInputQuery(''); // Clear input when user changes
  }, [currentUser]); // Dependency array ensures this runs when currentUser changes

  /**
   * Handles sending the user's query to the simulated AI.
   * NOW SENDS RECENT CHAT HISTORY ALONG WITH THE QUERY.
   */
  const handleSendQuery = async () => {
    // Prevent sending empty messages or sending while AI is busy
    if (!inputQuery.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: inputQuery };
    // Create the updated message list *before* calling askAI
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages); // Update UI immediately with user message

    // Prepare the recent chat history (e.g., last 6 messages)
    // Slice(-7, -1) gets up to 6 messages *before* the current user query
    const recentHistory = updatedMessages.slice(-7, -1);

    const currentQuery = inputQuery; // Capture the query before clearing the input
    setInputQuery(''); // Clear the input field
    setIsLoading(true); // Set loading state

    try {
        // Call the AI function from context, passing the current query, user, and recent history
        const aiResponseText = await askAI(currentQuery, currentUser, recentHistory);

        const aiMessage = { sender: 'ai', text: aiResponseText };
        // Use functional update based on the state *at the time the response arrives*
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        // Handle potential errors from the simulated AI function
        console.error("Error asking AI:", error);
        const errorMessage = { sender: 'ai', text: "Sorry, I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        // Reset loading state regardless of success or error
        setIsLoading(false);
    }
  };

  /**
   * Handles the Enter key press in the input field to send the message.
   * @param {React.KeyboardEvent<HTMLInputElement>} event - The keyboard event.
   */
  const handleKeyPress = (event) => {
    // Send message if Enter is pressed without the Shift key
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline insertion
      handleSendQuery();
    }
  };


  return (
    // Main container for the AI page, full height
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-blue-950 p-2 md:p-4">
        {/* Card container for the chat interface */}
        <Card className="flex flex-col flex-grow bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden shadow-xl dark:shadow-purple-900/20">
            {/* Chat Header */}
            <CardHeader className="border-b dark:border-gray-700">
                <div className="flex justify-between items-start gap-4">
                    {/* Title and description */}
                    <div>
                        <CardTitle className="text-secondary dark:text-purple-400">AI Assistant</CardTitle>
                        <CardDescription>Ask about journal entries or chat.</CardDescription>
                    </div>
                    {/* Home button */}
                    <Button
                        onClick={() => setCurrentPage('home')}
                        variant="ghost" // Use ghost style for less emphasis
                        size="icon" // Use icon size
                        className="text-muted-foreground hover:text-primary flex-shrink-0"
                        disabled={isLoading} // Disable while AI is thinking
                        aria-label="Back Home" // Accessibility label
                    >
                        <Home className="h-5 w-5" />
                    </Button>
                </div>
                 {/* User switcher component */}
                 <div className="mt-4">
                    <UserSwitcher />
                 </div>
            </CardHeader>

            {/* Chat Messages Area */}
            <CardContent className="flex-grow overflow-y-auto space-y-4">
                {/* Map through messages and render each one */}
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 md:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* AI Avatar (shown only for AI messages) */}
                    {msg.sender === 'ai' && (
                        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-pink-500 flex items-center justify-center text-white">
                             <Bot className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`rounded-lg px-3 py-2 md:px-4 md:py-2 max-w-[80%] break-words shadow-sm ${
                        msg.sender === 'user'
                        ? 'bg-secondary text-secondary-foreground rounded-br-none' // User style (purple)
                        : 'bg-muted text-muted-foreground rounded-bl-none' // AI style (gray)
                    }`}>
                        <p className="text-sm md:text-base">{msg.text}</p>
                    </div>

                    {/* User Avatar (shown only for user messages) */}
                     {msg.sender === 'user' && (
                         <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                           <User className="w-4 h-4 md:w-5 md:h-5" />
                         </div>
                     )}
                </div>
                ))}
                {/* Loading Indicator (shown when isLoading is true) */}
                {isLoading && (
                    <div className="flex items-end gap-2 md:gap-3 justify-start">
                         <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-pink-500 flex items-center justify-center text-white animate-pulse">
                             <Bot className="w-4 h-4 md:w-5 md:h-5" />
                         </div>
                        <div className="rounded-lg px-3 py-2 md:px-4 md:py-2 bg-muted text-muted-foreground rounded-bl-none animate-pulse">
                            <p className="text-sm md:text-base italic">Thinking...</p>
                        </div>
                    </div>
                )}
                 {/* Empty div used as a target for scrolling to the bottom */}
                <div ref={messagesEndRef} />
            </CardContent>

            {/* Chat Input Area */}
            <CardFooter>
                <div className="flex w-full items-center space-x-2">
                    {/* Text input field */}
                    <Input
                        placeholder={`Ask something as ${currentUser}...`}
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        onKeyPress={handleKeyPress} // Handle Enter key
                        disabled={isLoading} // Disable input while loading
                        className="flex-grow focus:border-primary focus:ring-primary"
                        aria-label="Chat input" // Accessibility label
                    />
                    {/* Send button */}
                    <Button
                        onClick={handleSendQuery}
                        disabled={isLoading || !inputQuery.trim()} // Disable if loading or input is empty
                        size="icon" // Icon size
                        aria-label="Send Message" // Accessibility label
                    >
                        {/* Show loader when loading, otherwise show Send icon */}
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </div>
  );
};

export default AiAssistantPage;
