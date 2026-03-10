import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface VoiceRecorderProps {
  onSend: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'preview';

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSend,
  disabled = false,
  className,
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    audioBlobRef.current = null;
    chunksRef.current = [];
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('preview');
        // Stop mic
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(t('messaging.micPermissionDenied'));
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setState('idle');
  }, [cleanup]);

  const sendRecording = useCallback(() => {
    if (audioBlobRef.current) {
      onSend(audioBlobRef.current, duration);
    }
    cleanup();
    setState('idle');
  }, [onSend, duration, cleanup]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (state === 'idle') {
    return (
      <button
        onClick={startRecording}
        disabled={disabled}
        className={cn(
          'flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50',
          className,
        )}
        title={t('messaging.voiceMessage')}
      >
        <Mic size={18} />
      </button>
    );
  }

  if (state === 'recording') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Recording indicator */}
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs text-red-500 font-medium min-w-[40px]">
          {formatDuration(duration)}
        </span>

        {/* Waveform visualization */}
        <div className="flex items-center gap-0.5 h-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-red-400 dark:bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.sin((Date.now() / 200 + i) * 0.8) * 8}px`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>

        <button
          onClick={cancelRecording}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={t('common.cancel')}
        >
          <X size={16} />
        </button>
        <button
          onClick={stopRecording}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title={t('messaging.stopRecording')}
        >
          <Square size={16} />
        </button>
      </div>
    );
  }

  // Preview state
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={togglePlayback}
        className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 min-w-[40px]">
        {formatDuration(duration)}
      </span>
      <button
        onClick={cancelRecording}
        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title={t('common.cancel')}
      >
        <X size={16} />
      </button>
      <button
        onClick={sendRecording}
        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
      >
        {t('messageInput.send')}
      </button>
    </div>
  );
};
