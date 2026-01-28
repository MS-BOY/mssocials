import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Video, Info, MessageCircle, Camera,
  Mic, Image as ImageIcon, Plus, Heart, Loader2, ShieldCheck,
  Play, ArrowUpRight, Globe
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, subscribeToMessages, sendMessage, subscribeToConversation } from '../services/firebase';
import type { User } from "../services/firebase";
import { Message, Conversation, ContentItem, ContentType } from '../types';

/* ---------------- POST PREVIEW CARD ---------------- */

const PostPreviewCard: React.FC<{ postId: string; initialData?: ContentItem }> = ({ postId, initialData }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState<ContentItem | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (post) return;

    const fetchPost = async () => {
      try {
        const snap = await getDoc(doc(db, "posts", postId));
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() } as ContentItem);
        } else setError(true);
      } catch {
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
      <div className="mt-4 w-full max-w-[320px] bg-[#121212] border border-white/5 rounded-2xl p-4 animate-pulse">
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
      className="mt-4 max-w-[340px] bg-[#121212] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-400/40 transition-all"
    >
      <div className="relative aspect-video bg-black">
        <img src={post.thumbnail} className="w-full h-full object-cover" />
        {post.type === ContentType.VIDEO && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="text-white" />
          </div>
        )}
      </div>

      <div className="p-4 bg-[#181818]">
        <h4 className="text-sm font-bold text-white">{post.title}</h4>
        <p className="text-xs text-white/50 line-clamp-2">{post.excerpt}</p>

        <div className="mt-3 flex justify-between items-center text-[9px] text-white/30">
          <div className="flex items-center gap-1">
            <Globe size={10} /> SIGNAL-STREAM
          </div>
          <ArrowUpRight size={12} />
        </div>
      </div>
    </div>
  );
};

/* ---------------- MESSAGING PAGE ---------------- */

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
    const u1 = subscribeToMessages(id, setMessages);
    const u2 = subscribeToConversation(id, setConversation);
    return () => { u1(); u2(); };
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !id || !inputText.trim() || isSending) return;

    const text = inputText;
    setInputText("");
    setIsSending(true);

    try {
      await sendMessage(id, user.uid, text);
    } catch {
      setInputText(text);
      alert("Message failed");
    } finally {
      setIsSending(false);
    }
  };

  /* ---------- FIXED PARTNER DATA (IMPORTANT) ---------- */

  const partnerUid =
    conversation?.participants?.find(p => p !== user?.uid) || "";

  const partnerName =
    conversation?.participantNames?.[partnerUid] || "OPERATOR";

  const partnerAvatar =
    conversation?.participantAvatars?.[partnerUid] ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${partnerUid || id}`;

  const postRegex = /(?:\/post\/|post:)([a-zA-Z0-9_-]{15,})/g;

  return (
    <div className="min-h-screen bg-black pt-24 pb-36">

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-black/70 backdrop-blur border-b border-white/5 flex items-center z-50">
        <div className="max-w-5xl mx-auto w-full px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>

            <img
              src={partnerAvatar}
              alt="Profile"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/identicon/svg?seed=fallback`;
              }}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />

            <div>
              <h1 className="text-white font-bold">
                {conversation ? partnerName : "Loading..."}
              </h1>
              <p className="text-xs text-cyan-400">SYNC ESTABLISHED</p>
            </div>
          </div>

          <div className="flex gap-4 text-white/40">
            <Phone />
            <Video />
            <Info />
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} className="max-w-3xl mx-auto px-6 space-y-6 overflow-y-auto">
        {messages.map((m, i) => {
          const isMe = m.senderId === user?.uid;
          const postIds = [...m.text.matchAll(postRegex)].map(m => m[1]);

          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-3xl max-w-[75%] ${isMe ? 'bg-cyan-400/10' : 'bg-white/5'}`}>
                <p className="text-white whitespace-pre-wrap">{m.text}</p>

                {postIds.map(pid => (
                  <PostPreviewCard
                    key={pid}
                    postId={pid}
                    initialData={items.find(p => p.id === pid)}
                  />
                ))}

                {isMe && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400/40">
                    <ShieldCheck size={10} /> Verified
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT BAR */}
      <div className="fixed bottom-6 left-6 right-6 flex justify-center">
        <div className="w-full max-w-4xl bg-[#161616] border border-white/10 rounded-full p-2 flex items-center gap-3">

          <button className="w-11 h-11 bg-white text-black rounded-full flex items-center justify-center">
            <Camera />
          </button>

          <form onSubmit={handleSend} className="flex-grow flex items-center gap-2">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Inject signal thought..."
              className="flex-grow bg-transparent text-white outline-none px-2"
            />

            {inputText.trim() ? (
              <button type="submit" disabled={isSending} className="px-6 text-cyan-400 font-bold">
                {isSending ? <Loader2 className="animate-spin" /> : "Sync"}
              </button>
            ) : (
              <>
                <Mic className="text-white/30" />
                <ImageIcon className="text-white/30" />
                <Plus className="text-white/30" />
                <Heart className="text-rose-500/40" />
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
