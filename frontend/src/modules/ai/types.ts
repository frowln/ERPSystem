export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiSuggestion {
  text: string;
  icon: string;
}
