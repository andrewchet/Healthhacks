/*
IMPORTANT NOTICE: DO NOT REMOVE
This is the PRIMARY AI client for the app. All AI functionality uses OpenAI.

valid model names:
gpt-4o-2024-11-20 (recommended - supports text and images)
gpt-4o-mini (faster, cost-effective)
gpt-4-turbo (older but reliable)
*/
import OpenAI from "openai";

export const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not found in environment variables");
    throw new Error("OpenAI API key is required for AI functionality");
  }
  return new OpenAI({
    apiKey: apiKey,
  });
};
