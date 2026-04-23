import { useState, useEffect, useCallback, useRef } from 'react';
import { Hash, ChevronLeft, Loader2, Lock, Megaphone, Users } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ChannelSidebar from '@/components/messages/ChannelSidebar';
import MessageThread from '@/components/messages/MessageThread';
import ComposeBox from '@/components/messages/ComposeBox';
import FindFriendsModal from '@/components/messages/FindFriendsModal';
import CreateGroupModal from '@/components/messages/CreateGroupModal';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { channels as channelsApi, chat as chatApi } from '@/services/api';

export default function MessagesPage({ dmUserId, teamId }) {
  const { currentUser } = useAuth();
  const {
    messages, messagesLoading, activeRoomId,
    openDM, openTeamRoom, openChannel, activeChannelId,
    sendMessage, sendTeamMessage, sendChannelMessage,
    activeConversationId, groupConversations,
    openConversation, sendConversationMessage, createGroupConversation,
    toggleReaction: toggleReactionApi,
    wsStatus,
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
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [teamChannels, setTeamChannels] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Typing indicator - poll who's typing in the current room
  const typingPollRef = useRef(null);
  useEffect(() => {
    if (typingPollRef.current) clearInterval(typingPollRef.current);
    setTypingUsers([]);
    if (!activeRoomId) return;
    const poll = () => {
      chatApi.getTypingStatus(activeRoomId)
        .then(data => setTypingUsers(data.typing_user_ids || []))
        .catch(() => {});
    };
    poll();
    typingPollRef.current = setInterval(poll, 3000);
    return () => clearInterval(typingPollRef.current);
  }, [activeRoomId]);

  const handleTyping = useCallback(() => {
    if (activeRoomId) {
      chatApi.sendTyping(activeRoomId).catch(() => {});
    }
  }, [activeRoomId]);

  const typingUserNames = typingUsers
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean)
    .map(u => u.display_name);

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
  const activeConversation = groupConversations.find(g => g.id === activeConversationId);

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

  const handleSelectConversation = useCallback((conversationId) => {
    setActiveDmUserId(null);
    setActiveTeamId(null);
    setMobileShowChat(true);
    openConversation(conversationId);
  }, [openConversation]);

  const handleSend = useCallback(async (msgText, fileList) => {
    try {
      if (activeDmUserId) {
        await sendMessage(activeDmUserId, msgText, fileList);
      } else if (activeConversationId) {
        await sendConversationMessage(activeConversationId, msgText);
      } else if (activeChannelId) {
        await sendChannelMessage(activeChannelId, msgText);
      } else if (activeTeamId) {
        await sendTeamMessage(activeTeamId, msgText, fileList);
      }
    } catch { /* handled by context */ }
  }, [activeDmUserId, activeConversationId, activeChannelId, activeTeamId, sendMessage, sendConversationMessage, sendChannelMessage, sendTeamMessage]);

  // Determine header info
  const renderChannelIcon = (type, size = 17) => {
    if (type === 'announcement') return <Megaphone size={size} className="text-amber-400" />;
    if (type === 'private') return <Lock size={size} className="text-kodo-text-muted" />;
    return <Hash size={size} className="text-kodo-text-muted" />;
  };

  const canSend = !!(activeDmUserId || activeTeamId || activeChannelId || activeConversationId);

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
        groupConversations={groupConversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewGroup={() => setShowCreateGroup(true)}
      />
      <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        <div className="h-[52px] flex items-center gap-2.5 px-3 md:px-6 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => setMobileShowChat(false)}
            aria-label={t.common.back || 'Back'}
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
          ) : activeConversation ? (
            <>
              <Users size={17} className="text-kodo-text-muted" />
              <span className="text-[14px] sm:text-[15px] font-semibold text-white truncate">{activeConversation.name}</span>
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
          <div className="ml-auto flex items-center gap-1.5" title={wsStatus === 'connected' ? 'Real-time' : wsStatus === 'connecting' ? 'Connecting...' : 'Polling'}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              wsStatus === 'connected' ? 'bg-green-400' :
              wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-kodo-text-dim'
            }`} />
            <span className="text-[10px] text-kodo-text-dim hidden sm:inline">
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? '...' : ''}
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-6 py-4">
          <MessageThread
            messages={messages}
            messagesLoading={messagesLoading}
            activeDmUserId={activeDmUserId}
            dmUser={dmUser}
            activeTeam={activeTeam}
            activeChannel={activeChannel}
            activeConversation={activeConversation}
            getUserById={getUserById}
            toggleReaction={toggleReaction}
          />
        </div>
        {typingUserNames.length > 0 && (
          <div className="px-3 md:px-6 py-1">
            <div className="flex items-center gap-2 text-[12px] text-kodo-text-muted animate-pulse">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUserNames.length === 1
                  ? `${typingUserNames[0]} ${t.messagesPage.isTyping || 'is typing...'}`
                  : `${typingUserNames.join(', ')} ${t.messagesPage.areTyping || 'are typing...'}`
                }
              </span>
            </div>
          </div>
        )}
        <ComposeBox
          activeDmUserId={activeDmUserId}
          dmUser={dmUser}
          activeTeam={activeTeam}
          activeChannel={activeChannel}
          activeConversation={activeConversation}
          allUsers={allUsers}
          currentUser={currentUser}
          onSend={handleSend}
          onTyping={handleTyping}
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
      {showCreateGroup && (
        <CreateGroupModal
          allUsers={allUsers}
          currentUser={currentUser}
          onClose={() => setShowCreateGroup(false)}
          onCreate={createGroupConversation}
        />
      )}
    </div>
  );
}
