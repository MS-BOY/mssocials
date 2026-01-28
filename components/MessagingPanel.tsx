
import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Search, AtSign, Zap, Loader2, Sparkles, UserPlus, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from "../services/firebase";
import { subscribeToConversations, searchUsers, startConversation, sendMessage, db } from '../services/firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { Conversation, UserProfile } from '../types';

interface MessagingPanelProps {
  user: User | null;
  onClose: () => void;
  onStartCall: () => void;
  initialMessage?: string;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ user, onClose, initialMessage }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubConvos = user ? subscribeToConversations(user.uid, setConversations) : () => {};
    
    const qUsers = query(collection(db, "users"), limit(50));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const users = snap.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== user?.uid);
      setAllUsers(users);
      setIsLoadingUsers(false);
    }, (err) => {
      console.error("Discover error:", err);
      setIsLoadingUsers(false);
    });
    
    return () => {
      unsubConvos();
      unsubUsers();
    };
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingLoading(false);
      return;
    }
    setIsSearchingLoading(true);
    const unsub = searchUsers(searchQuery, (users) => {
      setSearchResults(users);
      setIsSearchingLoading(false);
    });
    return () => unsub();
  }, [searchQuery]);

  const handleStartChat = async (target: UserProfile) => {
    if (!user) return alert("Please sync your identity first.");
    const convoId = await startConversation(user, {
      uid: target.uid,
      name: target.displayName,
      avatar: target.photoURL
    });
    
    if (initialMessage) {
      await sendMessage(convoId, user.uid, initialMessage);
    }

    navigate(`/messages/${convoId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex justify-end overflow-hidden perspective-3000">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl transition-opacity duration-1000" onClick={onClose} />
      
      <div 
        className="relative w-full sm:max-w-md h-full bg-[#050505] border-l border-white/5 flex flex-col shadow-[0_0_120px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-700 ease-out preserve-3d overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FFFF]/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="h-28 sm:h-32 px-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01] relative z-[100] preserve-3d">
           {!isSearching ? (
             <div className="flex-grow flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="flex items-center gap-5">
                 <div className="relative group">
                   <div className="absolute inset-0 bg-[#00FFFF] blur-2xl opacity-10 animate-pulse"></div>
                   <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#00FFFF]/5 rounded-2xl flex items-center justify-center text-[#00FFFF] border border-[#00FFFF]/20 shadow-2xl relative z-10 transition-transform group-hover:scale-110">
                     <MessageSquare size={28} fill="currentColor" className="opacity-90" />
                   </div>
                 </div>
                 <div className="preserve-3d">
                   <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none text-glow uppercase">MESSENGER</h3>
                   <div className="flex items-center gap-2 mt-2">
                     <Activity size={10} className="text-[#00FFFF] animate-pulse" />
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">NODES AVAILABLE</p>
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setIsSearching(true)}
                  className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-[#00FFFF] hover:bg-white/5 rounded-2xl transition-all"
                 >
                   <Search size={24} />
                 </button>
                 <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><X size={28} /></button>
               </div>
             </div>
           ) : (
             <div className="flex-grow flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <button onClick={() => setIsSearching(false)} className="text-[#00FFFF] hover:text-white transition-colors"><AtSign size={22} /></button>
                <div className="flex-grow relative">
                  <input 
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SCAN NODE ID..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-white placeholder-white/10 focus:outline-none focus:border-[#00FFFF]/40 transition-all tracking-widest uppercase"
                  />
                  {isSearchingLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00FFFF] animate-spin" size={18} />}
                </div>
                <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-2 text-white/40 hover:text-[#00FFFF]"><X size={24} /></button>
             </div>
           )}
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar p-6 space-y-8 preserve-3d">
          {initialMessage && (
            <div className="px-4 py-3 bg-[#00FFFF]/5 border border-[#00FFFF]/20 rounded-2xl mb-4">
              <p className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest italic">Sharing Signal:</p>
              <p className="text-[11px] text-white/60 truncate italic">{initialMessage}</p>
            </div>
          )}

          {isSearching ? (
            <div className="space-y-6 py-4">
              {searchResults.map((res, idx) => (
                <div 
                  key={res.uid}
                  onClick={() => handleStartChat(res)}
                  className="group relative p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 hover:border-[#00FFFF]/40 transition-all cursor-pointer animate-in zoom-in-95 duration-500 overflow-hidden shadow-2xl"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <img src={res.photoURL} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="" />
                    <div className="flex-grow">
                       <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1 group-hover:text-[#00FFFF] transition-colors">{res.displayName}</h4>
                       <p className="text-[9px] text-white/30 uppercase tracking-[0.4em] font-black italic">@{res.username}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {conversations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-white/25 uppercase tracking-[0.6em] px-2 mb-6">NEURAL CONNECTIONS</h4>
                  {conversations.map((c, idx) => {
                    const targetName = Object.values(c.participantNames).find(n => n !== user?.displayName) || "UNKNOWN OP";
                    const targetAvatar = Object.values(c.participantAvatars).find(a => a !== user?.photoURL) || "";
                    return (
                      <button 
                        key={c.id} 
                        onClick={() => { handleStartChat({ uid: c.participants.find(p => p !== user?.uid)!, displayName: targetName, photoURL: targetAvatar } as UserProfile); }}
                        className="w-full p-6 bg-white/[0.02] rounded-[2.5rem] flex items-center gap-6 border border-white/5 hover:border-[#00FFFF]/40 hover:bg-[#00FFFF]/5 transition-all group animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <img src={targetAvatar} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt="" />
                        <div className="text-left flex-grow min-w-0">
                          <p className="text-lg font-black text-white uppercase tracking-tighter truncate leading-none mb-2 group-hover:text-[#00FFFF] transition-colors">{targetName}</p>
                          <p className="text-white/40 text-[10px] truncate italic font-black uppercase tracking-widest">{c.lastMessage || "Link established."}</p>
                        </div>
                        <ChevronRight size={16} className="text-white/10 group-hover:text-[#00FFFF] group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-white/25 uppercase tracking-[0.6em] px-2 mb-6">DISCOVER NODES</h4>
                <div className="relative min-h-[120px] flex items-center justify-center">
                  {isLoadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-700">
                      <Loader2 size={40} className="animate-spin text-[#00FFFF] drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 w-full px-2">
                      {allUsers.length > 0 ? allUsers.map((u, idx) => (
                        <button 
                          key={u.uid}
                          onClick={() => handleStartChat(u)}
                          className="w-full p-4 flex items-center gap-6 hover:bg-white/[0.03] rounded-3xl transition-all group border border-transparent hover:border-white/5 animate-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="relative">
                            <img src={u.photoURL} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black"></div>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-[#00FFFF] transition-colors leading-none">{u.displayName}</p>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">@{u.username || u.displayName.toLowerCase().replace(/\s/g, '_')}</p>
                          </div>
                        </button>
                      )) : (
                         <p className="text-center py-10 text-[10px] font-black text-white/10 uppercase tracking-widest">No nodes discovered.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {conversations.length === 0 && allUsers.length === 0 && !isLoadingUsers && (
                <div className="h-full flex flex-col items-center justify-center text-center py-44 opacity-20">
                   <div className="relative mb-12">
                      <div className="absolute inset-0 bg-[#00FFFF] blur-[120px] opacity-10 animate-pulse"></div>
                      <MessageSquare size={120} className="text-white opacity-10" />
                   </div>
                   <h2 className="text-4xl font-black text-white uppercase italic tracking-[0.5em] leading-none mb-6">NEXUS VOID</h2>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">Open a direct signal packet to begin.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-8 py-4 bg-gradient-to-t from-black to-transparent z-[200]">
           <div className="flex items-center justify-between opacity-20">
              <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">SYSTEM.MESSAGING.HUB</span>
              <div className="flex gap-4">
                 <div className="w-12 h-[1px] bg-white"></div>
                 <div className="w-6 h-[1px] bg-white"></div>
              </div>
           </div>
        </div>
      </div>
      <style>{`
        .text-glow { text-shadow: 0 0 10px rgba(0, 255, 255, 0.4); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default MessagingPanel;
