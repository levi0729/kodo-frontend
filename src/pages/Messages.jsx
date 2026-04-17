import { useState, useEffect, useCallback } from 'react';
import { Hash, ChevronLeft, Loader2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChannelSidebar from '@/components/messages/ChannelSidebar';
import MessageThread from '@/components/messages/MessageThread';
import ComposeBox from '@/components/messages/ComposeBox';
import FindFriendsModal from '@/components/messages/FindFriendsModal';
import { users as usersApi, teams as teamsApi, friends as friendsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { useTheme } from '@/context/ThemeContext';

export default function MessagesPage({ dmUserId, teamId }) {
  const { currentUser } = useAuth();
  const {
    messages, messagesLoading,
    openDM, openTeamRoom, sendMessage, sendTeamMessage,
    toggleReaction: toggleReactionApi, addNotification
  } = useMessages();
  const { t } = useTheme();

  const [allUsers, setAllUsers] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeDmUserId, setActiveDmUserId] = useState(null);
  const [dmSearch, setDmSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);

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

  // Local helper to find user by id
  const getUserById = useCallback((id) => {
    if (id === currentUser?.id) return currentUser;
    return allUsers.find(u => u.id === id) || null;
  }, [allUsers, currentUser]);

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

  const toggleReaction = useCallback((msgId, emoji) => {
    toggleReactionApi(msgId, emoji);
  }, [toggleReactionApi]);

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

  const handleSend = useCallback(async (msgText, fileList) => {
    try {
      if (activeDmUserId) {
        await sendMessage(activeDmUserId, msgText, fileList);
      } else if (activeTeamId) {
        await sendTeamMessage(activeTeamId, msgText, fileList);
      }
    } catch { /* handled by context */ }
    // Process mention notifications
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
  }, [activeDmUserId, activeTeamId, sendMessage, sendTeamMessage, allUsers, currentUser, addNotification, t]);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-100px)] min-h-[400px]">
      <ChannelSidebar
        userTeams={userTeams}
        activeTeamId={activeTeamId}
        activeDmUserId={activeDmUserId}
        filteredMembers={filteredMembers}
        dmSearch={dmSearch}
        setDmSearch={setDmSearch}
        pendingRequests={pendingRequests}
        onSelectTeam={handleSelectTeam}
        onSelectDm={handleSelectDm}
        onFindFriends={() => setShowFindFriends(true)}
        mobileShowChat={mobileShowChat}
      />
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
          <MessageThread
            messages={messages}
            messagesLoading={messagesLoading}
            activeDmUserId={activeDmUserId}
            dmUser={dmUser}
            activeTeam={activeTeam}
            getUserById={getUserById}
            toggleReaction={toggleReaction}
          />
        </div>
        <ComposeBox
          activeDmUserId={activeDmUserId}
          dmUser={dmUser}
          activeTeam={activeTeam}
          allUsers={allUsers}
          currentUser={currentUser}
          onSend={handleSend}
        />
      </div>

      {showFindFriends && (
        <FindFriendsModal
          friendIds={friendIds}
          pendingRequests={pendingRequests}
          setPendingRequests={setPendingRequests}
          setFriendsList={setFriendsList}
          onClose={() => setShowFindFriends(false)}
        />
      )}
    </div>
  );
}
