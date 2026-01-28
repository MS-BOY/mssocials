
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToGroupDetails, subscribeToPosts, User } from '../services/firebase';
import { Group, ContentItem } from '../types';
import { Users, Lock, ShieldCheck, Zap, ArrowLeft, MessageSquare, Sparkles, Image as ImageIcon, Maximize2 } from 'lucide-react';
import NewsGrid from './NewsGrid';

interface GroupPageProps {
  user: User | null;
  onEdit: (item: ContentItem) => void;
  onOpenComments: (item: ContentItem) => void;
  onStartMessage: (target: { uid: string, name: string, avatar: string, isGroup?: boolean }) => void;
}

const GroupSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 space-y-12 animate-in fade-in duration-700">
    <div className="h-[250px] sm:h-[400px] w-full shimmer bg-white/5 rounded-[3rem]" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 h-64 shimmer bg-white/5 rounded-[2.5rem]" />
      <div className="lg:col-span-8 space-y-6">
        {[1, 2].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl shimmer" />)}
      </div>
    </div>
  </div>
);

const GroupPage: React.FC<GroupPageProps> = ({ user, onEdit, onOpenComments, onStartMessage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubDetails = subscribeToGroupDetails(id, (g) => {
      setGroup(g);
      if (!g) setLoading(false);
    });
    const unsubPosts = subscribeToPosts((items) => {
      setPosts(items);
      setLoading(false);
    }, id);
    return () => { unsubDetails(); unsubPosts(); };
  }, [id]);

  const isMember = user && group?.members.includes(user.uid);

  if (loading) return <GroupSkeleton />;

  if (!group) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 px-6">
      <h2 className="text-4xl font-black text-white/20 uppercase tracking-[0.4em]">Cluster Signal Lost</h2>
      <button onClick={() => navigate('/')} className="px-10 py-4 hyper-glass rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-cyan-400 transition-all active:scale-95">Return to Feed</button>
    </div>
  );

  if (!isMember) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8 px-6 text-center">
      <div className="w-24 h-24 hyper-glass rounded-[2rem] flex items-center justify-center text-rose-500 mb-4 animate-pulse"><Lock size={48} /></div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Node PIN Required</p>
      </div>
      <button onClick={() => navigate('/')} className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 hover:text-white transition-all active:scale-95 shadow-2xl">Return to Stream</button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-1000">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="relative group">
           <div className="h-[250px] sm:h-[400px] w-full relative overflow-hidden rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-4xl">
              <img src={group.avatar} className="w-full h-full object-cover filter brightness-[0.3] saturate-[1.5] blur-md scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                 <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] overflow-hidden border-4 border-black shadow-4xl mb-6 transform hover:scale-105 transition-transform duration-700">
                   <img src={group.avatar} className="w-full h-full object-cover" alt="" />
                 </div>
                 <h1 className="text-4xl sm:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">{group.name}</h1>
                 
                 <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                      onClick={() => onStartMessage({ uid: group.id, name: group.name, avatar: group.avatar, isGroup: true })}
                      className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00FFFF] hover:text-black transition-all active:scale-95 shadow-2xl"
                    >
                      <MessageSquare size={16} fill="currentColor" /> Signal Chat
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/lounge/${group.id}`)}
                      className="flex items-center gap-3 px-8 py-4 ss-glass border-[#00FFFF]/30 text-[#00FFFF] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00FFFF]/10 transition-all active:scale-95"
                    >
                      <Maximize2 size={16} /> Enter 3D Lounge
                    </button>
                 </div>
              </div>
              <button onClick={() => navigate('/')} className="absolute top-8 left-8 p-4 hyper-glass rounded-2xl text-white/40 hover:text-white transition-all active:scale-95"><ArrowLeft size={20} /></button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
          <div className="lg:col-span-4 space-y-8">
             <div className="hyper-glass rounded-[2.5rem] p-8 border border-white/5 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Cluster Metadata</h3>
                  <p className="text-sm text-white/70 font-medium leading-relaxed italic">{group.description || "Node initialized. No public documentation found."}</p>
                </div>
                <div className="pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span>Capacity</span>
                  <span className="text-cyan-400">{group.members.length} / UNLIMITED</span>
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-6 mb-4 px-4">
               <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Node <span className="text-cyan-400">Broadcasting</span></h2>
               <div className="h-[1px] flex-grow bg-white/5"></div>
            </div>
            {posts.length > 0 ? (
              <NewsGrid items={posts} user={user} onEdit={onEdit} onOpenComments={onOpenComments} onStartMessage={onStartMessage} />
            ) : (
              <div className="py-24 text-center hyper-glass rounded-[3rem] border border-dashed border-white/5">
                 <ImageIcon size={48} className="mx-auto mb-6 text-white/5" />
                 <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Awaiting First Transmission</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
