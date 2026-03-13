import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import type { ChatMessage, LiveData } from './types';
import { API_BASE } from './types';
import { getPageContext, buildSystemPrompt } from './pageContext';
import { TOOLS, TOOL_LABELS, executeTool } from './tools';

// ---------------------------------------------------------------------------
// Live data fetcher — loads real entity data so GPT can actually analyze it
// ---------------------------------------------------------------------------

async function fetchLiveData(pathname: string, token: string | null): Promise<LiveData> {
  if (!token) return null;

  const headers: HeadersInit = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const get = async (path: string) => {
    const r = await fetch(`${API_BASE}${path}`, { headers });
    if (!r.ok) return null;
    return r.json() as Promise<unknown>;
  };

  /** Helper: extract UUID from path segment (skip "new") */
  const idFrom = (match: RegExpMatchArray | null): string | null => {
    if (!match) return null;
    const id = match[1];
    return id === 'new' ? null : id;
  };

  // --- Projects ---
  const projectMatch = pathname.match(/^\/projects\/([^/]+)(?:\/|$)/);
  const projectId = idFrom(projectMatch);
  if (projectId) {
    const [project, financials] = await Promise.all([
      get(`/api/projects/${projectId}`),
      get(`/api/projects/${projectId}/financials`),
    ]);
    return { project, financials };
  }

  // --- Budgets ---
  const budgetId = idFrom(pathname.match(/^\/budgets\/([^/]+)(?:\/|$)/));
  if (budgetId) {
    const budget = await get(`/api/budgets/${budgetId}`);
    return { budget };
  }

  // --- Contracts ---
  const contractId = idFrom(pathname.match(/^\/contracts\/([^/]+)(?:\/|$)/));
  if (contractId) {
    const contract = await get(`/api/contracts/${contractId}`);
    return { contract };
  }

  // --- Invoices ---
  const invoiceId = idFrom(pathname.match(/^\/invoices\/([^/]+)(?:\/|$)/));
  if (invoiceId) {
    const invoice = await get(`/api/invoices/${invoiceId}`);
    return { invoice };
  }

  // --- Estimates ---
  const estimateId = idFrom(pathname.match(/^\/estimates\/([^/]+)(?:\/|$)/));
  if (estimateId) {
    const [estimate, summary] = await Promise.all([
      get(`/api/estimates/${estimateId}`),
      get(`/api/estimates/${estimateId}/financial-summary`),
    ]);
    return { estimate, financialSummary: summary };
  }

  // --- Specifications ---
  const specId = idFrom(pathname.match(/^\/specifications\/([^/]+)(?:\/|$)/));
  if (specId) {
    const specification = await get(`/api/specifications/${specId}`);
    return { specification };
  }

  // --- CRM Leads ---
  const crmLeadId = idFrom(pathname.match(/^\/crm\/leads\/([^/]+)(?:\/|$)/));
  if (crmLeadId) {
    const lead = await get(`/api/v1/crm/leads/${crmLeadId}`);
    return { lead };
  }

  // --- Submittals ---
  const submittalId = idFrom(pathname.match(/^\/submittals\/([^/]+)(?:\/|$)/));
  if (submittalId) {
    const submittal = await get(`/api/pto/submittals/${submittalId}`);
    return { submittal };
  }

  // --- KS-2 ---
  const ks2Id = idFrom(pathname.match(/^\/closing\/ks2\/([^/]+)(?:\/|$)/));
  if (ks2Id) {
    const ks2 = await get(`/api/ks2/${ks2Id}/detail`);
    return { ks2 };
  }

  // --- Site Assessment ---
  const saId = idFrom(pathname.match(/^\/site-assessments\/([^/]+)(?:\/|$)/));
  if (saId) {
    const assessment = await get(`/api/site-assessments/${saId}`);
    return { assessment };
  }

  // --- Commercial Proposal ---
  const cpId = idFrom(pathname.match(/^\/commercial-proposals\/([^/]+)(?:\/|$)/));
  if (cpId) {
    const proposal = await get(`/api/commercial-proposals/${cpId}`);
    return { proposal };
  }

  // --- Support Ticket ---
  const ticketId = idFrom(pathname.match(/^\/support\/([^/]+)(?:\/|$)/));
  if (ticketId) {
    const ticket = await get(`/api/support/tickets/${ticketId}`);
    return { ticket };
  }

  // --- Employee ---
  const empId = idFrom(pathname.match(/^\/hr\/employees\/([^/]+)(?:\/|$)/));
  if (empId) {
    const employee = await get(`/api/hr/employees/${empId}`);
    return { employee };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAiChat() {
  const location = useLocation();
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [liveData, setLiveData] = useState<LiveData>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pageCtx = getPageContext(location.pathname);

  // Fetch real entity data whenever the route changes
  useEffect(() => {
    let cancelled = false;
    setLiveData(null);
    fetchLiveData(location.pathname, token)
      .then((data) => { if (!cancelled) setLiveData(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [location.pathname, token]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    const streamingId = `a-${Date.now()}`;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: 'assistant',
          content: `\u26A0\uFE0F ${t('aiChat.errors.apiKeyNotConfigured')}`,
          ts: new Date().toISOString(),
        },
      ]);
      return;
    }

    const systemPrompt = buildSystemPrompt(pageCtx, location.pathname, liveData);
    const oaiHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };

    const historyForApi = messages.slice(-12).map((m) => ({ role: m.role as string, content: m.content }));
    type OAIMessage = { role: string; content: string | null; tool_call_id?: string; name?: string; tool_calls?: unknown[] };
    const apiMessages: OAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyForApi,
      { role: 'user', content },
    ];

    try {
      abortRef.current = new AbortController();

      // Step 1: Non-streaming call with tools to detect tool use
      const step1Res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: oaiHeaders,
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.4,
          max_tokens: 800,
          tools: TOOLS,
          tool_choice: 'auto',
          messages: apiMessages,
        }),
        signal: abortRef.current.signal,
      });

      if (!step1Res.ok) throw new Error(`OpenAI ${step1Res.status}: ${await step1Res.text()}`);

      const step1Data = await step1Res.json() as {
        choices: {
          finish_reason: string;
          message: { role: string; content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] };
        }[];
      };

      const assistantMsg = step1Data.choices[0].message;
      const finishReason = step1Data.choices[0].finish_reason;

      // Step 2: If tool calls requested, execute them
      if (finishReason === 'tool_calls' && assistantMsg.tool_calls?.length) {
        apiMessages.push({ role: 'assistant', content: assistantMsg.content, tool_calls: assistantMsg.tool_calls });

        for (const toolCall of assistantMsg.tool_calls) {
          const toolName = toolCall.function.name;
          const toolLabel = TOOL_LABELS[toolName] ?? toolName;

          const workId = `work-${Date.now()}-${Math.random()}`;
          setMessages((prev) => [
            ...prev,
            { id: workId, role: 'assistant', content: `\u2699\uFE0F ${toolLabel}\u2026`, ts: new Date().toISOString() },
          ]);

          let toolArgs: Record<string, unknown> = {};
          try { toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>; } catch { /* ignore */ }

          const toolResult = token
            ? await executeTool(toolName, toolArgs, token)
            : JSON.stringify({ error: t('aiChat.errors.notAuthorized') });

          const resultObj = JSON.parse(toolResult) as Record<string, unknown>;
          const resultPreview = resultObj.error
            ? `\u274C ${String(resultObj.error)}`
            : `\u2705 ${toolLabel} \u2014 ${t('aiChat.tools.done')}`;
          setMessages((prev) => prev.map((m) => m.id === workId ? { ...m, content: resultPreview } : m));

          apiMessages.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id, name: toolName });
        }

        setThinking(false);
      } else {
        // No tool calls — use the direct response
        setThinking(false);
        const directContent = assistantMsg.content ?? '';
        setMessages((prev) => [
          ...prev,
          { id: streamingId, role: 'assistant', content: directContent, ts: new Date().toISOString() },
        ]);
        return;
      }

      // Step 3: Stream final natural-language response
      const step2Res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: oaiHeaders,
        body: JSON.stringify({
          model: 'gpt-4o',
          stream: true,
          temperature: 0.5,
          max_tokens: 1000,
          messages: apiMessages,
        }),
        signal: abortRef.current.signal,
      });

      if (!step2Res.ok) throw new Error(`OpenAI ${step2Res.status}: ${await step2Res.text()}`);

      setMessages((prev) => [
        ...prev,
        { id: streamingId, role: 'assistant', content: '', ts: new Date().toISOString() },
      ]);

      let fullContent = '';
      const reader = step2Res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const chunk = parsed.choices?.[0]?.delta?.content ?? '';
            if (chunk) {
              fullContent += chunk;
              setMessages((prev) => prev.map((m) => m.id === streamingId ? { ...m, content: fullContent } : m));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      setThinking(false);
      if (err instanceof Error && err.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => {
        const hasStreaming = prev.some((m) => m.id === streamingId);
        const updated = prev.map((m) => m.id === streamingId ? { ...m, content: `${t('aiChat.errors.errorPrefix')}: ${errMsg}` } : m);
        return hasStreaming ? updated : [...updated, { id: streamingId, role: 'assistant', content: `${t('aiChat.errors.errorPrefix')}: ${errMsg}`, ts: new Date().toISOString() }];
      });
    }
  }, [input, thinking, messages, pageCtx, location.pathname, liveData, token]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setThinking(false);
  }, []);

  const suggestions = [
    pageCtx.hint,
    t('aiChat.suggestions.explainStatuses'),
    t('aiChat.suggestions.whatNext'),
  ];

  return {
    open,
    setOpen,
    messages,
    input,
    setInput,
    thinking,
    liveData,
    pageCtx,
    messagesEndRef,
    inputRef,
    sendMessage,
    handleKey,
    clearChat,
    suggestions,
  };
}
