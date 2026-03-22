import { useState, useEffect } from 'react';
import { Plus, Lock, Globe, Users, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import Avatar, { AvatarStack } from '@/components/Avatar';
import { useProject } from '@/context/ProjectContext';
import { teams as teamsApi, users as usersApi, participants as participantsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import NewTeamModal from '@/components/NewTeamModal';
import TeamMemberPopup from '@/components/TeamMemberPopup';
import { useTheme } from '@/context/ThemeContext';

export default function TeamsPage({ onNavigate }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const { currentUser } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const { activeProject, userProjects } = useProject();
  const { t } = useTheme();

  useEffect(() => {
    setTeamsLoading(true);
    Promise.all([
      teamsApi.list().catch(() => ({ data: [] })),
      usersApi.list().catch(() => ({ data: [] })),
    ]).then(([teamsRes, usersRes]) => {
      setTeams(teamsRes.teams || teamsRes.data || []);
      setAllUsers(usersRes.users || usersRes.data || []);
      setTeamsLoading(false);
    });
  }, []);

  const getUserById = (id) => allUsers.find(u => u.id === id) || null;

  const handleTeamCreate = async (teamData) => {
    try {
      const res = await teamsApi.create({
        name: teamData.name,
        description: teamData.description,
        color: teamData.color,
        visibility: teamData.visibility,
      });
      const newTeam = res.team || res.data;
      // Add members
      if (teamData.selectedMembers?.length) {
        await Promise.all(
          teamData.selectedMembers.map(userId =>
            participantsApi.add('team', newTeam.id, userId).catch(() => {})
          )
        );
      }
      // Refresh teams
      const teamsRes = await teamsApi.list().catch(() => ({ teams: [] }));
      setTeams(teamsRes.teams || teamsRes.data || []);
      toast.success(t.teamsPage.teamCreated || 'Team created!');
    } catch (err) {
      toast.error(err.message || 'Failed to create team');
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      await participantsApi.add('team', teamId, userId);
      // Refresh teams
      const teamsRes = await teamsApi.list().catch(() => ({ teams: [] }));
      setTeams(teamsRes.teams || teamsRes.data || []);
      toast.success(t.teamsPage.memberAdded || 'Member added!');
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleTeamMessage = (team) => {
    onNavigate('messages', { teamId: team.id });
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-7 gap-2 sm:gap-3">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">{t.teamsPage.title}</h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {t.teamsPage.subtitle.replace('{n}', teams.length)} — <span className="text-indigo-400 font-medium">{activeProject?.name}</span>
          </p>
        </div>
        <button
          onClick={() => setShowNewTeamModal(true)}
          className="kodo-btn-primary flex-shrink-0"
        >
          <Plus size={16} />
          {t.teamsPage.newTeam}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
        {teams.map(team => {
          const members = (team.members || []).map(id => typeof id === 'object' ? id : getUserById(id)).filter(Boolean);
          const teamProjects = userProjects.filter(p => p.team_id === team.id);
          const isExpanded = expandedTeam === team.id;
          const availableToAdd = allUsers.filter(u => !(team.members || []).includes(u.id));

          return (
            <div
              key={team.id}
              onClick={() => {
                setExpandedTeam(isExpanded ? null : team.id);
                setShowAddMember(null);
                setSelectedMemberId(null);
              }}
              className={`kodo-card p-4 md:p-6 relative overflow-hidden cursor-pointer ${
                isExpanded ? 'bg-white/[0.06] border-white/[0.1]' : ''
              }`}
              style={isExpanded ? { borderColor: team.color + '40' } : {}}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: team.color }} />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[16px] font-bold"
                    style={{ backgroundColor: team.color + '18', color: team.color }}
                  >
                    {team.name[0]}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white">{team.name}</div>
                    <div className="text-[12px] text-kodo-text-muted">{team.description}</div>
                  </div>
                </div>
                {team.visibility === 'private' ? (
                  <Lock size={14} className="text-kodo-text-dim" />
                ) : (
                  <Globe size={14} className="text-kodo-text-dim" />
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <AvatarStack users={members} size={28} max={4} />
                <span className="text-[12px] text-kodo-text-muted">{members.length} {t.teamsPage.members}</span>
              </div>

              {isExpanded && (
                <div className="mt-5 pt-4 border-t border-white/[0.06] animate-fade-in-up">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em]">
                      {t.teamsPage.membersLabel}
                    </div>
                    {availableToAdd.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddMember(showAddMember === team.id ? null : team.id);
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 bg-kodo-accent/10 hover:bg-kodo-accent/20 px-2.5 py-1 rounded-md cursor-pointer border-none transition-colors"
                      >
                        <UserPlus size={12} />
                        {t.teamsPage.addMember}
                      </button>
                    )}
                  </div>

                  {showAddMember === team.id && (
                    <div className="mb-3 bg-white/[0.04] rounded-lg border border-white/[0.08] p-2 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                      <div className="text-[11px] text-kodo-text-dim mb-2 px-1">{t.teamsPage.selectNewMember}</div>
                      <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto">
                        {availableToAdd.map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleAddMember(team.id, u.id)}
                            className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md bg-transparent border-none cursor-pointer hover:bg-white/[0.06] transition-colors text-left"
                          >
                            <Avatar user={u} size={24} showStatus />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium text-kodo-text">{u.display_name}</div>
                              <div className="text-[10px] text-kodo-text-muted">{u.job_title}</div>
                            </div>
                            <Plus size={14} className="text-kodo-text-dim" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {members.map(u => (
                      <div key={u.id} className="relative">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId(selectedMemberId === u.id ? null : u.id);
                          }}
                          className="flex items-center gap-3 py-1 cursor-pointer hover:bg-white/[0.04] rounded-lg px-2 transition-all"
                        >
                          <Avatar user={u} size={30} showStatus />
                          <div>
                            <div className="text-[13px] font-medium text-kodo-text">{u.display_name}</div>
                            <div className="text-[11px] text-kodo-text-muted">{u.job_title}</div>
                          </div>
                        </div>

                        {selectedMemberId === u.id && (
                          <TeamMemberPopup
                            user={u}
                            onClose={() => setSelectedMemberId(null)}
                            onNavigate={onNavigate}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeamMessage(team);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-kodo-accent/15 text-indigo-400 text-[13px] font-medium cursor-pointer border-none hover:bg-kodo-accent/25 transition-colors"
                    >
                      <MessageSquare size={15} />
                      {t.teamsPage.startChat}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NewTeamModal
        isOpen={showNewTeamModal}
        onClose={() => setShowNewTeamModal(false)}
        onTeamCreate={handleTeamCreate}
        availableUsers={allUsers}
      />
    </div>
  );
}
