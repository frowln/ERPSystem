// ---------------------------------------------------------------------------
// Shared types for AiChatWidget
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface PageContext {
  section: string;
  hint: string;
  systemContext: string;
}

export interface OAITool {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export type LiveData = Record<string, unknown> | null;

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
