
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentItem } from '../types';
import { ArrowUpRight, Clock, Zap, Target } from 'lucide-react';
import type { User } from "firebase/auth";
import PostActions from './PostActions';

interface HeroProps {
  item: ContentItem;
  user: User | null;
  onOpenComments: (item: ContentItem) => void;
}

const Hero: React.FC<HeroProps> = ({ item, user, onOpenComments }) => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 sm:pt-32 pb-4 sm:pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto group">
        <div className="relative rounded-[2rem] sm:rounded-[4rem] overflow-hidden aspect-[3/4] sm:aspect-[21/9] min-h-[500px] sm:min-h-[500px] shadow-4xl transition-all duration-1000 border border-white/10 animate-in fade-in duration-1000">
          <img 
            src={item.thumbnail} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[2000ms] filter saturate-[1.2] brightness-[0.7] sm:brightness-[0.8]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 p-6 sm:p-24 flex flex-col justify-end">
            <div className="max-w-4xl space-y-4 sm:space-y-8 animate-in slide-in-from-bottom-10 duration-1000 ease-out">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 bg-cyan-500 text-black px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
                  <Target size={12} fill="currentColor" /> PRIME TRANSMISSION
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/40 backdrop-blur-3xl rounded-xl sm:rounded-2xl border border-white/10 text-white/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mono">
                  <Clock size={12} /> {item.date}
                </div>
              </div>
              
              <h1 className="text-3xl sm:text-6xl md:text-8xl font-black text-white leading-tight sm:leading-[0.9] tracking-tighter text-glow cursor-pointer" onClick={() => navigate(`/post/${item.id}`)}>
                {item.title}
              </h1>
              
              <p className="text-white/70 text-sm sm:text-xl md:text-2xl font-medium leading-relaxed max-w-3xl opacity-90 line-clamp-3">
                {item.excerpt}
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 pt-4 sm:pt-6">
                <div className="flex items-center justify-between sm:justify-start gap-6 px-6 sm:px-8 py-4 hyper-glass rounded-2xl sm:rounded-3xl border border-white/10">
                  <PostActions item={item} user={user} onOpenComments={onOpenComments} variant="large" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
