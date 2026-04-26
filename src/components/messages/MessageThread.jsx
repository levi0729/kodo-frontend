import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { List as VirtualList, useDynamicRowHeight } from 'react-window';
import { User, Users, Pin, SmilePlus, FileText, Loader2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const QUICK_EMOJIS = ['❤️', '👍', '👎'];
const VIRTUALIZE_THRESHOLD = 50;

export default function MessageThread({ messages, messagesLoading, activeDmUserId, dmUser, activeTeam, activeChannel, activeConversation, getUserById, toggleReaction }) {
  const { currentUser } = useAuth();
  const { t, language } = useTheme();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [containerHeight, setContainerHeight] = useState(400);

  const EMOJI_CATEGORIES = [
    { label: t.messagesPage.emojiCategories.frequent, emojis: ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉', '🙌', '💯', '✅', '❌'] },
    { label: t.messagesPage.emojiCategories.smileys, emojis: ['😀', '😃', '😄', '😁', '😆', '🤣', '😅', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😜', '🤔', '🤗', '🤩', '😎'] },
    { label: t.messagesPage.emojiCategories.hands, emojis: ['👏', '🤝', '👊', '✊', '🤞', '✌️', '🤟', '🫡', '💪', '🙏', '👋', '🖐️'] },
    { label: t.messagesPage.emojiCategories.objects, emojis: ['⭐', '💡', '💎', '🏆', '🎯', '🚀', '⚡', '🔔', '📌', '🔗', '💬', '🗓️'] },
  ];

  const msg = t.messagesPage;
  const formatMessageTime = useCallback((dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (isToday) return timeStr;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
    if (isYesterday) return `${msg.yesterday} ${timeStr}`;
    const datePartStr = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${datePartStr} ${timeStr}`;
  }, [locale, msg.yesterday]);

  const displayMessages = (activeDmUserId || activeTeam || activeChannel || activeConversation) ? messages : [];
  const useVirtualization = displayMessages.length > VIRTUALIZE_THRESHOLD;

  // Measure container height for virtualized list
  useEffect(() => {
    if (!useVirtualization || !containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(Math.max(200, rect.height));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [useVirtualization]);

  // Auto-scroll: non-virtualized
  useEffect(() => {
    if (!useVirtualization) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, useVirtualization]);

  // Auto-scroll: virtualized — scroll to last item
  useEffect(() => {
    if (useVirtualization && listRef.current && displayMessages.length > 0) {
      listRef.current.scrollToItem(displayMessages.length - 1, 'end');
    }
  }, [messages, useVirtualization, displayMessages.length]);

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

  const handleReaction = (msgId, emoji) => {
    toggleReaction(msgId, emoji);
    setEmojiPickerMsgId(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  };

  // Estimated row height for virtualized list
  const estimateRowHeight = useCallback((index) => {
    const msg = displayMessages[index];
    const showHeader = index === 0 || displayMessages[index - 1].sender_id !== msg.sender_id;
    let h = 44; // base: content bubble + padding
    if (showHeader) h += 24; // name + time row
    if ((msg.reactions || []).length > 0) h += 28;
    if ((msg.attachments || []).length > 0) h += 48;
    return h;
  }, [displayMessages]);

  const { rowHeight, resetRowHeight, onRowResize } = useDynamicRowHeight({
    defaultRowHeight: 44,
    key: displayMessages.map(m => m.id).join(','),
  });

  // Render a single message row (shared between virtualized and non-virtualized)
  const renderMessage = useCallback((msg, idx, style) => {
    const sender = getUserById(msg.sender_id);
    const time = formatMessageTime(msg.created_at);
    const own = msg.sender_id === currentUser.id;
    const showHeader = idx === 0 || displayMessages[idx - 1].sender_id !== msg.sender_id;
    const reactions = msg.reactions || [];

    return (
      <div
        key={msg.id}
        style={style}
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
            <div ref={emojiPickerMsgId === msg.id ? emojiPickerRef : undefined} className={`absolute -top-3 ${own ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 ${emojiPickerMsgId === msg.id ? '!opacity-100' : ''} transition-opacity z-10 flex flex-col items-start bg-[#1e1e2e] border border-white/[0.1] rounded-lg shadow-lg`}>
              <div className="flex items-center gap-0.5 px-1 py-0.5">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(msg.id, emoji)}
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
                <div className="w-[240px] sm:w-[280px] border-t border-white/[0.08] animate-fade-in-up">
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
                              onClick={() => handleReaction(msg.id, emoji)}
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
                    onClick={() => handleReaction(msg.id, r.emoji)}
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
  }, [displayMessages, currentUser, locale, emojiPickerMsgId, getUserById, handleReaction, t, EMOJI_CATEGORIES]);

  // Row component for virtualized list
  const VirtualRow = useCallback(({ index, style, onResize }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current && onResize) {
        const h = ref.current.getBoundingClientRect().height;
        if (h > 0) onResize(index, h);
      }
    }, [index, onResize]);
    return (
      <div style={style}>
        <div ref={ref}>
          {renderMessage(displayMessages[index], index, undefined)}
        </div>
      </div>
    );
  }, [renderMessage, displayMessages]);

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (displayMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
          {activeDmUserId ? (
            <User size={28} className="text-kodo-text-dim" />
          ) : (
            <Users size={28} className="text-kodo-text-dim" />
          )}
        </div>
        <div className="text-[15px] font-semibold text-white mb-1">
          {activeDmUserId ? dmUser?.display_name : activeConversation ? activeConversation.name : activeChannel ? `#${activeChannel.name}` : activeTeam?.name}
        </div>
        <div className="text-[13px] text-kodo-text-muted mb-1">
          {activeDmUserId ? dmUser?.job_title : activeChannel?.description || activeTeam?.description}
        </div>
        <div className="text-[12px] text-kodo-text-dim">
          {t.messagesPage.startChatting}
        </div>
      </div>
    );
  }

  // Virtualized rendering for large message lists
  if (useVirtualization) {
    return (
      <div ref={containerRef} className="h-full">
        <VirtualList
          listRef={listRef}
          rowCount={displayMessages.length}
          rowHeight={estimateRowHeight}
          defaultHeight={containerHeight}
          overscanCount={8}
          rowComponent={VirtualRow}
          rowProps={{ onResize: onRowResize }}
          style={{ width: '100%' }}
        />
      </div>
    );
  }

  // Standard rendering for small message lists
  return (
    <div className="flex flex-col gap-0.5">
      {displayMessages.map((msg, idx) => renderMessage(msg, idx, undefined))}
      <div ref={messagesEndRef} />
    </div>
  );
}
