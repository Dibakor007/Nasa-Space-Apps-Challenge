// Defines the contract that every AI service must follow.
// This ensures that new services can be swapped in easily.
export interface AiService {
    generate(query: string): Promise<any>;
}
