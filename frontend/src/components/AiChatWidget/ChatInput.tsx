import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// SpeechRecognition type shim for Web Speech API
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null;
}

// ---------------------------------------------------------------------------
// Voice recording states
// ---------------------------------------------------------------------------

type VoiceState = 'idle' | 'recording' | 'processing';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatInputProps {
  input: string;
  thinking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChatInputInner: React.FC<ChatInputProps> = ({
  input,
  thinking,
  inputRef,
  onInputChange,
  onKeyDown,
  onSend,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preExistingTextRef = useRef('');

  // Check browser support on mount
  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 10_000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    preExistingTextRef.current = input;

    recognition.onstart = () => {
      setVoiceState('recording');
      resetSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      resetSilenceTimer();

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const transcribed = (finalTranscript || interimTranscript).trim();
      if (transcribed) {
        const pre = preExistingTextRef.current;
        const newText = pre ? `${pre} ${transcribed}` : transcribed;
        onInputChange(newText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setVoiceState('idle');
      }
    };

    recognition.onend = () => {
      setVoiceState('idle');
      recognitionRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setVoiceState('idle');
      recognitionRef.current = null;
    }
  }, [input, onInputChange, resetSilenceTimer]);

  const toggleRecording = useCallback(() => {
    if (voiceState === 'recording') {
      stopRecording();
    } else if (voiceState === 'idle') {
      startRecording();
    }
  }, [voiceState, stopRecording, startRecording]);

  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800 px-3 py-2.5 flex-shrink-0">
      {/* Recording indicator */}
      {voiceState === 'recording' && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            {t('aiChat.voice.listening')}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-auto"
          >
            {t('aiChat.voice.tapToStop')}
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('aiChat.input.placeholder')}
          rows={1}
          disabled={thinking}
          className={cn(
            'flex-1 resize-none text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5',
            'bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
            'placeholder:text-neutral-400 max-h-24 leading-relaxed',
          )}
          style={{ minHeight: '38px' }}
        />

        {/* Mic button — only shown when Web Speech API is available */}
        {isSupported && (
          <button
            type="button"
            onClick={toggleRecording}
            disabled={thinking || voiceState === 'processing'}
            title={
              voiceState === 'recording'
                ? t('aiChat.voice.tapToStop')
                : t('aiChat.voice.listening')
            }
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              voiceState === 'recording'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                : voiceState === 'processing'
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200',
            )}
          >
            {voiceState === 'processing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mic size={14} />
            )}
          </button>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || thinking}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
            input.trim() && !thinking
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed',
          )}
        >
          <Send size={14} />
        </button>
      </div>
      <p className="text-[10px] text-neutral-400 mt-1.5 text-center">{t('aiChat.input.hint')}</p>
    </div>
  );
};

const ChatInput = React.memo(ChatInputInner);
export default ChatInput;
