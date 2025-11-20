import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable. Please set it in your .env.local file.');
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
});

