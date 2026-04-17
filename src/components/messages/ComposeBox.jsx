import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, AtSign, X, FileText } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

export default function ComposeBox({ activeDmUserId, dmUser, activeTeam, activeChannel, activeConversation, allUsers, currentUser, onSend }) {
  const { t } = useTheme();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Cleanup object URLs on unmount
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
    };
  }, []);

  const mentionMembers = allUsers.filter(u => u.id !== currentUser?.id);
  const filteredMentionMembers = mentionFilter
    ? mentionMembers.filter(u => {
        const filter = mentionFilter.toLowerCase();
        const name = u.display_name?.toLowerCase() || '';
        const uname = u.username?.toLowerCase() || '';
        return name.includes(filter) || uname.includes(filter);
      })
    : mentionMembers;

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

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    const msgText = message.trim();
    const fileList = attachments.map(a => a.file).filter(Boolean);
    await onSend(msgText, fileList);
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

  const canSend = !!(activeDmUserId || activeTeam || activeChannel || activeConversation);

  return (
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
                  : activeConversation
                    ? (t.messagesPage.messageToGroup || t.messagesPage.messageToChannel).replace('{name}', activeConversation.name)
                    : t.messagesPage.messageToChannel.replace('{name}', activeChannel?.name || activeTeam?.name || 'general')
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
  );
}
