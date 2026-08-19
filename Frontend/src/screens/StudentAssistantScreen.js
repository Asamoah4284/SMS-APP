import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { colors } from '../theme';

const SUGGESTIONS = [
  'Help me study for my next exam',
  'Explain a concept from my class',
  'Quiz me on a topic',
  'How can I improve my grades?',
];

export default function StudentAssistantScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { student, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const flatListRef = useRef(null);

  const studentId = student?.studentId;
  const studentName = student?.firstName || 'there';

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
      mediaType: asset.mimeType || 'image/jpeg',
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

    try {
      const chatHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
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
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't process that right now. ${err.message || 'Please try again.'}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, studentId, token, pendingImage]);

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

  const showWelcome = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
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
            <Text style={styles.headerSub}>Powered by AI</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setMessages([])}
          hitSlop={10}
          style={styles.clearBtn}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.textMuted} />
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
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
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

      {/* Input bar */}
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
  clearBtn: { padding: 4 },

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
