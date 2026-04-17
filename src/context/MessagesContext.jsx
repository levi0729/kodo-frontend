import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { chat as chatApi, files as filesApi, channels as channelsApi, conversations as conversationsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';

const MessagesContext = createContext(null);

const POLL_INTERVAL = 3000; // 3 seconds
const DM_ROOM_MULTIPLIER = 1_000_000_000; // Must match backend constant

export function MessagesProvider({ children }) {
  const { isLoggedIn, currentUser } = useAuth();
  const { t } = useTheme();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [groupConversations, setGroupConversations] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Polling ref
  const pollRef = useRef(null);
  const lastMessageIdRef = useRef(0);

  // ── Conversations ──────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    setConversationsLoading(true);
    try {
      const data = await chatApi.conversations();
      setConversations(data.conversations || []);
    } catch (err) {
      // Silent fail - conversations will just be empty
    } finally {
      setConversationsLoading(false);
    }
  }, [isLoggedIn]);

  const fetchGroupConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await conversationsApi.list();
      setGroupConversations(data.conversations || []);
    } catch { /* silent */ }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) { fetchConversations(); fetchGroupConversations(); }
    else { setConversations([]); setGroupConversations([]); }
  }, [isLoggedIn]);

  // ── Messages for active room ────────────────────────────

  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    setMessagesLoading(true);
    try {
      const data = await chatApi.messages(roomId);
      const msgs = (data.messages || []).reverse(); // API returns newest first
      setMessages(msgs);
      lastMessageIdRef.current = msgs.length > 0 ? Math.max(...msgs.map(m => m.id)) : 0;
    } catch (err) {
      toast.error(t.chatErrors.loadFailed);
    } finally {
      setMessagesLoading(false);
    }
  }, [toast, t]);

  const openRoom = useCallback((roomId) => {
    setMessages([]);
    lastMessageIdRef.current = 0;
    setActiveRoomId(roomId);
    setActiveConversationId(null);
    fetchMessages(roomId);
  }, [fetchMessages]);

  const openDM = useCallback((otherUserId) => {
    if (!currentUser) return;
    const roomId = Math.min(currentUser.id, otherUserId) * DM_ROOM_MULTIPLIER + Math.max(currentUser.id, otherUserId);
    openRoom(roomId);
    return roomId;
  }, [currentUser, openRoom]);

  const openTeamRoom = useCallback((teamId) => {
    setActiveChannelId(null);
    openRoom(teamId); // Team room_id = team_id
    return teamId;
  }, [openRoom]);

  const openChannel = useCallback(async (channelId) => {
    setActiveChannelId(channelId);
    setActiveRoomId(null);
    setMessages([]);
    setMessagesLoading(true);
    // Stop room polling
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      const data = await channelsApi.messages(channelId, { per_page: 50 });
      const msgs = data.messages?.data || data.messages || [];
      // API returns newest first, reverse for chronological display
      setMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);
    } catch (err) {
      toast.error(t.chatErrors.loadFailed);
    } finally {
      setMessagesLoading(false);
    }
  }, [toast, t]);

  const sendChannelMessage = useCallback(async (channelId, content) => {
    try {
      const data = await channelsApi.sendMessage(channelId, { content, content_type: 'text' });
      const msg = data.message;
      if (msg) {
        // Normalize to same shape as chat messages
        const normalized = {
          ...msg,
          message: msg.content,
          content: msg.content,
          reactions: msg.reactions || [],
          attachments: msg.attachments || [],
        };
        setMessages(prev => [...prev, normalized]);
      }
      return msg;
    } catch (err) {
      toast.error(t.chatErrors.sendFailed + ': ' + err.message);
      throw err;
    }
  }, [toast, t]);

  // ── Group conversations ────────────────────────────────

  const openConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId);
    setActiveChannelId(null);
    setActiveRoomId(null);
    setMessages([]);
    setMessagesLoading(true);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      const data = await conversationsApi.messages(conversationId, { per_page: 50 });
      const msgs = data.messages?.data || data.messages || [];
      setMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);
    } catch (err) {
      toast.error(t.chatErrors.loadFailed);
    } finally {
      setMessagesLoading(false);
    }
  }, [toast, t]);

  const sendConversationMessage = useCallback(async (conversationId, content) => {
    try {
      const data = await conversationsApi.sendMessage(conversationId, content);
      const msg = data.message;
      if (msg) {
        const normalized = {
          ...msg,
          message: msg.content,
          content: msg.content,
          reactions: msg.reactions || [],
          attachments: msg.attachments || [],
        };
        setMessages(prev => [...prev, normalized]);
      }
      return msg;
    } catch (err) {
      toast.error(t.chatErrors.sendFailed + ': ' + err.message);
      throw err;
    }
  }, [toast, t]);

  const createGroupConversation = useCallback(async (name, userIds) => {
    try {
      const data = await conversationsApi.create({ name, user_ids: userIds });
      await fetchGroupConversations();
      return data.conversation;
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
      throw err;
    }
  }, [toast, fetchGroupConversations]);

  // ── Polling for new messages (pauses when tab is hidden) ─

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeRoomId || !isLoggedIn) return;

    pollRef.current = setInterval(async () => {
      try {
        const data = await chatApi.poll(activeRoomId, lastMessageIdRef.current);
        const newMsgs = data.messages || [];
        if (newMsgs.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const unique = newMsgs.filter(m => !existingIds.has(m.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
          lastMessageIdRef.current = Math.max(...newMsgs.map(m => m.id));
          chatApi.markAsRead(activeRoomId).catch(() => {});
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL);
  }, [activeRoomId, isLoggedIn]);

  useEffect(() => {
    startPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [startPolling]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollRef.current) clearInterval(pollRef.current);
      } else {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [startPolling]);

  // ── Send message ────────────────────────────────────────

  // Upload files in parallel, return their metadata for the send endpoint.
  const uploadAttachmentFiles = useCallback(async (files) => {
    if (!files?.length) return [];
    const results = await Promise.all(files.map(f => filesApi.upload(f).then(r => r.file)));
    return results.map(f => ({
      file_name: f.file_name,
      file_type: f.file_type,
      file_size: f.file_size,
      file_url:  f.file_url,
      width:     f.width,
      height:    f.height,
    }));
  }, []);

  const sendMessage = useCallback(async (receiverId, messageText, files = []) => {
    try {
      const attachments = await uploadAttachmentFiles(files);
      const data = await chatApi.sendWithAttachments({ receiverId, message: messageText, attachments });
      const msg = data.message;
      setMessages(prev => [...prev, msg]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, msg.id);
      fetchConversations();
      return msg;
    } catch (err) {
      toast.error(t.chatErrors.sendFailed + ': ' + err.message);
      throw err;
    }
  }, [toast, t, fetchConversations, uploadAttachmentFiles]);

  const sendTeamMessage = useCallback(async (teamId, messageText, files = []) => {
    try {
      const attachments = await uploadAttachmentFiles(files);
      const data = await chatApi.sendWithAttachments({ teamId, message: messageText, attachments });
      const msg = data.message;
      setMessages(prev => [...prev, msg]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, msg.id);
      return msg;
    } catch (err) {
      toast.error(t.chatErrors.sendFailed + ': ' + err.message);
      throw err;
    }
  }, [toast, t, uploadAttachmentFiles]);

  // ── Reactions ───────────────────────────────────────────

  const toggleReaction = useCallback(async (messageId, emoji) => {
    try {
      const data = await chatApi.toggleReaction(messageId, emoji);
      const updated = data.message;
      if (updated) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updated.reactions } : m));
      }
    } catch (err) {
      toast.error(t.chatErrors.reactFailed);
    }
  }, [toast, t]);

  // ── Mark as read ────────────────────────────────────────

  const markAsRead = useCallback(async (roomId) => {
    try {
      await chatApi.markAsRead(roomId);
      setConversations(prev =>
        prev.map(c => c.room_id === roomId ? { ...c, unread_count: 0 } : c)
      );
    } catch { /* silent */ }
  }, []);

  // ── Notifications ───────────────────────────────────────

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      is_read: false,
      created_at: new Date().toISOString(),
      ...notification,
    };
    setNotifications(prev => [newNotif, ...prev]);
    return newNotif;
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length +
    conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <MessagesContext.Provider value={{
      conversations,
      activeRoomId,
      messages,
      messagesLoading,
      conversationsLoading,
      fetchConversations,
      fetchMessages,
      openRoom,
      openDM,
      openTeamRoom,
      openChannel,
      activeChannelId,
      sendMessage,
      sendTeamMessage,
      sendChannelMessage,
      activeConversationId,
      groupConversations,
      openConversation,
      sendConversationMessage,
      createGroupConversation,
      markAsRead,
      toggleReaction,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
