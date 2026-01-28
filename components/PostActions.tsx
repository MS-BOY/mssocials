
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Check, Flame, Zap, Ghost } from 'lucide-react';
import type { User } from "../services/firebase";
import { toggleLike, updatePost } from '../services/firebase';
import { ContentItem } from '../types';

interface PostActionsProps {
  item: ContentItem;
  user: User | null;
  onOpenComments: (item: ContentItem) => void;
  variant?: 'compact' | 'large';
}

const PostActions: React.FC<PostActionsProps> = ({ item, user, onOpenComments, variant = 'compact' }) => {
  const [copied, setCopied] = useState(false);
  const [showMoods, setShowMoods] = useState(false);
  const isLiked = user ? (item.likedBy?.includes(user.uid) || false) : false;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert("Log in to like posts.");
    await toggleLike(item.id, user.uid, isLiked);
  };

  const handleMood = async (moodType: 'fire' | 'mindBlown' | 'heart' | 'ghost') => {
    if (!user) return;
    const moods = item.moods || { fire: [], mindBlown: [], heart: [], ghost: [] };
    const currentList = moods[moodType] || [];
    let newList = currentList.includes(user.uid) 
      ? currentList.filter(id => id !== user.uid) 
      : [...currentList, user.uid];

    await updatePost(item.id, { [`moods.${moodType}`]: newList });
    setShowMoods(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#/post/${item.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `MS Social: ${item.title}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const iconSize = variant === 'large' ? 24 : 22;
  const btnBase = "flex items-center justify-center gap-2 transition-all active:scale-90 select-none ";

  return (
    <div className={`flex items-center ${variant === 'large' ? 'gap-8' : 'gap-5'}`}>
      <div className="relative">
        <button 
          onClick={handleLike}
          onMouseEnter={() => setShowMoods(true)}
          className={`${btnBase} ${isLiked ? 'text-[#007BFF]' : 'text-white/60 hover:text-white'}`}
        >
          <Heart size={iconSize} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
          <span className="text-xs font-bold tabular-nums">{item.likes || 0}</span>
        </button>

        {showMoods && (
          <div 
            className="absolute bottom-full left-0 mb-4 flex items-center gap-2 p-2 ms-glass rounded-2xl border border-white/10 animate-in slide-in-from-bottom-2 duration-300 z-50 shadow-2xl"
            onMouseLeave={() => setShowMoods(false)}
          >
            {(['fire', 'mindBlown', 'heart', 'ghost'] as const).map(m => (
              <button 
                key={m}
                onClick={() => handleMood(m)} 
                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125"
              >
                {m === 'fire' && <Flame size={18} className="text-orange-500" fill="currentColor" />}
                {m === 'mindBlown' && <Zap size={18} className="text-[#007BFF]" fill="currentColor" />}
                {m === 'heart' && <Heart size={18} className="text-[#9B59B6]" fill="currentColor" />}
                {m === 'ghost' && <Ghost size={18} className="text-white/40" fill="currentColor" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
        className={`${btnBase} text-white/60 hover:text-[#007BFF]`}
      >
        <MessageCircle size={iconSize} strokeWidth={2.5} />
        <span className="text-xs font-bold tabular-nums">{item.comments?.length || 0}</span>
      </button>

      <button 
        onClick={handleShare}
        className={`${btnBase} text-white/60 hover:text-[#007BFF] relative`}
      >
        {copied ? (
          <Check size={iconSize} className="text-emerald-400" strokeWidth={3} />
        ) : (
          <Share2 size={iconSize} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
};

export default PostActions;
