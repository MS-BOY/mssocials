
import { ContentItem, Comment, Message, Conversation } from "../types";

/**
 * PROJECT CONFIGURATION
 */
const PROJECT_ID = "6975e0641196e915035516e5";

/**
 * MOCK MONGODB DRIVER FOR FRONTEND
 * Mimics MongoDB Collections and real-time listeners, scoped by Project ID.
 */

type Listener = (data: any) => void;

class MongoCollection {
  private name: string;
  private listeners: Set<Listener> = new Set();
  private storageKey: string;

  constructor(name: string) {
    this.name = name;
    this.storageKey = `prism_db_${PROJECT_ID}_${this.name}`;
    
    // Listen for storage changes across tabs for real-time multi-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.notify();
      }
    });
  }

  private getData(): any[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  private saveData(data: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.notify();
  }

  private notify() {
    const data = this.getData();
    this.listeners.forEach(cb => cb(data));
  }

  async find(query: any = {}) {
    let data = this.getData();
    // Basic filter implementation
    if (query.participants) {
      data = data.filter(d => query.participants.$all ? query.participants.$all.every((p: string) => d.participants?.includes(p)) : d.participants?.includes(query.participants));
    }
    if (query.uid) {
      data = data.filter(d => d.author?.uid === query.uid);
    }
    return data.sort((a, b) => new Date(b.createdAt || b.lastUpdate).getTime() - new Date(a.createdAt || a.lastUpdate).getTime());
  }

  async findOne(query: any) {
    const data = await this.find(query);
    return data[0] || null;
  }

  async insertOne(doc: any) {
    const data = this.getData();
    const newDoc = { 
      ...doc, 
      _id: Math.random().toString(36).substring(2, 15),
      id: Math.random().toString(36).substring(2, 15), // for compatibility
      createdAt: new Date().toISOString(),
      projectId: PROJECT_ID
    };
    data.push(newDoc);
    this.saveData(data);
    return newDoc;
  }

  async updateOne(id: string, updates: any) {
    const data = this.getData();
    const index = data.findIndex(d => d._id === id || d.id === id);
    if (index !== -1) {
      // Handle MongoDB-like operators
      if (updates.$push) {
        const key = Object.keys(updates.$push)[0];
        data[index][key] = [...(data[index][key] || []), updates.$push[key]];
      } else if (updates.$pull) {
        const key = Object.keys(updates.$pull)[0];
        data[index][key] = (data[index][key] || []).filter((v: any) => v !== updates.$pull[key] && v.id !== updates.$pull[key]);
      } else if (updates.$inc) {
        const key = Object.keys(updates.$inc)[0];
        data[index][key] = (data[index][key] || 0) + updates.$inc[key];
      } else {
        data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      }
      this.saveData(data);
    }
  }

  async deleteOne(id: string) {
    const data = this.getData().filter(d => d._id !== id && d.id !== id);
    this.saveData(data);
  }

  onSnapshot(callback: Listener, queryFilter?: any) {
    const wrapper = async () => {
      const data = await this.find(queryFilter);
      callback(data);
    };
    this.listeners.add(wrapper);
    wrapper(); // Initial call
    return () => this.listeners.delete(wrapper);
  }
}

export const db = {
  posts: new MongoCollection('posts'),
  conversations: new MongoCollection('conversations'),
  users: new MongoCollection('users'),
};

/**
 * AUTH SYSTEM REPLACEMENT
 */
export interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

const USER_STORAGE_KEY = `prism_user_${PROJECT_ID}`;
let currentUser: User | null = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
const authListeners = new Set<(user: User | null) => void>();

export const loginWithGoogle = async () => {
  // Simulate Google OAuth
  const mockUser: User = {
    uid: "user_" + Math.random().toString(36).substring(2, 9),
    displayName: "Operator_" + Math.random().toString(36).substring(2, 5).toUpperCase(),
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    email: "operator@prism.network"
  };
  currentUser = mockUser;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
  authListeners.forEach(cb => cb(currentUser));
  return mockUser;
};

export const logout = () => {
  currentUser = null;
  localStorage.removeItem(USER_STORAGE_KEY);
  authListeners.forEach(cb => cb(null));
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  authListeners.add(callback);
  callback(currentUser);
  return () => authListeners.delete(callback);
};

// COMPATIBILITY WRAPPERS
export const subscribeToPosts = (callback: (items: ContentItem[]) => void) => {
  return db.posts.onSnapshot(callback);
};

export const savePost = async (post: any) => {
  return db.posts.insertOne(post);
};

export const updatePost = async (id: string, updates: any) => {
  return db.posts.updateOne(id, updates);
};

export const deletePost = async (id: string) => {
  return db.posts.deleteOne(id);
};

export const toggleLike = async (postId: string, userId: string, isLiked: boolean) => {
  return db.posts.updateOne(postId, {
    [isLiked ? '$pull' : '$push']: { likedBy: userId },
    ['$inc']: { likes: isLiked ? -1 : 1 }
  });
};

export const addCommentToPost = async (postId: string, comment: any) => {
  const newComment = {
    ...comment,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString()
  };
  return db.posts.updateOne(postId, {
    ['$push']: { comments: newComment }
  });
};

export const startConversation = async (currentUser: User, targetUser: { uid: string, name: string, avatar: string }) => {
  const convoId = [currentUser.uid, targetUser.uid].sort().join("_");
  const existing = await db.conversations.findOne({ _id: convoId });
  
  if (!existing) {
    await db.conversations.insertOne({
      _id: convoId,
      id: convoId,
      participants: [currentUser.uid, targetUser.uid],
      participantNames: {
        [currentUser.uid]: currentUser.displayName || "Operator",
        [targetUser.uid]: targetUser.name
      },
      participantAvatars: {
        [currentUser.uid]: currentUser.photoURL || "",
        [targetUser.uid]: targetUser.avatar
      },
      lastUpdate: new Date().toISOString()
    });
  }
  return convoId;
};

export const sendMessage = async (convoId: string, senderId: string, text: string) => {
  const messageCollection = new MongoCollection(`chat_${convoId}`);
  await messageCollection.insertOne({ senderId, text, timestamp: new Date().toISOString() });
  await db.conversations.updateOne(convoId, {
    lastMessage: text,
    lastUpdate: new Date().toISOString()
  });
};

export const subscribeToConversations = (uid: string, callback: (convos: Conversation[]) => void) => {
  return db.conversations.onSnapshot(callback, { participants: uid });
};

export const subscribeToMessages = (convoId: string, callback: (msgs: Message[]) => void) => {
  const messageCollection = new MongoCollection(`chat_${convoId}`);
  return messageCollection.onSnapshot(callback);
};
