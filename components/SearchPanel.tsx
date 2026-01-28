import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Loader2, AtSign, WifiOff, Zap, ChevronLeft, Users, ShieldCheck, Lock } from 'lucide-react';
import { searchUsers, toggleFollow, joinGroup } from '../services/firebase';
import { UserProfile, Group } from '../types';
import type { User } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

interface SearchPanelProps {
  currentUser: User | null;
  onClose: () => void;
  onStartMessage: (target: { uid: string, name: string, avatar: string }) => void;
}

const SearchSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="p-4 flex items-center justify-between hyper-glass border border-white/5 rounded-3xl animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shimmer bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 shimmer bg-white/10 rounded" />
            <div className="h-2 w-20 shimmer bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-10 w-20 shimmer bg-white/10 rounded-xl" />
      </div>
    ))}
  </div>
);

const PinPrompt: React.FC<{
  group: Group;
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
}> = ({ group, onSuccess, onCancel, userId }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError("");
    try {
      await joinGroup(group.id, userId, pin);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePinInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setPin(clean);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onCancel} />
      <div className="relative w-full max-w-sm hyper-glass rounded-[2.5rem] p-8 border border-white/10 text-center space-y-6 animate-in zoom-in-95 duration-300">
         <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.id}`} className="w-full h-full object-cover" alt="" />
         </div>
         <div className="space-y-1">
           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Enter PIN for {group.name}</h3>
           <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol PIN Verification Required</p>
         </div>
         
         <div className="flex justify-center gap-3 py-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-12 h-16 rounded-2xl border flex items-center justify-center text-2xl font-black transition-all duration-300 ${pin[i] ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 scale-110' : 'border-white/10 bg-white/5 text-white/10'}`}>
                {pin[i] ? '•' : ''}
              </div>
            ))}
         </div>
         
         <input 
          autoFocus
          type="tel"
          maxLength={4}
          value={pin}
          onChange={(e) => handlePinInput(e.target.value)}
          className="absolute opacity-0 inset-0 w-full h-full cursor-default"
         />

         {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-bounce">{error}</p>}

         <div className="flex gap-4 pt-4">
            <button onClick={onCancel} className="flex-1 py-4 hyper-glass rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Abort</button>
            <button 
              onClick={handleJoin} 
              disabled={pin.length !== 4 || loading}
              className="flex-1 py-4 bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Sync Link'}
            </button>
         </div>
      </div>
    </div>
  );
};

const SearchPanel: React.FC<SearchPanelProps> = ({ currentUser, onClose, onStartMessage }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState<Group | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setGroupResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    const timer = setTimeout(() => {
      const unsub = searchUsers(searchTerm, (users, groups) => {
        setResults(users);
        setGroupResults(groups);
        setLoading(false);
      });
      return () => unsub();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFollow = async (e: React.MouseEvent, target: UserProfile) => {
    e.stopPropagation();
    if (!currentUser) return alert("Operator ID required.");
    const isFollowing = target.followers.includes(currentUser.uid);
    await toggleFollow(currentUser.uid, target.uid, isFollowing);
  };

  const handleGroupAction = (group: Group) => {
    if (!currentUser) return alert("Login required.");
    const isMember = group.members.includes(currentUser.uid);
    if (isMember) {
      navigate(`/group/${group.id}`);
      onClose();
    } else {
      setJoiningGroup(group);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center sm:items-start justify-center px-0 sm:px-6 sm:pt-24">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl hidden sm:block" onClick={onClose} />
      
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-black sm:bg-transparent sm:hyper-glass sm:rounded-[2.5rem] border-0 sm:border sm:border-white/10 shadow-4xl animate-in sm:zoom-in-95 duration-500 flex flex-col max-h-screen sm:max-h-[75vh] overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
          <button onClick={onClose} className="sm:hidden p-2 -ml-2 text-white/40 hover:text-white" aria-label="Close search">
            <ChevronLeft size={24} />
          </button>
          <div className="relative flex-grow">
            <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchTerm ? 'text-cyan-400' : 'text-white/20'}`} size={20} />
            <input 
              autoFocus
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users, UIDs, or groups..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-base font-bold text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 transition-all shadow-inner"
            />
            {loading && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <Loader2 className="text-cyan-400 animate-spin" size={18} />
              </div>
            )}
            {searchTerm && !loading && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="hidden sm:block p-2 text-white/20 hover:text-white" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 no-scrollbar pb-10">
          {loading ? (
            <SearchSkeleton />
          ) : (results.length > 0 || groupResults.length > 0) ? (
            <div className="grid grid-cols-1 gap-8">
              {/* Groups Section */}
              {groupResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Users size={14} className="text-cyan-400" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Clusters Found</h3>
                  </div>
                  <div className="space-y-3">
                    {groupResults.map(group => {
                      const isMember = currentUser && group.members.includes(currentUser.uid);
                      return (
                        <div 
                          key={group.id}
                          onClick={() => handleGroupAction(group)}
                          className="p-4 flex items-center justify-between hyper-glass border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.03] rounded-[1.5rem] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                              <img src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.id}`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <p className="text-base font-black text-white uppercase tracking-tighter italic">{group.name}</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest mono">{group.members.length} Members</p>
                            </div>
                          </div>
                          <button className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isMember ? 'bg-white/10 text-white' : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'}`}>
                            {isMember ? 'Enter' : 'Join'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Users Section */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <AtSign size={14} className="text-indigo-400" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operators</h3>
                  </div>
                  <div className="space-y-3">
                    {results.map(profile => {
                      const isMe = currentUser?.uid === profile.uid;
                      const isFollowing = currentUser ? profile.followers.includes(currentUser.uid) : false;
                      return (
                        <div 
                          key={profile.uid}
                          onClick={() => { navigate(`/profile/${profile.uid}`); onClose(); }}
                          className="p-4 flex items-center justify-between hyper-glass border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.03] rounded-[1.5rem] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                              <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <p className="text-base font-black text-white uppercase tracking-tighter">{profile.displayName}</p>
                              <p className="text-[10px] text-cyan-400/60 font-black mono italic">@{profile.username}</p>
                            </div>
                          </div>
                          {!isMe && currentUser && (
                             <button 
                              onClick={(e) => handleFollow(e, profile)}
                              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-white/10 text-white' : 'bg-white text-black'}`}
                            >
                              {isFollowing ? 'Linked' : 'Add'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : hasSearched && !loading ? (
            <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 hyper-glass rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
                <WifiOff size={32} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-[0.3em] italic mb-2">No Signal</h3>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">No matching nodes or clusters.</p>
            </div>
          ) : (
            <div className="py-20 text-center text-white/5">
               <AtSign size={48} className="mx-auto mb-6 opacity-5 animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Standby</p>
            </div>
          )}
        </div>
      </div>

      {joiningGroup && currentUser && (
        <PinPrompt 
          group={joiningGroup} 
          userId={currentUser.uid}
          onCancel={() => setJoiningGroup(null)}
          onSuccess={() => {
            const gid = joiningGroup.id;
            setJoiningGroup(null);
            navigate(`/group/${gid}`);
            onClose();
          }}
        />
      )}
    </div>
  );
};

export default SearchPanel;