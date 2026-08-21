import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { apiFetch } from '../config/api';
import {
  formatChatTime,
  loadAssistantStore,
  saveAssistantStore,
  titleFromMessages,
} from '../services/assistantChats';
import { colors } from '../theme';

const SUGGESTIONS = [
  'Help me study for my next exam',
  'Explain a concept from my class',
  'Quiz me on a topic',
  'How can I improve my grades?',
];

function whatsAppUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('0') && digits.length === 10
    ? `233${digits.slice(1)}`
    : digits.startsWith('233')
      ? digits
      : digits;
  return `https://wa.me/${intl}`;
}

function normalizeChatImageType(mediaType) {
  const raw = String(mediaType || '').toLowerCase();
  if (raw === 'image/jpg' || raw === 'image/pjpeg') return 'image/jpeg';
  if (raw.startsWith('image/')) return raw;
  return 'image/jpeg';
}

export default function StudentAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { student, token } = useAuth();
  const { school } = useSchool();
  const supportWhatsapp = school?.supportWhatsapp || '';
  const supportWhatsappUrl = whatsAppUrl(supportWhatsapp);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showRecents, setShowRecents] = useState(false);
  const flatListRef = useRef(null);
  const activeChatIdRef = useRef(null);

  const studentId = student?.studentId;
  const studentName = student?.firstName || 'there';

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await loadAssistantStore(studentId);
      if (cancelled) return;
      setChats(store.chats);
      const active = store.chats.find((c) => c.id === store.activeId);
      if (active?.messages?.length) {
        setActiveChatId(active.id);
        setMessages(active.messages);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const persistChat = useCallback(async (chatId, nextMessages) => {
    if (!studentId || !nextMessages.length) return chatId;
    const id = chatId || `chat_${Date.now()}`;
    const nextChat = {
      id,
      title: titleFromMessages(nextMessages),
      updatedAt: Date.now(),
      messages: nextMessages,
    };
    const store = await loadAssistantStore(studentId);
    const chatsNext = [nextChat, ...store.chats.filter((c) => c.id !== id)];
    await saveAssistantStore(studentId, { chats: chatsNext, activeId: id });
    setChats(chatsNext);
    setActiveChatId(id);
    return id;
  }, [studentId]);

  const startNewChat = useCallback(async () => {
    if (studentId) {
      const store = await loadAssistantStore(studentId);
      await saveAssistantStore(studentId, { chats: store.chats, activeId: null });
    }
    setActiveChatId(null);
    setMessages([]);
    setPendingImage(null);
    setInput('');
    setShowRecents(false);
  }, [studentId]);

  const openChat = useCallback(async (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
    setPendingImage(null);
    setInput('');
    setShowRecents(false);
    if (studentId) {
      await saveAssistantStore(studentId, { chats, activeId: chat.id });
    }
  }, [studentId, chats]);

  const deleteChat = useCallback((chat) => {
    Alert.alert('Delete chat?', 'This conversation will be removed from Recents.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = chats.filter((c) => c.id !== chat.id);
          const nextActive = activeChatId === chat.id ? null : activeChatId;
          setChats(next);
          if (activeChatId === chat.id) {
            setActiveChatId(null);
            setMessages([]);
          }
          if (studentId) {
            await saveAssistantStore(studentId, { chats: next, activeId: nextActive });
          }
        },
      },
    ]);
  }, [chats, activeChatId, studentId]);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    setPendingImage({
      uri: asset.uri,
      base64,
      mediaType: normalizeChatImageType(asset.mimeType),
    });
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if ((!trimmed && !pendingImage) || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed || 'Please help me understand the attached question.',
      imageUri: pendingImage?.uri || null,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const sentImage = pendingImage;
    setPendingImage(null);
    setLoading(true);

    let chatId = activeChatIdRef.current;
    try {
      try {
        chatId = await persistChat(chatId, newMessages);
      } catch {
        chatId = chatId || `chat_${Date.now()}`;
      }
      const chatHistory = newMessages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));
      const data = await apiFetch('/portal/ai/chat', token, {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          messages: chatHistory,
          images: sentImage
            ? [{ mediaType: sentImage.mediaType, base64: sentImage.base64 }]
            : [],
        }),
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
      };
      const withReply = [...newMessages, botMsg];
      setMessages(withReply);
      await persistChat(chatId, withReply);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        content: `Sorry, I couldn't process that right now. ${err.message || 'Please try again.'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, studentId, token, pendingImage, persistChat]);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot-outline" size={16} color={colors.white} />
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.botContent]}>
          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.messageImage} /> : null}
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>{item.content}</Text>
          ) : (
            <RichText content={item.content} />
          )}
        </View>
      </View>
    );
  }, []);

  const renderRecent = useCallback(({ item }) => {
    const preview = [...(item.messages || [])].reverse().find((m) => m.content)?.content || 'No messages yet';
    const isActive = item.id === activeChatId;
    return (
      <Pressable
        onPress={() => openChat(item)}
        onLongPress={() => deleteChat(item)}
        style={({ pressed }) => [
          styles.recentRow,
          isActive && styles.recentRowActive,
          pressed && styles.suggestionPressed,
        ]}
      >
        <View style={styles.recentIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.brandNavy} />
        </View>
        <View style={styles.recentBody}>
          <View style={styles.recentTop}>
            <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.recentTime}>{formatChatTime(item.updatedAt)}</Text>
          </View>
          <Text style={styles.recentPreview} numberOfLines={1}>{preview}</Text>
        </View>
        <Pressable onPress={() => deleteChat(item)} hitSlop={10} style={styles.recentDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.textSoft} />
        </Pressable>
      </Pressable>
    );
  }, [activeChatId, openChat, deleteChat]);

  const showWelcome = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="robot-outline" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Study Assistant</Text>
            <Text style={styles.headerSub}>
              {activeChatId ? 'Continuing a chat' : 'Powered by AI'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowRecents(true)}
          hitSlop={10}
          style={styles.recentsBtn}
        >
          <Ionicons name="time-outline" size={22} color={colors.brandNavy} />
          <Text style={styles.recentsBtnLabel}>Recents</Text>
        </Pressable>
      </View>

      {showWelcome ? (
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIconWrap}>
            <MaterialCommunityIcons name="robot-happy-outline" size={48} color={colors.brandNavy} />
          </View>
          <Text style={styles.welcomeTitle}>Hi {studentName}!</Text>
          <Text style={styles.welcomeText}>
            I'm your study assistant. I can help you understand concepts, quiz you on topics, and guide you through problems. I won't solve your homework for you, but I'll help you learn how to solve it yourself!
          </Text>
          <Text style={styles.suggestLabel}>Try asking:</Text>
          <View style={styles.suggestionsWrap}>
            {SUGGESTIONS.map((s, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionPressed]}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brandNavy} />
              </Pressable>
            ))}
          </View>
          {supportWhatsappUrl ? (
            <Pressable
              onPress={() => Linking.openURL(supportWhatsappUrl)}
              style={({ pressed }) => [styles.supportBtn, pressed && styles.suggestionPressed]}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#128C7E" />
              <Text style={styles.supportBtnText}>Need a human? WhatsApp support</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.chatList, { paddingBottom: 12 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot-outline" size={14} color={colors.white} />
          </View>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={colors.brandNavy} />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        </View>
      )}

      {pendingImage ? (
        <View style={styles.pendingWrap}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingImage} />
          <Pressable onPress={() => setPendingImage(null)} style={styles.removeImageBtn}>
            <Ionicons name="close" size={16} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable
          onPress={pickImage}
          disabled={loading}
          style={({ pressed }) => [styles.attachBtn, pressed && styles.attachBtnPressed]}
        >
          <Ionicons name="image-outline" size={20} color={colors.brandNavy} />
        </Pressable>
        <TextInput
          style={styles.textInput}
          placeholder="Ask me anything about your studies..."
          placeholderTextColor={colors.textSoft}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          editable={!loading}
          onSubmitEditing={() => sendMessage()}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={() => sendMessage()}
          disabled={(!input.trim() && !pendingImage) || loading}
          style={({ pressed }) => [
            styles.sendBtn,
            ((!input.trim() && !pendingImage) || loading) && styles.sendBtnDisabled,
            pressed && styles.sendBtnPressed,
          ]}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>

      <Modal
        visible={showRecents}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecents(false)}
      >
        <View style={[styles.recentsPage, { paddingTop: Platform.OS === 'ios' ? 12 : insets.top }]}>
          <View style={styles.recentsHeader}>
            <Pressable onPress={() => setShowRecents(false)} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.recentsTitle}>Recents</Text>
            <Pressable onPress={startNewChat} hitSlop={10} style={styles.newChatBtn}>
              <Ionicons name="create-outline" size={18} color={colors.brandNavy} />
              <Text style={styles.newChatBtnText}>New</Text>
            </Pressable>
          </View>
          {chats.length === 0 ? (
            <View style={styles.recentsEmpty}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textSoft} />
              <Text style={styles.recentsEmptyTitle}>No chats yet</Text>
              <Text style={styles.recentsEmptyText}>
                Start a conversation and it will show up here so you can pick it up later.
              </Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              renderItem={renderRecent}
              contentContainerStyle={styles.recentsList}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function RichText({ content }) {
  const text = String(content || '');
  const blocks = text.split(/(\$\$[\s\S]*?\$\$)/g).filter(Boolean);
  return (
    <View>
      {blocks.map((block, i) => {
        if (/^\$\$[\s\S]*\$\$$/.test(block)) {
          return (
            <View key={`m-${i}`} style={styles.mathBlock}>
              <Text style={[styles.richText, styles.mathText]}>
                {block.replace(/^\$\$|\$\$$/g, '').trim()}
              </Text>
            </View>
          );
        }
        return (
          <Text key={`t-${i}`} style={styles.richText}>
            {renderInline(block)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(text) {
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$\n]+\$)/g).filter(Boolean);
  return parts.map((part, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <Text key={idx} style={styles.richBold}>{part.slice(2, -2)}</Text>;
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <Text key={idx} style={styles.richItalic}>{part.slice(1, -1)}</Text>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return <Text key={idx} style={styles.richCode}>{part.slice(1, -1)}</Text>;
    }
    if (/^\$[^$\n]+\$$/.test(part)) {
      return <Text key={idx} style={[styles.richCode, styles.mathText]}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={idx}>{part}</Text>;
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 11, color: colors.textMuted },
  recentsBtn: { alignItems: 'center', paddingHorizontal: 4 },
  recentsBtnLabel: { fontSize: 10, fontWeight: '600', color: colors.brandNavy, marginTop: 1 },

  welcomeContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  welcomeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  welcomeText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestLabel: { fontSize: 13, fontWeight: '600', color: colors.textSoft, marginBottom: 10 },
  suggestionsWrap: { width: '100%', gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandNavyMuted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  suggestionPressed: { opacity: 0.85 },
  suggestionText: { fontSize: 14, color: colors.brandNavy, fontWeight: '500', flex: 1, marginRight: 8 },
  supportBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  supportBtnText: { fontSize: 13, fontWeight: '600', color: '#128C7E' },

  chatList: { paddingHorizontal: 16, paddingTop: 12 },
  messageBubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  botBubble: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubbleContent: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  userContent: {
    backgroundColor: colors.brandNavy,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  botContent: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20, color: colors.text },
  userMessageText: { color: colors.white },

  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  typingText: { fontSize: 13, color: colors.textMuted },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { opacity: 0.8 },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachBtnPressed: { opacity: 0.8 },
  pendingWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.white,
  },
  pendingImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    left: 84,
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  messageImage: {
    width: 180,
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.borderLight,
  },
  recentsPage: { flex: 1, backgroundColor: colors.bg },
  recentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentsTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandNavyMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newChatBtnText: { fontSize: 13, fontWeight: '700', color: colors.brandNavy },
  recentsList: { paddingVertical: 8 },
  recentsEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  recentsEmptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  recentsEmptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  recentRowActive: { backgroundColor: colors.brandNavyMuted },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBody: { flex: 1 },
  recentTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  recentTime: { fontSize: 11, color: colors.textSoft },
  recentPreview: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recentDelete: { padding: 4 },
  richText: { fontSize: 14, lineHeight: 20, color: colors.text },
  richBold: { fontWeight: '700' },
  richItalic: { fontStyle: 'italic' },
  richCode: {
    backgroundColor: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  mathBlock: {
    backgroundColor: '#E8EEF9',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  mathText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.brandNavy,
  },
});
