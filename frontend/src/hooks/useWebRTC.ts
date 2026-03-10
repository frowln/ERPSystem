import { useCallback, useEffect, useRef, useState } from 'react';
import { wsClient } from '@/lib/websocket';
import type { Subscription } from '@/lib/websocket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeerStream {
  peerId: string;
  stream: MediaStream;
  userName?: string;
}

export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-invite' | 'call-accept' | 'call-decline' | 'call-end' | string;
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
  callType?: 'AUDIO' | 'VIDEO';
  callerName?: string;
}

export interface UseWebRTCOptions {
  callId: string;
  userId: string;
  userName?: string;
  callType: 'AUDIO' | 'VIDEO';
  /** List of peer user IDs to connect to (for group calls — mesh topology) */
  peerIds: string[];
  enabled: boolean;
}

export type WebRTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: PeerStream[];
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  connectionState: WebRTCConnectionState;
  toggleMute: () => void;
  toggleCamera: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  hangUp: () => void;
}

// ---------------------------------------------------------------------------
// STUN / ICE configuration
// ---------------------------------------------------------------------------

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const { callId, userId, callType, peerIds, enabled } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(callType === 'AUDIO');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('new');

  // Refs for cleanup
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const isInitialized = useRef(false);

  // Keep latest handler in a ref so subscription doesn't go stale
  const handleSignalRef = useRef<(signal: SignalMessage) => void>(() => {});

  // ── Get user media ────────────────────────────────────────────────────

  const acquireLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'VIDEO',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (callType === 'AUDIO') setIsCameraOff(true);
      return stream;
    } catch {
      // Fallback: try audio only
      if (callType === 'VIDEO') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setIsCameraOff(true);
          return stream;
        } catch {
          // No media at all — return null
        }
      }
      return null;
    }
  }, [callType]);

  // ── Create peer connection for a specific peer ────────────────────────

  const createPeerConnection = useCallback(
    (peerId: string, stream: MediaStream | null): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }

      // ICE candidates → send via signaling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsClient.publish('/app/signal', {
            type: 'ice-candidate',
            callId,
            fromUserId: userId,
            toUserId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Remote tracks → store
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          setRemoteStreams((prev) => {
            const exists = prev.find((s) => s.peerId === peerId);
            if (exists) {
              return prev.map((s) => (s.peerId === peerId ? { ...s, stream: remoteStream } : s));
            }
            return [...prev, { peerId, stream: remoteStream }];
          });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === 'connected') setConnectionState('connected');
        else if (st === 'connecting') setConnectionState('connecting');
        else if (st === 'disconnected') setConnectionState('disconnected');
        else if (st === 'failed') setConnectionState('failed');
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [callId, userId],
  );

  // ── Send offer to a peer ──────────────────────────────────────────────

  const sendOffer = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsClient.publish('/app/signal', {
          type: 'offer',
          callId,
          fromUserId: userId,
          toUserId: peerId,
          sdp: pc.localDescription,
        });
        setConnectionState('connecting');
      } catch (err) {
        if (import.meta.env.DEV) console.error('[WebRTC] Error creating offer:', err);
      }
    },
    [callId, userId],
  );

  // ── Handle incoming signal messages ───────────────────────────────────

  const handleSignal = useCallback(
    async (signal: SignalMessage) => {
      if (signal.callId !== callId) return;
      if (signal.toUserId !== userId) return;

      const fromPeerId = signal.fromUserId;

      if (signal.type === 'offer' && signal.sdp) {
        let pc = peerConnectionsRef.current.get(fromPeerId);
        if (!pc) {
          pc = createPeerConnection(fromPeerId, localStreamRef.current);
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsClient.publish('/app/signal', {
            type: 'answer',
            callId,
            fromUserId: userId,
            toUserId: fromPeerId,
            sdp: pc.localDescription,
          });
        } catch (err) {
          if (import.meta.env.DEV) console.error('[WebRTC] Error handling offer:', err);
        }
      } else if (signal.type === 'answer' && signal.sdp) {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } catch (err) {
            if (import.meta.env.DEV) console.error('[WebRTC] Error handling answer:', err);
          }
        }
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (import.meta.env.DEV) console.error('[WebRTC] Error adding ICE candidate:', err);
          }
        }
      } else if (signal.type === 'call-end') {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(fromPeerId);
          setRemoteStreams((prev) => prev.filter((s) => s.peerId !== fromPeerId));
        }
      }
    },
    [callId, userId, createPeerConnection],
  );

  // Keep handler ref in sync
  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);

  // ── Initialize WebRTC ─────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !callId || isInitialized.current) return;
    isInitialized.current = true;

    let cancelled = false;

    const init = async () => {
      // 1. Acquire local media
      const stream = await acquireLocalStream();
      if (cancelled) {
        stream?.getTracks().forEach((tr) => tr.stop());
        return;
      }

      // 2. Subscribe to signaling channel for this user
      const sub = wsClient.subscribeRaw<SignalMessage>(
        '/user/queue/signal',
        (msg) => handleSignalRef.current(msg),
      );
      subscriptionRef.current = sub;

      // 3. Create peer connections and send offers
      for (const peerId of peerIds) {
        if (peerId === userId) continue;
        const pc = createPeerConnection(peerId, stream);
        await sendOffer(peerId, pc);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, callId]);

  // ── Cleanup on unmount ────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      for (const [, pc] of peerConnectionsRef.current) {
        pc.close();
      }
      peerConnectionsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      screenStreamRef.current = null;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      isInitialized.current = false;
    };
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────

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

  const stopScreenShareInternal = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    screenStreamRef.current = null;

    // Restore camera track in all peer connections
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      for (const [, pc] of peerConnectionsRef.current) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(cameraTrack).catch(() => { /* ignore */ });
      }
    }
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      // Replace video track in all peer connections
      for (const [, pc] of peerConnectionsRef.current) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);
      }

      // When user stops sharing via browser UI
      screenTrack.onended = () => stopScreenShareInternal();
    } catch {
      // User cancelled or error
    }
  }, [stopScreenShareInternal]);

  const stopScreenShare = useCallback(() => {
    stopScreenShareInternal();
  }, [stopScreenShareInternal]);

  const hangUp = useCallback(() => {
    // Notify all peers
    for (const peerId of peerConnectionsRef.current.keys()) {
      wsClient.publish('/app/signal', {
        type: 'call-end',
        callId,
        fromUserId: userId,
        toUserId: peerId,
      });
    }

    // Close all connections
    for (const [, pc] of peerConnectionsRef.current) {
      pc.close();
    }
    peerConnectionsRef.current.clear();

    // Stop all media
    localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    screenStreamRef.current = null;

    // Unsubscribe
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;

    setLocalStream(null);
    setRemoteStreams([]);
    setIsScreenSharing(false);
    setConnectionState('disconnected');
    isInitialized.current = false;
  }, [callId, userId]);

  return {
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
  };
}
