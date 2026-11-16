import React, { useState, useEffect } from 'react';
import {
  LeaveRequest,
  LeaveAttachment,
  UserProfile,
  TaskItem,
  TrainingLog,
  AttendanceRecord,
  AttendanceOverrideStatus,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { isAdminOrSuper, canApproveLeave } from '../utils/roleHelpers';
import { 
  CalendarDays, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  FileText
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { TrainingTeamAttendanceMatrix } from './TrainingTeamAttendanceMatrix';

interface LeaveTabProps {
  leaves: LeaveRequest[];
  tasks: TaskItem[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  filterRequest?: {
    filter: 'all' | 'my' | 'pending' | 'approved' | 'rejected' | 'hr-unsynced';
    key: number;
  } | null;
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onDeleteLeave: (leaveId: string) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onSetAttendanceOverride: (
    memberId: string,
    date: string,
    status: AttendanceOverrideStatus | null,
    note?: string
  ) => void;
  language: Language;
}

export const LeaveTab: React.FC<LeaveTabProps> = ({
  leaves,
  tasks,
  trainingLogs,
  attendanceOverrides,
  currentUser,
  allUsers,
  filterRequest,
  onOpenAddLeave,
  onOpenMemberSheet,
  onOpenEditLeave,
  onDeleteLeave,
  onApproveLeave,
  onSetAttendanceOverride,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | 'my' | 'pending' | 'approved' | 'rejected' | 'hr-unsynced'>('all');
  const [search, setSearch] = useState('');
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<LeaveAttachment | null>(null);

  useEffect(() => {
    if (filterRequest) {
      setFilter(filterRequest.filter);
    }
  }, [filterRequest]);

  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApprove = canApproveLeave(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';

  const filteredLeaves = leaves.filter((leave) => {
    if (filter === 'my') {
      const isMine = leave.memberId === currentUser.id || leave.memberName === currentUser.name;
      if (!isMine) return false;
    } else if (filter === 'pending') {
      if (leave.status !== 'Pending') return false;
    } else if (filter === 'approved') {
      if (leave.status !== 'Approved') return false;
    } else if (filter === 'rejected') {
      if (leave.status !== 'Rejected') return false;
    } else if (filter === 'hr-unsynced') {
      if (leave.hrSynced) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        leave.memberName.toLowerCase().includes(q) ||
        leave.type.toLowerCase().includes(q) ||
        leave.reason.toLowerCase().includes(q) ||
        (leave.hrRefId && leave.hrRefId.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            <span>{t.tabLeave}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'ကိုယ့်နာမည်အောက်တွင် ခွင့်ရက်တင်ခြင်း၊ ပြင်ခြင်း၊ ဖျက်ခြင်းနှင့် Admin အတည်ပြုမှု လုပ်ဆောင်ချက်များ'
              : 'Submit advance leave plans under your name, edit or cancel requests, and track admin approval status'}
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => onOpenAddLeave()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMyLeave}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.allRecords} ({leaves.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'my'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {language === 'my' ? 'ကိုယ့်ခွင့်ရက်' : 'My Leaves'} ({leaves.filter((l) => l.memberId === currentUser.id || l.memberName === currentUser.name).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {t.pending} ({leaves.filter((l) => l.status === 'Pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {t.approved} ({leaves.filter((l) => l.status === 'Approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            {t.rejected} ({leaves.filter((l) => l.status === 'Rejected').length})
          </button>
          <button
            onClick={() => setFilter('hr-unsynced')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'hr-unsynced'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            {language === 'my' ? 'HR ချိန်ညှိရန်ကျန်' : 'HR Pending Sync'} ({leaves.filter((l) => !l.hrSynced).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'my' ? 'အမည်၊ ခွင့်အမျိုးအစား ရှာရန်...' : 'Search leaves...'}
            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Main Leave Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    {language === 'my' ? 'ခွင့်မှတ်တမ်း မရှိပါ။' : 'No leave records match your filter.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const isMyLeave =
                    leave.memberId === currentUser.id || leave.memberName === currentUser.name;
                  const canEdit = (isMyLeave || isAdmin) && !isViewer;

                  return (
                    <tr
                      key={leave.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isMyLeave ? 'bg-teal-50/20' : ''
                      }`}
                    >
                      {/* Clean member name cell without +Leave, +Task, +Topic clutter */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            const found = allUsers.find(
                              (u) => u.id === leave.memberId || u.name === leave.memberName
                            );
                            if (found) onOpenMemberSheet(found);
                          }}
                          className="font-bold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1.5 text-left"
                          title={`Open sheet for ${leave.memberName}`}
                        >
                          <span>{leave.memberName}</span>
                          {isMyLeave && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                              {language === 'my' ? 'သင်' : 'You'}
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {leave.type}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 tabular-nums">
                        {leave.duration} Days
                      </td>

                      <td className="py-3.5 px-4 tabular-nums text-slate-600">
                        {leave.start} ~ {leave.end}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                        <span className="block truncate">{leave.reason}</span>
                        {leave.attachments && leave.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {leave.attachments.map((att) => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-[10px] font-semibold transition"
                                title={att.name}
                              >
                                {att.mimeType.startsWith('image/') ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-3.5 h-3.5 rounded-xs object-cover shrink-0"
                                  />
                                ) : (
                                  <FileText className="w-3 h-3 text-red-600 shrink-0" />
                                )}
                                <span className="truncate max-w-[90px]">{att.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {leave.adminNote && (
                          <span className="block text-[10px] text-purple-700 font-medium mt-0.5 truncate">
                            HR Note: {leave.adminNote}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : leave.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {leave.status}
                        </span>
                        {leave.hrSynced && (
                          <span className="block text-[10px] font-bold text-teal-700 mt-1">
                            ✓ {language === 'my' ? 'HR ကိုက်ညီပြီး' : 'HR Matched'}
                            {leave.hrRefId ? ` · ${leave.hrRefId}` : ''}
                          </span>
                        )}
                        {leave.approvedBy && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            by {leave.approvedBy}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Super Admin ONLY Approve/Reject buttons for Pending leaves */}
                          {canApprove && leave.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => onApproveLeave(leave.id, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[10px] shadow-sm transition"
                                title={t.approve}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onApproveLeave(leave.id, 'Rejected')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-[10px] shadow-sm transition"
                                title={t.reject}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isAdmin && !canApprove && leave.status === 'Pending' && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                              {language === 'my' ? 'Super Admin အတည်ပြုရန်' : 'Super Admin Approval'}
                            </span>
                          )}

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditLeave(leave)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                                  isAdmin
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    : 'text-amber-600 hover:bg-amber-50'
                                }`}
                                title={isAdmin ? (language === 'my' ? 'HR Leave နှင့် ကိုက်ညှိပြင်ဆင်ရန်' : 'Edit & Align with HR') : t.edit}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {isAdmin && <span>{language === 'my' ? 'HR ချိန်ညှိ' : 'HR Align'}</span>}
                              </button>
                              <button
                                onClick={() => setLeaveToDelete(leave)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title={t.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Team Attendance Matrix directly under Leave Request */}
      <TrainingTeamAttendanceMatrix
        allUsers={allUsers}
        currentUser={currentUser}
        tasks={tasks}
        leaves={leaves}
        trainingLogs={trainingLogs}
        attendanceOverrides={attendanceOverrides}
        onSetAttendanceOverride={onSetAttendanceOverride}
        onOpenMemberSheet={onOpenMemberSheet}
        language={language}
        showControls
      />

      <ConfirmModal
        isOpen={!!leaveToDelete}
        onClose={() => setLeaveToDelete(null)}
        onConfirm={() => {
          if (leaveToDelete) {
            onDeleteLeave(leaveToDelete.id);
            setLeaveToDelete(null);
          }
        }}
        title={language === 'my' ? 'ခွင့်မှတ်တမ်းကို ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Leave Deletion'}
        message={
          language === 'my'
            ? `"${leaveToDelete?.memberName}" ၏ ခွင့်မှတ်တမ်း (${leaveToDelete?.type}) ကို ဖျက်ရန် သေချာပါသလား?`
            : `Delete this leave entry for "${leaveToDelete?.memberName}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Leave'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />
      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        language={language}
      />
    </div>
  );
};
