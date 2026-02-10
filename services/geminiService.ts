
import { GoogleGenAI, Type } from "@google/genai";
import { InteractionStep, MessageRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are a Mermaid Flowchart Generator Bot.
Your goal is to help users visualize workflows or IT architectures using Mermaid.js.

STRICT RULES:
1. Interaction Limit: 3 steps (1: User input, 2: Clarify if needed, 3: Output Mermaid code).
2. For Step 1 (Initial Input): 
   - If the description is clear and detailed, skip to generating code (Step 3).
   - If missing actors, decisions, or sequence, ask 1-2 clarifying questions (Step 2).
3. For Step 3 (Output):
   - Provide ONLY the Mermaid code block.
   - Use 'flowchart TD/LR', 'sequenceDiagram', or 'timeline' as appropriate.
   - Add styles: Use classDef for colors. Green (#d1fae5/#059669) for start/success, yellow (#fef3c7/#d97706) for warnings, red (#fee2e2/#dc2626) for end/danger/error.
   - Use subgraphs for phases.
   - Multi-line labels: use \n.
   - Add FontAwesome icons if helpful (fa:fa-user, etc.).
   - Wrap labels with special chars in quotes.
4. Language: Use Vietnamese if the user uses Vietnamese, but the Mermaid labels/code should be in English for technical accuracy.
5. End Step 3 with: "Paste this into Draw.io Mermaid tab. Need edits? Describe changes."
6. If the user asks for more after Step 3, say: "Session complete. Start new for another flow."

You must return a JSON object with:
{
  "nextStep": number (2 or 3 or 4),
  "response": "Text response to user",
  "mermaidCode": "The mermaid code string (if step 3 or 4)"
}
`;

export const processUserMessage = async (
  messages: { role: MessageRole; content: string }[],
  currentStep: InteractionStep
) => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: messages.map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nextStep: { type: Type.INTEGER },
          response: { type: Type.STRING },
          mermaidCode: { type: Type.STRING }
        },
        required: ["nextStep", "response"]
      }
    }
  });

  const response = await model;
  const result = JSON.parse(response.text || '{}');
  return result;
};
