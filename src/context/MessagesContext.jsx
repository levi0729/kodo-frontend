import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { chat as chatApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

const MessagesContext = createContext(null);

const POLL_INTERVAL = 3000; // 3 seconds

export function MessagesProvider({ children }) {
  const { isLoggedIn, currentUser } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [reactionOverrides, setReactionOverrides] = useState({});

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

  useEffect(() => {
    if (isLoggedIn) fetchConversations();
    else setConversations([]);
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
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [toast]);

  const openRoom = useCallback((roomId) => {
    setMessages([]);
    lastMessageIdRef.current = 0;
    setActiveRoomId(roomId);
    fetchMessages(roomId);
  }, [fetchMessages]);

  const openDM = useCallback((otherUserId) => {
    if (!currentUser) return;
    const roomId = Math.min(currentUser.id, otherUserId) * 100000 + Math.max(currentUser.id, otherUserId);
    openRoom(roomId);
    return roomId;
  }, [currentUser, openRoom]);

  const openTeamRoom = useCallback((teamId) => {
    openRoom(teamId); // Team room_id = team_id (always < 100000)
    return teamId;
  }, [openRoom]);

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

  const sendMessage = useCallback(async (receiverId, messageText) => {
    try {
      const data = await chatApi.send(receiverId, messageText);
      const msg = data.message;
      setMessages(prev => [...prev, msg]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, msg.id);
      fetchConversations();
      return msg;
    } catch (err) {
      toast.error('Failed to send message: ' + err.message);
      throw err;
    }
  }, [toast, fetchConversations]);

  const sendTeamMessage = useCallback(async (teamId, messageText) => {
    try {
      const data = await chatApi.sendTeam(teamId, messageText);
      const msg = data.message;
      setMessages(prev => [...prev, msg]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, msg.id);
      return msg;
    } catch (err) {
      toast.error('Failed to send message: ' + err.message);
      throw err;
    }
  }, [toast]);

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
      sendMessage,
      sendTeamMessage,
      markAsRead,
      reactionOverrides,
      setReactionOverrides,
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
