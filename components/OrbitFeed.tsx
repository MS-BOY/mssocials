
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem, ContentType } from '../types';
import { Play, Heart, MessageSquare, ArrowUpRight, X } from 'lucide-react';

interface OrbitFeedProps {
  items: ContentItem[];
}

const OrbitFeed: React.FC<OrbitFeedProps> = ({ items }) => {
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const startXRef = useRef(0);
  const requestRef = useRef<number>(null);

  // High-performance animation loop
  useEffect(() => {
    const animate = () => {
      if (!isDragging && !previewItem) {
        rotationRef.current += 0.05;
        if (containerRef.current) {
          containerRef.current.style.setProperty('--orbit-rotation', `${rotationRef.current}deg`);
          
          const cards = containerRef.current.querySelectorAll('.orbit-card');
          cards.forEach((card: any) => {
            const angle = parseFloat(card.dataset.angle || "0");
            card.style.setProperty('--counter-rotation', `${-angle - rotationRef.current}deg`);
          });
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDragging, previewItem]);

  const handleStart = (clientX: number) => {
    if (previewItem) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || previewItem) return;
    const delta = (clientX - startXRef.current) * 0.08;
    rotationRef.current += delta;
    startXRef.current = clientX;
    
    if (containerRef.current) {
      containerRef.current.style.setProperty('--orbit-rotation', `${rotationRef.current}deg`);
    }
  };

  const getRadius = () => {
    const width = window.innerWidth;
    if (width < 640) return 380;
    if (width < 1024) return 600;
    return 950;
  };

  const radius = `${getRadius()}px`;
  const count = Math.max(items.length, 12);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden perspective-3000 cursor-grab active:cursor-grabbing select-none bg-transparent"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Central Neural Hub Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[450px] h-[450px] bg-[#00FFFF] opacity-[0.03] blur-[140px] rounded-full animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] border border-[#00FFFF]/5 rounded-full animate-[spin_40s_linear_infinite]"></div>
      </div>

      <div 
        ref={containerRef}
        className={`relative w-full h-full flex items-center justify-center transition-opacity duration-700 ease-out preserve-3d ${previewItem ? 'opacity-20 scale-95 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          transform: 'translate3d(0, 0, 0) rotateY(var(--orbit-rotation, 0deg)) rotateX(8deg)',
          willChange: 'transform' 
        } as any}
      >
        {items.map((item, idx) => {
          const angle = (idx / count) * 360;
          const verticalOffset = (idx % 2 === 0 ? 140 : -140);
          const vOffsetStr = `${verticalOffset}px`;

          return (
            <div
              key={item.id}
              data-angle={angle}
              onClick={(e) => {
                if (isDragging) return;
                e.stopPropagation();
                setPreviewItem(item);
              }}
              className="orbit-card absolute w-48 sm:w-64 h-[520px] sm:h-[650px] ms-glass rounded-[2.5rem] overflow-hidden cursor-pointer group border-white/10 shadow-4xl transition-all duration-300"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}) translateY(${vOffsetStr}) rotateY(var(--counter-rotation, ${-angle}deg))`,
                backfaceVisibility: 'hidden',
                willChange: 'transform'
              } as any}
            >
              <div className="relative w-full h-full flex flex-col">
                {/* Visual Media Section */}
                <div className="relative w-full h-[66%] overflow-hidden">
                  <img 
                    src={item.thumbnail} 
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" 
                    alt={item.title} 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  
                  {item.type === ContentType.VIDEO && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-[#00FFFF]/30 flex items-center justify-center text-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                        <Play size={24} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata & Title Cluster - Matches Screenshot */}
                <div className="flex-grow flex flex-col items-center justify-center p-6 text-center bg-black/40">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-[#00FFFF] uppercase tracking-[0.2em] italic mb-1">
                      {item.type} • {item.date.split('.')[0]}Z
                    </p>
                    <h3 className="text-sm sm:text-base font-black text-white italic tracking-tighter leading-[1.1] uppercase group-hover:text-[#00FFFF] transition-colors line-clamp-3">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden bg-neutral-900 p-0.5">
                      <img src={item.author.avatar} className="w-full h-full object-cover rounded-lg" alt="" />
                    </div>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.author.name}</span>
                  </div>
                </div>

                {/* Interactive Overlays */}
                <div className="absolute inset-0 border border-[#00FFFF]/0 group-hover:border-[#00FFFF]/10 transition-colors pointer-events-none rounded-[2.5rem]"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Signal Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setPreviewItem(null)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] sm:h-auto sm:aspect-video ms-glass border border-white/20 rounded-[3rem] sm:rounded-[4rem] shadow-4xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
             
             <div className="w-full md:w-3/5 h-[45%] md:h-full bg-black relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
               {previewItem.type === ContentType.VIDEO ? (
                 <video src={previewItem.videoUrl || previewItem.mediaUrls?.[0]} className="w-full h-full object-cover" controls autoPlay playsInline />
               ) : (
                 <img src={previewItem.mediaUrls?.[0] || previewItem.thumbnail} className="w-full h-full object-cover" alt="" />
               )}
               
               <button 
                 onClick={() => setPreviewItem(null)}
                 className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white z-20 hover:bg-rose-500 hover:border-rose-500 transition-all"
               >
                 <X size={24} />
               </button>
             </div>
             
             <div className="w-full md:w-2/5 h-[55%] md:h-full p-10 sm:p-14 flex flex-col justify-between bg-[#050505] relative">
                <div className="space-y-10 overflow-y-auto no-scrollbar pb-10">
                   <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl border-2 border-[#00FFFF]/40 p-1 bg-black shadow-2xl">
                       <img src={previewItem.author.avatar} className="w-full h-full rounded-xl object-cover" alt="" />
                     </div>
                     <div>
                       <p className="text-base font-black text-white uppercase italic tracking-tighter leading-none">{previewItem.author.name}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-pulse shadow-[0_0_10px_#00FFFF]"></div>
                         <p className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">Active Link</p>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-6">
                     <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-[0.95] text-glow">{previewItem.title}</h2>
                     <p className="text-sm sm:text-lg text-white/50 leading-relaxed font-medium line-clamp-6">{previewItem.excerpt || "Holographic packet distributed to the social cluster."}</p>
                   </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                  <button 
                    onClick={() => navigate(`/post/${previewItem.id}`)}
                    className="w-full py-6 sm:py-8 bg-white text-black text-[12px] sm:text-sm font-black uppercase tracking-[0.4em] rounded-[2.5rem] sm:rounded-[3rem] hover:bg-[#00FFFF] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-4xl"
                  >
                    SYNC LINK <ArrowUpRight size={22} strokeWidth={3} />
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .text-glow { text-shadow: 0 0 10px rgba(0, 255, 255, 0.4); }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

export default OrbitFeed;
