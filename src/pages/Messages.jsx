import { useState, useEffect, useRef, useCallback } from 'react';
import { Hash, Send, Pin, SmilePlus, Paperclip, AtSign, User, Search, Users, X, FileText, ChevronLeft, Loader2, UserPlus, Check, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { users as usersApi, teams as teamsApi, friends as friendsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { useTheme } from '@/context/ThemeContext';

const QUICK_EMOJIS = ['❤️', '👍', '👎'];

export default function MessagesPage({ dmUserId, teamId }) {
  const { currentUser } = useAuth();
  const {
    messages, messagesLoading,
    openDM, openTeamRoom, sendMessage, sendTeamMessage,
    toggleReaction: toggleReactionApi, addNotification
  } = useMessages();
  const { t } = useTheme();

  const EMOJI_CATEGORIES = [
    { label: t.messagesPage.emojiCategories.frequent, emojis: ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉', '🙌', '💯', '✅', '❌'] },
    { label: t.messagesPage.emojiCategories.smileys, emojis: ['😀', '😃', '😄', '😁', '😆', '🤣', '😅', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😜', '🤔', '🤗', '🤩', '😎'] },
    { label: t.messagesPage.emojiCategories.hands, emojis: ['👏', '🤝', '👊', '✊', '🤞', '✌️', '🤟', '🫡', '💪', '🙏', '👋', '🖐️'] },
    { label: t.messagesPage.emojiCategories.objects, emojis: ['⭐', '💡', '💎', '🏆', '🎯', '🚀', '⚡', '🔔', '📌', '🔗', '💬', '🗓️'] },
  ];

  const [allUsers, setAllUsers] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeDmUserId, setActiveDmUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Cleanup object URLs on unmount to prevent memory leaks
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
    };
  }, []);

  // Fetch users, teams, and friends from API
  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      usersApi.list().catch(() => ({ data: [] })),
      teamsApi.list().catch(() => ({ data: [] })),
      friendsApi.list().catch(() => ({ friends: [] })),
      friendsApi.pending().catch(() => ({ pending_requests: [] })),
    ]).then(([usersRes, teamsRes, friendsRes, pendingRes]) => {
      setAllUsers(usersRes.users || usersRes.data || []);
      setUserTeams(teamsRes.teams || teamsRes.data || []);
      setFriendsList(friendsRes.friends || []);
      setPendingRequests(pendingRes.pending_requests || []);
      setDataLoading(false);
    });
  }, []);

  // Set initial team once data is loaded
  useEffect(() => {
    if (!dataLoading && userTeams.length > 0 && !activeTeamId && !activeDmUserId) {
      const initialTeamId = teamId || userTeams[0]?.id || null;
      setActiveTeamId(initialTeamId);
      if (initialTeamId) openTeamRoom(initialTeamId);
    }
  }, [dataLoading, userTeams, teamId]);

  useEffect(() => {
    if (dmUserId) {
      setActiveDmUserId(dmUserId);
      setActiveTeamId(null);
      openDM(dmUserId);
    }
  }, [dmUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPickerMsgId(null);
      }
    };
    if (emojiPickerMsgId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [emojiPickerMsgId]);

  // Local helper to find user by id
  const getUserById = (id) => {
    if (id === currentUser?.id) return currentUser;
    return allUsers.find(u => u.id === id) || null;
  };

  const activeTeam = userTeams.find(tm => tm.id === activeTeamId);

  // DM list shows only accepted friends
  const friendIds = new Set(friendsList.map(f => f.id));
  const friendMembers = friendsList.filter(u => u.id !== currentUser?.id);
  const filteredMembers = dmSearch
    ? friendMembers.filter(u =>
        u.display_name?.toLowerCase().includes(dmSearch.toLowerCase()) ||
        u.job_title?.toLowerCase().includes(dmSearch.toLowerCase())
      )
    : friendMembers;

  const dmUser = activeDmUserId ? getUserById(activeDmUserId) : null;

  const teamChannels = []; // channels handled by backend now
  const activeChannelId = null;

  const mentionMembers = allUsers.filter(u => u.id !== currentUser?.id);
  const filteredMentionMembers = mentionFilter
    ? mentionMembers.filter(u => {
        const filter = mentionFilter.toLowerCase();
        const name = u.display_name?.toLowerCase() || '';
        const uname = u.username?.toLowerCase() || '';
        return name.includes(filter) || uname.includes(filter);
      })
    : mentionMembers;

  const displayMessages = (activeDmUserId || activeTeamId) ? messages : [];
  const canSend = !!(activeDmUserId || activeTeamId);

  const getReactions = (msg) => msg.reactions || [];

  const toggleReaction = (msgId, emoji) => {
    toggleReactionApi(msgId, emoji);
    setEmojiPickerMsgId(null);
  };

  const handleSelectTeam = useCallback((tId) => {
    setActiveTeamId(tId);
    setActiveDmUserId(null);
    setMobileShowChat(true);
    openTeamRoom(tId);
  }, [openTeamRoom]);

  const handleSelectDm = useCallback((userId) => {
    setActiveDmUserId(userId);
    setActiveTeamId(null);
    setMobileShowChat(true);
    openDM(userId);
  }, [openDM]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    // Support Unicode letters (Hungarian etc.) in mention filter
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
    if (atMatch) {
      setShowMentionPopup(true);
      setMentionFilter(atMatch[1]);
    } else {
      setShowMentionPopup(false);
      setMentionFilter('');
    }
  };

  const handleMentionSelect = (user) => {
    const cursorPos = inputRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const textAfterCursor = message.slice(cursorPos);
    const newBefore = textBeforeCursor.replace(/@([^\s@]*)$/, `@${user.display_name} `);
    setMessage(newBefore + textAfterCursor);
    setShowMentionPopup(false);
    setMentionFilter('');
    inputRef.current?.focus();
  };

  const handleAtButtonClick = () => {
    setMessage(prev => prev + '@');
    setShowMentionPopup(true);
    setMentionFilter('');
    inputRef.current?.focus();
  };

  // Friend search — debounced so we don't hit the API on every keystroke
  useEffect(() => {
    if (!friendSearch.trim()) {
      setFriendSearchResults([]);
      return;
    }
    const query = friendSearch.trim();
    const timer = setTimeout(() => {
      usersApi.list({ search: query }).then(res => {
        const users = (res.users || []).filter(u => u.id !== currentUser?.id);
        setFriendSearchResults(users);
      }).catch(() => setFriendSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [friendSearch, currentUser?.id]);

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      setSentRequests(prev => new Set([...prev, userId]));
    } catch { /* already sent or already friends */ }
  };

  const handleAcceptRequest = async (friendRecord) => {
    try {
      await friendsApi.accept(friendRecord.id);
      setPendingRequests(prev => prev.filter(r => r.id !== friendRecord.id));
      // Refresh friends list
      const res = await friendsApi.list().catch(() => ({ friends: [] }));
      setFriendsList(res.friends || []);
    } catch { /* ignore */ }
  };

  const handleDeclineRequest = async (friendRecord) => {
    try {
      await friendsApi.decline(friendRecord.id);
      setPendingRequests(prev => prev.filter(r => r.id !== friendRecord.id));
    } catch { /* ignore */ }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    const msgText = message.trim();
    const fileList = attachments.map(a => a.file).filter(Boolean);
    try {
      if (activeDmUserId) {
        await sendMessage(activeDmUserId, msgText, fileList);
      } else if (activeTeamId) {
        await sendTeamMessage(activeTeamId, msgText, fileList);
      }
    } catch { /* handled by context */ }
    // Process mention notifications — match each @Name by looking up known display names
    const mentionedUsers = allUsers.filter(u => {
      if (u.id === currentUser.id) return false;
      if (!u.display_name) return false;
      return msgText.toLowerCase().includes('@' + u.display_name.toLowerCase());
    });
    for (const mentionedUser of mentionedUsers) {
      addNotification({
        notification_type: 'mention',
        actor_id: currentUser.id,
        target_user_id: mentionedUser.id,
        title: t.messagesPage.mentioned.replace('{name}', currentUser.display_name),
        body: msgText.length > 60 ? msgText.slice(0, 60) + '...' : msgText,
      });
    }
    setMessage('');
    setAttachments(prev => {
      prev.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
      return [];
    });
    setShowMentionPopup(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  };

  const isOwnMessage = (msg) => msg.sender_id === currentUser.id;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-100px)] min-h-[400px]">
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-[220px] border-r-0 md:border-r border-white/[0.06] flex-col flex-shrink-0`}>
        <div className="p-4">
          <div className="kodo-section-title">{t.messagesPage.teams}</div>
          <div className="flex flex-col gap-0.5">
            {userTeams.map(tm => (
              <button
                key={tm.id}
                onClick={() => handleSelectTeam(tm.id)}
                className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none text-left ${
                  activeTeamId === tm.id && !activeDmUserId
                    ? 'bg-kodo-accent/10 text-indigo-400'
                    : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: tm.color }}
                />
                {tm.name}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 pt-0 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mt-4 mb-1">
            <div className="kodo-section-title m-0">{t.messagesPage.directMessages}</div>
            <div className="flex items-center gap-1">
              {pendingRequests.length > 0 && (
                <span className="text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
              <button
                onClick={() => setShowFindFriends(true)}
                className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-none"
                title={t.friends.findFriends}
              >
                <UserPlus size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 mb-2 bg-white/[0.04] rounded-lg border border-white/[0.06] focus-within:border-kodo-accent/30 transition-colors">
            <Search size={13} className="text-kodo-text-dim flex-shrink-0" />
            <input
              value={dmSearch}
              onChange={e => setDmSearch(e.target.value)}
              placeholder={t.messagesPage.search}
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-kodo-text placeholder:text-kodo-text-dim"
            />
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
            {filteredMembers.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelectDm(u.id)}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none text-left ${
                  activeDmUserId === u.id
                    ? 'bg-kodo-accent/10 text-indigo-400'
                    : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
                }`}
              >
                <Avatar user={u} size={22} showStatus />
                {u.display_name}
              </button>
            ))}
            {filteredMembers.length === 0 && (
              <div className="text-center py-4">
                <div className="text-[12px] text-kodo-text-dim px-2.5 py-2">
                  {dmSearch ? t.messagesPage.noResults : t.friends.noFriends}
                </div>
                {!dmSearch && (
                  <button
                    onClick={() => setShowFindFriends(true)}
                    className="text-[12px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
                  >
                    {t.friends.findFriends}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        <div className="h-[52px] flex items-center gap-2.5 px-3 md:px-6 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => setMobileShowChat(false)}
            className="p-2 rounded-lg text-kodo-text-muted hover:text-kodo-text-secondary hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-none md:hidden"
          >
            <ChevronLeft size={20} />
          </button>
          {activeDmUserId && dmUser ? (
            <>
              <Avatar user={dmUser} size={24} showStatus />
              <span className="text-[14px] sm:text-[15px] font-semibold text-white truncate">{dmUser.display_name}</span>
              <span className="text-[12px] text-kodo-text-dim ml-1 hidden sm:inline truncate">
                · {dmUser.job_title}
              </span>
            </>
          ) : activeTeam ? (
            <>
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: activeTeam.color }}
              />
              <span className="text-[14px] sm:text-[15px] font-semibold text-white truncate">{activeTeam.name}</span>
              <span className="text-[12px] text-kodo-text-dim ml-1 hidden sm:inline truncate">
                · {activeTeam.description}
              </span>
            </>
          ) : (
            <>
              <Hash size={17} className="text-kodo-text-muted" />
              <span className="text-[15px] font-semibold text-white">general</span>
            </>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-6 py-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                {activeDmUserId ? (
                  <User size={28} className="text-kodo-text-dim" />
                ) : (
                  <Users size={28} className="text-kodo-text-dim" />
                )}
              </div>
              <div className="text-[15px] font-semibold text-white mb-1">
                {activeDmUserId ? dmUser?.display_name : activeTeam?.name}
              </div>
              <div className="text-[13px] text-kodo-text-muted mb-1">
                {activeDmUserId ? dmUser?.job_title : activeTeam?.description}
              </div>
              <div className="text-[12px] text-kodo-text-dim">
                {t.messagesPage.startChatting}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {displayMessages.map((msg, idx) => {
                const sender = getUserById(msg.sender_id);
                const time = new Date(msg.created_at).toLocaleTimeString('hu-HU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const own = isOwnMessage(msg);
                const showHeader =
                  idx === 0 || displayMessages[idx - 1].sender_id !== msg.sender_id;
                const reactions = getReactions(msg);

                return (
                  <div
                    key={msg.id}
                    className={`relative flex gap-3 px-2 py-1 rounded-lg transition-colors hover:bg-white/[0.02] group ${
                      showHeader ? 'mt-3' : ''
                    } ${own ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-9 flex-shrink-0">
                      {showHeader && sender && <Avatar user={sender} size={36} />}
                    </div>
                    <div className={`flex-1 min-w-0 ${own ? 'flex flex-col items-end' : ''}`}>
                      {showHeader && (
                        <div className={`flex items-baseline gap-2 mb-0.5 ${own ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[13px] font-semibold text-kodo-text">
                            {sender?.display_name}
                          </span>
                          <span className="text-[11px] text-kodo-text-dim">{time}</span>
                          {msg.is_pinned && (
                            <Pin size={11} className="text-amber-400" />
                          )}
                        </div>
                      )}
                      <div className="relative inline-block max-w-[85%]">
                        <div className={`text-[14px] leading-relaxed px-3.5 py-2 rounded-2xl ${
                          own
                            ? 'bg-kodo-accent/20 text-kodo-text rounded-tr-md'
                            : 'bg-white/[0.04] text-[#c0c0d0] rounded-tl-md'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`absolute -top-3 ${own ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-0.5 bg-[#1e1e2e] border border-white/[0.1] rounded-lg px-1 py-0.5 shadow-lg`}>
                          {QUICK_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer bg-transparent border-none text-[14px]"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
                          <button
                            onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors cursor-pointer bg-transparent border-none text-kodo-text-dim"
                            title={t.messagesPage.moreEmoji}
                          >
                            <SmilePlus size={14} />
                          </button>
                        </div>
                        {emojiPickerMsgId === msg.id && (
                          <div
                            ref={emojiPickerRef}
                            className={`absolute z-50 ${own ? 'right-0' : 'left-0'} bottom-full mb-2 w-[240px] sm:w-[280px] bg-[#1a1a24] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up`}
                          >
                            <div className="max-h-[240px] overflow-y-auto p-2">
                              {EMOJI_CATEGORIES.map(cat => (
                                <div key={cat.label}>
                                  <div className="px-2 py-1.5 text-[10px] font-semibold text-kodo-text-dim uppercase tracking-[0.1em]">
                                    {cat.label}
                                  </div>
                                  <div className="grid grid-cols-8 gap-0.5">
                                    {cat.emojis.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => toggleReaction(msg.id, emoji)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer bg-transparent border-none text-[16px]"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {msg.attachments?.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-1.5 ${own ? 'justify-end' : ''}`}>
                          {msg.attachments.map((att, i) => {
                            const name = att.file_name || att.name;
                            const url = att.file_url || att.preview;
                            const type = att.file_type || att.type || '';
                            const size = att.file_size ?? att.size;
                            const isImage = type.startsWith('image/');
                            return isImage && url ? (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img
                                  src={url}
                                  alt={name}
                                  className="max-w-[240px] max-h-[180px] rounded-xl border border-white/[0.06] object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                download={name}
                                className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl no-underline hover:bg-white/[0.06] transition-colors"
                              >
                                <FileText size={16} className="text-kodo-text-muted flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[12px] text-kodo-text truncate max-w-[180px]">{name}</div>
                                  {size != null && (
                                    <div className="text-[10px] text-kodo-text-dim">{formatFileSize(size)}</div>
                                  )}
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}
                      {reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1.5 mt-1.5 ${own ? 'justify-end' : ''}`}>
                          {reactions.map((r, i) => {
                            const hasReacted = r.users.includes(currentUser.id);
                            return (
                              <button
                                key={i}
                                onClick={() => toggleReaction(msg.id, r.emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] cursor-pointer transition-all border ${
                                  hasReacted
                                    ? 'bg-kodo-accent/15 border-kodo-accent/30 hover:bg-kodo-accent/25'
                                    : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
                                }`}
                              >
                                {r.emoji}{' '}
                                <span className={`text-[11px] ${hasReacted ? 'text-indigo-400' : 'text-kodo-text-dim'}`}>
                                  {r.users.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="px-3 md:px-6 py-3 border-t border-white/[0.06] flex-shrink-0">
          {canSend && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map(att => (
                <div key={att.id} className="relative group/att">
                  {att.preview ? (
                    <div className="relative">
                      <img
                        src={att.preview}
                        alt={att.name}
                        className="w-16 h-16 rounded-lg object-cover border border-white/[0.06]"
                      />
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover/att:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                      <FileText size={14} className="text-kodo-text-muted" />
                      <div className="min-w-0">
                        <div className="text-[11px] text-kodo-text truncate max-w-[120px]">{att.name}</div>
                        <div className="text-[9px] text-kodo-text-dim">{formatFileSize(att.size)}</div>
                      </div>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer border-none opacity-0 group-hover/att:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {canSend && (
            <div className="relative">
              {showMentionPopup && filteredMentionMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a24] border border-white/[0.08] rounded-xl py-1.5 z-50 shadow-2xl max-h-[200px] overflow-y-auto animate-fade-in-up">
                  <div className="px-3 py-1 text-[10px] font-semibold text-kodo-text-dim uppercase tracking-[0.1em]">
                    {t.common.members}
                  </div>
                  {filteredMentionMembers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleMentionSelect(u)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-none cursor-pointer transition-colors bg-transparent hover:bg-white/[0.04]"
                    >
                      <Avatar user={u} size={24} showStatus />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-kodo-text">{u.display_name}</div>
                        <div className="text-[11px] text-kodo-text-dim">{u.job_title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.04] rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 border border-white/[0.06] focus-within:border-kodo-accent/30 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-kodo-text-dim hover:text-kodo-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0"
                  title={t.messagesPage.attachFile}
                >
                  <Paperclip size={18} />
                </button>
                <input
                  ref={inputRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !showMentionPopup) handleSendMessage();
                    if (e.key === 'Escape') setShowMentionPopup(false);
                  }}
                  placeholder={
                    activeDmUserId && dmUser
                      ? t.messagesPage.messageTo.replace('{name}', dmUser.display_name)
                      : t.messagesPage.messageToChannel.replace('{name}', activeTeam?.name || 'general')
                  }
                  className="flex-1 bg-transparent border-none outline-none text-[13px] sm:text-[14px] text-kodo-text placeholder:text-kodo-text-dim min-w-0"
                />
                <button
                  onClick={handleAtButtonClick}
                  className="text-kodo-text-dim hover:text-kodo-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0"
                  title={t.messagesPage.tagMember}
                >
                  <AtSign size={18} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className={`p-2 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center ${
                    message || attachments.length > 0
                      ? 'bg-kodo-accent text-white'
                      : 'bg-white/[0.06] text-kodo-text-dim cursor-default'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Find Friends Modal */}
      {showFindFriends && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFindFriends(false)}>
          <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[440px] max-h-[80vh] overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-[16px] font-semibold text-white">{t.friends.findFriends}</h2>
              <button onClick={() => setShowFindFriends(false)} className="text-kodo-text-dim hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1">
                <X size={16} />
              </button>
            </div>

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="text-[11px] font-semibold text-kodo-text-dim uppercase tracking-[0.05em] mb-2">
                  {t.friends.friendRequests} ({pendingRequests.length})
                </div>
                <div className="flex flex-col gap-2">
                  {pendingRequests.map(req => {
                    const sender = req.user_one || req.sender;
                    if (!sender) return null;
                    return (
                      <div key={req.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03]">
                        <Avatar user={sender} size={32} showStatus />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-kodo-text truncate">{sender.display_name}</div>
                          <div className="text-[11px] text-kodo-text-dim truncate">{sender.email}</div>
                        </div>
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-medium cursor-pointer border-none hover:bg-green-500/30 transition-colors"
                        >
                          {t.friends.accept}
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-medium cursor-pointer border-none hover:bg-red-500/30 transition-colors"
                        >
                          {t.friends.decline}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-lg border border-white/[0.06] focus-within:border-kodo-accent/30 transition-colors mb-3">
                <Search size={14} className="text-kodo-text-dim flex-shrink-0" />
                <input
                  value={friendSearch}
                  onChange={e => setFriendSearch(e.target.value)}
                  placeholder={t.friends.searchPlaceholder}
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-kodo-text placeholder:text-kodo-text-dim"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                {friendSearch.trim() && friendSearchResults.length === 0 && (
                  <div className="text-center text-[12px] text-kodo-text-dim py-4">{t.friends.noResults}</div>
                )}
                {friendSearchResults.map(user => {
                  const isFriend = friendIds.has(user.id);
                  const isPending = sentRequests.has(user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <Avatar user={user} size={34} showStatus />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-kodo-text truncate">{user.display_name}</div>
                        <div className="text-[11px] text-kodo-text-dim truncate">{user.email}</div>
                      </div>
                      {isFriend ? (
                        <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                          <Check size={12} /> {t.friends.alreadyFriend}
                        </span>
                      ) : isPending ? (
                        <span className="flex items-center gap-1 text-[11px] text-yellow-400 font-medium">
                          <Clock size={12} /> {t.friends.requestSent}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kodo-accent/20 text-indigo-400 text-[11px] font-medium cursor-pointer border-none hover:bg-kodo-accent/30 transition-colors"
                        >
                          <UserPlus size={12} /> {t.friends.sendRequest}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
