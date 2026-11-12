import React, { useState, useEffect } from 'react';
import { LeaveRequest, UserProfile, LeaveType } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { X, Check, CalendarDays } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveToEdit: LeaveRequest | null;
  targetMember?: UserProfile | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveLeave: (leaveData: Partial<LeaveRequest>) => void;
  language: Language;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  leaveToEdit,
  targetMember,
  currentUser,
  allUsers,
  onSaveLeave,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const [memberId, setMemberId] = useState(currentUser.id);
  const [type, setType] = useState<LeaveType>('Casual Leave');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (leaveToEdit) {
      setMemberId(leaveToEdit.memberId || (targetMember ? targetMember.id : currentUser.id));
      setType(leaveToEdit.type);
      setStart(leaveToEdit.start);
      setEnd(leaveToEdit.end);
      setDuration(leaveToEdit.duration);
      setReason(leaveToEdit.reason);
    } else {
      setMemberId(targetMember ? targetMember.id : currentUser.id);
      setType('Casual Leave');
      setStart(new Date().toISOString().split('T')[0]);
      setEnd(new Date().toISOString().split('T')[0]);
      setDuration(1);
      setReason('');
    }
  }, [leaveToEdit, targetMember, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const selectedMember = allUsers.find((u) => u.id === memberId) || currentUser;

    onSaveLeave({
      id: leaveToEdit?.id,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      type,
      start,
      end,
      duration: Number(duration) || 1,
      reason: reason.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {leaveToEdit ? (language === 'my' ? 'ခွင့်မှတ်တမ်း ပြင်ဆင်ရန်' : 'Edit Leave Record') : t.submitLeave}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my' ? 'ကိုယ့်နာမည်အောက်တွင် ခွင့်ရက်တင်သွင်းခြင်း' : 'Submit or edit advance leave plan'}
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
          {/* Member Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{language === 'my' ? 'ခွင့်တောင်းခံသူ (Team Member)' : 'Team Member'}</span>
              {targetMember && (
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded">
                  Direct for: {targetMember.name}
                </span>
              )}
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
            >
              {allUsers
                .filter((u) => u.roleTier !== 'VIEWER')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleLabel})
                  </option>
                ))}
            </select>
            <span className="text-[10px] text-teal-600 block mt-0.5 font-medium">
              {language === 'my'
                ? `${allUsers.find((u) => u.id === memberId)?.name || ''} အမည်အောက်တွင် ခွင့်ရက် တင်သွင်းပါမည်`
                : `Submitting leave request under ${allUsers.find((u) => u.id === memberId)?.name || ''}`}
            </span>
          </div>

          {/* Leave Type & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.leaveType}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Casual Leave">Casual Leave (လုပ်သက်ခွင့်/ရှောင်တခင်ခွင့်)</option>
                <option value="Earned Leave">Earned Leave (နှစ်စဉ်ခံစားခွင့်)</option>
                <option value="Medical Leave">Medical Leave (ဆေးခွင့်)</option>
                <option value="Training/Exam Leave">Training/Exam Leave (စာမေးပွဲ/သင်တန်းခွင့်)</option>
                <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.durationDays} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.startDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.endDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.reason} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State reason for leave and hand-over notes..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>{leaveToEdit ? (language === 'my' ? 'သိမ်းဆည်းရန်' : 'Save Changes') : t.submitLeave}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
