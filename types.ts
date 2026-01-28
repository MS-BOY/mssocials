
export enum ContentType {
  NEWS = 'NEWS',
  ARTICLE = 'ARTICLE',
  POST = 'POST',
  VIDEO = 'VIDEO',
  STICKER = 'STICKER',
  VOICE = 'VOICE'
}

export interface Author {
  name: string;
  avatar: string;
  role: string;
  uid: string;
  username?: string;
  status?: 'online' | 'offline' | 'live';
}

export interface Group {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  avatar: string;
  pin: string; // 4-digit PIN
  members: string[]; // UIDs of members
  createdAt: any;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // UIDs of voters
}

export interface Moods {
  fire: string[];
  mindBlown: string[];
  heart: string[];
  ghost: string[];
}

export interface PostInsights {
  reach: number;
  velocity: number; // 0-100 score of how fast it's spreading
  shares: number;
}

export interface StickerOverlay {
  id: string;
  stickerUrl: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number;
  rotation: number;
}

export interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  mediaUrls?: string[];
  category: string;
  author: Author;
  date: string;
  // Added createdAt to fix NewsGrid.tsx error where it expects this property from Firestore documents
  createdAt?: any;
  type: ContentType;
  likes: number; 
  likedBy?: string[]; 
  comments: Comment[]; 
  videoUrl?: string;
  audioUrl?: string;
  tags?: string[];
  filter?: string; 
  overlayText?: string;
  overlays?: StickerOverlay[]; // Stickers placed on media
  aiHook?: string; 
  poll?: {
    question: string;
    options: PollOption[];
  };
  moods?: Moods;
  insights?: PostInsights;
  locationName?: string; 
  groupId?: string; 
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: any; 
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string; 
  timestamp: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantAvatars: { [key: string]: string };
  participantUsernames: { [key: string]: string };
  lastMessage: string;
  lastUpdate: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  email: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt: any;
}