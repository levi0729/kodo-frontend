import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check, Square, CheckSquare, Trash2, Clock, Loader2, GripVertical } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import ProgressBar from '@/components/ProgressBar';
import { checklists as checklistsApi } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useTasks } from '@/context/TasksContext';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { t, language } = useTheme();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';
  const td = t.taskDetail;
  const { updateTask, deleteTask } = useTasks();
  const modalRef = useRef(null);

  const [checklistItems, setChecklistItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [localDescription, setLocalDescription] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalDescription(task.description || '');
      loadChecklists();
    }
  }, [task?.id]);

  const loadChecklists = async () => {
    if (!task) return;
    setChecklistLoading(true);
    try {
      const data = await checklistsApi.list(task.id);
      const lists = data.checklists || data.data || [];
      const items = lists.flatMap(cl =>
        (cl.items || []).map(item => ({ ...item, checklist_id: cl.id }))
      );
      setChecklistItems(items);
    } catch {
      // API may not exist yet — use empty
      setChecklistItems([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const toggleItem = async (item) => {
    const updated = { ...item, is_completed: !item.is_completed };
    setChecklistItems(prev => prev.map(i => i.id === item.id ? updated : i));
    try {
      await checklistsApi.updateItem(task.id, item.checklist_id, item.id, { is_completed: updated.is_completed });
    } catch {
      // Revert on failure
      setChecklistItems(prev => prev.map(i => i.id === item.id ? item : i));
    }
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;
    const tempId = Date.now();
    const tempItem = { id: tempId, title: newItemText.trim(), is_completed: false };
    setChecklistItems(prev => [...prev, tempItem]);
    setNewItemText('');

    try {
      // Try to create via API — will fail gracefully if backend doesn't support it
      const data = await checklistsApi.create(task.id, { title: 'Checklist' });
      const cl = data.checklist || data.data;
      if (cl) {
        const itemData = await checklistsApi.addItem(task.id, cl.id, { title: tempItem.title });
        const realItem = itemData.item || itemData.data;
        if (realItem) {
          setChecklistItems(prev => prev.map(i => i.id === tempId ? { ...realItem, checklist_id: cl.id } : i));
        }
      }
    } catch {
      // Keep local item even if API fails
    }
  };

  const removeItem = (itemId) => {
    setChecklistItems(prev => prev.filter(i => i.id !== itemId));
  };

  const saveDescription = async () => {
    setEditingDesc(false);
    if (localDescription !== task.description) {
      await updateTask(task.id, { description: localDescription });
    }
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const completedCount = checklistItems.filter(i => i.is_completed).length;
  const totalCount = checklistItems.length;
  const checklistProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const statusColors = {
    todo: '#94a3b8',
    in_progress: '#818cf8',
    in_review: '#fbbf24',
    done: '#4ade80',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[580px] max-h-[90vh] overflow-y-auto animate-fade-in-up mx-2 sm:mx-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-white/[0.06]">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-[18px] font-semibold text-white leading-tight">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span className="text-[11px] text-kodo-text-dim flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(task.due_date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          {/* Labels */}
          {(task.labels || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {task.labels.map(l => (
                <span key={l} className="text-[11px] px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 font-medium">
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <h3 className="text-[12px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em] mb-2">
              {td.description}
            </h3>
            {editingDesc ? (
              <div>
                <textarea
                  value={localDescription}
                  onChange={e => setLocalDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveDescription} className="text-[11px] px-2.5 py-1 rounded bg-indigo-500 text-white cursor-pointer border-none font-medium">
                    {t.common.save}
                  </button>
                  <button onClick={() => { setEditingDesc(false); setLocalDescription(task.description || ''); }} className="text-[11px] px-2.5 py-1 rounded bg-white/[0.04] text-kodo-text-muted cursor-pointer border border-white/[0.08] font-medium">
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className="text-[13px] text-kodo-text-secondary cursor-pointer hover:bg-white/[0.04] rounded-lg p-2 -m-2 transition-colors min-h-[40px]"
              >
                {task.description || td.descriptionPlaceholder}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em]">
                {td.checklist}
              </h3>
              {totalCount > 0 && (
                <span className="text-[11px] text-kodo-text-dim">{completedCount}/{totalCount}</span>
              )}
            </div>

            {totalCount > 0 && (
              <div className="mb-3">
                <ProgressBar value={checklistProgress} color="#818cf8" height={4} />
              </div>
            )}

            {checklistLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-kodo-text-dim" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {checklistItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                  >
                    <button
                      onClick={() => toggleItem(item)}
                      className="flex-shrink-0 cursor-pointer bg-transparent border-none p-0 text-kodo-text-dim hover:text-indigo-400 transition-colors"
                    >
                      {item.is_completed ? (
                        <CheckSquare size={16} className="text-indigo-400" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <span className={`text-[13px] flex-1 ${item.is_completed ? 'text-kodo-text-dim line-through' : 'text-kodo-text'}`}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-kodo-text-dim hover:text-red-400 cursor-pointer bg-transparent border-none p-0.5 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                placeholder={td.addItem}
                className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              />
              <button
                onClick={addItem}
                disabled={!newItemText.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-[11px] font-medium cursor-pointer border-none hover:bg-indigo-500/25 transition-colors disabled:opacity-40"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Assignees */}
          {task.assignee_users?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[12px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em] mb-2">
                {td.assignees}
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.assignee_users.map(u => (
                  <div key={u.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.04] rounded-lg">
                    <Avatar user={u} size={20} />
                    <span className="text-[12px] text-kodo-text">{u.display_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task meta */}
          {task.estimated_hours > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-kodo-text-dim mb-4">
              <Clock size={13} />
              {td.estimated.replace('{n}', task.estimated_hours)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 md:px-6 py-3 border-t border-white/[0.06]">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 text-[12px] font-medium cursor-pointer border-none bg-transparent hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
            {t.common.delete}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-muted text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            {td.close}
          </button>
        </div>
      </div>
    </div>
  );
}
