import { useState, useEffect, useMemo } from 'react';
import { Loader2, MessageSquare, UserMinus, UserPlus, Search, Check, X, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { friends as friendsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';

const TABS = ['friends', 'pending', 'find'];

export default function FriendsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const toast = useToast();
  const { t } = useTheme();
  const { allUsers, invalidate: invalidateCache } = useAppData();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        friendsApi.list().catch(() => ({ data: [] })),
        friendsApi.pending().catch(() => ({ data: [] })),
        friendsApi.sent().catch(() => ({ data: [] })),
      ]);
      setFriendsList(friendsRes.friends || friendsRes.data || []);
      setPendingList(pendingRes.friends || pendingRes.data || []);
      setSentList(sentRes.friends || sentRes.data || []);
      invalidateCache('friends');
    } catch {
      // errors already handled per-request
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derive IDs of users that are already friends, pending, or sent
  const connectedUserIds = useMemo(() => {
    const ids = new Set();
    friendsList.forEach(f => {
      ids.add(f.friend_id || f.user_id || f.id);
      if (f.user) ids.add(f.user.id);
      if (f.friend) ids.add(f.friend.id);
    });
    pendingList.forEach(f => {
      ids.add(f.sender_id || f.user_id || f.id);
      if (f.user) ids.add(f.user.id);
      if (f.sender) ids.add(f.sender.id);
    });
    sentList.forEach(f => {
      ids.add(f.receiver_id || f.friend_id || f.user_id || f.id);
      if (f.user) ids.add(f.user.id);
      if (f.receiver) ids.add(f.receiver.id);
    });
    // Remove self
    if (currentUser?.id) ids.delete(currentUser.id);
    return ids;
  }, [friendsList, pendingList, sentList, currentUser]);

  // Helper to extract the "other user" from a friendship record
  const getFriendUser = (record) => {
    if (record.friend) return record.friend;
    if (record.user) return record.user;
    // Fallback: look up from allUsers
    const otherId = record.friend_id || record.user_id;
    if (otherId) return allUsers.find(u => u.id === otherId) || null;
    return record;
  };

  const getSenderUser = (record) => {
    if (record.sender) return record.sender;
    if (record.user) return record.user;
    const otherId = record.sender_id || record.user_id;
    if (otherId) return allUsers.find(u => u.id === otherId) || null;
    return record;
  };

  const getReceiverUser = (record) => {
    if (record.receiver) return record.receiver;
    if (record.user) return record.user;
    const otherId = record.receiver_id || record.friend_id || record.user_id;
    if (otherId) return allUsers.find(u => u.id === otherId) || null;
    return record;
  };

  // Filtered users for "Find Friends" tab
  const availableUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (u.id === currentUser?.id) return false;
      if (connectedUserIds.has(u.id)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (u.display_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [allUsers, currentUser, connectedUserIds, searchQuery]);

  const handleAccept = async (record) => {
    try {
      await friendsApi.accept(record.id);
      toast.success(t.friends.requestAccepted);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (record) => {
    try {
      await friendsApi.decline(record.id);
      toast.success(t.friends.declined || 'Request declined');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to decline request');
    }
  };

  const handleRemove = async (record) => {
    if (!confirm(t.friends.confirmRemove)) return;
    try {
      await friendsApi.remove(record.id);
      toast.success(t.friends.friendRemoved);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove friend');
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      toast.success(t.friends.requestSent);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    }
  };

  const handleMessage = (userId) => {
    onNavigate('messages', { dmUserId: userId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-7 gap-2 sm:gap-3">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">
            {t.friends.title}
          </h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {t.friends.subtitle}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-all ${
              activeTab === tab
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-transparent text-kodo-text-muted hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {t.friends.tabs[tab]}
            {tab === 'pending' && pendingList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-semibold">
                {pendingList.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="flex flex-col gap-3">
          {friendsList.length === 0 ? (
            <div className="kodo-card p-8 text-center">
              <UserPlus className="w-10 h-10 text-kodo-text-dim mx-auto mb-3" />
              <p className="text-kodo-text-muted text-[14px]">{t.friends.noFriends}</p>
            </div>
          ) : (
            friendsList.map(record => {
              const user = getFriendUser(record);
              if (!user) return null;
              return (
                <div key={record.id || user.id} className="kodo-card p-4 flex items-center gap-4">
                  <Avatar user={user} size={40} showStatus />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">
                      {user.display_name}
                    </div>
                    <div className="text-[12px] text-kodo-text-muted truncate">
                      {user.job_title || user.email || ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleMessage(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] font-medium cursor-pointer border-none hover:bg-indigo-500/25 transition-colors"
                    >
                      <MessageSquare size={14} />
                      {t.friends.message}
                    </button>
                    <button
                      onClick={() => handleRemove(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border-none hover:bg-red-500/20 transition-colors"
                    >
                      <UserMinus size={14} />
                      {t.friends.remove}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="flex flex-col gap-5">
          {/* Incoming requests */}
          <div>
            {pendingList.length === 0 && sentList.length === 0 ? (
              <div className="kodo-card p-8 text-center">
                <Clock className="w-10 h-10 text-kodo-text-dim mx-auto mb-3" />
                <p className="text-kodo-text-muted text-[14px]">{t.friends.noPending}</p>
              </div>
            ) : (
              <>
                {pendingList.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {pendingList.map(record => {
                      const user = getSenderUser(record);
                      if (!user) return null;
                      return (
                        <div key={record.id || user.id} className="kodo-card p-4 flex items-center gap-4">
                          <Avatar user={user} size={40} showStatus />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-white truncate">
                              {user.display_name}
                            </div>
                            <div className="text-[12px] text-kodo-text-muted truncate">
                              {user.job_title || user.email || ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleAccept(record)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[12px] font-medium cursor-pointer border-none hover:bg-emerald-500/25 transition-colors"
                            >
                              <Check size={14} />
                              {t.friends.accept}
                            </button>
                            <button
                              onClick={() => handleDecline(record)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border-none hover:bg-red-500/20 transition-colors"
                            >
                              <X size={14} />
                              {t.friends.decline}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sent requests */}
                {sentList.length > 0 && (
                  <div className="mt-5">
                    <div className="text-[11px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em] mb-3">
                      {t.friends.sentRequests}
                    </div>
                    <div className="flex flex-col gap-3">
                      {sentList.map(record => {
                        const user = getReceiverUser(record);
                        if (!user) return null;
                        return (
                          <div key={record.id || user.id} className="kodo-card p-4 flex items-center gap-4 opacity-70">
                            <Avatar user={user} size={40} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-semibold text-white truncate">
                                {user.display_name}
                              </div>
                              <div className="text-[12px] text-kodo-text-muted truncate">
                                {user.job_title || user.email || ''}
                              </div>
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-kodo-text-muted text-[12px] font-medium">
                              <Clock size={13} />
                              {t.friends.pendingLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Find Friends Tab */}
      {activeTab === 'find' && (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kodo-text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.friends.searchPlaceholder}
              className="kodo-input w-full pl-9 pr-4 py-2.5 text-[13px]"
            />
          </div>

          <div className="flex flex-col gap-3">
            {availableUsers.length === 0 ? (
              <div className="kodo-card p-8 text-center">
                <Search className="w-10 h-10 text-kodo-text-dim mx-auto mb-3" />
                <p className="text-kodo-text-muted text-[14px]">{t.friends.noResults}</p>
              </div>
            ) : (
              availableUsers.map(user => (
                <div key={user.id} className="kodo-card p-4 flex items-center gap-4">
                  <Avatar user={user} size={40} showStatus />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">
                      {user.display_name}
                    </div>
                    <div className="text-[12px] text-kodo-text-muted truncate">
                      {user.job_title || user.email || ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[12px] font-medium cursor-pointer border-none hover:bg-indigo-500/25 transition-colors flex-shrink-0"
                  >
                    <UserPlus size={14} />
                    {t.friends.addFriend}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
