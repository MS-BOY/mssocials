
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  increment, 
  arrayUnion, 
  arrayRemove, 
  Timestamp,
  where,
  limit
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { ContentItem, Comment, Message, Conversation, UserProfile, Group, ContentType } from "../types";
import { deleteFromCloudinary } from "./cloudinary";

// Re-export User type from Firebase to fix downstream module resolution errors
export type { User };

const firebaseConfig = {
  apiKey: "AIzaSyClsxAeIZncTep_kvfuNHITRJgkkTY_eTA",
  authDomain: "chat-39e15.firebaseapp.com",
  projectId: "chat-39e15",
  storageBucket: "chat-39e15.firebasestorage.app",
  messagingSenderId: "495144123310",
  appId: "1:495144123310:web:7441d446756a1e041ea63f",
  measurementId: "G-90YD86MZ2Y"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use extremely resilient settings for restricted networks
export const db = initializeFirestore(app as any, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const baseName = (result.user.displayName || "operator").toLowerCase().replace(/\s/g, '_');
      const randomSuffix = Math.random().toString(36).substring(2, 5);
      const username = `${baseName}_${randomSuffix}`;

      await setDoc(userRef, {
        uid: result.user.uid,
        displayName: result.user.displayName,
        username: username,
        photoURL: result.user.photoURL,
        email: result.user.email,
        followers: [],
        following: [],
        createdAt: Timestamp.now()
      });
    }
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback(snap.data() as UserProfile);
    else callback(null);
  });
};

