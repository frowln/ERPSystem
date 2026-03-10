import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { callsApi, type CallSession, type CallType } from '@/api/calls';

// ---------------------------------------------------------------------------
// VideoTile (duplicate for guest page — self-contained, no auth deps)
// ---------------------------------------------------------------------------

const VideoTile: React.FC<{
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  isLocal?: boolean;
  className?: string;
}> = ({ stream, label, muted = false, isLocal = false, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((tr) => tr.enabled && tr.readyState === 'live');

  return (
    <div
      className={cn(
        'relative bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center',
        className,
      )}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn('w-full h-full object-cover', isLocal && 'transform -scale-x-100')}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-semibold">
            {label.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-neutral-400">{label}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
        {label}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CallTimer
// ---------------------------------------------------------------------------

const CallTimer: React.FC<{ startedAt?: string }> = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="text-sm text-neutral-300 tabular-nums">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Guest Call Page
// ---------------------------------------------------------------------------

type PageState = 'loading' | 'name-input' | 'joining' | 'in-call' | 'ended' | 'error';

export default function GuestCallPage() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [guestName, setGuestName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // In-call state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Load call info
  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid link');
      setPageState('error');
      return;
    }
    callsApi.getByToken(token).then((session) => {
      setCallSession(session);
      if (session.status === 'ENDED' || session.status === 'CANCELLED') {
        setPageState('ended');
      } else {
        setPageState('name-input');
      }
    }).catch(() => {
      setErrorMsg(t('calls.noAnswer'));
      setPageState('error');
    });
  }, [token]);

  // Join the call
  const handleJoin = useCallback(async () => {
    if (!token || !guestName.trim()) return;
    setPageState('joining');
    try {
      const session = await callsApi.joinByLink(token, guestName.trim());
      setCallSession(session);

      // Acquire media
      const isVideo = session.callType === 'VIDEO';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (!isVideo) setIsCameraOff(true);
      } catch {
        // Try audio only
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setIsCameraOff(true);
        } catch {
          // No media
        }
      }
      setPageState('in-call');
    } catch {
      setErrorMsg(t('calls.callEnded'));
      setPageState('error');
    }
  }, [token, guestName]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !isMuted;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !newMuted;
    }
    setIsMuted(newMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newOff = !isCameraOff;
    for (const track of stream.getVideoTracks()) {
      track.enabled = !newOff;
    }
    setIsCameraOff(newOff);
  }, [isCameraOff]);

  const handleLeave = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setPageState('ended');
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="text-neutral-400 text-sm">{t('calls.loading') || 'Loading...'}</span>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
          <PhoneOff size={40} className="mx-auto text-neutral-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">{errorMsg || t('common.operationError')}</h2>
          <p className="text-neutral-400 text-sm">{t('calls.callEnded')}</p>
        </div>
      </div>
    );
  }

  // ── Ended ─────────────────────────────────────────────────────────────

  if (pageState === 'ended') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
          <PhoneOff size={40} className="mx-auto text-neutral-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">{t('calls.callEnded')}</h2>
          {callSession?.durationSeconds != null && callSession.durationSeconds > 0 && (
            <p className="text-neutral-400 text-sm">
              {t('calls.duration')}: {Math.floor(callSession.durationSeconds / 60)}:{String(callSession.durationSeconds % 60).padStart(2, '0')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Name input (guest lobby) ──────────────────────────────────────────

  if (pageState === 'name-input' || pageState === 'joining') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 flex items-center justify-center">
            {callSession?.callType === 'VIDEO' ? (
              <Video size={28} className="text-white" />
            ) : (
              <Phone size={28} className="text-white" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">
            {callSession?.title ?? t('calls.groupCall')}
          </h2>
          <p className="text-neutral-400 text-sm mb-6">
            {callSession?.initiatorName ? `${t('calls.incoming')}: ${callSession.initiatorName}` : t('calls.guestJoin')}
          </p>

          <div className="mb-4">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('calls.enterName')}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={pageState === 'joining'}
              autoFocus
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!guestName.trim() || pageState === 'joining'}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {pageState === 'joining' && <Loader2 size={16} className="animate-spin" />}
            {t('calls.guestJoin')}
          </button>

          {callSession?.participants && callSession.participants.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-neutral-500">
              <Users size={12} />
              <span>{callSession.participants.length} {t('calls.participants').toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── In-call (simplified for guest — no WebRTC mesh, just media preview + leave) ──

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-white truncate">
            {callSession?.title ?? t('calls.groupCall')}
          </span>
          <CallTimer startedAt={callSession?.startedAt} />
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Users size={14} />
          <span>{callSession?.participants?.length ?? 0}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <VideoTile
          stream={localStream}
          label={guestName || 'Guest'}
          muted
          isLocal
          className="w-full max-w-2xl aspect-video"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-neutral-900/80 border-t border-neutral-800">
        <button
          onClick={toggleMute}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isMuted ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-neutral-700 text-white hover:bg-neutral-600',
          )}
          title={isMuted ? t('calls.unmute') : t('calls.mute')}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleCamera}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isCameraOff ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-neutral-700 text-white hover:bg-neutral-600',
          )}
          title={isCameraOff ? t('calls.cameraOn') : t('calls.cameraOff')}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={handleLeave}
          className="w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
          title={t('calls.endCall')}
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}
