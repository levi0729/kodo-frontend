import { Search, UserPlus, Hash, Lock, Megaphone, Users, Plus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

function ChannelIcon({ type, size = 13 }) {
  if (type === 'announcement') return <Megaphone size={size} className="text-amber-400 flex-shrink-0" />;
  if (type === 'private') return <Lock size={size} className="text-kodo-text-dim flex-shrink-0" />;
  return <Hash size={size} className="text-kodo-text-dim flex-shrink-0" />;
}

export default function ChannelSidebar({
  userTeams, activeTeamId, activeDmUserId,
  filteredMembers, dmSearch, setDmSearch,
  pendingRequests, onSelectTeam, onSelectDm, onFindFriends,
  mobileShowChat,
  teamChannels, activeChannelId, onSelectChannel,
  groupConversations, activeConversationId, onSelectConversation, onNewGroup,
}) {
  const { t } = useTheme();

  return (
    <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-[220px] border-r-0 md:border-r border-white/[0.06] flex-col flex-shrink-0`}>
      <div className="p-4">
        <div className="kodo-section-title">{t.messagesPage.teams}</div>
        <div className="flex flex-col gap-0.5">
          {userTeams.map(tm => (
            <div key={tm.id}>
              <button
                onClick={() => onSelectTeam(tm.id)}
                className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none text-left ${
                  activeTeamId === tm.id && !activeDmUserId && !activeChannelId
                    ? 'bg-kodo-accent/10 text-indigo-400'
                    : activeTeamId === tm.id && !activeDmUserId
                      ? 'bg-white/[0.03] text-kodo-text-secondary'
                      : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: tm.color }}
                />
                {tm.name}
              </button>
              {/* Show channels when this team is active */}
              {activeTeamId === tm.id && !activeDmUserId && teamChannels.length > 0 && (
                <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
                  {teamChannels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => onSelectChannel(ch.id)}
                      className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all border-none text-left ${
                        activeChannelId === ch.id
                          ? 'bg-kodo-accent/10 text-indigo-400'
                          : 'bg-transparent text-kodo-text-dim hover:bg-white/[0.04] hover:text-kodo-text-muted'
                      }`}
                    >
                      <ChannelIcon type={ch.channel_type} size={12} />
                      <span className="truncate">{ch.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between mb-1">
          <div className="kodo-section-title m-0">{t.messagesPage.groups}</div>
          <button
            onClick={onNewGroup}
            className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-none"
            title={t.messagesPage.newGroup}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {groupConversations.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectConversation(g.id)}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none text-left ${
                activeConversationId === g.id
                  ? 'bg-kodo-accent/10 text-indigo-400'
                  : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
              }`}
            >
              <Users size={14} className="text-kodo-text-dim flex-shrink-0" />
              <span className="truncate">{g.name}</span>
            </button>
          ))}
          {groupConversations.length === 0 && (
            <div className="text-[12px] text-kodo-text-dim px-2.5 py-1">{t.messagesPage.noGroups}</div>
          )}
        </div>
      </div>
      <div className="p-4 pt-0 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1">
          <div className="kodo-section-title m-0">{t.messagesPage.directMessages}</div>
          <div className="flex items-center gap-1">
            {pendingRequests.length > 0 && (
              <span className="text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
            <button
              onClick={onFindFriends}
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
              onClick={() => onSelectDm(u.id)}
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
                  onClick={onFindFriends}
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
  );
}
