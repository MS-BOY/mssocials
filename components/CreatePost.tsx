
import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, ImageIcon, Video, Mic, Loader2, Square, Trash2, Upload, ArrowLeft, RotateCcw } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { savePost, User } from '../services/firebase';

interface CreatePostProps {
  user: User | null;
  onClose: () => void;
  onPost: (title: string, progress: number, status: 'uploading' | 'saving' | 'success' | 'error' | 'idle' | 'analyzing') => void;
  editItem?: any;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onClose, onPost }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'success' | 'error' | 'analyzing'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbRef.current || window.innerWidth < 768) return;
    const rect = orbRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / 25;
    const y = (e.clientY - (rect.top + rect.height / 2)) / -25;
    setTilt({ x, y });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const clearMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setAudioBlob(null);
    setThumbnailBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (f: File) => {
    clearMedia();
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    if (f.type.startsWith('video/')) {
      try {
        const thumb = await generateVideoThumbnail(f);
        setThumbnailBlob(thumb);
      } catch (err) {
        console.error("Thumbnail error", err);
      }
    }
  };

  // Add handleFileChange to fix the reference error on the input onChange handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      processFile(droppedFile);
    }
  };

  const startRecording = async () => {
    try {
      clearMedia();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);
      video.onloadedmetadata = () => { video.currentTime = 1; };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob); else reject();
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.8);
      };
      video.onerror = () => reject();
    });
  };

  const handleSubmit = async () => {
    if ((!file && !audioBlob) || !user) return;
    setStatus('uploading');
    onPost(title || "Broadcast", 0, 'uploading');
    try {
      let mediaUrl = '';
      let thumbUrl = '';
      if (audioBlob) {
        const voiceFile = new File([audioBlob], "voice.webm", { type: 'audio/webm' });
        mediaUrl = await uploadToCloudinary(voiceFile, 'video', (p) => onPost(title, p, 'uploading'));
      } else if (file) {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        mediaUrl = await uploadToCloudinary(file, type, (p) => onPost(title, p, 'uploading'));
        if (type === 'video' && thumbnailBlob) {
          const thumbFile = new File([thumbnailBlob], "thumb.jpg", { type: 'image/jpeg' });
          thumbUrl = await uploadToCloudinary(thumbFile, 'image');
        }
      }
      setStatus('saving');
      onPost(title, 100, 'saving');
      await savePost({
        title: title || "MS Transmission",
        excerpt: "Holographic packet distributed to the cluster.",
        thumbnail: thumbUrl || (audioBlob ? `https://api.dicebear.com/7.x/identicon/svg?seed=${Date.now()}` : mediaUrl),
        mediaUrls: [mediaUrl],
        videoUrl: file?.type.startsWith('video/') ? mediaUrl : null,
        audioUrl: audioBlob ? mediaUrl : null,
        category: audioBlob ? "VOICE" : (file?.type.startsWith('video/') ? "VIDEO" : "IMAGE"),
        author: { name: user.displayName || "Operator", avatar: user.photoURL || "", uid: user.uid, role: "Operator" },
        type: audioBlob ? "VOICE" : (file?.type.startsWith('video/') ? "VIDEO" : "POST"),
        date: new Date().toISOString()
      });
      setStatus('success');
      onPost(title, 100, 'success');
      setTimeout(onClose, 800);
    } catch (e) {
      setStatus('error');
      onPost(title, 0, 'error');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[700] flex items-center justify-center p-0 overflow-y-auto no-scrollbar touch-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full min-h-screen sm:min-h-0 sm:max-w-4xl flex flex-col items-center py-10 sm:py-20 px-6 sm:px-12 animate-in zoom-in-95 duration-500 space-y-8 sm:space-y-12">
        
        {user && (
          <div className="absolute top-6 right-6 flex items-center gap-3 sm:gap-4 z-[750]">
            <div className="text-right hidden sm:block">
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">{user.displayName}</h4>
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1">Operator Verified</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 p-0.5 bg-black overflow-hidden shadow-2xl">
              <img src={user.photoURL || ""} className="w-full h-full rounded-full object-cover" alt="" />
            </div>
          </div>
        )}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02] w-full text-center">
          <h2 className="text-[18vw] sm:text-[14vw] font-black text-white italic tracking-tighter uppercase leading-none">
            {isDragging ? "DROP" : isRecording ? "RECORD" : (audioBlob ? "VOICE" : "SIGNAL")} <br/> SYNC
          </h2>
        </div>

        <div 
          ref={orbRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          className="relative w-64 h-64 sm:w-[480px] sm:h-[480px] group perspective-2000"
        >
          <div className={`absolute inset-0 rounded-full blur-[80px] sm:blur-[140px] opacity-20 transition-all duration-1000 ${isDragging ? 'bg-cyan-400 opacity-40 scale-110' : isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white/5'}`}></div>
          
          <div 
            className={`w-full h-full rounded-full bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center overflow-hidden transition-transform duration-500 ease-out border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] relative ${isDragging ? 'scale-105 border-cyan-500/50' : ''}`}
            style={{ transform: `translate3d(0,0,0) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
          >
            {preview ? (
              <div className="w-full h-full flex items-center justify-center relative bg-black">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} className="w-full h-full object-cover grayscale-[0.5] opacity-80" muted autoPlay loop playsInline />
                ) : audioBlob ? (
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-1 h-12">
                       {[1,2,3,4,5,6].map(i => (
                         <div key={i} className="w-1.5 bg-cyan-400 animate-pulse" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }} />
                       ))}
                     </div>
                     <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest italic">Audio Captured</p>
                  </div>
                ) : (
                  <img src={preview} className="w-full h-full object-cover grayscale-[0.3] opacity-90" alt="" />
                )}
                <div className="absolute inset-0 border-[12px] sm:border-[24px] border-white/5 rounded-full pointer-events-none"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:gap-10 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-5 group-hover:opacity-20 transition-opacity"></div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/10 flex items-center justify-center text-white/10 group-hover:text-cyan-400/60 group-hover:border-cyan-400/20 transition-all relative z-10">
                     <Zap size={36} className="sm:w-[44px]" />
                     <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Upload size={12} className="text-white/20" />
                     </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-white/20 italic tracking-tighter uppercase">SYNC SOURCE</h3>
                  <p className="text-[7px] font-black text-white/5 uppercase tracking-widest mt-2">OR DRAG FILE HERE</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Overlay - Fixed position, highest Z to ensure click */}
          {preview && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-6 sm:gap-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearMedia(); }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500 text-white rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                >
                  <Trash2 size={28} className="sm:w-[32px]" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500 text-white rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                >
                  <RotateCcw size={28} className="sm:w-[32px]" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-xl space-y-8 sm:space-y-16 flex flex-col items-center">
          <div className="relative group/input w-full">
             <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="TRANSMISSION_ID..."
              className="w-full bg-transparent text-white text-4xl sm:text-7xl font-black italic tracking-tighter placeholder-white/5 border-none focus:ring-0 outline-none text-center uppercase"
            />
            <div className="w-24 h-[1px] bg-white/10 mx-auto mt-4 sm:mt-6"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full pb-20 sm:pb-0">
            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all"><ImageIcon size={24} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all"><Video size={24} /></button>
              <button 
                onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={`w-16 h-16 sm:w-20 sm:h-20 border rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 border-rose-500 text-white animate-pulse' : 'bg-white/5 border-white/10 text-white/20 hover:text-rose-500'}`}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={status !== 'idle' || (!file && !audioBlob)}
              className="px-8 sm:px-12 py-5 sm:py-6 bg-white text-black rounded-[2rem] font-black text-[11px] sm:text-sm uppercase tracking-[0.3em] hover:bg-cyan-400 hover:scale-105 transition-all shadow-xl disabled:opacity-10 w-full sm:w-auto flex items-center justify-center gap-4"
            >
              {status !== 'idle' ? <Loader2 className="animate-spin" size={20} /> : "SYNC SIGNAL"}
            </button>
          </div>
          
          {isRecording && (
            <div className="flex flex-col items-center animate-bounce">
               <p className="text-2xl sm:text-3xl font-black text-rose-500 tabular-nums">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={onClose} className="fixed top-6 left-6 p-4 text-white/20 hover:text-white transition-all z-[800]">
        <X size={28} className="sm:w-[32px]" />
      </button>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />

      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CreatePost;
