
import React from 'react';
import { Home, LayoutGrid, Plus, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User as UserType } from "../services/firebase";

interface BottomNavProps {
  onOpenCreate: () => void;
  onOpenSearch: () => void;
  onOpenMessages: () => void;
  user: UserType | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ onOpenCreate, onOpenSearch, onOpenMessages, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isProfile = location.pathname.startsWith('/profile');

  return (
    <div className="fixed bottom-8 sm:bottom-12 left-0 right-0 z-[200] px-6 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-lg sm:w-auto pointer-events-auto">
        {/* Foundation Glow */}
        <div className="absolute inset-x-12 bottom-0 h-10 bg-[#00FFFF]/10 blur-3xl opacity-30 rounded-full pointer-events-none"></div>
        
        <nav className="ms-glass rounded-[3rem] sm:rounded-[4rem] p-3 flex items-center justify-between sm:justify-center gap-4 sm:gap-10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10 group backdrop-blur-[60px] w-full sm:min-w-[480px]">
          
          <button 
            onClick={() => navigate('/')}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isHome ? 'bg-[#00FFFF]/10 text-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'text-white/20 hover:text-white/50'}`}
          >
            <Home size={26} strokeWidth={isHome ? 3 : 2} />
          </button>

          <button 
            onClick={onOpenSearch}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-white/20 hover:text-white/50 transition-all duration-500 hover:bg-white/5 flex items-center justify-center"
          >
            <LayoutGrid size={26} />
          </button>

          {/* Central Neural Injector Orb - Precise match to screenshot */}
          <div className="relative flex flex-col items-center flex-shrink-0 -mt-6">
            <div className="absolute inset-0 bg-[#00FFFF] blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <button 
              onClick={onOpenCreate}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ms-glass border-2 border-[#00FFFF]/30 flex items-center justify-center text-white shadow-4xl transition-all duration-700 hover:scale-110 active:scale-90 group/orb relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFFF]/20 to-transparent"></div>
              <Plus size={40} strokeWidth={4} className="relative z-10 group-hover/orb:rotate-90 transition-transform duration-500" />
              
              {/* Dynamic HUD Borders */}
              <div className="absolute inset-1 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]"></div>
              <div className="absolute inset-3 rounded-full border border-[#00FFFF]/20 animate-[spin_8s_linear_infinite_reverse]"></div>
            </button>
          </div>

          <button 
            onClick={onOpenMessages}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-white/20 hover:text-white/50 transition-all duration-500 hover:bg-white/5 flex items-center justify-center"
          >
            <MessageCircle size={26} />
          </button>

          <button 
            onClick={() => user ? navigate(`/profile/${user.uid}`) : navigate('/')}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all duration-500 p-1 flex items-center justify-center ${isProfile ? 'border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.3)]' : 'border-white/10 hover:border-white/20'}`}
          >
            <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
              {user ? (
                <img src={user.photoURL || ""} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={24} className="text-white/20" />
              )}
            </div>
          </button>

        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
