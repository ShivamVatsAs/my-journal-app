// D:/my-journal-app/server.js
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
if (!process.env.MONGODB_URI) { // Corrected variable name
  console.error("FATAL ERROR: MONGODB_URI environment variable is not defined."); // Corrected variable name
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not defined.");
  process.exit(1);
}

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI) // Corrected variable name
  .then(() => console.log("MongoDB connected successfully!"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --- Mongoose Schema & Model ---
const journalEntrySchema = new mongoose.Schema({
  user: { type: String, required: true, enum: ['Shivam', 'Shreya'] },
  date: { type: String, required: true }, // YYYY-MM-DD
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// --- INDEXING ---
// Index for user/date queries
journalEntrySchema.index({ user: 1, date: 1 });
// *** NEW: Add a text index for keyword searching on the 'text' field ***
journalEntrySchema.index({ text: 'text' });

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
    // Optional: Validate date format if needed here
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
      // Add date validation if needed
      query.date = date;
    }
    const entries = await JournalEntry.find(query).sort({ date: -1, createdAt: -1 }); // Sort by date primarily
    console.log(`Found ${entries.length} entries for query:`, query);
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ message: 'Failed to fetch journal entries', error: error.message });
  }
});


// **** UPDATED /api/ai Route ****
app.post('/api/ai', async (req, res) => {
  console.log('Received POST /api/ai request:', req.body);
  try {
    const { query, askingUser } = req.body;

    if (!query || !askingUser || !['Shivam', 'Shreya'].includes(askingUser)) {
      return res.status(400).json({ message: 'Missing or invalid fields (query, askingUser)' });
    }

    // --- Enhanced Context Gathering ---
    let contextText = "";
    const otherUser = askingUser === 'Shivam' ? 'Shreya' : 'Shivam';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let fetchedEntries = [];
    const queryLower = query.toLowerCase();

    // Determine target user(s) - default to asking user, check if other user mentioned
    let targetUsers = [askingUser];
    if (queryLower.includes(otherUser.toLowerCase())) {
        targetUsers.push(otherUser);
    }
    // If query mentions "both" or "everyone", include both
    if (queryLower.includes('both') || queryLower.includes('everyone')) {
        targetUsers = ['Shivam', 'Shreya'];
    }
    targetUsers = [...new Set(targetUsers)]; // Remove duplicates

    // --- Date Parsing Logic ---
    let dateFilter = null;
    const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/); // YYYY-MM-DD
    const todayMatch = queryLower.includes('today');
    const yesterdayMatch = queryLower.includes('yesterday');
    const lastWeekMatch = queryLower.includes('last week');
    // Add more date keywords: "this week", "last month", "since [date]", "between [date] and [date]" etc.

    if (dateMatch) {
        dateFilter = { date: dateMatch[1] };
        console.log(`Date filter: Specific date ${dateMatch[1]}`);
    } else if (todayMatch) {
        dateFilter = { date: todayStr };
        console.log(`Date filter: Today (${todayStr})`);
    } else if (yesterdayMatch) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        dateFilter = { date: yesterday.toISOString().split('T')[0] };
        console.log(`Date filter: Yesterday (${dateFilter.date})`);
    } else if (lastWeekMatch) {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        // Find entries between one week ago and today (inclusive)
        dateFilter = {
            date: {
                $gte: oneWeekAgo.toISOString().split('T')[0],
                $lte: todayStr
            }
        };
         console.log(`Date filter: Last week (${dateFilter.date.$gte} to ${dateFilter.date.$lte})`);
    }
     // Add more complex date range logic here...

    // --- Keyword Extraction Logic ---
    let keywordFilter = null;
    // Simple example: Look for words in quotes or common nouns if no date filter applied
    // This is basic, more advanced NLP could be used here.
    if (!dateFilter && queryLower.length > 5) { // Avoid triggering on short queries like "hi"
        const keywords = queryLower
          .replace(/what|how|did|was|is|a|the|for|on|about|tell|me/g, '') // Remove common words
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .trim().split(/\s+/).filter(word => word.length > 3); // Get words longer than 3 chars

        if (keywords.length > 0) {
            // Use MongoDB text search if keywords found
            keywordFilter = { $text: { $search: keywords.join(' ') } };
            console.log(`Keyword filter: Searching for "${keywords.join(' ')}"`);
        }
    }


    // --- Build MongoDB Query ---
    const mongoQuery = { user: { $in: targetUsers } }; // Filter by target user(s)

    if (dateFilter) {
        // If specific date(s) identified, combine with user filter
        Object.assign(mongoQuery, dateFilter);
         console.log(`Fetching entries for user(s): ${targetUsers.join(', ')}, date filter applied.`);
         fetchedEntries = await JournalEntry.find(mongoQuery)
                                            .sort({ date: -1, createdAt: -1 }) // Sort by date, then time
                                            .limit(15); // Limit results for date queries slightly higher
    } else if (keywordFilter) {
        // If keywords identified (and no date), use text search combined with user filter
        Object.assign(mongoQuery, keywordFilter);
        console.log(`Fetching entries for user(s): ${targetUsers.join(', ')}, keyword filter applied.`);
        // Text search results are automatically sorted by relevance (textScore)
        // We add projection to see the score, and then limit
        fetchedEntries = await JournalEntry.find(
            mongoQuery,
            { score: { $meta: "textScore" } } // Project the text search score
          )
          .sort({ score: { $meta: "textScore" }, date: -1 }) // Sort by relevance, then date
          .limit(10); // Limit results for keyword searches
    } else if (queryLower.includes('how was') || queryLower.includes('what did')) {
        // Fallback for generic "how was/what did" - get recent entries for target user(s)
        console.log(`Fetching recent entries for user(s): ${targetUsers.join(', ')} (fallback).`);
        fetchedEntries = await JournalEntry.find({ user: { $in: targetUsers } }) // Query modified to include all target users
                                          .sort({ date: -1, createdAt: -1 })
                                          .limit(5 * targetUsers.length); // Limit recent entries (5 per target user)
    } else {
        // If no specific criteria met, maybe fetch the very latest entry? Or provide no context.
        console.log(`No specific date/keyword criteria met. Fetching latest entry for ${targetUsers.join(', ')} as fallback.`);
         fetchedEntries = await JournalEntry.find({ user: { $in: targetUsers } })
                                          .sort({ date: -1, createdAt: -1 })
                                          .limit(1); // Fetch just the single latest entry
    }


    // --- Format Context ---
    if (fetchedEntries.length > 0) {
       contextText = `Here are some relevant journal entries for context (newest first):\n`;
       fetchedEntries.forEach(entry => {
         // Include user in context if multiple users' entries were fetched
         const userPrefix = targetUsers.length > 1 ? `${entry.user} ` : '';
         contextText += `- On ${entry.date}, ${userPrefix}wrote: "${entry.text}"\n`;
       });
       console.log(`Generated context with ${fetchedEntries.length} entries.`);
    } else {
        // Refine 'no context' message based on what was searched
        if (dateFilter) contextText = `Context: No journal entries found for ${targetUsers.join(' or ')} matching the specified date criteria.\n`;
        else if (keywordFilter) contextText = `Context: No journal entries found for ${targetUsers.join(' or ')} matching the keywords.\n`;
        else contextText = `Context: No specific journal entries were found relating to the query for ${targetUsers.join(' or ')}.\n`;
        console.log("Context generated: No relevant entries found.");
    }
    // --- End Enhanced Context Gathering ---


    // --- Refined Prompt Construction ---
    // Slightly adjust task to allow summarization *based on context*
    const persona = `You are a helpful and empathetic AI assistant integrated into a personal journal app for a couple, Shivam and Shreya. The user asking the question is ${askingUser}.`;
    const task = `Your primary goal is to answer ${askingUser}'s questions based *only* on the provided journal entry context, unless the question is clearly a general knowledge query or normal chat. Be concise and understanding. If asked about a day/period with no entry in the context, state that clearly. If asked to summarize based on the context, provide a brief summary *using only information from the provided entries*. Do not make assumptions or provide information not present in the context unless it's general chat.`;
    const fullPrompt = `${persona}\n\n${task}\n\n${contextText}\n${askingUser}'s query: "${query}"\n\nAssistant's Response:`;
    // --- End Refined Prompt Construction ---

    console.log("----\nSending refined prompt to Gemini:\n", fullPrompt.substring(0, 500) + "...", "\n----"); // Log only beginning of long prompts

    // Call Gemini API
    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;

    // Handle potential lack of response or safety blocks (same as before)
    if (!response || !response.text) {
      // ... (keep existing block/error handling logic here) ...
       const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            console.warn("Gemini response blocked:", blockReason);
            return res.status(400).json({ message: `Response blocked due to: ${blockReason}` });
        } else {
             console.warn("Gemini returned no text content.");
             const candidates = response?.candidates;
             if(candidates && candidates[0]?.finishReason && candidates[0].finishReason !== 'STOP') {
                console.warn("Gemini finish reason:", candidates[0].finishReason);
                return res.status(400).json({ message: `Response generation stopped due to: ${candidates[0].finishReason}` });
             }
             // Check if there's any text, even if finishReason isn't STOP (sometimes happens)
             const potentialText = candidates?.[0]?.content?.parts?.[0]?.text;
             if (potentialText) {
                console.log("Received partial response from Gemini:", potentialText);
                return res.status(200).json({ response: potentialText });
             }
             return res.status(500).json({ message: 'AI returned an empty response.' });
        }
    }

    const aiResponseText = response.text();
    console.log("Received response from Gemini:", aiResponseText);
    res.status(200).json({ response: aiResponseText });

  } catch (error) {
    console.error("Error interacting with AI:", error);
    if (error.message && error.message.includes('SAFETY')) {
         res.status(400).json({ message: 'Request failed due to safety settings.', error: error.message });
    } else {
       res.status(500).json({ message: 'Failed to get AI response', error: error.message });
    }
  }
});


export default app;