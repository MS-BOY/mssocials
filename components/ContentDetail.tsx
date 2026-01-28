
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ContentItem, ContentType } from '../types';
import type { User } from "../services/firebase";
import { ArrowLeft, Clock, MessageSquare, Edit3, Trash2, ShieldCheck, Zap, Check, Play, Mic, Volume2 } from 'lucide-react';
import PostActions from './PostActions';
import { deletePost, updatePost } from '../services/firebase';

// Interface defining the expected props for the ContentDetail component
interface ContentDetailProps {
  items: ContentItem[];
  user: User | null;
  onEdit: (item: ContentItem) => void;
  onOpenComments: (item: ContentItem) => void;
  onStartMessage: () => void;
}

const getRelativeTime = (timestamp: any) => {
  if (!timestamp) return 'JUST NOW';
  const past = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return 'JUST NOW';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}M AGO`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}H AGO`;
  return past.toLocaleDateString().toUpperCase();
};

const ContentDetail: React.FC<ContentDetailProps> = ({ items, user, onEdit, onOpenComments }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = items.find(i => i.id === id);

  if (!item) return null;

  const relativeTime = getRelativeTime(item.createdAt || item.date);
  const isOwner = user && item.author.uid === user.uid;

  const handleDelete = async () => {
    if (window.confirm("Purge this broadcast?")) {
      await deletePost(item.id);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] animate-in fade-in duration-700 pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-24">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-4 text-white/40 hover:text-white transition-all mb-12">
          <div className="w-12 h-12 ss-glass rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-xl">
            <ArrowLeft size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic">Sync Back</span>
        </button>

        <div className="space-y-12">
          {/* Main Content Render */}
          <div className="rounded-[3.5rem] overflow-hidden border border-white/10 ss-glass shadow-4xl relative">
            {item.type === ContentType.VOICE || item.audioUrl ? (
              <div className="p-16 flex flex-col items-center gap-10 bg-gradient-to-b from-orange-500/10 to-transparent">
                 <div className="relative">
                   <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                   <div className="w-32 h-32 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 border border-orange-500/30 relative z-10">
                     <Mic size={48} />
                   </div>
                 </div>
                 
                 <div className="w-full space-y-6">
                    <div className="flex items-center justify-center gap-1 h-12">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="w-1.5 bg-orange-500 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 40}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <audio src={item.audioUrl} controls className="w-full h-14 rounded-2xl ss-glass p-2 accent-orange-500" />
                 </div>
              </div>
            ) : item.type === ContentType.VIDEO ? (
              <video src={item.videoUrl || item.mediaUrls?.[0]} className="w-full object-cover max-h-[70vh]" controls autoPlay muted playsInline loop />
            ) : (
              <img src={item.mediaUrls?.[0] || item.thumbnail} className="w-full object-cover max-h-[80vh]" alt="" />
            )}
          </div>

          {/* Metadata & Title */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <span className="px-5 py-2 bg-[#00FFFF] text-black rounded-xl text-[9px] font-black uppercase tracking-[0.3em]">{item.category}</span>
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {relativeTime}</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter italic uppercase leading-tight">{item.title}</h1>
            
            <div className="flex gap-6">
              <div className="w-1.5 bg-gradient-to-b from-[#00FFFF] to-transparent rounded-full flex-shrink-0" />
              <p className="text-xl text-white/60 font-medium leading-relaxed italic">{item.excerpt}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-12 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <img src={item.author.avatar} className="w-14 h-14 rounded-2xl border border-white/10" alt="" />
               <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase italic">{item.author.name}</span>
                  <span className="text-[9px] font-black text-[#00FFFF]/40 uppercase tracking-widest">Operator Node</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
              <PostActions item={item} user={user} onOpenComments={() => onOpenComments(item)} variant="large" />
              {isOwner && (
                <button onClick={handleDelete} className="p-4 ss-glass rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl">
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
