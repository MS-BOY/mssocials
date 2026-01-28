
import React from 'react';
import { Download, X, Zap, Smartphone, Cloud, ShieldCheck, Globe } from 'lucide-react';

interface InstallModalProps {
  onClose: () => void;
}

const InstallModal: React.FC<InstallModalProps> = ({ onClose }) => {
  const DRIVE_LINK = "https://drive.google.com/file/d/1eHmqCszNMsNAB9tNW-9oqTh2AONK7CwS/view?usp=sharing";

  const handleDownload = () => {
    window.open(DRIVE_LINK, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-sm hyper-glass rounded-[3rem] p-8 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00FFFF]/10 blur-[80px] rounded-full animate-pulse"></div>
        
        <div className="absolute top-0 right-0 p-4 z-10">
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="flex flex-col items-center text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse" />
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-cyan-400 relative z-10 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <Download size={48} strokeWidth={2.5} className="animate-bounce duration-[2000ms]" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">NEURAL MOBILE LINK</h2>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mono">V1.0.4 • STABLE RELEASE</p>
          </div>

          <div className="space-y-4 w-full">
            <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center text-indigo-400 bg-indigo-500/10 rounded-xl"><Smartphone size={20} /></div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-wider">Direct APK Sync</p>
                <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Optimized for Android Nexus</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center text-emerald-400 bg-emerald-500/10 rounded-xl"><Globe size={20} /></div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-wider">Holographic UI</p>
                <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Full Immersive 3D Stream</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleDownload}
            className="w-full py-5 bg-white text-black rounded-[1.75rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-4xl hover:bg-cyan-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Download size={18} strokeWidth={3} /> Sync Node (APK)
          </button>

          <div className="flex items-center gap-2 opacity-20">
             <ShieldCheck size={10} className="text-cyan-400" />
             <p className="text-[8px] font-black text-white uppercase tracking-[0.3em] italic">Protocol Secured via Google Drive</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallModal;
