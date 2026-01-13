import OpenAI from 'openai';
import { AiService } from "./base";

const SYSTEM_INSTRUCTION = `You are an AI agent that retrieves and analyzes NASA Space Biology research data.
Your job is to act as a JSON API. Based on the user's query, you must:
1. Fetch relevant research from NASA sources (GeneLab, NTRS, etc.).
2. Analyze and summarize findings.
3. MOST IMPORTANT: Always attach an official NASA reference URL if available.
4. STRICTLY respond only with a single, valid JSON object that conforms to the user-provided schema. Do not add any text before or after the JSON.
`;

const JSON_SCHEMA = `{
  "summary": { "overview": "...", "years_range": "...", "highlight_points": ["..."] },
  "detailed_report": [ { "title": "...", "year": ..., "organism": "...", "mission_or_experiment": "...", "main_findings": "...", "source_url": "..." } ],
  "graph": { "nodes": [ { "id": "...", "type": "..." } ], "links": [ { "source": "...", "target": "...", "label": "..." } ] }
}`;


class OpenAIService implements AiService {
  private readonly openai: OpenAI | null;
  
  constructor(apiKey: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.openai = null;
    }
  }

  async generate(query: string): Promise<any> {
    if (!this.openai) {
      throw new Error("OpenAI API key is not configured on the server. Please add OPENAI_API_KEY to your .env file.");
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTION,
          },
          {
            role: "user",
            content: `Generate a response for the topic: "${query}". Respond with JSON matching this schema: ${JSON_SCHEMA}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const resultText = response.choices[0]?.message?.content;
      if (!resultText) {
        throw new Error("OpenAI returned an empty response.");
      }

      return JSON.parse(resultText);

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error("Failed to get summary from OpenAI.");
    }
  }
}

const apiKey = process.env.OPENAI_API_KEY || '';
const openAiService = new OpenAIService(apiKey);

export default openAiService;