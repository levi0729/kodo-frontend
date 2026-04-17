import { Search, UserPlus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

export default function ChannelSidebar({
  userTeams, activeTeamId, activeDmUserId,
  filteredMembers, dmSearch, setDmSearch,
  pendingRequests, onSelectTeam, onSelectDm, onFindFriends,
  mobileShowChat,
}) {
  const { t } = useTheme();

  return (
    <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-[220px] border-r-0 md:border-r border-white/[0.06] flex-col flex-shrink-0`}>
      <div className="p-4">
        <div className="kodo-section-title">{t.messagesPage.teams}</div>
        <div className="flex flex-col gap-0.5">
          {userTeams.map(tm => (
            <button
              key={tm.id}
              onClick={() => onSelectTeam(tm.id)}
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
