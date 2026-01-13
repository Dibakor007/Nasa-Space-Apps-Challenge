import geminiService from './services/gemini';
import openAiService from './services/openai';
import { AiService } from './services/base';

// This is a serverless function that will be deployed to a Node.js environment.
// It is designed to be compatible with platforms like Vercel.

export const config = {
  runtime: 'edge',
};

// --- AI PROVIDER SWITCH ---
// To change the AI provider, simply assign the desired service to the 'activeService' variable.
//
// Options:
// - geminiService (Default)
// - openAiService (ChatGPT)
//
// Example to switch to OpenAI:
// const activeService: AiService = openAiService;

const activeService: AiService = geminiService; // <-- CHANGE THE SERVICE HERE

// Define CORS headers. Using '*' is fine for local development.
// For production, you would restrict this to your frontend's domain.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};


export default async function handler(req: Request) {
  // Handle CORS preflight requests sent by the browser.
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delegate the generation task to the active AI service
    const result = await activeService.generate(query);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return new Response(JSON.stringify({ error: 'Failed to process your request.', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}