
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem, ContentType } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Send } from 'lucide-react';
import PostActions from './PostActions';
import type { User } from '../services/firebase';

interface MobileFeedProps {
  items: ContentItem[];
  user: User | null;
  onOpenComments: (item: ContentItem) => void;
  onOpenMessages: (msg?: string) => void;
}

const MobileFeed: React.FC<MobileFeedProps> = ({ items, user, onOpenComments, onOpenMessages }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full h-full pt-[100px] pb-32 overflow-y-auto no-scrollbar space-y-4">
      {items.map((item) => (
        <div key={item.id} className="w-full bg-black/40 border-y border-white/5 flex flex-col">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3" onClick={() => navigate(`/profile/${item.author.uid}`)}>
              <div className="w-10 h-10 rounded-full border border-white/10 p-0.5">
                <img src={item.author.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase italic tracking-tighter leading-none">{item.author.name}</h4>
                <p className="text-[8px] font-black text-[#00FFFF]/60 uppercase tracking-widest mt-1">OPERATOR NODE</p>
              </div>
            </div>
            <button className="text-white/20 p-2"><MoreHorizontal size={20} /></button>
          </div>

          {/* Media Container */}
          <div 
            className="relative w-full aspect-square bg-neutral-900 flex items-center justify-center cursor-pointer"
            onClick={() => navigate(`/post/${item.id}`)}
          >
            {item.type === ContentType.VIDEO ? (
              <video src={item.videoUrl || item.mediaUrls?.[0]} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            ) : (
              <img src={item.mediaUrls?.[0] || item.thumbnail} className="w-full h-full object-cover" alt="" />
            )}
            
            {item.type === ContentType.VIDEO && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                  <Play size={24} fill="white" />
                </div>
              </div>
            )}
          </div>

          {/* Post Details */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <PostActions item={item} user={user} onOpenComments={() => onOpenComments(item)} />
              <button 
                onClick={() => onOpenMessages(`#/post/${item.id}`)}
                className="text-white/40 hover:text-[#00FFFF] transition-all p-2"
              >
                <Send size={22} />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase italic leading-tight">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed font-medium line-clamp-2">{item.excerpt}</p>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full py-20 text-white/20">
          <p className="text-xs font-black uppercase tracking-widest">Awaiting Neural Signals...</p>
        </div>
      )}
    </div>
  );
};

export default MobileFeed;
