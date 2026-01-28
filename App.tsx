
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import OrbitFeed from './components/OrbitFeed';
import MobileFeed from './components/MobileFeed';
import CreatePost from './components/CreatePost';
import CommentPanel from './components/CommentPanel';
import MessagingPanel from './components/MessagingPanel';
import MessagingPage from './components/MessagingPage';
import SearchPanel from './components/SearchPanel';
import UploadToast from './components/UploadToast';
import ContentDetail from './components/ContentDetail';
import ProfilePage from './components/ProfilePage';
import BottomNav from './components/BottomNav';
import LoungeRoom from './components/LoungeRoom';
import { ContentItem } from './types';
import { subscribeToPosts, subscribeToAuthChanges, User } from './services/firebase';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#030303]">
      <div className="relative group">
        <div className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center rounded-full bg-white/5 border border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-[#007BFF] to-[#9B59B6] opacity-10 animate-pulse"></div>
           <div className="w-10 h-10 sm:w-14 sm:h-14 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <div className="mt-8 sm:mt-12 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <p className="text-[10px] font-black text-[#00FFFF] uppercase tracking-[0.8em] opacity-60">Neural Stream Sync</p>
        <div className="w-24 sm:w-32 h-[1px] bg-white/10 mx-auto mt-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-[#00FFFF] animate-[loading_2.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const Layout: React.FC<{ 
  user: User | null;
  items: ContentItem[];
  onOpenSearch: () => void;
  onOpenCreate: () => void;
  onOpenMessages: (initialMsg?: string) => void;
  setEditingItem: (item: ContentItem) => void;
  setCommentingItemId: (id: string) => void;
  isMobile: boolean;
}> = ({ user, items, onOpenSearch, onOpenCreate, onOpenMessages, setEditingItem, setCommentingItemId, isMobile }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen text-white font-inter bg-transparent relative flex flex-col overflow-hidden">
      <Header 
        user={user} 
        onOpenSearch={onOpenSearch}
        onOpenCreate={onOpenCreate}
        onOpenMessages={() => onOpenMessages()}
      />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            isMobile ? (
              <MobileFeed 
                items={items} 
                user={user} 
                onOpenComments={(item) => setCommentingItemId(item.id)}
                onOpenMessages={onOpenMessages}
              />
            ) : (
              <OrbitFeed items={items} />
            )
          } />
          <Route path="/post/:id" element={
            <ContentDetail 
              items={items} 
              user={user} 
              onEdit={(i) => { setEditingItem(i); onOpenCreate(); }} 
              onOpenComments={(item) => setCommentingItemId(item.id)}
              onStartMessage={(msg) => onOpenMessages(msg)}
            />
          } />
          <Route path="/messages/:id" element={<MessagingPage user={user} items={items} />} />
          <Route path="/lounge/:id" element={<LoungeRoom user={user} />} />
          <Route path="/profile/:uid" element={
            <ProfilePage 
              items={items} 
              currentUser={user}
              onEdit={(i) => { setEditingItem(i); onOpenCreate(); }}
              onOpenComments={(item) => setCommentingItemId(item.id)}
              onStartMessage={(msg) => onOpenMessages(msg)}
            />
          } />
        </Routes>
      </main>

      {isHomePage && (
        <BottomNav 
          onOpenCreate={onOpenCreate}
          onOpenSearch={onOpenSearch}
          onOpenMessages={() => onOpenMessages()}
          user={user}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | undefined>(undefined);
  const [commentingItemId, setCommentingItemId] = useState<string | undefined>(undefined);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [initialMessagingMsg, setInitialMessagingMsg] = useState<string | undefined>(undefined);

  const [uploadState, setUploadState] = useState<{
    progress: number;
    status: 'uploading' | 'saving' | 'success' | 'error' | 'idle' | 'analyzing';
    title: string;
  }>({
    progress: 0,
    status: 'idle',
    title: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    const unsubAuth = subscribeToAuthChanges(setUser);
    const unsubPosts = subscribeToPosts((updatedItems: ContentItem[]) => {
      setItems(updatedItems);
    });
    
    return () => { 
      window.removeEventListener('resize', handleResize);
      unsubAuth(); 
      unsubPosts(); 
    };
  }, []);

  const handleOpenMessages = (initialMsg?: string) => {
    setInitialMessagingMsg(initialMsg);
    setIsMessagingOpen(true);
  };

  return (
    <Router>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Layout 
        user={user} 
        items={items} 
        isMobile={isMobile}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreate={() => setIsPostModalOpen(true)}
        onOpenMessages={handleOpenMessages}
        setEditingItem={setEditingItem}
        setCommentingItemId={setCommentingItemId}
      />

      {isPostModalOpen && (
        <CreatePost 
          user={user}
          editItem={editingItem}
          onClose={() => { setIsPostModalOpen(false); setEditingItem(undefined); }} 
          onPost={(title, progress, status) => setUploadState({ title, progress, status })}
        />
      )}

      {isSearchOpen && (
        <SearchPanel 
          currentUser={user} 
          onClose={() => setIsSearchOpen(false)} 
          onStartMessage={(target, initialMsg) => handleOpenMessages(initialMsg)} 
        />
      )}

      {commentingItemId && (
        <CommentPanel 
          item={items.find(i => i.id === commentingItemId)!} 
          user={user} 
          onClose={() => setCommentingItemId(undefined)} 
        />
      )}

      {isMessagingOpen && (
        <MessagingPanel 
          user={user} 
          onClose={() => { setIsMessagingOpen(false); setInitialMessagingMsg(undefined); }} 
          onStartCall={() => {}}
          initialMessage={initialMessagingMsg}
        />
      )}

      <UploadToast progress={uploadState.progress} status={uploadState.status} title={uploadState.title} />
    </Router>
  );
};

export default App;
