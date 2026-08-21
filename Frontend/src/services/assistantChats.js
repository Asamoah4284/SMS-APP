import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_CHATS = 40;
const MAX_MESSAGES = 80;

function storageKey(studentId) {
  return `@edutrack_ai_chats_${studentId}`;
}

export function titleFromMessages(messages) {
  const first = (messages || []).find((m) => m.role === 'user' && String(m.content || '').trim());
  const text = String(first?.content || 'New chat').replace(/\s+/g, ' ').trim();
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function formatChatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function slimMessages(messages) {
  return (messages || []).slice(-MAX_MESSAGES).map((m) => ({
    id: String(m.id),
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || ''),
    imageUri: m.imageUri || null,
  }));
}

export async function loadAssistantStore(studentId) {
  if (!studentId) return { chats: [], activeId: null };
  try {
    const raw = await AsyncStorage.getItem(storageKey(studentId));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.chats)) return { chats: [], activeId: null };
    return {
      chats: parsed.chats,
      activeId: parsed.activeId || null,
    };
  } catch {
    return { chats: [], activeId: null };
  }
}

export async function saveAssistantStore(studentId, { chats, activeId }) {
  if (!studentId) return;
  const next = (chats || []).slice(0, MAX_CHATS).map((chat) => ({
    id: chat.id,
    title: chat.title || 'New chat',
    updatedAt: chat.updatedAt || Date.now(),
    messages: slimMessages(chat.messages),
  }));
  try {
    await AsyncStorage.setItem(
      storageKey(studentId),
      JSON.stringify({ chats: next, activeId: activeId || null }),
    );
  } catch {
    // Native storage can be unavailable (Expo Go vs mismatched native module).
    // Recents won't persist, but sending a message must not fail because of that.
  }
}
