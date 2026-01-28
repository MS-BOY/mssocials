
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Cpu, CloudUpload, Sparkles, Zap } from 'lucide-react';

interface UploadToastProps {
  progress: number;
  status: 'uploading' | 'saving' | 'success' | 'error' | 'idle' | 'analyzing';
  title: string;
}

const UploadToast: React.FC<UploadToastProps> = ({ progress, status, title }) => {
  if (status === 'idle') return null;

  const isComplete = status === 'success';
  const isError = status === 'error';
  const isAnalyzing = status === 'analyzing';
  const isSaving = status === 'saving';

  // Circular progress calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const displayProgress = isSaving || isComplete ? 100 : progress;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[90vw] max-w-sm">
      <div className="hyper-glass rounded-[2rem] p-4 flex items-center gap-4 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-500 ease-out">
        
        {/* Goal-Shaped Circular Progress */}
        <div className="relative flex-shrink-0 w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
              className={`${
                isError ? 'text-rose-500' : 
                isComplete ? 'text-emerald-400' : 
                'text-cyan-400'
              } drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]`}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 size={20} className="text-emerald-400 animate-in zoom-in duration-300" />
            ) : isError ? (
              <AlertCircle size={20} className="text-rose-500" />
            ) : isAnalyzing ? (
              <Sparkles size={18} className="text-cyan-400 animate-pulse" />
            ) : (
              <span className="text-[10px] font-black text-white tabular-nums">
                {Math.round(displayProgress)}%
              </span>
            )}
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-grow min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isComplete ? 'bg-emerald-400' : isError ? 'bg-rose-500' : 'bg-cyan-400'}`} />
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
              {isAnalyzing ? 'Analyzing Signal' : 
               isSaving ? 'Verifying Node' : 
               isComplete ? 'Broadcast Secure' : 
               isError ? 'Link Failure' : 'Upstreaming Content'}
            </p>
          </div>
          <h4 className="text-xs font-bold text-white truncate max-w-full tracking-tight">
            {title || 'Initializing Transmission...'}
          </h4>
          <p className="text-[8px] font-black text-cyan-400/40 uppercase tracking-widest mt-1 mono">
            {isSaving ? 'Syncing Distributed Database...' : 
             isComplete ? 'Successfully Distributed' : 
             `Fulfilled: ${Math.round(displayProgress)}%`}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="pr-2">
          {isSaving || (status === 'uploading' && progress < 100) ? (
            <Loader2 size={16} className="text-white/20 animate-spin" />
          ) : isComplete ? (
            <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Live</span>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Visual Anchor Glow */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-500/20 blur-xl rounded-full" />
    </div>
  );
};

export default UploadToast;
