import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Configuration ---
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Environment Variable Checks ---
if (!process.env.MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is not defined.");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not defined.");
  process.exit(1);
}

// --- Mongoose Schema & Model ---
const journalEntrySchema = new mongoose.Schema({
  user: { type: String, required: true, enum: ['Shivam', 'Shreya'] },
  date: { type: String, required: true }, // YYYY-MM-DD
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// --- INDEXING ---
journalEntrySchema.index({ user: 1, date: 1 });
journalEntrySchema.index({ text: 'text' }); // Ensure text index exists for $text search

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

// --- Google Generative AI Client Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- API Routes ---

// POST /api/journal - Save a new entry
app.post('/api/journal', async (req, res) => {
  console.log('Received POST /api/journal request:', req.body);
  try {
    const { user, date, text } = req.body;
    if (!user || !date || !text || !['Shivam', 'Shreya'].includes(user)) {
      return res.status(400).json({ message: 'Missing or invalid fields (user, date, text)' });
    }
    const newEntry = new JournalEntry({ user, date, text });
    await newEntry.save();
    console.log('Journal entry saved:', newEntry);
    res.status(201).json({ success: true, entry: newEntry });
  } catch (error) {
    console.error("Error saving journal entry:", error);
    res.status(500).json({ message: 'Failed to save journal entry', error: error.message });
  }
});

// GET /api/journal/:user - Get entries for a user (optional date filter)
app.get('/api/journal/:user', async (req, res) => {
  console.log(`Received GET /api/journal/${req.params.user} request:`, req.query);
  try {
    const { user } = req.params;
    const { date } = req.query;
    if (!['Shivam', 'Shreya'].includes(user)) {
      return res.status(400).json({ message: 'Invalid user specified' });
    }
    const query = { user: user };
    if (date) {
      // Optional: Add date validation if needed
      query.date = date;
    }
    const entries = await JournalEntry.find(query).sort({ date: -1, createdAt: -1 });
    console.log(`Found ${entries.length} entries for query:`, query);
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ message: 'Failed to fetch journal entries', error: error.message });
  }
});


