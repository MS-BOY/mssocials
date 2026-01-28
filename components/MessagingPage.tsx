
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Smile, Paperclip, Mic, Sparkles, Activity, ShieldCheck, 
  Home, LayoutGrid, Plus, MessageCircle, User as UserIcon,
  Camera, Image as ImageIcon, Heart, Info, Phone, Video, Play, ArrowUpRight, Loader2, Globe
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, subscribeToMessages, sendMessage, subscribeToConversation } from '../services/firebase';
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !id || !inputText.trim() || isSending) return;
    
    setIsSending(true);
    const text = inputText;
    setInputText("");
    
    try {
      await sendMessage(id, user.uid, text);
    } catch (err) {
      console.error("Signal transmission error:", err);
      setInputText(text); 
      alert("Transmission failed. Neural link unstable.");
    } finally {
      setIsSending(false);
    }
  };

  const partnerUid = conversation?.participants?.find(p => p !== user?.uid);
  const partnerName = partnerUid ? (conversation.participantNames[partnerUid] || 'OPERATOR') : 'OPERATOR';
  const partnerAvatar = partnerUid ? conversation.participantAvatars[partnerUid] : '';

  // Improved regex for dynamic detection
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
          
          // Dynamically find all IDs in the message
          const matches = Array.from(m.text.matchAll(postLinkRegex));
          const postIds = matches.map(match => match[1]);

          return (
            <div key={m.id || i} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-3 mt-auto self-end border border-white/5 opacity-50">
                  <img src={partnerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.senderId}`} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              <div 
                className={`relative group max-w-[90%] sm:max-w-[75%] p-4 px-6 rounded-[2rem] transition-all duration-300 border shadow-2xl ${
                  isMe 
                    ? 'bg-[#00FFFF]/5 border-[#00FFFF]/20 text-white rounded-br-md' 
                    : 'bg-[#161616] border-white/5 text-white/90 rounded-bl-md'
                }`}
              >
                <p className="text-sm sm:text-base font-medium leading-relaxed tracking-tight whitespace-pre-wrap selection:bg-[#00FFFF]/30">{m.text}</p>
                
                {/* Dynamic Preview List */}
                {postIds.map(postId => (
                  <PostPreviewCard 
                    key={postId} 
                    postId={postId} 
                    initialData={items.find(p => p.id === postId)} 
                  />
                ))}

                <div className={`mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TRANSMITTING...'}
                  </span>
                  {isMe && (
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={9} className="text-[#00FFFF]/40" />
                      <span className="text-[6px] font-black text-[#00FFFF]/30 uppercase">Neural Verify</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-44">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#00FFFF] blur-[100px] opacity-10 animate-pulse"></div>
                <MessageCircle size={80} className="text-white opacity-10 relative z-10" />
             </div>
             <h2 className="text-lg font-black text-white uppercase tracking-[0.5em] italic opacity-20">Secure Node Ready</h2>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 z-[200] flex justify-center">
        <form 
          onSubmit={handleSend}
          className="w-full max-w-4xl flex items-center gap-3 bg-[#161616]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 pl-3 shadow-4xl group transition-all focus-within:border-[#00FFFF]/20"
        >
          <div className="flex items-center">
             <button type="button" className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#00FFFF] hover:scale-105 active:scale-95 transition-all shadow-xl">
               <Camera size={20} strokeWidth={2.5} />
             </button>
          </div>

          <div className="flex-grow flex items-center">
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Inject signal thought..."
              className="flex-grow bg-transparent border-none text-sm sm:text-base font-bold text-white placeholder-white/10 focus:ring-0 outline-none px-2"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 pr-2">
            {!inputText.trim() ? (
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
                {isSending ? <Loader2 size={16} className="animate-spin" /> : "Sync"}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default MessagingPage;
