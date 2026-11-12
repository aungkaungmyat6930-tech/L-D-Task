import React, { useState } from 'react';
import { LeaveRequest, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { 
  CalendarDays, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ShieldCheck
} from 'lucide-react';

interface LeaveTabProps {
  leaves: LeaveRequest[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onDeleteLeave: (leaveId: string) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  language: Language;
}

export const LeaveTab: React.FC<LeaveTabProps> = ({
  leaves,
  currentUser,
  allUsers,
  onOpenAddLeave,
  onOpenAddTask,
  onOpenAddTraining,
  onOpenMemberSheet,
  onOpenEditLeave,
  onDeleteLeave,
  onApproveLeave,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | 'my' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const isAdmin = currentUser.roleTier === 'ADMIN';
  const isViewer = currentUser.roleTier === 'VIEWER';

  const filteredLeaves = leaves.filter((l) => {
    if (filter === 'my') {
      const isMine = l.memberId === currentUser.id || l.memberName === currentUser.name;
      if (!isMine) return false;
    } else if (filter === 'pending') {
      if (l.status !== 'Pending') return false;
    } else if (filter === 'approved') {
      if (l.status !== 'Approved') return false;
    } else if (filter === 'rejected') {
      if (l.status !== 'Rejected') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.memberName.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action & Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            <span>{language === 'my' ? 'ခွင့်တောင်းခံလွှာများနှင့် ခွင့်ပြုချက် လုပ်ငန်းစဉ်' : 'Leave Requests & Approvals Register'}</span>
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
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.allRecords} ({leaves.length})
          </button>

          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'my'
                ? 'bg-teal-600 text-white shadow-sm font-bold'
                : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            ⭐ {t.myRecordsOnly}
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            ⏳ {t.pending} ({leaves.filter((l) => l.status === 'Pending').length})
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            ✓ {t.approved}
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white shadow-sm font-bold'
                : 'text-red-700 bg-red-50 hover:bg-red-100'
            }`}
          >
            ✕ {t.rejected}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={language === 'my' ? 'အမည် သို့မဟုတ် ခွင့်အမျိုးအစား...' : 'Search leave...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-56 text-xs"
          />
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Team Member</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Date Range</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    {language === 'my' ? 'ကိုက်ညီသော ခွင့်မှတ်တမ်း မရှိပါ။' : 'No leave records found.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const isMyLeave = leave.memberId === currentUser.id || leave.memberName === currentUser.name;
                  const canEdit = (isMyLeave || isAdmin) && !isViewer;

                  return (
                    <tr
                      key={leave.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isMyLeave ? 'bg-teal-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const found = allUsers.find(
                                (u) => u.id === leave.memberId || u.name === leave.memberName
                              );
                              if (found) onOpenMemberSheet(found);
                            }}
                            className="font-bold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1 text-left"
                            title={`Open sheet for ${leave.memberName}`}
                          >
                            <span>{leave.memberName}</span>
                            {isMyLeave && (
                              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                                {language === 'my' ? 'သင်' : 'You'}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const found = allUsers.find(
                                (u) => u.id === leave.memberId || u.name === leave.memberName
                              );
                              onOpenAddLeave(found);
                            }}
                            className="text-[10px] text-teal-600 hover:bg-teal-100 px-1 py-0.5 rounded font-bold"
                            title={`+ Add Leave directly for ${leave.memberName}`}
                          >
                            +Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const found = allUsers.find(
                                (u) => u.id === leave.memberId || u.name === leave.memberName
                              );
                              onOpenAddTask(found);
                            }}
                            className="text-[10px] text-blue-600 hover:bg-blue-100 px-1 py-0.5 rounded font-bold"
                            title={`+ Add Task directly for ${leave.memberName}`}
                          >
                            +Task
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const found = allUsers.find(
                                (u) => u.id === leave.memberId || u.name === leave.memberName
                              );
                              onOpenAddTraining(found);
                            }}
                            className="text-[10px] text-purple-600 hover:bg-purple-100 px-1 py-0.5 rounded font-bold"
                            title={`+ Log Training Topic directly for ${leave.memberName}`}
                          >
                            +Topic
                          </button>
                        </div>
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

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {leave.reason}
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
                        {leave.approvedBy && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            by {leave.approvedBy}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Admin Approve/Reject buttons for Pending leaves */}
                          {isAdmin && leave.status === 'Pending' && (
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

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditLeave(leave)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title={t.edit}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(language === 'my' ? 'ဤခွင့်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?' : 'Delete this leave entry?')) {
                                    onDeleteLeave(leave.id);
                                  }
                                }}
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
    </div>
  );
};
