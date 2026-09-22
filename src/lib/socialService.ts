import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseErrors';
import {
  Friend,
  FriendRequest,
  LobbyMessage,
  DirectChatMessage,
  DirectChatSummary,
  UserProfile,
  StampData,
  GroupChat,
  GroupChatMessage,
} from '../types';

// Deterministic chat ID between two users
export function getDirectChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

// Search users by gamer tag or display name
export async function searchUsers(searchTerm: string, currentUid?: string): Promise<UserProfile[]> {
  const clean = searchTerm.trim().toLowerCase();
  if (!clean) return [];

  const path = 'users';
  try {
    const q = query(collection(db, path), limit(25));
    const snapshot = await getDocs(q);
    const results: UserProfile[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;
      if (currentUid && uid === currentUid) return;

      const dName = (data.displayName || '').toLowerCase();
      const gTag = (data.gamerTag || '').toLowerCase();

      if (dName.includes(clean) || gTag.includes(clean) || uid.toLowerCase().includes(clean)) {
        results.push({
          uid,
          displayName: data.displayName || 'プレイヤー',
          gamerTag: data.gamerTag || `S-Player-${uid.slice(0, 5)}`,
          email: null, // isolate PII
          photoURL: data.photoURL || null,
          level: data.level || 1,
          xp: data.xp || 0,
          bio: data.bio || '',
        });
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Send a friend request
export async function sendFriendRequest(
  currentUser: { uid: string; displayName: string; gamerTag?: string; photoURL?: string },
  targetUser: { uid: string; displayName: string }
): Promise<void> {
  const requestId = `${currentUser.uid}_${targetUser.uid}`;
  const path = `friendRequests/${requestId}`;

  try {
    await setDoc(doc(db, 'friendRequests', requestId), {
      id: requestId,
      fromUid: currentUser.uid,
      fromName: currentUser.displayName,
      fromGamerTag: currentUser.gamerTag || '',
      fromPhotoURL: currentUser.photoURL || '',
      toUid: targetUser.uid,
      toName: targetUser.displayName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Accept friend request
export async function acceptFriendRequest(
  request: FriendRequest,
  currentUser: { uid: string; displayName: string; gamerTag?: string; photoURL?: string; level?: number }
): Promise<void> {
  const reqPath = `friendRequests/${request.id}`;
  try {
    // 1. Add to current user's friends
    const myFriendPath = `users/${currentUser.uid}/friends/${request.fromUid}`;
    await setDoc(doc(db, 'users', currentUser.uid, 'friends', request.fromUid), {
      friendUid: request.fromUid,
      displayName: request.fromName,
      gamerTag: request.fromGamerTag || '',
      photoURL: request.fromPhotoURL || '',
      level: 1,
      status: 'online',
      addedAt: new Date().toISOString(),
    });

    // 2. Add current user to friend's friends list
    const otherFriendPath = `users/${request.fromUid}/friends/${currentUser.uid}`;
    await setDoc(doc(db, 'users', request.fromUid, 'friends', currentUser.uid), {
      friendUid: currentUser.uid,
      displayName: currentUser.displayName,
      gamerTag: currentUser.gamerTag || '',
      photoURL: currentUser.photoURL || '',
      level: currentUser.level || 1,
      status: 'online',
      addedAt: new Date().toISOString(),
    });

    // 3. Delete or mark the friend request
    await deleteDoc(doc(db, 'friendRequests', request.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, reqPath);
  }
}

// Reject or cancel friend request
export async function rejectFriendRequest(requestId: string): Promise<void> {
  const path = `friendRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Remove friend
export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const path = `users/${myUid}/friends/${friendUid}`;
  try {
    await deleteDoc(doc(db, 'users', myUid, 'friends', friendUid));
    // Also remove mutual
    await deleteDoc(doc(db, 'users', friendUid, 'friends', myUid)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Send message in Global Lobby Chat (supports text, gameInvite, Daizu Stamp)
export async function sendLobbyMessage(
  user: { uid: string; displayName: string; gamerTag?: string; photoURL?: string },
  text: string,
  options?: {
    gameInvite?: { gameTitle: string; gameId: string; isCloudmoon?: boolean };
    stamp?: StampData;
  }
): Promise<void> {
  const msgId = `lobby_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `lobbyMessages/${msgId}`;

  const payload: LobbyMessage = {
    id: msgId,
    userId: user.uid,
    userName: user.displayName,
    userGamerTag: user.gamerTag || `S-Player-${user.uid.slice(0, 5)}`,
    userPhoto: user.photoURL || '',
    text: (text || '').trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  if (options?.gameInvite) {
    payload.gameInvite = options.gameInvite;
  }
  if (options?.stamp) {
    payload.stamp = options.stamp;
  }

  try {
    await setDoc(doc(db, 'lobbyMessages', msgId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete own lobby message
export async function deleteLobbyMessage(messageId: string): Promise<void> {
  const path = `lobbyMessages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'lobbyMessages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Send Direct Message (1-on-1 friend chat, supports text, Daizu Stamp)
export async function sendDirectMessage(
  chatId: string,
  sender: { uid: string; displayName: string; photoURL?: string },
  recipientUid: string,
  text: string,
  options?: {
    stamp?: StampData;
  }
): Promise<void> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const chatPath = `directChats/${chatId}`;
  const msgPath = `${chatPath}/messages/${msgId}`;

  const trimmed = (text || '').trim().slice(0, 1000);
  const nowISO = new Date().toISOString();

  const previewSummary = options?.stamp
    ? `[スタンプ: ${options.stamp.caption}]`
    : trimmed;

  try {
    // 1. Ensure chat thread parent document exists with participants
    await setDoc(
      doc(db, 'directChats', chatId),
      {
        id: chatId,
        participants: [sender.uid, recipientUid],
        lastMessage: previewSummary,
        lastMessageTime: nowISO,
        updatedAt: nowISO,
      },
      { merge: true }
    );

    // 2. Add message to subcollection
    const msgPayload: DirectChatMessage = {
      id: msgId,
      chatId,
      senderId: sender.uid,
      senderName: sender.displayName,
      senderPhoto: sender.photoURL || '',
      text: trimmed,
      createdAt: nowISO,
    };

    if (options?.stamp) {
      msgPayload.stamp = options.stamp;
    }

    await setDoc(doc(db, 'directChats', chatId, 'messages', msgId), msgPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

// ==========================================
// Group Messages & Group Chat (グループメッセージ)
// ==========================================

// Create a new Group Chat room
export async function createGroupChat(
  creator: { uid: string; displayName: string; photoURL?: string; gamerTag?: string },
  name: string,
  icon: string,
  friends: Array<{ uid: string; displayName: string; photoURL?: string; gamerTag?: string }>,
  description?: string
): Promise<string> {
  const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `groupChats/${groupId}`;
  const nowISO = new Date().toISOString();

  const allMembers = [creator, ...friends];
  const memberUids = allMembers.map((m) => m.uid);
  const memberNames: { [uid: string]: string } = {};
  const memberPhotos: { [uid: string]: string } = {};
  const memberGamerTags: { [uid: string]: string } = {};

  allMembers.forEach((m) => {
    memberNames[m.uid] = m.displayName;
    if (m.photoURL) memberPhotos[m.uid] = m.photoURL;
    if (m.gamerTag) memberGamerTags[m.uid] = m.gamerTag;
  });

  const groupData: GroupChat = {
    id: groupId,
    name: (name || '').trim() || 'ゲームグループ',
    icon: icon || '🎮',
    description: (description || '').trim() || '',
    createdBy: creator.uid,
    creatorName: creator.displayName,
    members: memberUids,
    memberNames,
    memberPhotos,
    memberGamerTags,
    lastMessage: 'グループが作成されました！🎉',
    lastMessageSenderName: creator.displayName,
    lastMessageTime: nowISO,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  try {
    await setDoc(doc(db, 'groupChats', groupId), groupData);

    // Initial welcome message in group
    const msgId = `msg_${Date.now()}_welcome`;
    await setDoc(doc(db, 'groupChats', groupId, 'messages', msgId), {
      id: msgId,
      groupId,
      senderId: creator.uid,
      senderName: creator.displayName,
      senderPhoto: creator.photoURL || '',
      senderGamerTag: creator.gamerTag || '',
      text: `${creator.displayName} がグループ「${groupData.name}」を作成しました！みんなで楽しくプレイ＆チャットしよう🎮✨`,
      createdAt: nowISO,
    });

    return groupId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// Send message in a Group Chat (supports text, Daizu Stamp)
export async function sendGroupMessage(
  groupId: string,
  sender: { uid: string; displayName: string; photoURL?: string; gamerTag?: string },
  text: string,
  options?: {
    stamp?: StampData;
  }
): Promise<void> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const groupPath = `groupChats/${groupId}`;
  const msgPath = `${groupPath}/messages/${msgId}`;

  const trimmed = (text || '').trim().slice(0, 1000);
  const nowISO = new Date().toISOString();
  const previewSummary = options?.stamp
    ? `[スタンプ: ${options.stamp.caption}]`
    : trimmed;

  try {
    // 1. Update parent group doc metadata
    await updateDoc(doc(db, 'groupChats', groupId), {
      lastMessage: previewSummary,
      lastMessageSenderName: sender.displayName,
      lastMessageTime: nowISO,
      updatedAt: nowISO,
    });

    // 2. Add message to group subcollection
    const msgPayload: GroupChatMessage = {
      id: msgId,
      groupId,
      senderId: sender.uid,
      senderName: sender.displayName,
      senderPhoto: sender.photoURL || '',
      senderGamerTag: sender.gamerTag || '',
      text: trimmed,
      createdAt: nowISO,
    };

    if (options?.stamp) {
      msgPayload.stamp = options.stamp;
    }

    await setDoc(doc(db, 'groupChats', groupId, 'messages', msgId), msgPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

// Add friends to existing group chat
export async function addGroupMembers(
  groupId: string,
  newMembers: Array<{ uid: string; displayName: string; photoURL?: string; gamerTag?: string }>,
  currentMembers?: string[],
  currentNames: { [uid: string]: string } = {},
  currentPhotos: { [uid: string]: string } = {},
  currentTags: { [uid: string]: string } = {}
): Promise<void> {
  const path = `groupChats/${groupId}`;
  let existingMembers = currentMembers;
  let existingNames = currentNames;
  let existingPhotos = currentPhotos;
  let existingTags = currentTags;

  if (!existingMembers || existingMembers.length === 0) {
    const snap = await getDoc(doc(db, 'groupChats', groupId));
    if (snap.exists()) {
      const data = snap.data();
      existingMembers = (data.members as string[]) || [];
      existingNames = (data.memberNames as Record<string, string>) || {};
      existingPhotos = (data.memberPhotos as Record<string, string>) || {};
      existingTags = (data.memberGamerTags as Record<string, string>) || {};
    } else {
      existingMembers = [];
    }
  }

  const updatedMembers = [...new Set([...existingMembers, ...newMembers.map((m) => m.uid)])];
  const updatedNames = { ...existingNames };
  const updatedPhotos = { ...existingPhotos };
  const updatedTags = { ...existingTags };

  newMembers.forEach((m) => {
    updatedNames[m.uid] = m.displayName;
    if (m.photoURL) updatedPhotos[m.uid] = m.photoURL;
    if (m.gamerTag) updatedTags[m.uid] = m.gamerTag;
  });

  try {
    await updateDoc(doc(db, 'groupChats', groupId), {
      members: updatedMembers,
      memberNames: updatedNames,
      memberPhotos: updatedPhotos,
      memberGamerTags: updatedTags,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Leave group chat
export async function leaveGroupChat(
  groupId: string,
  userUid: string,
  currentMembers?: string[]
): Promise<void> {
  const path = `groupChats/${groupId}`;
  let members = currentMembers;
  if (!members) {
    const snap = await getDoc(doc(db, 'groupChats', groupId));
    if (snap.exists()) {
      members = (snap.data().members as string[]) || [];
    } else {
      members = [];
    }
  }

  const remaining = members.filter((id) => id !== userUid);
  try {
    if (remaining.length === 0) {
      await deleteDoc(doc(db, 'groupChats', groupId));
    } else {
      await updateDoc(doc(db, 'groupChats', groupId), {
        members: remaining,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
