
import React from 'react';
import { Smile, Zap, Heart, Flame, Globe, Cpu, Ghost, Moon, Sun, Star } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_SETS = [
  {
    name: 'Pulse',
    icon: Zap,
    emojis: ['⚡', '✨', '🔥', '💥', '🌈', '🌀', '🌊', '🦾', '🧠', '👁️']
  },
  {
    name: 'Vibe',
    icon: Smile,
    emojis: ['😎', '🫠', '👽', '👾', '🤖', '👻', '💀', '🤡', '🦊', '🐲']
  },
  {
    name: 'Core',
    icon: Cpu,
    emojis: ['💎', '🔮', '🧿', '🔋', '📡', '💾', '🕹️', '📱', '📸', '📽️']
  },
  {
    name: 'Zenith',
    icon: Star,
    emojis: ['🚀', '🛸', '🛰️', '🪐', '🌌', '☄️', '🌑', '🌓', '🌞', '🌍']
  }
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeSet, setActiveSet] = React.useState(0);

  return (
    <div className="absolute bottom-full right-0 mb-4 w-72 hyper-glass rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
      <div className="flex border-b border-white/10 bg-black/40">
        {EMOJI_SETS.map((set, i) => {
          const Icon = set.icon;
          return (
            <button 
              key={i}
              onClick={() => setActiveSet(i)}
              className={`flex-1 py-4 flex items-center justify-center transition-all ${activeSet === i ? 'text-cyan-400 bg-white/5 border-b-2 border-cyan-500' : 'text-white/20 hover:text-white/40'}`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      
      <div className="p-4 grid grid-cols-5 gap-3 max-h-52 overflow-y-auto no-scrollbar bg-black/20">
        {EMOJI_SETS[activeSet].emojis.map((emoji, i) => (
          <button 
            key={i}
            onClick={() => onSelect(emoji)}
            className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-white/10 rounded-2xl transition-all hover:scale-125 active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between bg-black/40">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{EMOJI_SETS[activeSet].name} Cluster</span>
        <button onClick={onClose} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 px-2 py-1 bg-rose-500/5 rounded-lg">Close</button>
      </div>
    </div>
  );
};

export default EmojiPicker;
