import { useState, useEffect } from 'react';
import { Search, X, UserPlus, Check, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { users as usersApi, friends as friendsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function FindFriendsModal({ friendIds, pendingRequests, setPendingRequests, setFriendsList, onClose }) {
  const { currentUser } = useAuth();
  const { t } = useTheme();

  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());

  // Friend search — debounced
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[440px] max-h-[80vh] overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-[16px] font-semibold text-white">{t.friends.findFriends}</h2>
          <button onClick={onClose} className="text-kodo-text-dim hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1">
            <X size={16} />
          </button>
        </div>

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
  );
}
