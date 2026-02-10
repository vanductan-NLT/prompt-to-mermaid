
import { GoogleGenAI, Type } from "@google/genai";
import { InteractionStep, MessageRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are a Mermaid Flowchart Generator Bot.
Your goal is to help users visualize workflows or IT architectures using Mermaid.js.

STRICT RULES FOR MERMAID SYNTAX (V11+):
1. ONE STATEMENT PER LINE: Every node definition, arrow, or subgraph boundary MUST be on its own unique line. Never concatenate statements.
2. ARROW LABELS: Use the syntax 'A -- "Label Text" --> B'. This is the most robust format.
   - ALWAYS wrap the label in double quotes.
   - WRONG: A -->|Label| B
   - RIGHT: A -- "Label Text" --> B
3. NODE LABELS: Use 'ID["Label Text"]'.
   - ALWAYS wrap node labels in double quotes.
   - Example: FE["Frontend App"]
4. SUBGRAPHS:
   - Always start with 'subgraph ID ["Title"]'
   - Always end with 'end' on a new line.
   - Put a 'direction TB' or 'direction LR' inside subgraphs if needed.
5. STYLES: 
   - Define at the bottom: 'classDef green fill:#d1fae5,stroke:#059669,stroke-width:2px;'
   - Apply: 'class nodeID green'
6. MULTI-LINE: Use <br/> inside the quoted labels for line breaks.
7. Avoid using brackets like ( ) or { } inside labels unless they are inside the double quotes.
8. NO STEP LIMIT: Support continuous conversation.
9. Always provide the FULL, valid Mermaid code.

You must return a JSON object with:
{
  "nextStep": number,
  "response": "Text response to user",
  "mermaidCode": "The FULL updated mermaid code string"
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
