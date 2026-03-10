import React, { useRef, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Camera, CameraOff, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  callerName?: string;
}

export const CallOverlay: React.FC<Props> = ({
  localStream, remoteStream, isMuted, isCameraOff,
  onEndCall, onToggleMute, onToggleCamera, callerName,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-900 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-10 w-10 text-neutral-400 animate-pulse" />
              </div>
              <p className="text-lg text-neutral-300">{callerName ?? t('calls.defaultCallTitle')}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('calls.statusRinging')}</p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {localStream && (
          <div className="absolute top-4 right-4 w-40 h-28 rounded-lg overflow-hidden shadow-xl border-2 border-neutral-700">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 py-6 bg-neutral-800/80">
        <button
          onClick={onToggleMute}
          className={cn(
            'p-4 rounded-full transition-colors',
            isMuted ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600',
          )}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button
          onClick={onToggleCamera}
          className={cn(
            'p-4 rounded-full transition-colors',
            isCameraOff ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600',
          )}
        >
          {isCameraOff ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
        </button>
        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
