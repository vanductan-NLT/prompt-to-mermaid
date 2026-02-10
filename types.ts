
export type MessageRole = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  mermaidCode?: string;
  timestamp: Date;
}

export enum InteractionStep {
  INPUT = 1,
  CLARIFY = 2,
  OUTPUT = 3,
  COMPLETE = 4
}

export interface AppState {
  step: InteractionStep;
  messages: ChatMessage[];
  isLoading: boolean;
  currentMermaidCode: string | null;
}
