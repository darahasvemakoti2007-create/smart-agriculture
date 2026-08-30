/**
 * SERVER-ONLY UTILITY
 * This module cannot be imported into client-side code.
 * Exposing the Gemini client to the browser is a severe security risk.
 */

if (typeof window !== "undefined") {
  throw new Error("SECURITY ERROR: The Gemini client must only be used on the server.");
}

import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

/**
 * Returns a configured GoogleGenAI client instance.
 * Throws a configuration error if the API key is missing.
 */
export function getGeminiClient(): GoogleGenAI {
  // Return the existing instance if it was already initialized
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  // Initialize the Gemini client using the environment variable
  geminiClient = new GoogleGenAI({
    apiKey: apiKey,
  });

  return geminiClient;
}
