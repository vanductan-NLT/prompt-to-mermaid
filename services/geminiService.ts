
import { GoogleGenAI, Type } from "@google/genai";
import { InteractionStep, MessageRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are a Mermaid Flowchart Generator Bot.
Your goal is to help users visualize workflows or IT architectures using Mermaid.js.

STRICT RULES FOR MERMAID SYNTAX:
1. ARROW LABELS: Always use the format 'A -->| "Label Text" | B'. 
   - ALWAYS wrap the label in double quotes if it contains spaces, special characters (like brackets, slashes, hashes), or HTML tags like <br/>.
   - WRONG: A --|label| B
   - RIGHT: A -->| "label" | B
2. NODE LABELS: Use 'ID["Label Text"]' or 'ID(["Label Text"])' for nodes.
   - ALWAYS wrap node labels in double quotes.
3. STYLES: 
   - Use 'classDef className fill:#hex,stroke:#hex,stroke-width:2px;'
   - Use 'class nodeID className' to apply.
   - Standard palette: 
     - green: fill:#d1fae5,stroke:#059669
     - yellow: fill:#fef3c7,stroke:#d97706
     - red: fill:#fee2e2,stroke:#dc2626
     - blue: fill:#e0f2fe,stroke:#0284c7
4. MULTI-LINE: Use <br/> for line breaks inside the quoted labels.
5. NO STEP LIMIT: Support continuous conversation. Users can refine their diagrams indefinitely or start new ones.
6. Language: Use Vietnamese if the user uses Vietnamese, but technical terms in Mermaid labels should be English for professional standards.
7. Always provide the FULL updated Mermaid code.

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
