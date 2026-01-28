import React, { useState } from 'react';
import { X, Users, Lock, Zap, ShieldCheck, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { createGroup } from '../services/firebase';
import type { User } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

interface CreateGroupProps {
  user: User | null;
  onClose: () => void;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ user, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || pin.length !== 4) return;
    
    setLoading(true);
    try {
      const gid = await createGroup(user.uid, {
        name,
        description,
        pin,
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name + Date.now()}`
      });
      setLoading(false);
      onClose();
      navigate(`/group/${gid}`);
    } catch (err) {
      alert("Nexus Initialization Failed.");
      setLoading(false);
    }
  };

  const generateAvatar = () => {
    setAvatar(`https://api.dicebear.com/7.x/identicon/svg?seed=${name + Math.random()}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-xl hyper-glass rounded-[3rem] overflow-hidden border border-white/10 shadow-4xl animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 hyper-glass rounded-2xl flex items-center justify-center text-indigo-400">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Initialize Cluster</h2>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Distributed Node Creation</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-2xl transition-all">
             <X size={24} />
           </button>
        </div>

        <form onSubmit={handleCreate} className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
             <div className="relative group">
               <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-white/10 p-1 bg-black shadow-2xl relative">
                 <img src={avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name || 'temp'}`} className="w-full h-full object-cover rounded-[2rem]" alt="" />
               </div>
               <button 
                type="button" 
                onClick={generateAvatar}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-cyan-500 rounded-2xl border-4 border-black flex items-center justify-center text-black hover:scale-110 transition-all shadow-xl"
               >
                 <Sparkles size={16} fill="currentColor" />
               </button>
             </div>

             <div className="flex-grow w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Cluster Name</label>
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter unique node name..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder-white/10 focus:border-cyan-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">4-Digit Access PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-400/40" size={16} />
                    <input 
                      required
                      type="password" 
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-black tracking-[1em] placeholder-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Node Descriptor</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this cluster..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium placeholder-white/10 focus:border-cyan-500/50 outline-none transition-all resize-none"
            />
          </div>

          <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl flex items-center gap-4">
             <ShieldCheck size={24} className="text-cyan-400 flex-shrink-0" />
             <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest leading-relaxed">
               Secure Cluster initialized under Operator ID: <br/>
               <span className="mono text-[8px] opacity-40">{user?.uid}</span>
             </p>
          </div>

          <button 
            type="submit" 
            disabled={loading || !name.trim() || pin.length !== 4}
            className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-cyan-400 hover:text-white transition-all shadow-2xl active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} fill="currentColor" />}
            Initialize Cluster
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;