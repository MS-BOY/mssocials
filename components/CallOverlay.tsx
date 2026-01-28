
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, Zap, ShieldAlert, Loader2 } from 'lucide-react';

interface CallOverlayProps {
  type: 'voice' | 'video';
  target: { name: string, avatar: string };
  onClose: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ type, target, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 2000);
    const interval = setInterval(() => {
      if (!isConnecting) setCallDuration(prev => prev + 1);
    }, 1000);

    // Initialize Camera if video call
    if (type === 'video' && !isVideoOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera access denied"));
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      // Stop streams on unmount
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isConnecting, type, isVideoOff]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-500">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
      
      <div className="relative w-full max-w-4xl aspect-video hyper-glass rounded-[3rem] overflow-hidden border border-white/10 shadow-4xl flex flex-col glass-inset">
        {/* Call Stream Area */}
        <div className="flex-grow relative bg-black flex items-center justify-center">
          {isVideoOff ? (
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 bg-cyan-500 rounded-full animate-pulse opacity-10" />
                <img src={target.avatar} className="relative w-40 h-40 rounded-full border-4 border-white/10 shadow-2xl" alt="" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-2">{target.name}</h2>
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mono">
                  {isConnecting ? "Establishing Sync..." : "Encrypted Link Active"}
                </p>
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-80" 
            />
          )}

          {/* Watermark UI */}
          <div className="absolute top-8 left-8 flex items-center gap-3">
             <div className="w-8 h-8 hyper-glass rounded-lg flex items-center justify-center text-cyan-400">
               <Zap size={16} fill="currentColor" />
             </div>
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mono">Node-to-Node Secure</span>
          </div>

          <div className="absolute top-8 right-8">
             <div className="px-4 py-2 hyper-glass rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest mono">
               {formatTime(callDuration)}
             </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-8 sm:p-12 border-t border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-center gap-6 sm:gap-12">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-500 text-white' : 'hyper-glass text-white hover:bg-white/10'
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-rose-500 text-white' : 'hyper-glass text-white hover:bg-white/10'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button 
            onClick={onClose}
            className="w-20 h-20 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center hover:bg-rose-600 transition-all shadow-2xl shadow-rose-500/40 active:scale-95"
          >
            <PhoneOff size={32} />
          </button>
        </div>

        {/* Bottom Status Bar */}
        <div className="px-8 py-3 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Protocol 7-Refraction</span>
           </div>
           <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mono">Latency: 12ms</span>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
