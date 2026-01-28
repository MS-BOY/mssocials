
import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User as UserType } from "../services/firebase";
import { loginWithGoogle } from '../services/firebase';

interface HeaderProps {
  user: UserType | null;
  onOpenSearch: () => void;
  onOpenCreate: () => void;
  onOpenMessages: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenSearch }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-[150] bg-black/20 backdrop-blur-3xl h-[80px] sm:h-[100px] flex items-center border-b border-white/10">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 flex items-center justify-between">
        <div className="flex flex-col cursor-pointer group" onClick={() => navigate('/')}>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter leading-none uppercase group-hover:text-[#00FFFF] transition-colors">
            MS SOCIAL
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="w-6 sm:w-10 h-[2px] bg-[#00FFFF] opacity-60"></span>
            <span className="text-[8px] sm:text-[9px] font-black text-[#9B59B6] uppercase tracking-[0.5em]">NEURAL STREAM</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={onOpenSearch}
            className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-white/40 hover:text-[#00FFFF] transition-all ms-glass rounded-2xl border-white/5"
            aria-label="Search"
          >
            <Search size={24} />
          </button>
          
          {!user ? (
            <button 
              onClick={() => loginWithGoogle()}
              className="h-12 sm:h-16 px-8 sm:px-12 bg-white text-black text-[11px] sm:text-xs font-black uppercase tracking-[0.4em] rounded-2xl sm:rounded-3xl hover:bg-[#00FFFF] transition-all active:scale-95 shadow-2xl"
            >
              SYNC
            </button>
          ) : (
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/10 p-1 cursor-pointer bg-black"
              onClick={() => navigate(`/profile/${user.uid}`)}
            >
              <img src={user.photoURL || ""} className="w-full h-full object-cover rounded-xl" alt="User Profile" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
