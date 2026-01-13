import { AiSearchResult } from '../types';

export const getAiSummary = async (query: string): Promise<AiSearchResult> => {
  console.log(`Searching for: ${query}`);

  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "An unknown error occurred" }));
      console.error("API call failed with status:", response.status, errorData);
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Backend proxy call failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get summary from AI.");
  }
};
