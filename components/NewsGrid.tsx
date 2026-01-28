
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem, ContentType } from '../types';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Play, Share2 } from 'lucide-react';
import type { User } from "../services/firebase";
import { toggleLike } from '../services/firebase';
import PostActions from './PostActions';

interface NewsGridProps {
  items: ContentItem[];
  user: User | null;
  onEdit: (item: ContentItem) => void;
  onOpenComments: (item: ContentItem) => void;
  onOpenMessages: (msg?: string) => void;
  onStartMessage: (target: { uid: string, name: string, avatar: string }) => void;
}

const getRelativeTime = (timestamp: any) => {
  if (!timestamp) return 'NOW';
  const past = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return 'JUST NOW';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}M`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}H`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}D`;
};

const NewsGrid: React.FC<NewsGridProps> = ({ items, user, onEdit, onOpenComments, onOpenMessages, onStartMessage }) => {
  const [likeAnimId, setLikeAnimId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleDoubleTap = async (item: ContentItem) => {
    if (!user) return;
    setLikeAnimId(item.id);
    if (!item.likedBy?.includes(user.uid)) {
      await toggleLike(item.id, user.uid, false);
    }
    setTimeout(() => setLikeAnimId(null), 1000);
  };

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-16 pb-48 px-4">
      {items.map((item, idx) => {
        const relativeTime = getRelativeTime(item.createdAt || item.date);
        const username = item.author.name.replace(/\s/g, '').toLowerCase();
        const isSaved = savedIds.has(item.id);

        return (
          <article 
            key={item.id} 
            className="ss-glass rounded-[4rem] border border-white/10 animate-slide-up overflow-hidden shadow-4xl group/card relative preserve-3d"
            style={{ 
              animationDelay: `${idx * 150}ms`,
              transform: 'perspective(2000px) rotateX(1deg)' 
            }}
          >
            {/* Sphere Header */}
            <div className="px-10 py-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div 
                className="flex items-center gap-6 cursor-pointer group"
                onClick={() => navigate(`/profile/${item.author.uid}`)}
              >
                <div className="w-16 h-16 ss-sphere p-0.5 group-hover:scale-110 transition-transform">
                  <div className="w-full h-full rounded-full border-2 border-[#121212] overflow-hidden bg-neutral-900">
                    <img src={item.author.avatar} alt={item.author.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-white tracking-tighter italic uppercase leading-none group-hover:text-[#00FFFF] transition-colors">{item.author.name}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[#00FFFF]/60 font-black uppercase tracking-widest italic">@{username}</span>
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{relativeTime}</span>
                  </div>
                </div>
              </div>
              <button className="p-4 text-white/30 hover:text-white transition-colors bg-white/5 rounded-3xl">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Content Body - Sphere Immersive */}
            <div 
              className="relative aspect-square w-full bg-neutral-900/40 flex items-center justify-center cursor-pointer overflow-hidden select-none"
              onDoubleClick={() => handleDoubleTap(item)}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 z-0"></div>
              {item.type === ContentType.VIDEO ? (
                <video src={item.videoUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110" muted loop playsInline autoPlay />
              ) : (
                <img src={item.mediaUrls?.[0] || item.thumbnail} className={`w-full h-full object-cover transition-transform duration-[2000ms] group-hover/card:scale-110 ${item.filter || ''}`} alt="" />
              )}
              
              {/* Double Tap Heart Sphere */}
              {likeAnimId === item.id && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-in zoom-in duration-500">
                  <div className="w-48 h-48 ss-sphere flex items-center justify-center bg-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                    <Heart size={80} fill="#f43f5e" className="text-rose-500 drop-shadow-[0_0_20px_#f43f5e]" />
                  </div>
                </div>
              )}

              {/* Holographic Play Node */}
              {item.type === ContentType.VIDEO && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-24 h-24 ss-sphere flex items-center justify-center bg-black/40 border border-white/20 text-[#00FFFF] shadow-2xl scale-0 group-hover/card:scale-100 transition-transform">
                      <Play size={32} fill="#00FFFF" />
                    </div>
                 </div>
              )}

              <div className="absolute top-8 left-8">
                 <div className="px-6 py-2 ss-sphere ss-glass border-white/20 flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-pulse shadow-[0_0_10px_#00FFFF]"></div>
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">{item.category}</span>
                 </div>
              </div>
            </div>

            {/* Spherical Action Pills */}
            <div className="p-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-10">
                  <PostActions item={item} user={user} onOpenComments={onOpenComments} variant="large" />
                  <button 
                    onClick={() => onOpenMessages(`#/post/${item.id}`)}
                    className="p-5 ss-sphere ss-glass border-white/10 text-white/40 hover:text-[#00FFFF] transition-all"
                  >
                    <Send size={24} strokeWidth={2.5} />
                  </button>
                </div>
                <button 
                  onClick={() => toggleSave(item.id)}
                  className={`p-5 ss-sphere ss-glass border-white/10 transition-all ${isSaved ? 'text-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'text-white/40 hover:text-white'}`}
                >
                  <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-5 ss-glass rounded-3xl border-white/5 bg-black/40">
                   <div className="flex -space-x-4">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-10 h-10 ss-sphere border-4 border-[#0A0A0A] overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${i + item.id}`} alt="" />
                       </div>
                     ))}
                   </div>
                   <p className="text-[11px] font-black text-white/30 uppercase tracking-widest italic">
                     <span className="text-white">{item.likes.toLocaleString()}</span> Neural Links Harmonized
                   </p>
                 </div>

                 <div className="space-y-3">
                   <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight group-hover/card:text-[#00FFFF] transition-colors">{item.title}</h4>
                   <p className="text-base text-white/60 font-medium leading-relaxed italic">{item.excerpt}</p>
                 </div>
              </div>

              {item.comments?.length > 0 && (
                <button 
                  onClick={() => onOpenComments(item)}
                  className="w-full py-6 ss-sphere ss-glass border-white/10 text-[10px] font-black text-white/30 hover:text-[#00FFFF] transition-all uppercase tracking-[0.5em] italic"
                >
                  Retrieve {item.comments.length} transmissions
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default NewsGrid;
