import React, { useState, useEffect } from 'react';
import { TaskItem, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { X, Check, CheckSquare } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: TaskItem | null;
  targetMember?: UserProfile | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveTask: (taskData: Partial<TaskItem>) => void;
  language: Language;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  targetMember,
  currentUser,
  allUsers,
  onSaveTask,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [due, setDue] = useState(new Date().toISOString().split('T')[0]);
  const [followup, setFollowup] = useState(new Date().toISOString().split('T')[0]);
  const [day, setDay] = useState<TaskItem['day']>('Wed');
  const [status, setStatus] = useState<TaskItem['status']>('Active');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setOwnerId(taskToEdit.ownerId || (targetMember ? targetMember.id : currentUser.id));
      setDue(taskToEdit.due);
      setFollowup(taskToEdit.followup);
      setDay(taskToEdit.day || 'Wed');
      setStatus(taskToEdit.status);
      setNote(taskToEdit.note || '');
    } else {
      setTitle('');
      setOwnerId(targetMember ? targetMember.id : currentUser.id);
      setDue(new Date().toISOString().split('T')[0]);
      setFollowup(new Date().toISOString().split('T')[0]);
      setDay('Wed');
      setStatus('Active');
      setNote('');
    }
  }, [taskToEdit, targetMember, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedOwner = allUsers.find((u) => u.id === ownerId) || currentUser;

    onSaveTask({
      id: taskToEdit?.id,
      title: title.trim(),
      ownerId: selectedOwner.id,
      ownerName: selectedOwner.name,
      due,
      followup,
      day,
      status,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {taskToEdit ? (language === 'my' ? 'Task ပြင်ဆင်ရန်' : 'Edit Task') : (language === 'my' ? 'Task အသစ်ထည့်ရန်' : 'Add New Task')}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my' ? 'ကိုယ့်နာမည်အောက်တွင် Task ထည့်သွင်းစီမံခြင်း' : 'Manage department or personal tasks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.taskTitle} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct Agent Onboarding Assessment"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
            />
          </div>

          {/* Owner & Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.assignee}</span>
                {targetMember && (
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                    Direct for: {targetMember.name}
                  </span>
                )}
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
              >
                {allUsers
                  .filter((u) => u.roleTier !== 'VIEWER')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleLabel})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {language === 'my'
                  ? `တာဝန်ယူသူအဖြစ် ${allUsers.find((u) => u.id === ownerId)?.name || ''} ကို တိုက်ရိုက်သတ်မှတ်ထားပါသည်`
                  : `Assigning task to ${allUsers.find((u) => u.id === ownerId)?.name || ''}`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'my' ? 'အပတ်စဉ် ရက် (Day)' : 'Weekly Schedule Day'}
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as TaskItem['day'])}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Mon">Monday (တနင်္လာ)</option>
                <option value="Tue">Tuesday (အင်္ဂါ)</option>
                <option value="Wed">Wednesday (ဗုဒ္ဓဟူး)</option>
                <option value="Thu">Thursday (ကြာသပတေး)</option>
                <option value="Fri">Friday (သောကြာ)</option>
                <option value="Sat">Saturday (စနေ)</option>
                <option value="Sun">Sunday (တနင်္ဂနွေ)</option>
              </select>
            </div>
          </div>

          {/* Due Date & Next Followup Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.dueDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.nextFollowup} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.status}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskItem['status'])}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="Active">{t.inProgress}</option>
              <option value="Waiting">{t.waiting}</option>
              <option value="Completed">{t.completed}</option>
              <option value="Overdue">{t.overdue}</option>
              <option value="Cancelled">{t.cancelled}</option>
            </select>
          </div>

          {/* Follow-up / Progress Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.note}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Next steps, current obstacles, or completion notes..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>{taskToEdit ? (language === 'my' ? 'ပြင်ဆင်မှု သိမ်းဆည်းရန်' : 'Save Changes') : t.saveTask}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
