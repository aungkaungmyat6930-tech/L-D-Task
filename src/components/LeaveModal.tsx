import React, { useState, useEffect } from 'react';
import { LeaveRequest, UserProfile, LeaveType, LeaveStatus, LeaveAttachment } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  WEEKDAY_CODES,
  WeekdayCode,
  getMonthKey,
  getDayOfWeekCode,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekOrdinal,
  getDefaultDateForMonthWeek,
  getDateForWeekAndWeekday,
  formatMonthLabel,
} from '../utils/weekHelpers';
import { isAdminOrSuper, canApproveLeave } from '../utils/roleHelpers';
import { processLeaveAttachmentFile } from '../utils/imageUpload';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { X, Check, CalendarDays, ShieldCheck, FileCheck2, Paperclip, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveToEdit: LeaveRequest | null;
  targetMember?: UserProfile | null;
  defaultDate?: string;
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
  defaultDate,
  currentUser,
  allUsers,
  onSaveLeave,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApprove = canApproveLeave(currentUser.roleTier);

  const [memberId, setMemberId] = useState(currentUser.id);
  const [type, setType] = useState<LeaveType>('Casual Leave');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<LeaveAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<LeaveAttachment | null>(null);

  // Admin HR Alignment States
  const [status, setStatus] = useState<LeaveStatus>('Pending');
  const [hrRefId, setHrRefId] = useState('');
  const [hrSynced, setHrSynced] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    setAttachmentError(null);
    if (leaveToEdit) {
      setMemberId(leaveToEdit.memberId || (targetMember ? targetMember.id : currentUser.id));
      setType(leaveToEdit.type);
      setStart(leaveToEdit.start);
      setEnd(leaveToEdit.end);
      setDuration(leaveToEdit.duration);
      setReason(leaveToEdit.reason);
      setAttachments(leaveToEdit.attachments || []);
      setStatus(leaveToEdit.status);
      setHrRefId(leaveToEdit.hrRefId || '');
      setHrSynced(Boolean(leaveToEdit.hrSynced));
      setAdminNote(leaveToEdit.adminNote || '');
    } else {
      const initDate = defaultDate || new Date().toISOString().split('T')[0];
      setMemberId(targetMember ? targetMember.id : currentUser.id);
      setType('Casual Leave');
      setStart(initDate);
      setEnd(initDate);
      setDuration(1);
      setReason('');
      setAttachments([]);
      setStatus('Pending');
      setHrRefId('');
      setHrSynced(false);
      setAdminNote('');
    }
  }, [leaveToEdit, targetMember, defaultDate, currentUser, isOpen]);

  if (!isOpen) return null;

  const selectedMonthKey = getMonthKey(start);
  const selectedWeek = getWeekOfMonth(start);
  const selectedWeekday = getDayOfWeekCode(start);
  const weeksInMonth = getWeeksInMonth(selectedMonthKey);

  const handleStartEndChange = (nextStart: string, nextEnd: string) => {
    setStart(nextStart);
    const resolvedEnd = nextEnd < nextStart ? nextStart : nextEnd;
    setEnd(resolvedEnd);
    const sDate = new Date(nextStart);
    const eDate = new Date(resolvedEnd);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
      const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays >= 1) {
        setDuration(diffDays);
      }
    }
  };

  const handleSelectWeek = (wk: 1 | 2 | 3 | 4 | 5) => {
    const targetDt = getDefaultDateForMonthWeek(selectedMonthKey, wk, selectedWeekday);
    handleStartEndChange(targetDt, targetDt);
  };

  const handleSelectWeekday = (wd: WeekdayCode) => {
    const targetDt = getDateForWeekAndWeekday(selectedMonthKey, selectedWeek, wd);
    handleStartEndChange(targetDt, targetDt);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const added: LeaveAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const processed = await processLeaveAttachmentFile(files[i]);
        added.push(processed);
      } catch (err: any) {
        setAttachmentError(err?.message || 'Unable to attach file.');
      }
    }

    if (added.length > 0) {
      setAttachments((prev) => [...prev, ...added]);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const selectedMember = allUsers.find((u) => u.id === memberId) || currentUser;

    const payload: Partial<LeaveRequest> = {
      id: leaveToEdit?.id,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      type,
      start,
      end,
      duration: Number(duration) || 1,
      reason: reason.trim(),
      attachments,
    };

    if (isAdmin) {
      if (canApprove) {
        payload.status = status;
      }
      payload.hrRefId = hrRefId.trim() || undefined;
      payload.hrSynced = hrSynced;
      payload.adminNote = adminNote.trim() || undefined;
    }

    onSaveLeave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {leaveToEdit
                  ? isAdmin
                    ? language === 'my'
                      ? 'ခွင့်မှတ်တမ်း ပြင်ဆင်ရန် / HR နှင့်ကိုက်ညှိရန်'
                      : 'Edit & Align Leave with HR'
                    : language === 'my'
                    ? 'ခွင့်မှတ်တမ်း ပြင်ဆင်ရန်'
                    : 'Edit Leave Record'
                  : t.submitLeave}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my'
                  ? 'ကိုယ့်နာမည်အောက်တွင် ခွင့်ရက်တင်သွင်းခြင်းနှင့် HR ခွင့်စာရင်း ချိန်ညှိခြင်း'
                  : 'Submit leave plan & align with HR leave records'}
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
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">
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
                <option value="Casual Leave">Casual Leave (ရှောင်တခင်ခွင့်)</option>
                <option value="Earned Leave">Earned Leave (လုပ်သက်ခွင့်)</option>
                <option value="Medical Leave">Medical Leave (ဆေးခွင့်)</option>
                <option value="Replacement Leave">Replacement Leave (အစားထိုးခွင့်)</option>
                <option value="Training/Exam Leave">Training/Exam Leave (စာမေးပွဲ/သင်တန်းခွင့်)</option>
                <option value="Maternity/Paternity Leave">Maternity/Paternity Leave (မီးဖွားခွင့်)</option>
                <option value="Compassionate Leave">Compassionate Leave (သာရေး/နာရေးခွင့်)</option>
                <option value="Unpaid Leave">Unpaid Leave (လစာမဲ့ခွင့်)</option>
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
                onChange={(e) => setDuration(parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.startDate} <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-bold text-teal-700">
                  {formatMonthLabel(selectedMonthKey, language)} · {getWeekOrdinal(selectedWeek)} · {selectedWeekday}
                </span>
              </label>
              <input
                type="date"
                required
                value={start}
                onChange={(e) => handleStartEndChange(e.target.value, end)}
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
                onChange={(e) => handleStartEndChange(start, e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Auto-Synced Week & Weekday Quick Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div>
              <span className="block text-[10px] font-bold text-slate-600 mb-1.5">
                {language === 'my' ? 'လအလိုက် အပတ်စဉ် (Date ရွေးလျှင် အလိုအလျောက်ရွေးပေးမည်)' : 'Week of Month (auto-syncs with date)'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weeksInMonth.map((wk) => (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => handleSelectWeek(wk)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedWeek === wk
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {getWeekOrdinal(wk)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-600 mb-1.5">
                {language === 'my' ? 'နေ့ရက် (Mon – Sun တိုက်ရိုက်ရွေးရန်)' : 'Weekday (Mon – Sun quick select)'}
              </span>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_CODES.map((wd) => (
                  <button
                    key={wd}
                    type="button"
                    onClick={() => handleSelectWeekday(wd)}
                    className={`py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedWeekday === wd
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {wd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason & Supporting PDF / Photo Attachments */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.reason} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State reason for leave and hand-over notes..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    {language === 'my'
                      ? 'အထောက်အထား ဖိုင်ပူးတွဲရန် (PDF / Photo)'
                      : 'Supporting Documents (PDF / Photo)'}
                  </span>
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-700 rounded-lg text-[11px] font-bold cursor-pointer transition shadow-xs">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{language === 'my' ? '+ PDF / ဓာတ်ပုံ ထည့်ရန်' : '+ Attach PDF / Photo'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {attachmentError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">
                  {attachmentError}
                </p>
              )}

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] max-w-full shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="flex items-center gap-1.5 min-w-0 hover:text-teal-700 transition text-left"
                        title={language === 'my' ? 'ဖိုင်ကြည့်ရှုရန်' : 'Preview attachment'}
                      >
                        {att.mimeType.startsWith('image/') ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {att.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== att.id))}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition shrink-0"
                        title={language === 'my' ? 'ဖယ်ရှားရန်' : 'Remove'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin HR Leave Alignment Controls */}
          {isAdmin && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>
                    {language === 'my'
                      ? 'Admin: HR ခွင့်စာရင်းနှင့် ကိုက်ညှိပြင်ဆင်မှု'
                      : 'Admin: HR Leave Alignment & Status Override'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-purple-700">
                  {canApprove ? 'SUPER ADMIN' : 'ADMIN'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    {language === 'my' ? 'ခွင့်ပြုချက် အခြေအနေ (Status)' : 'Approval Status'}
                  </label>
                  <select
                    value={status}
                    disabled={!canApprove}
                    onChange={(e) => setStatus(e.target.value as LeaveStatus)}
                    className={`w-full text-xs px-2.5 py-1.5 border border-purple-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      canApprove ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <option value="Pending">Pending (စောင့်ဆိုင်းဆဲ)</option>
                    <option value="Approved">Approved (အတည်ပြုပြီး)</option>
                    <option value="Rejected">Rejected (ငြင်းပယ်ထား)</option>
                  </select>
                  {!canApprove && (
                    <span className="block text-[10px] text-purple-700 mt-0.5 font-medium">
                      {language === 'my'
                        ? 'Super Admin သာလျှင် Leave Approval ပြောင်းလဲနိုင်ပါသည်'
                        : 'Approval status can only be changed by Super Admin'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    {language === 'my' ? 'HR ခွင့်စာရင်း Reference ID' : 'HR Leave Reference ID'}
                  </label>
                  <input
                    type="text"
                    value={hrRefId}
                    onChange={(e) => setHrRefId(e.target.value)}
                    placeholder="e.g. HR-LV-2026-042"
                    className="w-full text-xs px-2.5 py-1.5 border border-purple-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer bg-white px-3 py-2 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  checked={hrSynced}
                  onChange={(e) => setHrSynced(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'my'
                    ? 'HR Leave စနစ်မှ ခွင့်ရက်/အမျိုးအစားနှင့် တိုက်ဆိုင်ကိုက်ညီပြီး (HR Matched)'
                    : 'Verified & Matched with HR Leave System'}
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  {language === 'my' ? 'HR နှင့်ကိုက်ညှိသည့် Admin မှတ်ချက် (Admin / HR Note)' : 'Admin / HR Adjustment Note'}
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    language === 'my'
                      ? 'ဥပမာ- HR မှတ်တမ်းအရ ၁.၅ ရက်သို့ ပြင်ဆင်ချိန်ညှိပြီး...'
                      : 'e.g. Adjusted leave type/days to match HR portal record...'
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-purple-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

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

      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        language={language}
      />
    </div>
  );
};
