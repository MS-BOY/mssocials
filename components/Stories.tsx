import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem } from '../types';
import { Plus, Zap } from 'lucide-react';

interface StoriesProps {
  items: ContentItem[];
  userAvatar?: string;
}

const Stories: React.FC<StoriesProps> = ({ items, userAvatar }) => {
  const navigate = useNavigate();

  const storyOwners = React.useMemo(() => {
    const seen = new Set();
    return items
      .map(item => item.author)
      .filter(author => {
        if (seen.has(author.uid)) return false;
        seen.add(author.uid);
        return true;
      })
      .slice(0, 15);
  }, [items]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-8 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
      <div className="flex items-center gap-6 px-6 min-w-max">
        {/* Your Story with vibrant pulse orb */}
        <div className="flex flex-col items-center gap-3 cursor-pointer group">
          <div className="relative">
            <div className="w-[76px] h-[76px] rounded-[2rem] border-2 border-white/10 overflow-hidden bg-neutral-900 p-[3px] transition-all group-hover:border-[#00FFFF]/50 shadow-2xl">
              <img src={userAvatar || "https://api.dicebear.com/7.x/bottts/svg?seed=user"} className="w-full h-full object-cover rounded-[1.75rem] brightness-75 group-hover:brightness-100 transition-all" alt="" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[#007BFF] to-[#9B59B6] rounded-2xl border-4 border-[#0A0A0A] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
              <Plus size={18} strokeWidth={4} />
            </div>
          </div>
          <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Me</span>
        </div>

        {/* Dynamic Holographic Stories */}
        {storyOwners.map((op, i) => (
          <button
            key={op.uid}
            onClick={() => navigate(`/profile/${op.uid}`)}
            className="flex flex-col items-center gap-3 group animate-in slide-in-from-right duration-700"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-[82px] h-[82px] ms-story-ring transition-all active:scale-95 group-hover:rotate-6 shadow-[0_0_30px_rgba(0,123,255,0.15)] group-hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]">
              <div className="w-full h-full rounded-full border-[5px] border-[#0A0A0A] overflow-hidden bg-neutral-800 relative">
                <img
                  src={op.avatar}
                  alt={op.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-[#00FFFF]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <span className="text-[10px] text-white/70 truncate max-w-[82px] font-black tracking-tighter uppercase italic group-hover:text-[#00FFFF] transition-colors">
              {op.name.split(' ')[0]}
            </span>
          </button>
        ))}

        {storyOwners.length === 0 && (
           <div className="flex items-center gap-4 opacity-5 px-10">
             {[1,2,3].map(i => <div key={i} className="w-16 h-16 rounded-full bg-white"></div>)}
           </div>
        )}
      </div>
    </div>
  );
};

export default Stories;