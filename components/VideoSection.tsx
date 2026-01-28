
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem } from '../types';
import { Play, MoreVertical, Edit3, Trash2, Zap, Monitor } from 'lucide-react';
import type { User } from "../services/mongodb";
import { deletePost } from '../services/mongodb';
import PostActions from './PostActions';

interface VideoSectionProps {
  items: ContentItem[];
  user: User | null;
  onEdit: (item: ContentItem) => void;
  onOpenComments: (item: ContentItem) => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ items, user, onEdit, onOpenComments }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Purge this video document?")) {
      try {
        await deletePost(id);
      } catch (err) { alert("Action failed."); }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-6">
      {items.map((item) => {
        const isOwner = user && (item.author.uid === user.uid || item.author.name === user.displayName);
        
        return (
          <div 
            key={item.id} 
            className="group hyper-glass rounded-[3rem] overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-10 border border-white/10"
          >
            <div className="relative aspect-video bg-neutral-900 overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${item.id}`)}>
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-1000 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(34,211,238,0.2)] group-hover:scale-110 transition-transform group-hover:bg-cyan-500 group-hover:text-black">
                  <Play fill="currentColor" size={32} className="ml-1" />
                </div>
              </div>

              <div className="absolute top-6 right-6" ref={openMenuId === item.id ? menuRef : null}>
                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }} className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-black/60 transition-all">
                  <MoreVertical size={20} />
                </button>
                {openMenuId === item.id && (
                  <div className="absolute right-0 mt-3 w-52 hyper-glass rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 border border-white/10">
                    {isOwner ? (
                      <>
                        <button onClick={() => { onEdit(item); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white hover:bg-white/10 rounded-xl font-black uppercase tracking-widest transition-all"><Edit3 size={16} className="text-cyan-400" /> Edit Node</button>
                        <button onClick={() => handleDelete(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-xl font-black uppercase tracking-widest transition-all">Delete Signal</button>
                      </>
                    ) : <div className="px-4 py-3 text-[9px] text-white/20 uppercase font-black mono italic">Read-Only Access</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">{item.category}</span>
                <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mono">{item.date}</span>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-8 tracking-tighter group-hover:text-cyan-400 transition-colors leading-tight line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
              
              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                    <img src={item.author.avatar} alt={item.author.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mono">{item.author.name}</span>
                </div>
                
                <PostActions item={item} user={user} onOpenComments={onOpenComments} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoSection;
