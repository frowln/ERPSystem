import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai';
import type { AiConversation, AiMessage, AiSuggestion } from './types';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTIONS: AiSuggestion[] = [
  { text: 'Проанализируй бюджет проекта ЖК Солнечный', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { text: 'Какие риски на текущих проектах?', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { text: 'Сводка по безопасности за неделю', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { text: 'Найди просроченные задачи', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { text: 'Статус поставок материалов', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Markdown renderer (lightweight)
// ---------------------------------------------------------------------------

const renderMarkdown = (content: string): string => {
  let html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm list-decimal">$1</li>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return '';
      const tag = cells.length > 0 ? 'td' : 'td';
      return '<tr>' + cells.map((c) => `<${tag} class="px-2 py-1 border-b border-neutral-200 dark:border-neutral-700 text-sm">${c}</${tag}>`).join('') + '</tr>';
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-sm text-neutral-700 dark:text-neutral-300 mt-1.5">')
    // Line breaks
    .replace(/\n/g, '<br />');

  return `<div class="prose-sm">${html}</div>`;
};

// ---------------------------------------------------------------------------
// Loading dots animation
// ---------------------------------------------------------------------------

const ThinkingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm text-neutral-400 ml-2">ИИ-ассистент думает...</span>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AiAssistantPage: React.FC = () => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversationId === 'c1') {
      setMessages([]);
    } else if (activeConversationId) {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleNewConversation = () => {
    const newConv: AiConversation = {
      id: `c-${Date.now()}`,
      title: 'Новый диалог',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messagesCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleTitleSave = (id: string) => {
    if (!editTitleValue.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editTitleValue.trim() } : c))
    );
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const handleSendMessage = useCallback(async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content) return;

    // Create conversation if none active
    let convId = activeConversationId;
    if (!convId) {
      const newConv: AiConversation = {
        id: `c-${Date.now()}`,
        title: content.length > 40 ? content.slice(0, 40) + '...' : content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messagesCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConversationId(convId);
    }

    // Add user message
    const userMsg: AiMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

    const aiResponse = generateMockResponse(content);
    const assistantMsg: AiMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsThinking(false);
  }, [inputValue, activeConversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: AiSuggestion) => {
    handleSendMessage(suggestion.text);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-8rem)] -mt-2">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 border-r border-neutral-200 dark:border-neutral-700 flex flex-col shrink-0 bg-neutral-50 dark:bg-neutral-800">
          {/* Sidebar header */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Новый диалог
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-8">Нет диалогов</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <svg className="w-4 h-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  {editingTitle === conv.id ? (
                    <input
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={() => handleTitleSave(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave(conv.id);
                        if (e.key === 'Escape') setEditingTitle(null);
                      }}
                      className="text-sm w-full bg-white dark:bg-neutral-900 border border-primary-300 rounded px-1 py-0.5 focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-sm truncate">{conv.title}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle(conv.id);
                      setEditTitleValue(conv.title);
                    }}
                    className="p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600"
                    title="Переименовать"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="p-1 rounded hover:bg-danger-100 text-neutral-400 hover:text-danger-600"
                    title="Удалить"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {activeConversation?.title || 'ИИ-ассистент'}
              </h2>
              <p className="text-xs text-neutral-400">Строительный помощник на базе ИИ</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">ИИ-ассистент</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-md mb-8">
                Я помогу с анализом проектов, бюджетов, рисков и других данных вашей строительной компании. Задайте вопрос или выберите тему ниже.
              </p>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-start gap-3 text-left border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={suggestion.icon} />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-primary-700">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div
                    className="text-sm [&_table]:w-full [&_table]:border-collapse [&_table]:mt-2 [&_table]:mb-2 [&_tr:first-child_td]:font-semibold [&_tr:first-child_td]:bg-neutral-50 dark:bg-neutral-800 [&_li]:py-0.5"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                )}
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-primary-200' : 'text-neutral-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-neutral-300 flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                <ThinkingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3">
          {/* Suggestion chips above input when messages exist */}
          {messages.length > 0 && !isThinking && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSuggestionClick(s)}
                  className="shrink-0 text-xs border border-neutral-200 dark:border-neutral-700 text-neutral-600 rounded-full px-3 py-1.5 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Задайте вопрос ИИ-ассистенту..."
                rows={1}
                className="w-full resize-none border border-neutral-300 dark:border-neutral-600 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 max-h-32"
                style={{ minHeight: '44px' }}
                disabled={isThinking}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isThinking}
              className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2 text-center">
            ИИ-ассистент анализирует данные проектов. Ответы носят рекомендательный характер.
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
const generateMockResponse = (question: string): string => {
  const q = question.toLowerCase();

  if (q.includes('риск')) {
    return `## Обзор рисков по текущим проектам\n\n### Высокий приоритет\n1. **ЖК "Солнечный"** - Задержка поставки металлоконструкций на 2 недели\n   - Влияние: смещение графика монтажа каркаса 3-го этажа\n   - Рекомендация: связаться с поставщиком, рассмотреть альтернативу\n\n2. **Мост через р. Вятка** - Превышение бюджета на земляные работы (+15%)\n   - Причина: обнаружены грунтовые воды выше проектной отметки\n   - Рекомендация: пересмотреть проект водопонижения\n\n### Средний приоритет\n- ТЦ "Центральный" - нехватка квалифицированных сварщиков (3 из 8)\n- ЖК "Новые Горизонты" - истекает срок разрешения на строительство через 45 дней`;
  }

  if (q.includes('безопасност')) {
    return `## Сводка по безопасности за неделю\n**Период:** 08.03.2025 - 15.03.2025\n\n### Статистика\n- Инцидентов: **2** (прошлая неделя: 1)\n- Проверок: **12** из 15 запланированных\n- Нарушений: **8** (устранено: 5)\n- Дней без травм: **23**\n\n### Инциденты\n1. Падение предмета с высоты (ЖК "Солнечный", 10.03) - без пострадавших\n2. Мелкая травма руки (ТЦ "Центральный", 12.03) - оказана первая помощь\n\n### Рекомендации\n- Провести внеплановый инструктаж по работе на высоте\n- Усилить контроль ограждений на объекте ЖК "Солнечный"\n- Обновить запас СИЗ на складе`;
  }

  if (q.includes('задач') && q.includes('просроч')) {
    return `## Просроченные задачи\n\nОбнаружено **14** просроченных задач по 3 проектам:\n\n### ЖК "Солнечный" (7 задач)\n- Монтаж опалубки перекрытия 4 этажа - просрочка 3 дня\n- Приёмка арматуры от поставщика - просрочка 5 дней\n- Оформление акта скрытых работ №12 - просрочка 2 дня\n- Испытание бетона кубиков серии №8 - просрочка 4 дня\n- ещё 3 задачи...\n\n### Мост через р. Вятка (4 задачи)\n- Водопонижение котлована - просрочка 7 дней\n- Геодезическая разбивка опоры №3 - просрочка 2 дня\n- ещё 2 задачи...\n\n### ТЦ "Центральный" (3 задачи)\n- Согласование изменений в проект - просрочка 10 дней\n- ещё 2 задачи...`;
  }

  if (q.includes('поставк') || q.includes('материал')) {
    return `## Статус поставок материалов\n\n### Ожидаемые поставки (ближайшие 7 дней)\n| Материал | Поставщик | Объект | Дата | Статус |\n|----------|-----------|--------|------|--------|\n| Арматура A500C d16 | СтальТорг | ЖК Солнечный | 17.03 | В пути |\n| Бетон B25 | БетонСервис | ТЦ Центральный | 18.03 | Подтверждён |\n| Кирпич М150 | СтройКомплект | ЖК НГ | 19.03 | Подтверждён |\n| Щебень фр 5-20 | Промснаб | Мост | 20.03 | Ожидание |\n\n### Проблемные поставки\n- **Металлоконструкции** (ООО "МеталлСтрой") - задержка на 14 дней, новая дата: 28.03\n- **Утеплитель** (ООО "ТеплоДом") - частичная поставка, 60% от заказа\n\n### Склад - критически низкие остатки\n- Цемент М500: осталось на 3 дня работ\n- Электроды: осталось на 2 дня работ`;
  }

  return `Спасибо за вопрос. Вот что я нашёл по вашему запросу:\n\n### Краткая сводка\nНа текущий момент в системе активно **4 проекта** с общим бюджетом **1.2 млрд ₽**.\n\n### Ключевые показатели\n- Средний прогресс по проектам: **47%**\n- Открытых задач: **156**\n- Активных договоров: **23**\n- Замечаний в работе: **34**\n\nЕсли вам нужна более детальная информация по конкретному аспекту, уточните вопрос.`;
};

export default AiAssistantPage;