// **** UPDATED /api/ai Route (with History, Flexible Prompt, Corrected Query Logic) ****
app.post('/api/ai', async (req, res) => {
  console.log('[Server AI] Received POST /api/ai request');
  let fullPrompt = ""; // Define fullPrompt outside try block to access in catch
  try {
    const { query, askingUser, chatHistory = [] } = req.body;
    console.log('[Server AI] Parsed request body:', { query, askingUser, historyLength: chatHistory?.length });

    if (!query || !askingUser || !['Shivam', 'Shreya'].includes(askingUser)) {
      console.warn('[Server AI] Invalid request body fields');
      return res.status(400).json({ message: 'Missing or invalid fields (query, askingUser)' });
    }

    // --- Context Gathering (Journal Entries) ---
    console.log('[Server AI] Starting journal context fetch...');
    let contextText = "";
    let fetchedEntries = [];
    const queryLower = query.toLowerCase();
    const otherUser = askingUser === 'Shivam' ? 'Shreya' : 'Shivam';

    // Determine Target Users
    let targetUsers = [askingUser];
    if (queryLower.includes(otherUser.toLowerCase())) targetUsers.push(otherUser);
    if (queryLower.includes('both') || queryLower.includes('everyone')) targetUsers = ['Shivam', 'Shreya'];
    targetUsers = [...new Set(targetUsers)];

    // --- CORRECTED Filter/Sort/Projection Logic ---
    let dateFilter = null;
    const today = new Date(); // Define today here
    const todayStr = today.toISOString().split('T')[0]; // Define todayStr

    // Date Parsing Logic
    const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
    const todayMatch = queryLower.includes('today');
    const yesterdayMatch = queryLower.includes('yesterday');

    if (dateMatch) {
        dateFilter = { date: dateMatch[1] };
        console.log(`[Server AI] Date filter: Specific date ${dateMatch[1]}`);
    } else if (todayMatch) {
        dateFilter = { date: todayStr };
        console.log(`[Server AI] Date filter: Today (${todayStr})`);
    } else if (yesterdayMatch) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        dateFilter = { date: yesterday.toISOString().split('T')[0] };
        console.log(`[Server AI] Date filter: Yesterday (${dateFilter.date})`);
    }
     // (Add more date parsing if needed)

    // Only look for keywords IF no date filter was found
    let keywordFilter = null;
    let sortOptions = { date: -1, createdAt: -1 }; // Default sort
    let projectionOptions = {}; // Default projection

    if (!dateFilter) { // Check if NO date filter exists
        console.log('[Server AI] No date filter found, checking for keywords...');
        // Keyword extraction logic
        const keywords = queryLower
          .replace(/what|how|did|was|is|a|the|for|on|about|tell|me/g, '') // Basic stop words
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .trim().split(/\s+/).filter(word => word.length > 3); // Get longer words

        if (keywords.length > 0) {
            keywordFilter = { $text: { $search: keywords.join(' ') } };
            // IF keyword filter is active, THEN change sort and projection
            sortOptions = { score: { $meta: "textScore" }, date: -1 };
            projectionOptions = { score: { $meta: "textScore" } };
            console.log(`[Server AI] Keyword filter active: Searching for "${keywords.join(' ')}"`);
        } else {
            console.log('[Server AI] No relevant keywords found.');
        }
    } else {
         console.log('[Server AI] Date filter found, skipping keyword search logic.');
    }
    // --- End Corrected Logic ---

    // Build the final query filter
    const mongoQuery = { user: { $in: targetUsers } };
    if (dateFilter) Object.assign(mongoQuery, dateFilter);
    // Apply keywordFilter ONLY if it exists (which implies dateFilter is null)
    if (keywordFilter) Object.assign(mongoQuery, keywordFilter);

    // Determine limit
    // Use fallback limit logic only if neither date nor keyword filter is active
    let limit = 5 * targetUsers.length; // Default fallback limit
     if (dateFilter) {
        limit = 15;
     } else if (keywordFilter) {
        limit = 10;
     } else if (!queryLower.includes('how was') && !queryLower.includes('what did')) {
         // If it's not a date/keyword search and not a generic 'how was/what did', maybe just get 1?
         limit = 1;
     }


    // Execute the query
    console.log('[Server AI] Final Mongo Query Filter:', mongoQuery);
    console.log('[Server AI] Final Sort Options:', sortOptions);
    try { // Wrap DB call
        const findQuery = JournalEntry.find(mongoQuery)
                                       .sort(sortOptions)
                                       .limit(limit);

        // Apply projection only if defined (i.e., only for keyword searches)
        if (Object.keys(projectionOptions).length > 0) {
             console.log('[Server AI] Applying projection:', projectionOptions);
             findQuery.projection(projectionOptions);
        }

        fetchedEntries = await findQuery.exec();
        console.log(`[Server AI] Fetched ${fetchedEntries?.length} journal entries`);
    } catch (dbError) {
        console.error("[Server AI] Database find error:", dbError);
        // Important: Set contextText here so we inform the AI about the DB error
        contextText = "Context: There was an issue retrieving journal entries due to a database error.\n";
        // Don't re-throw, let the function proceed to inform the user via AI if possible
    }
    // --- End Database Query Execution ---


    // --- Format Journal Context ---
    if (fetchedEntries.length > 0) {
       // This part only runs if entries were successfully fetched
       contextText = `Relevant Journal Entries (newest first):\n`;
       fetchedEntries.forEach(entry => {
         const userPrefix = targetUsers.length > 1 ? `${entry.user} ` : '';
         contextText += `- On ${entry.date}, ${userPrefix}wrote: "${entry.text}"\n`;
       });
    } else if (!contextText) { // Only set 'no entries found' if DB call didn't error AND length is 0
        contextText = "Context: No specific journal entries were found relevant to the current query.\n";
    }
    // --- End Context Formatting ---


    // --- Format Chat History Context ---
    console.log('[Server AI] Formatting chat history...');
    let historyText = "";
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
        historyText = "Recent Conversation History:\n";
         chatHistory.forEach(msg => {
            const speaker = msg.sender === 'user' ? askingUser : 'Assistant';
            historyText += `${speaker}: ${msg.text}\n`;
         });
        console.log(`[Server AI] Added ${chatHistory.length} messages to history context.`);
    }
    // --- End History Formatting ---


    // --- MODIFIED Prompt Construction (More Flexible) ---
    console.log('[Server AI] Constructing full prompt...');
    const persona = `You are a helpful, empathetic, and thoughtful AI assistant for Shivam and Shreya. You have access to their shared journal context when provided. The user currently asking the question is ${askingUser}. You HAVE access to the journal entries provided in the 'Relevant Journal Entries' context section.`;

    const task = `Your goal is to be a supportive assistant to ${askingUser}.
1.  Understand the query using conversation history and journal context (if provided).
2.  If the query asks for information directly present in the 'Relevant Journal Entries' context, provide that information accurately. If the context indicates no relevant entries were found (or if there was an issue retrieving entries), clearly state that.
3.  Engage naturally in conversation for general chat queries.
4.  **Flexibility:** If ${askingUser} asks for advice, ideas, seems unsure, or could benefit from a suggestion related to the conversation or journal topics, **feel free to offer helpful, relevant, and empathetic suggestions or ideas.** Make it clear when you are offering a suggestion versus stating a fact from the journal (e.g., start suggestions with "Maybe you could try...", "Have you considered...", "One idea might be...").
5.  Prioritize being helpful and supportive. Don't strictly limit yourself to only the provided context if a helpful suggestion comes to mind, but *do not invent* false journal entries or information.`;

    fullPrompt = `${persona}\n\n${task}\n\n${historyText}\n${contextText}\n${askingUser}'s current query: "${query}"\n\nAssistant's Response:`;
    // --- End Prompt Construction ---


    // --- Gemini Call ---
    console.log('[Server AI] ABOUT TO CALL Gemini API...');
    const result = await geminiModel.generateContent(fullPrompt);
    console.log('[Server AI] COMPLETED Gemini API call');

    const response = await result.response;
    console.log('[Server AI] Got response object from Gemini result');

    // Handle potential lack of response or safety blocks
    if (!response || !response.text) {
       console.error('[Server AI] Gemini response blocked or empty', response?.promptFeedback || response?.candidates);
       const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            // Make sure to return after sending response
            return res.status(400).json({ message: `Response blocked due to: ${blockReason}` });
        } else {
             const candidates = response?.candidates;
             if(candidates && candidates[0]?.finishReason && candidates[0].finishReason !== 'STOP') {
                console.warn("[Server AI] Gemini finish reason:", candidates[0].finishReason);
                 // Make sure to return after sending response
                return res.status(400).json({ message: `Response generation stopped due to: ${candidates[0].finishReason}` });
             }
             const potentialText = candidates?.[0]?.content?.parts?.[0]?.text;
             if (potentialText) {
                console.log("[Server AI] Received partial response from Gemini:", potentialText);
                 // Make sure to return after sending response
                return res.status(200).json({ response: potentialText });
             }
              // Make sure to return after sending response
             return res.status(500).json({ message: 'AI returned an empty response.' });
        }
    }

    const aiResponseText = response.text();
    console.log("[Server AI] Received text response from Gemini:", aiResponseText.substring(0, 100) + "...");

    // --- Sending Response ---
    console.log('[Server AI] Sending successful response to client');
    res.status(200).json({ response: aiResponseText });

  } catch (error) {
    // Log the specific error occurring on the backend
    console.error("[Server AI] Error in /api/ai route:", error);
    // Log the prompt that might have caused the error
    if (fullPrompt) {
        console.error("[Server AI] Prompt that failed (first 500 chars):", fullPrompt.substring(0, 500));
    }
    // Ensure an error response is sent back to the client
    res.status(500).json({ message: 'Failed to get AI response', error: error.message });
  }
});


// --- Connect to DB THEN Start Server ---
console.log('[Server] Attempting MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("[Server] MongoDB connected successfully!");
    // Start the Express server ONLY AFTER successful DB connection
    app.listen(PORT, () => {
      console.log(`[Server] Backend server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("[Server] Initial MongoDB connection error:", err);
    process.exit(1);
  });


export default app; // Keep this for Vercel deployment
