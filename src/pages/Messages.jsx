import { useState, useEffect, useCallback } from 'react';
import { Hash, ChevronLeft, Loader2, Lock, Megaphone } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChannelSidebar from '@/components/messages/ChannelSidebar';
import MessageThread from '@/components/messages/MessageThread';
import ComposeBox from '@/components/messages/ComposeBox';
import FindFriendsModal from '@/components/messages/FindFriendsModal';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { channels as channelsApi } from '@/services/api';

export default function MessagesPage({ dmUserId, teamId }) {
  const { currentUser } = useAuth();
  const {
    messages, messagesLoading,
    openDM, openTeamRoom, openChannel, activeChannelId,
    sendMessage, sendTeamMessage, sendChannelMessage,
    toggleReaction: toggleReactionApi, addNotification
  } = useMessages();
  const { t } = useTheme();
  const {
    allUsers, userTeams,
    friendsList, setFriendsList,
    pendingRequests, setPendingRequests,
  } = useAppData();

  const dataLoading = allUsers.length === 0 && userTeams.length === 0;

  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeDmUserId, setActiveDmUserId] = useState(null);
  const [dmSearch, setDmSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [teamChannels, setTeamChannels] = useState([]);

  // Fetch channels when active team changes
  useEffect(() => {
    if (!activeTeamId) { setTeamChannels([]); return; }
    let cancelled = false;
    channelsApi.list(activeTeamId).then(data => {
      if (!cancelled) setTeamChannels(data.channels || []);
    }).catch(() => {
      if (!cancelled) setTeamChannels([]);
    });
    return () => { cancelled = true; };
  }, [activeTeamId]);

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

  const getUserById = useCallback((id) => {
    if (id === currentUser?.id) return currentUser;
    return allUsers.find(u => u.id === id) || null;
  }, [allUsers, currentUser]);

  const activeTeam = userTeams.find(tm => tm.id === activeTeamId);
  const activeChannel = teamChannels.find(ch => ch.id === activeChannelId);

  // DM list shows only accepted friends
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

  const handleSelectChannel = useCallback((channelId) => {
    setActiveDmUserId(null);
    setMobileShowChat(true);
    openChannel(channelId);
  }, [openChannel]);

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
      } else if (activeChannelId) {
        await sendChannelMessage(activeChannelId, msgText);
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
  }, [activeDmUserId, activeChannelId, activeTeamId, sendMessage, sendChannelMessage, sendTeamMessage, allUsers, currentUser, addNotification, t]);

  // Determine header info
  const renderChannelIcon = (type, size = 17) => {
    if (type === 'announcement') return <Megaphone size={size} className="text-amber-400" />;
    if (type === 'private') return <Lock size={size} className="text-kodo-text-muted" />;
    return <Hash size={size} className="text-kodo-text-muted" />;
  };

  const canSend = !!(activeDmUserId || activeTeamId || activeChannelId);

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
        teamChannels={teamChannels}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
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
          ) : activeChannel ? (
            <>
              {renderChannelIcon(activeChannel.channel_type)}
              <span className="text-[14px] sm:text-[15px] font-semibold text-white truncate">{activeChannel.name}</span>
              {activeChannel.description && (
                <span className="text-[12px] text-kodo-text-dim ml-1 hidden sm:inline truncate">
                  · {activeChannel.description}
                </span>
              )}
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
            activeChannel={activeChannel}
            getUserById={getUserById}
            toggleReaction={toggleReaction}
          />
        </div>
        <ComposeBox
          activeDmUserId={activeDmUserId}
          dmUser={dmUser}
          activeTeam={activeTeam}
          activeChannel={activeChannel}
          allUsers={allUsers}
          currentUser={currentUser}
          onSend={handleSend}
        />
      </div>

      {showFindFriends && (
        <FindFriendsModal
          friendIds={new Set(friendsList.map(f => f.id))}
          pendingRequests={pendingRequests}
          setPendingRequests={setPendingRequests}
          setFriendsList={setFriendsList}
          onClose={() => setShowFindFriends(false)}
        />
      )}
    </div>
  );
}
