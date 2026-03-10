import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Copy,
  X,
  Users,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useWebRTC } from '@/hooks/useWebRTC';
import { callsApi, type CallSession, type CallType } from '@/api/calls';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CallDialogMode = 'ringing-incoming' | 'ringing-outgoing' | 'active' | 'ended';

export interface CallDialogProps {
  /** The active call session */
  callSession: CallSession | null;
  /** Current user info */
  userId: string;
  userName: string;
  /** Which mode the dialog is in */
  mode: CallDialogMode;
  /** Called when the user wants to close/dismiss the dialog */
  onClose: () => void;
  /** Called when the user accepts an incoming call */
  onAccept?: () => void;
  /** Called when the user declines an incoming call */
  onDecline?: () => void;
  /** Called when the call ends (from either side) */
  onCallEnded?: () => void;
}

// ---------------------------------------------------------------------------
// VideoTile — renders a single video/audio participant tile
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

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

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
        {label}{isLocal ? ` (${t('common.you') || 'You'})` : ''}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CallTimer — shows elapsed time
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
// CallDialog component
// ---------------------------------------------------------------------------

const CallDialog: React.FC<CallDialogProps> = ({
  callSession,
  userId,
  userName,
  mode,
  onClose,
  onAccept,
  onDecline,
  onCallEnded,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  // Compute peer IDs from call participants
  const peerIds = useMemo(() => {
    if (!callSession?.participants) return [];
    return callSession.participants
      .filter((p) => p.userId !== userId && p.status === 'JOINED')
      .map((p) => p.userId);
  }, [callSession?.participants, userId]);

  // WebRTC hook
  const {
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    isScreenSharing,
    connectionState,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    hangUp,
  } = useWebRTC({
    callId: callSession?.id ?? '',
    userId,
    userName,
    callType: (callSession?.callType ?? 'VIDEO') as CallType,
    peerIds,
    enabled: mode === 'active' && !!callSession,
  });

  // ── End call handler ─────────────────────────────────────────────────

  const handleEndCall = useCallback(async () => {
    hangUp();
    if (callSession) {
      try {
        await callsApi.end(callSession.id, userId);
      } catch {
        // ignore
      }
    }
    onCallEnded?.();
  }, [callSession, userId, hangUp, onCallEnded]);

  // ── Copy invite link ─────────────────────────────────────────────────

  const handleCopyInviteLink = useCallback(async () => {
    if (!callSession) return;
    try {
      let token: string | undefined = callSession.inviteToken;
      if (!token) {
        const updated = await callsApi.generateInviteLink(callSession.id);
        token = updated.inviteToken;
      }
      if (token) {
        const link = `${window.location.origin}/call/${token}`;
        setInviteLink(link);
        await navigator.clipboard.writeText(link);
        toast.success(t('calls.linkCopied'));
      }
    } catch {
      toast.error(t('common.operationError'));
    }
  }, [callSession]);

  // ── Ringing animation pulse ──────────────────────────────────────────

  if (!callSession) return null;

  // ── MINIMIZED PIP view ────────────────────────────────────────────────

  if (minimized && mode === 'active') {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] w-64 h-44 bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden cursor-pointer border border-neutral-700"
        onClick={() => setMinimized(false)}
      >
        {/* Show remote video or local video in mini view */}
        {remoteStreams[0] ? (
          <VideoTile
            stream={remoteStreams[0].stream}
            label={remoteStreams[0].userName ?? t('calls.participants')}
            className="w-full h-full"
          />
        ) : (
          <VideoTile
            stream={localStream}
            label={userName}
            muted
            isLocal
            className="w-full h-full"
          />
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
            className="p-1 bg-black/50 rounded-md text-white hover:bg-black/70 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
            className="p-1 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={14} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <CallTimer startedAt={callSession.startedAt} />
        </div>
      </div>
    );
  }

  // ── RINGING state (incoming) ──────────────────────────────────────────

  if (mode === 'ringing-incoming') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-neutral-900 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          {/* Pulsing ring animation */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-green-500/30 animate-ping animation-delay-200" />
            <div className="relative w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-semibold">
              {callSession.initiatorName?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">
            {callSession.initiatorName ?? t('calls.incoming')}
          </h2>
          <p className="text-neutral-400 text-sm mb-8">
            {callSession.callType === 'VIDEO' ? t('calls.newVideoCall') : t('calls.newAudioCall')}
          </p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center text-white shadow-lg"
              title={t('calls.decline')}
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center text-white shadow-lg"
              title={t('calls.accept')}
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RINGING state (outgoing) ──────────────────────────────────────────

  if (mode === 'ringing-outgoing') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-neutral-900 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-semibold">
              {callSession.callType === 'VIDEO' ? <Video size={32} /> : <Phone size={32} />}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">
            {t('calls.outgoing')}
          </h2>
          <p className="text-neutral-400 text-sm mb-8">
            {t('calls.connecting')}
          </p>

          <button
            onClick={() => { handleEndCall(); onClose(); }}
            className="w-14 h-14 mx-auto rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center text-white shadow-lg"
            title={t('calls.endCall')}
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    );
  }

  // ── ENDED state ───────────────────────────────────────────────────────

  if (mode === 'ended') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-neutral-900 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
            <PhoneOff size={28} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">{t('calls.callEnded')}</h2>
          {callSession.durationSeconds > 0 && (
            <p className="text-neutral-400 text-sm mb-6">
              {t('calls.duration')}: {Math.floor(callSession.durationSeconds / 60)}:{String(callSession.durationSeconds % 60).padStart(2, '0')}
            </p>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE CALL state ─────────────────────────────────────────────────

  const totalParticipants = 1 + remoteStreams.length; // 1 = local
  const gridClass =
    totalParticipants <= 1
      ? 'grid-cols-1'
      : totalParticipants <= 2
        ? 'grid-cols-1 md:grid-cols-2'
        : totalParticipants <= 4
          ? 'grid-cols-2'
          : totalParticipants <= 6
            ? 'grid-cols-2 md:grid-cols-3'
            : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500',
            )}
          />
          <span className="text-sm font-medium text-white truncate max-w-[200px]">
            {callSession.title ?? t('calls.groupCall')}
          </span>
          <CallTimer startedAt={callSession.startedAt} />
          {connectionState === 'connecting' && (
            <span className="text-xs text-yellow-400">{t('calls.connecting')}</span>
          )}
          {connectionState === 'disconnected' && (
            <span className="text-xs text-red-400">{t('calls.reconnecting')}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={cn(
              'p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5',
              showParticipants && 'bg-neutral-800 text-white',
            )}
            title={t('calls.participants')}
          >
            <Users size={16} />
            <span className="text-xs">{callSession.participants?.length ?? 0}</span>
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={() => { handleEndCall(); onClose(); }}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Video grid + participants sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className={cn('flex-1 p-3 grid gap-3', gridClass)}>
          {/* Local video */}
          <VideoTile
            stream={localStream}
            label={userName}
            muted
            isLocal
            className="min-h-[200px]"
          />

          {/* Remote streams */}
          {remoteStreams.map((rs) => (
            <VideoTile
              key={rs.peerId}
              stream={rs.stream}
              label={rs.userName ?? rs.peerId.slice(0, 8)}
              className="min-h-[200px]"
            />
          ))}
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-64 bg-neutral-900 border-l border-neutral-800 overflow-y-auto">
            <div className="p-3 border-b border-neutral-800">
              <h3 className="text-sm font-medium text-white">{t('calls.participants')}</h3>
            </div>
            <div className="p-2 space-y-1">
              {callSession.participants?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-800"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {(p.userName ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{p.userName ?? p.userId.slice(0, 8)}</div>
                    <div className="text-xs text-neutral-500">
                      {p.status === 'JOINED' ? t('calls.statusActive') : p.status === 'INVITED' ? t('calls.statusRinging') : p.status}
                    </div>
                  </div>
                  {p.muted && <MicOff size={12} className="text-red-400 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-neutral-900/80 border-t border-neutral-800">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isMuted
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-neutral-700 text-white hover:bg-neutral-600',
          )}
          title={isMuted ? t('calls.unmute') : t('calls.mute')}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera toggle */}
        <button
          onClick={toggleCamera}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isCameraOff
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-neutral-700 text-white hover:bg-neutral-600',
          )}
          title={isCameraOff ? t('calls.cameraOn') : t('calls.cameraOff')}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* Screen share */}
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isScreenSharing
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-neutral-700 text-white hover:bg-neutral-600',
          )}
          title={isScreenSharing ? t('calls.stopSharing') : t('calls.shareScreen')}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        {/* Copy invite link */}
        <button
          onClick={handleCopyInviteLink}
          className="w-12 h-12 rounded-full bg-neutral-700 text-white hover:bg-neutral-600 flex items-center justify-center transition-colors"
          title={t('calls.copyLink')}
        >
          <Copy size={20} />
        </button>

        {/* End call */}
        <button
          onClick={() => { handleEndCall(); onClose(); }}
          className="w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
          title={t('calls.endCall')}
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};

export default CallDialog;
