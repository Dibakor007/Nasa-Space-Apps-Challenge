import { GoogleGenAI, Type } from "@google/genai";
import { AiService } from "./base";

class GeminiService implements AiService {
  private readonly ai: GoogleGenAI | null;
  private readonly SYSTEM_INSTRUCTION: string;
  private readonly responseSchema: any;

  constructor(apiKey: string) {
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.ai = null;
    }

    this.SYSTEM_INSTRUCTION = `You are an AI agent that retrieves and analyzes NASA Space Biology research data.
When the user searches a topic (e.g., “plants in microgravity”), your job is to:
Fetch all relevant research items from NASA’s sources (papers, datasets, media, experiments).
Analyze & summarize the findings in student-friendly English.
MOST IMPORTANT: Always attach the official NASA reference URL for each item.
DATA SOURCES (priority order):
NASA GeneLab: https://genelab-data.ndc.nasa.gov/genelab/projects
NASA Technical Reports Server (NTRS): https://ntrs.nasa.gov/
NASA Image & Video Library: https://images.nasa.gov/
NASA Space Biology Program pages (ISS, RR missions, etc.)
OUTPUT RULES:
Never fabricate references or links.
If a direct NASA link is not available, return "source_url": null and note “(no NASA reference found)”.
Ensure all URLs are clickable and valid (https://).
OUTPUT SCHEMA (strict):
{
"summary": {
"overview": "<3–4 sentence plain English summary of findings>",
"years_range": "<YYYY–YYYY>",
"highlight_points": ["<trend 1>", "<trend 2>", "<trend 3>"]
},
"detailed_report": [
{
"title": "<paper or dataset title>",
"year": <YYYY>,
"organism": "<Human|Mouse|Plant|Microbe|Other>",
"mission_or_experiment": "<ISS|RR-1|GLDS-242|Shuttle|N/A>",
"main_findings": "<1–2 sentences in English>",
"source_url": "<NASA reference link here>"
}
],
"graph": {
"nodes": [...],
"links": [...]
}
}
RESPONSE STYLE:
Summary must always be in English.
Report must include NASA link in "source_url".
Graph nodes should match report entities.
If zero NASA references found: show "No NASA references available for this query."
ERROR / EMPTY TEXT :
No Results: "No NASA reference has been found for this topic"
API Error: "There was a problem retrieving the data, please try again later"
`;

    this.responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            years_range: { type: Type.STRING },
            highlight_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['overview', 'years_range', 'highlight_points'],
        },
        detailed_report: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.INTEGER },
              organism: { type: Type.STRING },
              mission_or_experiment: { type: Type.STRING },
              main_findings: { type: Type.STRING },
              source_url: { type: Type.STRING, nullable: true },
            },
            required: ['title', 'year', 'organism', 'mission_or_experiment', 'main_findings', 'source_url'],
          },
        },
        graph: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { id: { type: Type.STRING }, type: { type: Type.STRING } },
                required: ['id', 'type'],
              },
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING } },
                required: ['source', 'target', 'label'],
              },
            },
          },
          required: ['nodes', 'links'],
        },
      },
      required: ['summary', 'detailed_report', 'graph'],
    };
  }

  async generate(query: string): Promise<any> {
    if (!this.ai) {
      throw new Error("Gemini API key is not configured on the server. Please add API_KEY to your .env file.");
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a response for the topic: "${query}"`,
        config: {
          systemInstruction: this.SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: this.responseSchema,
        },
      });

      const resultText = response.text;
      // Parse the JSON string into an object before returning
      return JSON.parse(resultText);

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error("Failed to get summary from AI.");
    }
  }
}

// The API key is retrieved from environment variables on the server.
const apiKey = process.env.API_KEY || '';
const geminiService = new GeminiService(apiKey);

export default geminiService;