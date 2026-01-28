
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Zap, Users, Share2, Maximize2 } from 'lucide-react';
import type { User } from '../services/firebase';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  status: 'online' | 'linking';
}

const LoungeRoom: React.FC<{ user: User | null }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState({ x: -15, y: 0 });
  const [isLinking, setIsLinking] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);

  // Mock participants for demonstration
  const [participants] = useState<Participant[]>([
    { id: '1', name: 'Nexus Prime', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=1', isSpeaking: true, status: 'online' },
    { id: '2', name: 'Cyber Ghost', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2', isSpeaking: false, status: 'online' },
    { id: '3', name: 'Neural Link', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3', isSpeaking: false, status: 'online' },
    { id: '4', name: 'Operator X', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=4', isSpeaking: false, status: 'online' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLinking(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLinking) return;
    const yRotation = (e.clientX / window.innerWidth - 0.5) * 40;
    const xRotation = (e.clientY / window.innerHeight - 0.5) * -20 - 15;
    setRotation({ x: xRotation, y: yRotation });
  };

  return (
    <div 
      className="fixed inset-0 bg-[#050505] overflow-hidden flex flex-col items-center justify-center perspective-container"
      onMouseMove={handleMouseMove}
    >
      {/* Background Starfield/Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#00FFFF_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      {isLinking ? (
        <div className="flex flex-col items-center gap-8 animate-pulse z-50">
           <div className="w-32 h-32 ss-glass rounded-[2.5rem] flex items-center justify-center border-[#00FFFF]/40 neon-aura-cyan">
             <Zap size={48} className="text-[#00FFFF]" fill="currentColor" />
           </div>
           <div className="text-center">
             <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Establishing Link</h2>
             <p className="text-[10px] font-black text-[#00FFFF] uppercase tracking-[0.5em] mt-2">Neural Synchronization in Progress</p>
           </div>
        </div>
      ) : (
        <>
          {/* Header Info */}
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            <div className="px-6 py-2 ss-glass rounded-full border-white/10 flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-pulse shadow-[0_0_10px_#00FFFF]"></div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Nexus Lounge: {id?.slice(0, 8)}</span>
               </div>
               <div className="w-[1px] h-4 bg-white/10"></div>
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{participants.length + 1} Operators</span>
            </div>
          </div>

          {/* 3D Lounge Scene */}
          <div 
            className="relative w-full h-full transition-transform duration-700 ease-out preserve-3d"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` 
            }}
          >
            {/* Floor Grid */}
            <div 
              className="absolute top-1/2 left-1/2 w-[2000px] h-[2000px] -translate-x-1/2 -translate-y-1/2"
              style={{ 
                transform: 'rotateX(90deg) translateZ(-300px)',
                background: 'radial-gradient(circle, transparent 20%, #050505 70%), linear-gradient(#00FFFF22 1px, transparent 1px), linear-gradient(90deg, #00FFFF22 1px, transparent 1px)',
                backgroundSize: '100%, 80px 80px, 80px 80px'
              }}
            />

            {/* Central Holographic Core */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center preserve-3d"
              style={{ transform: 'translateZ(0)' }}
            >
               <div className="absolute inset-0 bg-[#00FFFF] rounded-full blur-[100px] opacity-10 animate-pulse"></div>
               <div className="w-48 h-48 ss-glass rounded-full border border-white/20 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-dashed border-[#00FFFF]/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={64} className="text-[#00FFFF] drop-shadow-[0_0_20px_#00FFFF]" fill="currentColor" />
               </div>
            </div>

            {/* Participants Orbit */}
            {participants.map((p, idx) => {
              const angle = (idx / participants.length) * 360;
              const radius = 600;
              return (
                <div 
                  key={p.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 preserve-3d flex flex-col items-center gap-6"
                  style={{ 
                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`
                  }}
                >
                  {/* Holographic Platform */}
                  <div className="w-40 h-1 ss-glass rounded-full border-[#00FFFF]/20 neon-aura-cyan transform -rotateX(90deg) translateZ(-100px)"></div>
                  
                  {/* Participant Aura */}
                  <div className={`relative w-32 h-32 rounded-full ss-glass border-2 flex items-center justify-center transition-all duration-500 ${p.isSpeaking ? 'border-[#00FFFF] scale-110 shadow-[0_0_50px_rgba(0,255,255,0.4)]' : 'border-white/10'}`}>
                    <img src={p.avatar} className="w-24 h-24 rounded-full object-cover" alt="" />
                    <div className="absolute inset-0 scan-effect rounded-full opacity-40"></div>
                    {p.isSpeaking && (
                      <div className="absolute -bottom-2 px-3 py-1 bg-[#00FFFF] text-black rounded-lg text-[8px] font-black uppercase tracking-widest">Active Signal</div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter">{p.name}</p>
                    <p className="text-[8px] font-black text-[#00FFFF]/40 uppercase tracking-widest">Operator Linked</p>
                  </div>
                </div>
              );
            })}

            {/* Self Avatar */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 preserve-3d flex flex-col items-center gap-6"
              style={{ transform: `rotateY(${rotation.y}deg) translateZ(-600px)` }}
            >
               <div className="w-40 h-40 rounded-full ss-glass border-4 border-[#007BFF]/40 flex items-center justify-center shadow-4xl relative">
                  <img src={user?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=me'} className="w-32 h-32 rounded-full object-cover grayscale" alt="" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border-2 border-dashed border-[#007BFF]/20 animate-spin"></div>
                  </div>
               </div>
               <p className="text-sm font-black text-[#007BFF] uppercase italic tracking-tighter">You (Operator)</p>
            </div>
          </div>

          {/* Lounge Controls Overlay */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 ss-glass px-10 py-6 rounded-[3rem] border-white/10 flex items-center gap-8 shadow-4xl">
             <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'ss-glass text-white/40 hover:text-white'}`}
             >
               {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
             </button>

             <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center transition-all ${isVideoOff ? 'ss-glass text-white/40 hover:text-white' : 'bg-[#00FFFF] text-black'}`}
             >
               {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
             </button>

             <button 
              onClick={() => navigate(-1)}
              className="w-20 h-20 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-rose-500/20"
             >
               <PhoneOff size={32} />
             </button>

             <button className="w-16 h-16 rounded-[1.75rem] ss-glass flex items-center justify-center text-white/40 hover:text-white">
               <MessageSquare size={24} />
             </button>

             <button className="w-16 h-16 rounded-[1.75rem] ss-glass flex items-center justify-center text-white/40 hover:text-white">
               <Share2 size={24} />
             </button>
          </div>
        </>
      )}

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

export default LoungeRoom;