export const sendMessage = async (convoId: string, senderId: string, text: string, imageUrl?: string) => {
  if (!convoId || !senderId) {
    throw new Error("Target node not identified. Sync required.");
  }

  try {
    const convoRef = doc(db, "conversations", convoId);
    const chatsRef = collection(db, "conversations", convoId, "chats");

    await setDoc(convoRef, {
      lastMessage: text || (imageUrl ? "Shared a visual packet" : "Signal detected"),
      lastUpdate: Timestamp.now(),
      participants: convoId.split('_') 
    }, { merge: true });

    await addDoc(chatsRef, {
      senderId,
      text: text || "",
      imageUrl: imageUrl || null,
      timestamp: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Failed to transmit message packet:", error);
    throw error;
  }
};

export const deleteMessage = async (convoId: string, messageId: string) => {
  try {
    const msgRef = doc(db, "conversations", convoId, "chats", messageId);
    await deleteDoc(msgRef);
    return true;
  } catch (err) {
    console.error("Signal dissolution failed:", err);
    throw err;
  }
};

export const updateMessage = async (convoId: string, messageId: string, newText: string) => {
  try {
    const msgRef = doc(db, "conversations", convoId, "chats", messageId);
    await updateDoc(msgRef, {
      text: newText,
      isEdited: true,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (err) {
    console.error("Signal modulation failed:", err);
    throw err;
  }
};

export const subscribeToMessages = (convoId: string, callback: (msgs: Message[]) => void) => {
  if (!convoId) return () => {};
  const q = query(
    collection(db, "conversations", convoId, "chats"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
    callback(msgs);
  }, (error) => {
    console.error("Messages subscription failed:", error);
  });
};

export const subscribeToConversations = (uid: string, callback: (convos: Conversation[]) => void) => {
  if (!uid) return () => {};
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid),
    orderBy("lastUpdate", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
    callback(convos);
  });
};

export const subscribeToConversation = (convoId: string, callback: (convo: Conversation | null) => void) => {
  if (!convoId) return () => {};
  return onSnapshot(doc(db, "conversations", convoId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Conversation);
    else callback(null);
  });
};

export const startConversation = async (currentUser: User, targetUser: { uid: string, name: string, avatar: string, username?: string }) => {
  if (!currentUser || !targetUser) return null;
  const convoId = [currentUser.uid, targetUser.uid].sort().join("_");
  const convoRef = doc(db, "conversations", convoId);
  
  await setDoc(convoRef, {
    participants: [currentUser.uid, targetUser.uid],
    participantNames: {
      [currentUser.uid]: currentUser.displayName || "Operator",
      [targetUser.uid]: targetUser.name
    },
    participantAvatars: {
      [currentUser.uid]: currentUser.photoURL || "",
      [targetUser.uid]: targetUser.avatar
    },
    participantUsernames: {
      [currentUser.uid]: currentUser.email?.split('@')[0] || "operator",
      [targetUser.uid]: targetUser.username || targetUser.name.toLowerCase().replace(/\s/g, '_')
    },
    lastUpdate: Timestamp.now()
  }, { merge: true });

  return convoId;
};

export const searchUsers = (searchTerm: string, callback: (users: UserProfile[], groups: Group[]) => void) => {
  if (!searchTerm.trim()) {
    callback([], []);
    return () => {};
  }
  const searchLower = searchTerm.toLowerCase();
  const qName = query(collection(db, "users"), where("displayName", ">=", searchTerm), where("displayName", "<=", searchTerm + '\uf8ff'), limit(10));
  const qUser = query(collection(db, "users"), where("username", ">=", searchLower), where("username", "<=", searchLower + '\uf8ff'), limit(10));
  const qGroupName = query(collection(db, "groups"), where("name", ">=", searchTerm), where("name", "<=", searchTerm + '\uf8ff'), limit(10));

  let resultsName: UserProfile[] = [];
  let resultsUser: UserProfile[] = [];
  let resultsGroupName: Group[] = [];

  const mergeAndCallback = () => {
    const usersCombined = [...resultsName, ...resultsUser];
    const usersUnique = usersCombined.reduce((acc: UserProfile[], curr) => {
      if (!acc.find(u => u.uid === curr.uid)) acc.push(curr);
      return acc;
    }, []);
    const groupsUnique = resultsGroupName.reduce((acc: Group[], curr) => {
      if (!acc.find(g => g.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
    callback(usersUnique, groupsUnique);
  };

  const unsubName = onSnapshot(qName, (snap) => { resultsName = snap.docs.map(d => d.data() as UserProfile); mergeAndCallback(); });
  const unsubUser = onSnapshot(qUser, (snap) => { resultsUser = snap.docs.map(d => d.data() as UserProfile); mergeAndCallback(); });
  const unsubGN = onSnapshot(qGroupName, (snap) => { resultsGroupName = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Group); mergeAndCallback(); });

  return () => { unsubName(); unsubUser(); unsubGN(); };
};

export const subscribeToPosts = (callback: (items: ContentItem[]) => void, groupId?: string) => {
  let q;
  if (groupId) {
    q = query(collection(db, "posts"), where("groupId", "==", groupId), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  }
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContentItem[];
    callback(items);
  }, (error) => {
    console.warn("Firestore subscription error (offline?):", error);
  });
};

export const savePost = async (post: any) => { return addDoc(collection(db, "posts"), { ...post, createdAt: Timestamp.now(), likes: 0, likedBy: [], comments: [] }); };
export const updatePost = async (id: string, updates: any) => { return updateDoc(doc(db, "posts", id), { ...updates, updatedAt: Timestamp.now() }); };

export const deletePost = async (id: string) => { 
  const postRef = doc(db, "posts", id);
  const snap = await getDoc(postRef);
  
  if (snap.exists()) {
    const data = snap.data() as ContentItem;
    if (data.mediaUrls && data.mediaUrls.length > 0) {
      for (const url of data.mediaUrls) {
        const type = url.includes('/video/upload/') ? 'video' : 'image';
        await deleteFromCloudinary(url, type);
      }
    } else if (data.thumbnail && !data.thumbnail.includes('dicebear.com') && !data.thumbnail.includes('unsplash.com')) {
      await deleteFromCloudinary(data.thumbnail, 'image');
    }
    
    if (data.videoUrl) {
      await deleteFromCloudinary(data.videoUrl, 'video');
    }
  }

  return deleteDoc(postRef); 
};

export const toggleLike = async (postId: string, userId: string, isLiked: boolean) => { return updateDoc(doc(db, "posts", postId), { likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId), likes: increment(isLiked ? -1 : 1) }); };
export const addCommentToPost = async (postId: string, comment: any) => { const postRef = doc(db, "posts", postId); const newComment = { ...comment, id: Math.random().toString(36).substr(2, 9), createdAt: Timestamp.now() }; return updateDoc(postRef, { comments: arrayUnion(newComment) }); };

export const deleteCommentFromPost = async (postId: string, commentId: string) => {
  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  const data = snap.data() as ContentItem;
  const updatedComments = (data.comments || []).filter(c => c.id !== commentId);
  return updateDoc(postRef, { comments: updatedComments });
};

export const updateCommentInPost = async (postId: string, commentId: string, newText: string) => {
  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  const data = snap.data() as ContentItem;
  const updatedComments = (data.comments || []).map(c => 
    c.id === commentId ? { ...c, text: newText, isEdited: true, updatedAt: Timestamp.now() } : c
  );
  return updateDoc(postRef, { comments: updatedComments });
};

export const toggleFollow = async (currentUid: string, targetUid: string, isFollowing: boolean) => { const currentUserRef = doc(db, "users", currentUid); const targetUserRef = doc(db, "users", targetUid); if (isFollowing) { await updateDoc(currentUserRef, { following: arrayRemove(targetUid) }); await updateDoc(targetUserRef, { followers: arrayRemove(currentUid) }); } else { await updateDoc(currentUserRef, { following: arrayUnion(targetUid) }); await updateDoc(targetUserRef, { followers: arrayUnion(currentUid) }); } };

export const createAIPost = async (user: User, postData: { title: string, description: string, category: string, imageUrl?: string }) => {
  const newPost = {
    title: postData.title,
    excerpt: postData.description,
    thumbnail: postData.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000',
    mediaUrls: postData.imageUrl ? [postData.imageUrl] : [],
    category: postData.category,
    author: {
      name: user.displayName || "Operator",
      avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      role: "AI Co-Operator",
      uid: user.uid,
      status: 'online'
    },
    date: new Date().toISOString(),
    type: postData.imageUrl ? ContentType.POST : ContentType.ARTICLE,
    createdAt: Timestamp.now(),
    likes: 0,
    likedBy: [],
    comments: [],
    moods: { fire: [], mindBlown: [], heart: [], ghost: [] },
    insights: { reach: 1, velocity: 1, shares: 0 }
  };
  return addDoc(collection(db, "posts"), newPost);
};

export const joinGroup = async (groupId: string, userId: string, pin: string) => {
  const groupRef = doc(db, "groups", groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) throw new Error("Group not found.");
  
  const data = snap.data() as Group;
  if (data.pin !== pin) throw new Error("Invalid access PIN.");
  
  await updateDoc(groupRef, {
    members: arrayUnion(userId)
  });
};

export const subscribeToGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const q = query(collection(db, "groups"), where("members", "array-contains", userId));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Group[];
    callback(groups);
  });
};

export const subscribeToGroupDetails = (groupId: string, callback: (group: Group | null) => void) => {
  return onSnapshot(doc(db, "groups", groupId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Group);
    else callback(null);
  });
};

export const createGroup = async (creatorId: string, groupData: Omit<Group, 'id' | 'createdAt' | 'members' | 'creatorId'>) => {
  const groupRef = await addDoc(collection(db, "groups"), {
    ...groupData,
    creatorId,
    members: [creatorId],
    createdAt: Timestamp.now()
  });
  return groupRef.id;
};
