import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Video, Info, Mic, Image as ImageIcon,
  Plus, Heart, Loader2, ShieldCheck, MessageCircle
} from "lucide-react";
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  deleteMessage,
  editMessage
} from "../services/firebase";
import type { User } from "../services/firebase";
import { Message, Conversation, ContentItem } from "../types";

const MessagingPage: React.FC<{ user: User | null; items: ContentItem[] }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---------------- SUBSCRIPTIONS ---------------- */

  useEffect(() => {
    if (!id) return;
    const u1 = subscribeToMessages(id, setMessages);
    const u2 = subscribeToConversation(id, setConversation);
    return () => { u1(); u2(); };
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  /* ---------------- SEND ---------------- */

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !id || !inputText.trim() || isSending) return;

    setIsSending(true);
    const text = inputText;
    setInputText("");

    try {
      await sendMessage(id, user.uid, text, {
        replyTo: replyTo
          ? { id: replyTo.id, text: replyTo.text }
          : null
      });
      setReplyTo(null);
    } catch {
      setInputText(text);
      alert("Message failed");
    } finally {
      setIsSending(false);
    }
  };

  /* ---------------- HEADER DATA ---------------- */

  const partnerUid = conversation?.participants?.find(p => p !== user?.uid);
  const partnerName = partnerUid
    ? conversation?.participantNames[partnerUid]
    : "OPERATOR";

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black pt-24 pb-36">

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-black/70 backdrop-blur border-b border-white/5 z-50 flex items-center">
        <div className="max-w-5xl mx-auto w-full px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}><ArrowLeft /></button>
            <div>
              <h1 className="text-white font-bold">{partnerName}</h1>
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
      <div ref={scrollRef} className="max-w-3xl mx-auto px-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-96 flex flex-col justify-center items-center text-white/20">
            <MessageCircle size={64} />
            <p className="mt-4">Secure channel ready</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === user?.uid;

          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`group max-w-[75%] rounded-3xl p-4 ${
                isMe ? "bg-cyan-400/10" : "bg-white/5"
              }`}>

                {/* REPLY PREVIEW */}
                {m.replyTo && (
                  <div className="mb-2 p-2 rounded bg-black/30 text-xs text-cyan-300">
                    Replying to: {m.replyTo.text}
                  </div>
                )}

                {/* EDIT MODE */}
                {editingId === m.id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await editMessage(id!, m.id, editText);
                      setEditingId(null);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-grow bg-black/30 text-white px-2 rounded"
                    />
                    <button className="text-cyan-400 text-sm">Save</button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-white/40 text-sm"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p className="text-white whitespace-pre-wrap">{m.text}</p>
                    {m.edited && (
                      <span className="text-[9px] text-white/30 italic">(edited)</span>
                    )}
                  </>
                )}

                {/* ACTIONS */}
                {isMe && editingId !== m.id && (
                  <div className="flex gap-4 mt-2 text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => {
                      setEditingId(m.id);
                      setEditText(m.text);
                    }}>
                      Edit
                    </button>

                    <button onClick={() => {
                      if (confirm("Delete this message?")) {
                        deleteMessage(id!, m.id);
                      }
                    }}>
                      Delete
                    </button>

                    <button onClick={() => setReplyTo(m)}>
                      Reply
                    </button>
                  </div>
                )}

                {/* VERIFIED */}
                {isMe && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-cyan-400/40">
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

          {/* REPLY BANNER */}
          {replyTo && (
            <div className="absolute -top-12 left-4 right-4 bg-black/80 p-2 rounded-xl text-xs text-white/70">
              Replying to: {replyTo.text.slice(0, 60)}
              <button
                onClick={() => setReplyTo(null)}
                className="ml-3 text-red-400"
              >
                ✕
              </button>
            </div>
          )}

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
