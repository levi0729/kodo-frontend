import { useState, useEffect } from 'react';
import { Plus, Lock, Globe, Users, MessageSquare, UserPlus, Loader2, LogOut, Trash2, Pencil, Hash, Megaphone, X, FolderKanban } from 'lucide-react';
import Avatar, { AvatarStack } from '@/components/Avatar';
import { useProject } from '@/context/ProjectContext';
import { teams as teamsApi, participants as participantsApi, channels as channelsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import NewTeamModal from '@/components/NewTeamModal';
import TeamMemberPopup from '@/components/TeamMemberPopup';
import CreateProjectModal from '@/components/CreateProjectModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { friends as friendsApi } from '@/services/api';

function TeamChannelsSection({ team, isOwner, onStartChat }) {
  const toast = useToast();
  const { t } = useTheme();
  const tp = t.teamsPage;

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', channel_type: 'standard' });
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', action: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    channelsApi.list(team.id)
      .then(res => { if (!cancelled) setChannels(res.channels || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [team.id]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await channelsApi.create({
        team_id: team.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        channel_type: form.channel_type,
      });
      setChannels(prev => [...prev, res.channel]);
      setForm({ name: '', description: '', channel_type: 'standard' });
      setShowCreate(false);
      toast.success(tp.channelCreated);
    } catch (err) {
      toast.error(err.message || tp.channelCreateFailed);
    }
    setCreating(false);
  };

  const handleDelete = (channelId) => {
    setConfirmModal({
      open: true,
      message: tp.confirmDeleteChannel,
      action: async () => {
        try {
          await channelsApi.destroy(channelId);
          setChannels(prev => prev.filter(c => c.id !== channelId));
          toast.success(tp.channelDeleted);
        } catch (err) {
          toast.error(err.message || tp.channelDeleteFailed);
        }
        setConfirmModal({ open: false, message: '', action: null });
      },
    });
  };

  const iconFor = (type) => {
    if (type === 'announcement') return <Megaphone size={13} className="text-orange-400" />;
    if (type === 'private') return <Lock size={13} className="text-kodo-text-dim" />;
    return <Hash size={13} className="text-kodo-text-dim" />;
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em]">
          {tp.channels}
        </div>
        {isOwner && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 bg-kodo-accent/10 hover:bg-kodo-accent/20 px-2.5 py-1 rounded-md cursor-pointer border-none transition-colors"
          >
            <Plus size={12} />
            {tp.newChannel}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-3 bg-white/[0.04] rounded-lg border border-white/[0.08] p-3 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-kodo-text-dim">{tp.newChannel}</span>
            <button
              onClick={() => { setShowCreate(false); setForm({ name: '', description: '', channel_type: 'standard' }); }}
              className="text-kodo-text-dim hover:text-kodo-text p-0.5 cursor-pointer bg-transparent border-none"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={tp.channelName}
            className="w-full px-2 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[12px] text-white mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={tp.channelDescription}
            className="w-full px-2 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[12px] text-kodo-text-muted mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex gap-1 mb-2">
            {[
              { key: 'standard', label: tp.channelTypeStandard },
              { key: 'private', label: tp.channelTypePrivate },
              { key: 'announcement', label: tp.channelTypeAnnouncement },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setForm(f => ({ ...f, channel_type: opt.key }))}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all border ${
                  form.channel_type === opt.key
                    ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
                    : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !form.name.trim()}
            className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[11px] font-medium cursor-pointer border-none hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creating && <Loader2 size={12} className="animate-spin" />}
            {tp.create}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-[12px] text-kodo-text-dim py-2">
          <Loader2 size={13} className="inline animate-spin mr-1" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-[12px] text-kodo-text-dim py-2">{tp.noChannels}</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {channels.map(ch => (
            <div
              key={ch.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors group"
            >
              {iconFor(ch.channel_type)}
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-kodo-text truncate">
                  {ch.name}
                  {ch.is_default && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-kodo-accent/15 text-indigo-400">
                      default
                    </span>
                  )}
                </div>
                {ch.description && (
                  <div className="text-[10.5px] text-kodo-text-muted truncate">{ch.description}</div>
                )}
              </div>
              {typeof ch.messages_count === 'number' && (
                <span className="text-[10px] text-kodo-text-dim">{ch.messages_count}</span>
              )}
              {isOwner && !ch.is_default && (
                <button
                  onClick={() => handleDelete(ch.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-kodo-text-dim hover:text-red-400 cursor-pointer bg-transparent border-none transition-all"
                  aria-label="Delete channel"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ open: false, message: '', action: null })}
      />
    </div>
  );
}

export default function TeamsPage({ onNavigate }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const { activeProject, userProjects } = useProject();
  const { t } = useTheme();
  const { allUsers, friendsList, invalidate: invalidateCache } = useAppData();
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', action: null });

  useEffect(() => {
    if (!activeProject?.id) return;
    setTeamsLoading(true);
    teamsApi.list({ project_id: activeProject.id }).catch(() => ({ data: [] })).then((teamsRes) => {
      setTeams(teamsRes.teams || teamsRes.data || []);
      setTeamsLoading(false);
    });
  }, [activeProject?.id]);

  const friendIds = new Set((friendsList || []).map(f => f.id));

  const getUserById = (id) => allUsers.find(u => u.id === id) || null;

  const handleTeamCreate = async (teamData) => {
    try {
      const projectId = teamData.project_id || activeProject?.id;
      const res = await teamsApi.create({
        name: teamData.name,
        description: teamData.description,
        color: teamData.color,
        visibility: teamData.visibility,
        project_id: projectId,
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
      // Refresh teams filtered by active project
      const teamsRes = await teamsApi.list({ project_id: activeProject?.id }).catch(() => ({ teams: [] }));
      setTeams(teamsRes.teams || teamsRes.data || []);
      toast.success(t.teamsPage.teamCreated || 'Team created!');
    } catch (err) {
      toast.error(err.message || t.teamsPage.teamCreateFailed);
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      await participantsApi.add('team', teamId, userId);
      // Refresh teams and invalidate cache so project members update too
      const teamsRes = await teamsApi.list({ project_id: activeProject?.id }).catch(() => ({ teams: [] }));
      setTeams(teamsRes.teams || teamsRes.data || []);
      invalidateCache();
      toast.success(t.teamsPage.memberAdded || 'Member added!');
    } catch (err) {
      toast.error(err.message || t.teamsPage.memberAddFailed);
    }
  };

  const handleTeamMessage = (team) => {
    onNavigate('messages', { teamId: team.id });
  };

  const TEAM_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#f97316'];

  const startEditing = (team) => {
    setEditingTeam(team.id);
    setEditForm({ name: team.name, description: team.description || '', color: team.color || '#6366f1' });
  };

  const handleEditTeam = async (teamId) => {
    try {
      await teamsApi.update(teamId, editForm);
      const teamsRes = await teamsApi.list({ project_id: activeProject?.id }).catch(() => ({ teams: [] }));
      setTeams(teamsRes.teams || teamsRes.data || []);
      setEditingTeam(null);
      toast.success(t.teamsPage.teamUpdated);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLeaveTeam = (teamId) => {
    const team = teams.find(tm => tm.id === teamId);
    const teamName = team?.name || '';
    setConfirmModal({
      open: true,
      message: (t.teamsPage.confirmLeaveNamed || t.teamsPage.confirmLeave).replace('{name}', teamName),
      action: async () => {
        try {
          await teamsApi.leave(teamId);
          setTeams(prev => prev.filter(tm => tm.id !== teamId));
          setExpandedTeam(null);
          toast.success(t.teamsPage.teamLeft);
        } catch (err) {
          toast.error(err.message);
        }
        setConfirmModal({ open: false, message: '', action: null });
      },
    });
  };

  const handleDeleteTeam = (teamId) => {
    const team = teams.find(tm => tm.id === teamId);
    const teamName = team?.name || '';
    setConfirmModal({
      open: true,
      message: (t.teamsPage.confirmDeleteNamed || t.teamsPage.confirmDelete).replace('{name}', teamName),
      action: async () => {
        try {
          await teamsApi.destroy(teamId);
          setTeams(prev => prev.filter(tm => tm.id !== teamId));
          setExpandedTeam(null);
          toast.success(t.teamsPage.teamDeleted);
        } catch (err) {
          toast.error(err.message);
        }
        setConfirmModal({ open: false, message: '', action: null });
      },
    });
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (userProjects.length === 0) {
    return (
      <div className="pb-6 md:pb-10">
        <div className="mb-4 md:mb-7">
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">{t.teamsPage.title}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-kodo-text-dim" />
          </div>
          <div className="text-[15px] font-semibold text-white mb-1">{t.teamsPage.needProjectTitle}</div>
          <div className="text-[13px] text-kodo-text-muted mb-4">{t.teamsPage.needProjectDesc}</div>
          <button onClick={() => setShowCreateProjectModal(true)} className="kodo-btn-primary">
            <Plus size={16} />
            {t.teamsPage.createProjectBtn}
          </button>
        </div>
        <CreateProjectModal isOpen={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} />
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

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Users size={28} className="text-kodo-text-dim" />
          </div>
          <div className="text-[15px] font-semibold text-white mb-1">{t.teamsPage.noTeams || 'No teams yet'}</div>
          <div className="text-[13px] text-kodo-text-muted mb-4">{t.teamsPage.noTeamsDesc || 'Create a team to start collaborating'}</div>
          <button onClick={() => setShowNewTeamModal(true)} className="kodo-btn-primary">
            <Plus size={16} />
            {t.teamsPage.newTeam}
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
        {[...teams].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)).map(team => {
          const members = (team.members || []).map(id => typeof id === 'object' ? id : getUserById(id)).filter(Boolean);
          const teamProjects = userProjects.filter(p => p.team_id === team.id);
          const isExpanded = expandedTeam === team.id;
          const isOwner = team.owner_id === currentUser?.id;
          const displayName = team.is_default ? (t.teamsPage.generalTeam || 'General') : team.name;
          const availableToAdd = allUsers.filter(u => !(team.members || []).includes(u.id) && friendIds.has(u.id));

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
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: editingTeam === team.id ? editForm.color : team.color }} />

              {editingTeam === team.id ? (
                <div className="mb-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="flex-1 px-2 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[14px] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder={t.teamsPage.editTeam}
                    />
                  </div>
                  <input
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[12px] text-kodo-text-muted mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder={t.teamsPage.channelDescription || 'Description'}
                  />
                  <div className="flex items-center gap-1.5 mb-2">
                    {TEAM_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditForm(p => ({ ...p, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${editForm.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditTeam(team.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[11px] font-medium cursor-pointer border-none hover:bg-indigo-600 transition-colors">
                      {t.settings?.save || 'Save'}
                    </button>
                    <button onClick={() => setEditingTeam(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-kodo-text-muted text-[11px] font-medium cursor-pointer border-none hover:bg-white/[0.1] transition-colors">
                      {t.newTeamModal?.cancel || 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[16px] font-bold"
                      style={{ backgroundColor: team.color + '18', color: team.color }}
                    >
                      {displayName[0]}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-white">{displayName}</div>
                      <div className="text-[12px] text-kodo-text-muted">{team.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.owner_id === currentUser?.id && !team.is_default && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(team); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent text-kodo-text-dim hover:text-indigo-400"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {team.visibility === 'private' ? (
                      <Lock size={14} className="text-kodo-text-dim" />
                    ) : (
                      <Globe size={14} className="text-kodo-text-dim" />
                    )}
                  </div>
                </div>
              )}

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
                    {isOwner && availableToAdd.length > 0 && (
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

                  <TeamChannelsSection
                    team={team}
                    isOwner={team.owner_id === currentUser?.id}
                    onStartChat={() => handleTeamMessage(team)}
                  />

                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
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
                    {!team.is_default && (
                    <div className="flex gap-2">
                      {team.owner_id === currentUser?.id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border-none hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={13} />
                          {t.teamsPage.deleteTeam}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeaveTeam(team.id); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-[12px] font-medium cursor-pointer border-none hover:bg-orange-500/20 transition-colors"
                        >
                          <LogOut size={13} />
                          {t.teamsPage.leaveTeam}
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      <NewTeamModal
        isOpen={showNewTeamModal}
        onClose={() => setShowNewTeamModal(false)}
        onTeamCreate={handleTeamCreate}
        availableUsers={allUsers.filter(u => friendIds.has(u.id))}
        projects={userProjects}
        activeProjectId={activeProject?.id}
      />
      <ConfirmModal
        isOpen={confirmModal.open}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ open: false, message: '', action: null })}
      />
    </div>
  );
}
