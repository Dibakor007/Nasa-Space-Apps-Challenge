import { AiSearchResult, AdvancedFilters, TimelineAnalysisData, AiComparisonResult, DetailedReportItem, AiHypothesisResult, AiGlossaryTermResult, ChatHistoryItem, SearchMetadata } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

async function sendRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to parse error response from backend.',
      }));
      throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from backend endpoint /${endpoint}:`, error);
    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
      throw new Error('Network Error: Could not connect to the backend service. Please ensure the backend server is running and accessible.');
    }
    throw error;
  }
}

function postToBackend<T>(endpoint: string, body: object): Promise<T> {
  return sendRequest<T>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}


interface AiSummaryParams {
  query: string;
  filters: AdvancedFilters;
}

interface AiExtendSummaryParams {
  query: string;
  existingResult: AiSearchResult;
  filters: AdvancedFilters;
}

interface AiChatParams {
  query: string;
  initialSearchQuery: string;
  searchResultContext: AiSearchResult;
  history: ChatHistoryItem[];
}

export const getAiSummary = async ({ query, filters }: AiSummaryParams): Promise<AiSearchResult> => {
  return postToBackend<AiSearchResult>('search', { query, filters });
};

export const getExtendedAiSummary = async ({ query, existingResult, filters }: AiExtendSummaryParams): Promise<AiSearchResult> => {
  return postToBackend<AiSearchResult>('extend-search', { query, existingResult, filters });
};

export const getTimelineAnalysis = async (searchResult: AiSearchResult): Promise<TimelineAnalysisData> => {
  return postToBackend<TimelineAnalysisData>('timeline-analysis', { searchResult });
};

export const getAiComparison = async (items: DetailedReportItem[]): Promise<AiComparisonResult> => {
  return postToBackend<AiComparisonResult>('comparison', { items });
};

export const getAiHypothesis = async (searchResult: AiSearchResult): Promise<AiHypothesisResult> => {
  return postToBackend<AiHypothesisResult>('hypothesis', { searchResult });
};

export const getAiGlossaryTerm = async (term: string): Promise<AiGlossaryTermResult> => {
  return postToBackend<AiGlossaryTermResult>('glossary', { term });
};

export const getMetadata = async (): Promise<SearchMetadata> => {
  return sendRequest<SearchMetadata>('metadata', { method: 'GET' });
};

export const getAiChatResponseStream = async ({ query, initialSearchQuery, searchResultContext, history }: AiChatParams): Promise<ReadableStream<Uint8Array> | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, initialSearchQuery, searchResultContext, history }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Request failed with status ${response.status}`);
        }
        
        return response.body;

    } catch (error) {
        console.error(`Error fetching from backend endpoint /chat:`, error);
        if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
             throw new Error('Network Error: Could not connect to the backend service. Please ensure the backend server is running and accessible.');
        }
        throw error;
    }
};