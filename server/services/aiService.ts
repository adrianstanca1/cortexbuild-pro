import { logger } from '../utils/logger.js';
import { generateStructured, generateWithImage, OLLAMA_MODEL } from './ollamaService.js';

// Schema for phase extraction
const phaseHandlerSchema = {
    type: "OBJECT",
    properties: {
        phases: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    startDate: { type: "STRING", description: "YYYY-MM-DD" },
                    endDate: { type: "STRING", description: "YYYY-MM-DD" },
                    status: { type: "STRING", enum: ["Pending", "In Progress", "Completed", "Delayed", "On Hold"] },
                    riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"] },
                    description: { type: "STRING" },
                    keyDependencies: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["name", "startDate", "endDate", "status", "riskLevel"]
            }
        },
        summary: { type: "STRING" },
        confidenceScore: { type: "NUMBER" }
    },
    required: ["phases", "summary"]
};

export const analyzeProjectDocument = async (fileBuffer: Buffer, mimeType: string, projectContext: any = {}) => {
    try {
        const prompt = `
Analyze this project document (schedule, gantt chart, or plan).
Context: Project "${projectContext.name || 'Unknown'}" (${projectContext.type || 'General'}).

Extract the distinct project phases, their dates, and status.
If specific dates aren't visible, estimate reasonable logical dates based on standard construction timelines relative to the start date.
Assess risk level based on the complexity or tight deadlines visible.

Return a JSON object with:
- phases: array of phase objects with name, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status (Pending/In Progress/Completed/Delayed/On Hold), riskLevel (Low/Medium/High), description, and keyDependencies
- summary: brief summary of the project
- confidenceScore: number between 0-1
`;

        // Check if it's an image
        if (mimeType.startsWith('image/')) {
            const response = await generateWithImage(prompt, fileBuffer, mimeType, { temperature: 0.1 });
            
            // Try to parse JSON from the response
            try {
                return JSON.parse(response);
            } catch {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('Could not parse JSON from image analysis response');
            }
        } else {
            // For non-image files, convert to text and use structured generation
            const textContent = fileBuffer.toString('utf-8');
            const messages = [
                { role: 'system' as const, content: 'You are a construction project document analyzer. Extract structured data from documents.' },
                { role: 'user' as const, content: `${prompt}\n\nDocument content:\n${textContent.substring(0, 10000)}` }
            ];
            
            return await generateStructured(messages, phaseHandlerSchema, { temperature: 0.1 });
        }
    } catch (error: any) {
        logger.error("AI Analysis Failed:", error);
        throw error;
    }
};
