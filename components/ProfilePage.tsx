import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ContentItem, UserProfile } from '../types';
import { subscribeToUserProfile } from '../services/firebase';
import { Zap, ShieldCheck, Briefcase, Smile, Gamepad2, Palette, Loader2, Users, Heart, Share2 } from 'lucide-react';

interface ProfilePageProps {
  items: ContentItem[];
  currentUser: any;
  onEdit: (i: any) => void;
  onOpenComments: (i: any) => void;
  onStartMessage: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ items, currentUser }) => {
  const { uid } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeLayer, setActiveLayer] = useState<'fun' | 'work' | 'gaming' | 'art'>('fun');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUserProfile(uid, (p) => {
      setProfile(p);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const userPosts = useMemo(() => items.filter(i => i.author.uid === uid), [items, uid]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-[#00FFFF]" size={32} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-y-auto no-scrollbar pt-32 pb-48 px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Layered Identity Rings Header */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center mb-16">
          {/* Identity Rings - Holographic borders */}
          <div className={`absolute w-full h-full rounded-full border-2 transition-all duration-1000 ${activeLayer === 'art' ? 'border-[#9B59B6] opacity-40' : 'border-white/5 opacity-10'}`} />
          <div className={`absolute w-[82%] h-[82%] rounded-full border-2 transition-all duration-1000 ${activeLayer === 'gaming' ? 'border-[#007BFF] opacity-40' : 'border-white/5 opacity-10'}`} />
          <div className={`absolute w-[64%] h-[64%] rounded-full border-2 transition-all duration-1000 ${activeLayer === 'work' ? 'border-white opacity-40' : 'border-white/5 opacity-10'}`} />
          
          {/* Central Avatar */}
          <div className="relative z-10 w-44 h-44 rounded-full p-2 bg-gradient-to-br from-[#00FFFF] to-[#9B59B6] shadow-[0_0_80px_rgba(0,255,255,0.2)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-black border-[6px] border-[#0A0A0A]">
              <img src={profile?.photoURL} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black rounded-full border border-white/20 text-[10px] font-black text-[#00FFFF] uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> VERIFIED NODE
            </div>
          </div>

          {/* Interactive Layer Switches */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <button onClick={() => setActiveLayer('art')} className={`absolute top-0 pointer-events-auto p-4 rounded-2xl ms-glass border-white/10 transition-all ${activeLayer === 'art' ? 'text-[#9B59B6] scale-125' : 'text-white/20 hover:text-white/40'}`}>
               <Palette size={24} />
             </button>
             <button onClick={() => setActiveLayer('gaming')} className={`absolute left-0 pointer-events-auto p-4 rounded-2xl ms-glass border-white/10 transition-all ${activeLayer === 'gaming' ? 'text-[#007BFF] scale-125' : 'text-white/20 hover:text-white/40'}`}>
               <Gamepad2 size={24} />
             </button>
             <button onClick={() => setActiveLayer('work')} className={`absolute right-0 pointer-events-auto p-4 rounded-2xl ms-glass border-white/10 transition-all ${activeLayer === 'work' ? 'text-white scale-125' : 'text-white/20 hover:text-white/40'}`}>
               <Briefcase size={24} />
             </button>
             <button onClick={() => setActiveLayer('fun')} className={`absolute bottom-0 pointer-events-auto p-4 rounded-2xl ms-glass border-white/10 transition-all ${activeLayer === 'fun' ? 'text-[#00FFFF] scale-125' : 'text-white/20 hover:text-white/40'}`}>
               <Smile size={24} />
             </button>
          </div>
        </div>

        {/* Identity Stats */}
        <div className="text-center space-y-4 mb-20">
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{profile?.displayName}</h1>
          <p className="text-[#00FFFF] font-bold tracking-[0.4em] text-[11px] uppercase opacity-60 italic">MS Identity Packet Linked</p>
          <div className="flex items-center justify-center gap-12 pt-8">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">{profile?.followers.length || 0}</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">{userPosts.length}</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Signals</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">{Math.floor(userPosts.reduce((acc, p) => acc + (p.likes || 0), 0) / 1000)}K</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Harmonics</span>
            </div>
          </div>
        </div>

        {/* Content Matrix */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {userPosts.map((post, i) => (
            <div 
              key={post.id} 
              className="aspect-square ms-glass rounded-[2rem] overflow-hidden group relative cursor-pointer animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <img src={post.thumbnail} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <span className="text-[9px] font-black text-[#00FFFF] uppercase tracking-widest mb-1">{post.category}</span>
                <p className="text-[10px] font-bold text-white truncate">{post.title}</p>
              </div>
            </div>
          ))}
          {userPosts.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center text-white/10">
              <Zap size={64} className="mb-4" />
              <p className="font-black uppercase tracking-[0.4em]">Zero Signals Detected</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;