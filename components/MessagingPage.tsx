
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Smile, Paperclip, Mic, Sparkles, Activity, ShieldCheck, 
  Home, LayoutGrid, Plus, MessageCircle, User as UserIcon,
  Camera, Image as ImageIcon, Heart, Info, Phone, Video, Play, ArrowUpRight, Loader2, Globe,
  MoreVertical, Edit3, Trash2, X as CloseIcon
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, subscribeToMessages, sendMessage, subscribeToConversation, deleteMessage, updateMessage } from '../services/firebase';
import type { User } from "../services/firebase";
import { Message, Conversation, ContentItem, ContentType } from '../types';

// Fully Dynamic Post Preview Card
const PostPreviewCard: React.FC<{ postId: string; initialData?: ContentItem }> = ({ postId, initialData }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState<ContentItem | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (post) return;

    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          setPost({ id: postSnap.id, ...postSnap.data() } as ContentItem);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Link metadata fetch failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, post]);

  if (error) return null;

  if (loading || !post) {
    return (
      <div className="mt-4 w-full max-w-[320px] bg-[#121212] border border-white/5 rounded-2xl p-4 flex gap-4 animate-pulse">
        <div className="w-20 h-20 bg-white/5 rounded-xl flex-shrink-0" />
        <div className="flex-grow space-y-2 py-1">
          <div className="h-2 w-1/2 bg-white/5 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-3 w-3/4 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
      className="mt-4 w-full max-w-[340px] bg-[#121212] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-[#00FFFF]/40 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all duration-500 group/preview animate-in fade-in zoom-in-95 duration-500"
    >
      {/* Media Section */}
      <div className="relative aspect-[1.91/1] overflow-hidden bg-neutral-900">
        <img 
          src={post.thumbnail} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover/preview:scale-110" 
          alt="" 
        />
        <div className="absolute inset-0 bg-black/20 group-hover/preview:bg-transparent transition-colors duration-500"></div>
        
        {post.type === ContentType.VIDEO && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-hover/preview:scale-110 group-hover/preview:bg-[#00FFFF] group-hover/preview:text-black transition-all">
              <Play size={20} fill="currentColor" />
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
             <span className="text-[8px] font-black text-[#00FFFF] uppercase tracking-widest">{post.category}</span>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="p-4 bg-[#181818] border-t border-white/5 space-y-1.5">
         <h4 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover/preview:text-[#00FFFF] transition-colors">
           {post.title}
         </h4>
         <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed font-medium italic">
           {post.excerpt}
         </p>
         
         <div className="pt-3 mt-2 flex items-center justify-between border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#00FFFF]/10 flex items-center justify-center border border-[#00FFFF]/20">
                <Globe size={11} className="text-[#00FFFF]" />
              </div>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.1em]">SIGNAL-STREAM.NET</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="text-[8px] font-black text-[#00FFFF] opacity-0 group-hover/preview:opacity-100 transition-opacity tracking-widest">OPEN LINK</span>
               <ArrowUpRight size={12} className="text-white/20 group-hover/preview:text-[#00FFFF] transition-all" />
            </div>
         </div>
      </div>
    </div>
  );
};

const MessagingPage: React.FC<{ user: User | null; items: ContentItem[] }> = ({ user, items }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const unsubMsgs = subscribeToMessages(id, (msgs) => setMessages(msgs));
    const unsubConvo = subscribeToConversation(id, (convo) => setConversation(convo));
    
    return () => {
      unsubMsgs();
      unsubConvo();
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current && !editingMessage) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, editingMessage]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !id || !inputText.trim() || isSending) return;
    
    setIsSending(true);
    const text = inputText;
    
    try {
      if (editingMessage) {
        await updateMessage(id, editingMessage.id, text);
        setEditingMessage(null);
      } else {
        await sendMessage(id, user.uid, text);
      }
      setInputText("");
    } catch (err) {
      console.error("Signal modulation error:", err);
      alert("Neural sync error. Retry packet.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!id || !window.confirm("Dissolve this signal transmission from the timeline?")) return;
    try {
      await deleteMessage(id, msgId);
      setActiveMenuId(null);
    } catch (err) {
      alert("Dissolution failed.");
    }
  };

  const startEdit = (msg: Message) => {
    setEditingMessage(msg);
    setInputText(msg.text);
    setActiveMenuId(null);
  };

  const partnerUid = conversation?.participants?.find(p => p !== user?.uid);
  const partnerName = partnerUid ? (conversation.participantNames[partnerUid] || 'OPERATOR') : 'OPERATOR';
  const partnerAvatar = partnerUid ? conversation.participantAvatars[partnerUid] : '';

  const postLinkRegex = /(?:#\/post\/|post:|\/post\/)([a-zA-Z0-9_-]{15,})/g;

  return (
    <div className="min-h-screen bg-[#030303] pt-24 pb-32 flex flex-col items-center overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(#00FFFF_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-[150] h-20 sm:h-24 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center">
        <div className="w-full max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-white/40 hover:text-white transition-all">
              <ArrowLeft size={28} />
            </button>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(-1)}>
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 p-0.5 bg-black overflow-hidden relative shadow-lg">
                 <img 
                  src={partnerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`} 
                  className="w-full h-full object-cover rounded-full" 
                  alt="Partner Avatar" 
                 />
                 <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black"></div>
               </div>
               <div>
                <h1 className="text-sm sm:text-lg font-black text-white uppercase italic tracking-tighter leading-none truncate">{partnerName}</h1>
                <p className="text-[8px] font-black text-[#00FFFF] uppercase tracking-widest mt-1 opacity-60">SYNC ESTABLISHED</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 text-white/30">
            <button className="hover:text-[#00FFFF] transition-all p-3"><Phone size={20} /></button>
            <button className="hover:text-[#00FFFF] transition-all p-3"><Video size={24} /></button>
            <button className="hover:text-[#00FFFF] transition-all p-3"><Info size={22} /></button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="w-full max-w-3xl flex-grow overflow-y-auto no-scrollbar px-6 space-y-6 py-12 relative z-10">
        {messages.map((m, i) => {
          const isMe = m.senderId === user?.uid;
          const matches = Array.from(m.text.matchAll(postLinkRegex));
          const postIds = matches.map(match => match[1]);

          return (
            <div key={m.id || i} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-3 mt-auto self-end border border-white/5 opacity-50">
                  <img src={partnerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.senderId}`} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              
              <div className={`relative group max-w-[90%] sm:max-w-[75%] transition-all duration-300`}>
                <div 
                  className={`relative p-4 px-6 rounded-[2rem] border shadow-2xl ${
                    isMe 
                      ? 'bg-[#00FFFF]/5 border-[#00FFFF]/20 text-white rounded-br-md' 
                      : 'bg-[#161616] border-white/5 text-white/90 rounded-bl-md'
                  }`}
                  onClick={() => isMe && !activeMenuId && setActiveMenuId(m.id)}
                >
                  <p className="text-sm sm:text-base font-medium leading-relaxed tracking-tight whitespace-pre-wrap selection:bg-[#00FFFF]/30">
                    {m.text}
                  </p>
                  
                  {postIds.map(postId => (
                    <PostPreviewCard 
                      key={postId} 
                      postId={postId} 
                      initialData={items.find(p => p.id === postId)} 
                    />
                  ))}

                  <div className={`mt-3 flex items-center justify-between opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">
                        {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SYNCING...'}
                      </span>
                      {m.isEdited && (
                        <span className="text-[6px] font-black text-[#00FFFF]/40 uppercase italic tracking-widest">(MODULATED)</span>
                      )}
                    </div>
                    {isMe && (
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={9} className="text-[#00FFFF]/40" />
                        <span className="text-[6px] font-black text-[#00FFFF]/30 uppercase">Neural Verify</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Menu Trigger */}
                {isMe && (
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 hidden sm:block opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === m.id ? null : m.id); }}
                      className="p-2 text-white/20 hover:text-[#00FFFF]"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeMenuId === m.id && (
                      <div className="absolute right-full mr-2 bottom-0 w-32 ss-glass rounded-2xl p-1.5 border border-white/10 z-[100] animate-in slide-in-from-right-2 duration-300">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEdit(m); }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest group/item transition-all"
                        >
                          Modulate <Edit3 size={12} className="text-[#00FFFF]" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-rose-500/10 rounded-xl text-[10px] font-black text-rose-500 uppercase tracking-widest transition-all"
                        >
                          Dissolve <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Mobile Menu Overlay */}
                {isMe && activeMenuId === m.id && (
                   <div className="fixed inset-0 z-[1000] sm:hidden flex items-center justify-center p-6" onClick={() => setActiveMenuId(null)}>
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                      <div className="relative w-full max-w-xs ss-glass rounded-[2.5rem] p-4 space-y-2 border border-white/10 animate-in zoom-in-95 duration-300">
                         <button 
                          onClick={(e) => { e.stopPropagation(); startEdit(m); }}
                          className="w-full flex items-center justify-between p-6 bg-white/5 rounded-3xl text-xs font-black text-white uppercase tracking-widest"
                        >
                          Modulate Signal <Edit3 size={18} className="text-[#00FFFF]" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          className="w-full flex items-center justify-between p-6 bg-rose-500/10 rounded-3xl text-xs font-black text-rose-500 uppercase tracking-widest"
                        >
                          Dissolve Link <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => setActiveMenuId(null)}
                          className="w-full p-4 text-[10px] font-black text-white/30 uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-6 left-6 right-6 z-[200] flex justify-center">
        <form 
          onSubmit={handleSend}
          className={`w-full max-w-4xl flex items-center gap-3 bg-[#161616]/90 backdrop-blur-2xl border rounded-[2.5rem] p-2 pl-3 shadow-4xl group transition-all ${editingMessage ? 'border-[#00FFFF]/40 ring-1 ring-[#00FFFF]/20' : 'border-white/10'}`}
        >
          <div className="flex items-center">
             <button type="button" className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${editingMessage ? 'bg-[#00FFFF] text-black' : 'bg-white text-black hover:bg-[#00FFFF]'}`}>
               {editingMessage ? <Edit3 size={20} /> : <Camera size={20} strokeWidth={2.5} />}
             </button>
          </div>

          <div className="flex-grow flex items-center relative">
            <input 
              autoFocus={!!editingMessage}
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              placeholder={editingMessage ? "Modulating packet..." : "Inject signal thought..."}
              className="flex-grow bg-transparent border-none text-sm sm:text-base font-bold text-white placeholder-white/10 focus:ring-0 outline-none px-2"
            />
            {editingMessage && (
              <button 
                type="button"
                onClick={() => { setEditingMessage(null); setInputText(""); }}
                className="absolute right-2 p-2 text-rose-500 hover:text-white transition-all"
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 pr-2">
            {!inputText.trim() && !editingMessage ? (
              <>
                <button type="button" className="p-2 text-white/20 hover:text-white transition-all"><Mic size={22} /></button>
                <button type="button" className="p-2 text-white/20 hover:text-white transition-all"><ImageIcon size={22} /></button>
                <button type="button" className="p-2 text-white/20 hover:text-white transition-all"><Plus size={22} /></button>
                <button type="button" className="p-2 text-rose-500/40 hover:text-rose-500 hover:scale-110 transition-all"><Heart size={22} fill="currentColor" /></button>
              </>
            ) : (
              <button 
                type="submit"
                disabled={isSending}
                className="px-6 py-3 text-[#00FFFF] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : editingMessage ? "UPDATE" : "Sync"}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .ss-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default MessagingPage;
