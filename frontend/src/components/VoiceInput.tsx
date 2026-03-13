import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Web Speech API type declarations
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VoiceInputProps {
  /** Called with the recognized text (appended to existing) */
  onTranscript: (text: string) => void;
  /** Language for recognition. Default: 'ru-RU' */
  lang?: string;
  /** Additional CSS classes for the button */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  lang = 'ru-RU',
  className,
  disabled = false,
  size = 'md',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast.error(t('ai.voice.notSupported'));
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      let transcript = '';
      for (let i = event.resultIndex; i < results.length; i++) {
        if (results[i].isFinal) {
          transcript += results[i][0].transcript;
        }
      }
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(t('ai.voice.notSupported'));
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return null;
  }

  const iconSize = size === 'sm' ? 14 : 16;
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isListening ? t('ai.voice.stop') : t('ai.voice.record')}
      aria-label={isListening ? t('ai.voice.stop') : t('ai.voice.record')}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        btnSize,
        isListening
          ? 'bg-danger-50 dark:bg-danger-900/30 border-danger-300 dark:border-danger-700 text-danger-600 dark:text-danger-400 animate-pulse'
          : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400',
        className,
      )}
      data-testid="voice-input-button"
    >
      {isListening ? (
        <Square size={iconSize} className="fill-current" />
      ) : (
        <Mic size={iconSize} />
      )}
    </button>
  );
};

export default VoiceInput;
