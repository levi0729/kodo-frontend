import { useState, useEffect } from 'react';
import { Search, X, UserPlus, Check, Clock, UserMinus, Loader2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { users as usersApi, friends as friendsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const TABS = ['find', 'pending', 'sent'];

export default function FindFriendsModal({ friendIds, pendingRequests, setPendingRequests, setFriendsList, onClose }) {
  const { currentUser } = useAuth();
  const { t } = useTheme();

  const [activeTab, setActiveTab] = useState(pendingRequests.length > 0 ? 'pending' : 'find');
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [sentList, setSentList] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  // Load sent requests
  useEffect(() => {
    friendsApi.sent().then(res => {
      setSentList(res.friends || res.data || []);
    }).catch(() => {});
  }, []);

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
    setActionLoading(userId);
    try {
      await friendsApi.sendRequest(userId);
      setSentRequests(prev => new Set([...prev, userId]));
      // Refresh sent list
      friendsApi.sent().then(res => setSentList(res.friends || res.data || [])).catch(() => {});
    } catch { /* already sent or already friends */ }
    setActionLoading(null);
  };

  const handleAcceptRequest = async (friendRecord) => {
    setActionLoading(friendRecord.id);
    try {
      await friendsApi.accept(friendRecord.id);
      setPendingRequests(prev => prev.filter(r => r.id !== friendRecord.id));
      const res = await friendsApi.list().catch(() => ({ friends: [] }));
      setFriendsList(res.friends || []);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDeclineRequest = async (friendRecord) => {
    setActionLoading(friendRecord.id);
    try {
      await friendsApi.decline(friendRecord.id);
      setPendingRequests(prev => prev.filter(r => r.id !== friendRecord.id));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[480px] max-h-[80vh] overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-[16px] font-semibold text-white">{t.friends.findFriends}</h2>
          <button onClick={onClose} className="text-kodo-text-dim hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-3 pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-t-lg text-[12px] font-medium cursor-pointer border-none transition-all ${
                activeTab === tab
                  ? 'bg-white/[0.06] text-indigo-400'
                  : 'bg-transparent text-kodo-text-dim hover:text-kodo-text-secondary'
              }`}
            >
              {tab === 'find' && (t.friends.tabs?.find || t.friends.findFriends)}
              {tab === 'pending' && (t.friends.tabs?.pending || t.friends.friendRequests)}
              {tab === 'sent' && (t.friends.sentRequests || 'Sent')}
              {tab === 'pending' && pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-semibold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-130px)]">
          {/* Find Tab */}
          {activeTab === 'find' && (
            <>
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

              <div className="flex flex-col gap-1">
                {friendSearch.trim() && friendSearchResults.length === 0 && (
                  <div className="text-center text-[12px] text-kodo-text-dim py-4">{t.friends.noResults}</div>
                )}
                {!friendSearch.trim() && (
                  <div className="text-center text-[12px] text-kodo-text-dim py-6">
                    {t.friends.searchPlaceholder}
                  </div>
                )}
                {friendSearchResults.map(user => {
                  const isFriend = friendIds.has(user.id);
                  const isPending = sentRequests.has(user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <Avatar user={user} size={34} showStatus />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-kodo-text truncate">{user.display_name}</div>
                        <div className="text-[11px] text-kodo-text-dim truncate">{user.job_title || user.email}</div>
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
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kodo-accent/20 text-indigo-400 text-[11px] font-medium cursor-pointer border-none hover:bg-kodo-accent/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                          {t.friends.sendRequest}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="flex flex-col gap-2">
              {pendingRequests.length === 0 ? (
                <div className="text-center text-[12px] text-kodo-text-dim py-6">
                  {t.friends.noPending || 'No pending requests'}
                </div>
              ) : (
                pendingRequests.map(req => {
                  const sender = req.user_one || req.sender;
                  if (!sender) return null;
                  return (
                    <div key={req.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]">
                      <Avatar user={sender} size={34} showStatus />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-kodo-text truncate">{sender.display_name}</div>
                        <div className="text-[11px] text-kodo-text-dim truncate">{sender.job_title || sender.email}</div>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={actionLoading === req.id}
                        className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-[11px] font-medium cursor-pointer border-none hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        {' '}{t.friends.accept}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req)}
                        disabled={actionLoading === req.id}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-medium cursor-pointer border-none hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sent Tab */}
          {activeTab === 'sent' && (
            <div className="flex flex-col gap-2">
              {sentList.length === 0 ? (
                <div className="text-center text-[12px] text-kodo-text-dim py-6">
                  {t.friends.noSentRequests || 'No sent requests'}
                </div>
              ) : (
                sentList.map(record => {
                  const user = record.receiver || record.user;
                  if (!user) return null;
                  return (
                    <div key={record.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] opacity-70">
                      <Avatar user={user} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-kodo-text truncate">{user.display_name}</div>
                        <div className="text-[11px] text-kodo-text-dim truncate">{user.job_title || user.email}</div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-kodo-text-muted font-medium">
                        <Clock size={12} />
                        {t.friends.pendingLabel || 'Pending'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
