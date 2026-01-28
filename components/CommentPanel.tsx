
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Sparkles, Smile, Loader2, Zap, MoreVertical, Edit3, Trash2, Check, CornerDownRight } from 'lucide-react';
import type { User } from "../services/firebase";
import { addCommentToPost, deleteCommentFromPost, updateCommentInPost } from '../services/firebase';
import { suggestFunnyComment } from '../services/geminiService';
import { ContentItem, Comment } from '../types';
import EmojiPicker from './EmojiPicker';

interface CommentPanelProps {
  item: ContentItem;
  user: User | null;
  onClose: () => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ item, user, onClose }) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // States for comment editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !editingCommentId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [item.comments, editingCommentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addCommentToPost(item.id, {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userAvatar: user.photoURL || "",
        text: newComment.trim()
      });
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCommentInPost(item.id, commentId, editText.trim());
      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Dissolve this signal transmission?")) return;
    try {
      await deleteCommentFromPost(item.id, commentId);
      setActiveMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
    setActiveMenuId(null);
  };

  const handleAISuggest = async () => {
    if (isAIThinking) return;
    setIsAIThinking(true);
    try {
      const suggestion = await suggestFunnyComment(item.excerpt || item.title);
      setNewComment(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIThinking(false);
    }
  };

  const addEmoji = (emoji: string) => {
    if (editingCommentId) {
      setEditText(prev => prev + emoji);
    } else {
      setNewComment(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed inset-0 z-[650] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl transition-opacity duration-500" onClick={onClose} />
      
      {/* Panel Content */}
      <div 
        className="relative w-full sm:max-w-xl md:max-w-2xl h-full bg-[#050505] shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col border-l border-white/5 animate-in slide-in-from-right duration-500 ease-out"
      >
        {/* Header */}
        <div className="h-24 sm:h-32 px-5 sm:px-10 flex items-center justify-between border-b border-white/5 bg-black/40 relative z-50">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
               <div className="absolute inset-0 bg-[#00FFFF] blur-2xl opacity-20 animate-pulse"></div>
               <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#00FFFF]/10 rounded-2xl flex items-center justify-center text-[#00FFFF] border border-[#00FFFF]/30 relative z-10 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                 <MessageCircle size={32} strokeWidth={2.5} />
               </div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none text-glow">COMMENTS</h3>
              <div className="mt-2 sm:mt-3 flex items-center">
                <div className="px-3 sm:px-4 py-1 sm:py-1.5 bg-[#9B59B6]/10 rounded-full border border-[#9B59B6]/20 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-[#9B59B6] rounded-full animate-pulse shadow-[0_0_8px_#9B59B6]"></div>
                   <span className="text-[8px] sm:text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">{item.comments?.length || 0} NEURALS ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white/20 hover:text-white bg-white/5 rounded-xl sm:rounded-2xl transition-all border border-white/10">
            <X size={24} />
          </button>
        </div>

        {/* Comment Stream Area */}
        <div 
          ref={scrollRef} 
          className="flex-grow overflow-y-auto p-5 sm:p-10 space-y-8 sm:space-y-10 no-scrollbar pb-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.98]"
        >
          {item.comments && item.comments.length > 0 ? (
            item.comments.map((comment, idx) => {
              const isMe = user && comment.userId === user.uid;
              const isEditing = editingCommentId === comment.id;

              return (
                <div 
                  key={comment.id} 
                  className="flex gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl p-0.5 bg-gradient-to-br from-[#00FFFF]/20 to-transparent">
                      <img 
                        src={comment.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`} 
                        className="w-full h-full rounded-[0.9rem] sm:rounded-[1.1rem] object-cover border border-white/10" 
                        alt="" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-2 flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] sm:text-[10px] font-black text-[#00FFFF] uppercase tracking-widest italic">{comment.userName}</p>
                        {(comment as any).isEdited && (
                          <span className="text-[7px] text-white/20 uppercase tracking-widest font-black italic">(modulated)</span>
                        )}
                      </div>
                      
                      {/* Options Button for own comments */}
                      {isMe && !isEditing && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === comment.id ? null : comment.id)}
                            className="p-1 text-white/10 hover:text-white transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuId === comment.id && (
                            <div className="absolute right-0 top-full mt-2 w-32 ss-glass rounded-xl p-1.5 border border-white/10 z-[100] animate-in slide-in-from-top-2 duration-300">
                              <button 
                                onClick={() => startEdit(comment)}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg text-[9px] font-black text-white uppercase tracking-widest group transition-all"
                              >
                                Modulate <Edit3 size={11} className="text-[#00FFFF]" />
                              </button>
                              <button 
                                onClick={() => handleDelete(comment.id)}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-rose-500/10 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest transition-all"
                              >
                                Dissolve <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="relative animate-in zoom-in-95 duration-300">
                        <textarea 
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.05] border border-[#00FFFF]/30 text-sm sm:text-base text-white/90 leading-relaxed font-medium outline-none focus:border-[#00FFFF]/60 transition-all resize-none shadow-[0_0_30px_rgba(0,255,255,0.05)]"
                          rows={3}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                           <button 
                             onClick={() => { setEditingCommentId(null); setEditText(""); }}
                             className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                           >
                             <X size={16} />
                           </button>
                           <button 
                             onClick={() => handleUpdate(comment.id)}
                             disabled={!editText.trim() || isSubmitting}
                             className="p-2 bg-[#00FFFF] text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                           >
                             {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-inner transition-all ${isMe ? 'bg-white/[0.05] border-white/10' : 'bg-white/[0.03] border-white/5'}`}>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed font-medium">{comment.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-in fade-in duration-1000">
              <Zap size={100} className="text-white mb-6 sm:mb-8" strokeWidth={1} />
              <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase">NO SIGNALS RETRIEVED</h2>
              <p className="text-[9px] font-black text-white uppercase tracking-[0.5em] mt-3 sm:mt-4 italic opacity-50">PROTOCOL: NEURAL STANDBY</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-10 sm:left-10 sm:right-10 z-[100] max-w-xl mx-auto transition-transform duration-500 ${editingCommentId ? 'translate-y-40' : 'translate-y-0'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-grow flex items-center gap-2 sm:gap-4 bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 sm:p-2 pl-4 sm:pl-6 shadow-4xl focus-within:border-[#00FFFF]/30 transition-all">
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-white/30 hover:text-white transition-colors"
                >
                  <Smile size={24} />
                </button>
                <button 
                  type="button"
                  onClick={handleAISuggest}
                  disabled={isAIThinking}
                  className="p-2 text-white/30 hover:text-[#00FFFF] transition-colors"
                >
                  {isAIThinking ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-grow flex items-center">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Broadcast thought"
                  className="w-full bg-transparent border-none py-3 sm:py-5 text-sm sm:text-base text-white placeholder-white/20 focus:ring-0 outline-none font-medium"
                />
              </form>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 text-white hover:bg-[#00FFFF] hover:text-black rounded-full flex items-center justify-center transition-all disabled:opacity-10 shadow-2xl border border-white/5 flex-shrink-0 active:scale-95"
            >
              {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} strokeWidth={2.5} />}
            </button>
          </div>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-4 w-full max-w-sm">
              <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmojiPicker(false)} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .text-glow { text-shadow: 0 0 15px rgba(0, 255, 255, 0.5); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .ss-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        @media (max-width: 640px) {
          .max-w-xl { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CommentPanel;
