import React, { useState, useMemo, useEffect } from 'react';
import { TrainingLog, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Calculator, 
  Search, 
  Calendar, 
  Users,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TrainingTabProps {
  trainingLogs: TrainingLog[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditTraining: (training: TrainingLog) => void;
  onDeleteTraining: (trainingId: string) => void;
  onQuickSaveTraining: (log: Partial<TrainingLog>) => void;
  language: Language;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  trainingLogs,
  currentUser,
  allUsers,
  onOpenAddTraining,
  onOpenAddTask,
  onOpenAddLeave,
  onOpenMemberSheet,
  onOpenEditTraining,
  onDeleteTraining,
  onQuickSaveTraining,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [search, setSearch] = useState('');
  const [logToDelete, setLogToDelete] = useState<TrainingLog | null>(null);

  // Quick Inline Calculator state
  const [qName, setQName] = useState('');
  const [qTrainer, setQTrainer] = useState(currentUser.name);
  const [qDate, setQDate] = useState(new Date().toISOString().split('T')[0]);
  const [qStart, setQStart] = useState('09:00');
  const [qEnd, setQEnd] = useState('17:00');
  const [qBreak, setQBreak] = useState(1.0);
  const [qAttendees, setQAttendees] = useState<string[]>([currentUser.id]);

  useEffect(() => {
    setQTrainer(currentUser.name);
    setQAttendees([currentUser.id]);
  }, [currentUser.id, currentUser.name]);

  const isAdmin = currentUser.roleTier === 'ADMIN';
  const isViewer = currentUser.roleTier === 'VIEWER';

  // Real-time formula
  const calculatedHours = useMemo(() => {
    if (!qStart || !qEnd) return 0;
    const [sH, sM] = qStart.split(':').map(Number);
    const [eH, eM] = qEnd.split(':').map(Number);
    if (isNaN(sH) || isNaN(eH)) return 0;
    const diff = (eH + eM / 60) - (sH + sM / 60);
    const net = diff - (Number(qBreak) || 0);
    return Math.max(0, parseFloat(net.toFixed(1)));
  }, [qStart, qEnd, qBreak]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName.trim()) return;

    const attendees = allUsers.filter((u) => qAttendees.includes(u.id));

    onQuickSaveTraining({
      name: qName.trim(),
      date: qDate,
      start: qStart,
      end: qEnd,
      breakHrs: Number(qBreak) || 0,
      calculatedHours,
      attendeeIds: qAttendees,
      attendeeNames: attendees.map((u) => u.name),
      trainerName: qTrainer.trim() || currentUser.name,
    });

    setQName('');
  };

  const filteredLogs = trainingLogs.filter((tr) => {
    if (filter === 'my') {
      const isMine =
        tr.attendeeIds?.includes(currentUser.id) ||
        tr.attendeeNames?.includes(currentUser.name);
      if (!isMine) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tr.name.toLowerCase().includes(q) ||
        (tr.trainerName && tr.trainerName.toLowerCase().includes(q)) ||
        (tr.attendeeNames && tr.attendeeNames.some((n) => n.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const totalCalculatedHours = filteredLogs.reduce(
    (sum, tr) => sum + (tr.calculatedHours || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-700" />
            <span>{language === 'my' ? 'သင်တန်းနာရီ အလိုအလျောက်တွက်ချက်မှုနှင့် မှတ်တမ်းစနစ်' : 'Training Hours Auto-Calculator & Master Log'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'ပုံသေနည်း: သင်တန်းနာရီ = (ပြီးဆုံးချိန် − စတင်ချိန်) − အနားယူချိန် • ကိုယ့်နာမည်အောက်တွင် မှတ်တမ်းတင်နိုင်ပါသည်'
              : 'Formula: Training Hours = (End Time − Start Time) − Break Time'}
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => onOpenAddTraining()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMyTraining}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Log Form Sidebar */}
        {!isViewer && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'my' ? 'သင်တန်းနာရီ အမြန်ထည့်သွင်းရန်' : 'Quick Session Logger'}
              </h3>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.sessionName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  placeholder="e.g. Life Insurance Product Training"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.trainerName}
                </label>
                <input
                  type="text"
                  list="quick-trainer-list"
                  value={qTrainer}
                  onChange={(e) => setQTrainer(e.target.value)}
                  placeholder={language === 'my' ? 'သင်တန်းဆရာအမည်...' : 'Trainer / Facilitator name...'}
                  className="w-full text-xs px-3 py-1.5 border border-purple-300 bg-purple-50/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
                />
                <datalist id="quick-trainer-list">
                  {allUsers
                    .filter((u) => u.roleTier !== 'VIEWER')
                    .map((u) => (
                      <option key={u.id} value={u.name} />
                    ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.trainingDate}
                </label>
                <input
                  type="date"
                  required
                  value={qDate}
                  onChange={(e) => setQDate(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.startTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={qStart}
                    onChange={(e) => setQStart(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={qEnd}
                    onChange={(e) => setQEnd(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.breakHours}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={qBreak}
                  onChange={(e) => setQBreak(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Calculated banner */}
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                  {t.calculatedHours}
                </span>
                <span className="text-2xl font-black text-purple-900 tabular-nums">
                  {calculatedHours.toFixed(1)} hrs
                </span>
                <span className="text-[10px] text-purple-600 block mt-0.5">
                  ({qEnd} - {qStart}) − {qBreak}h
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.attendees}
                </label>
                <div className="space-y-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {allUsers
                    .filter((u) => u.roleTier !== 'VIEWER')
                    .map((u) => {
                      const isSel = qAttendees.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-1.5 cursor-pointer text-[11px] hover:text-purple-700"
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() =>
                              setQAttendees((prev) =>
                                prev.includes(u.id)
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              )
                            }
                            className="rounded text-purple-600"
                          />
                          <span className="truncate">
                            {u.name} {u.id === currentUser.id && '(You)'}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm transition"
              >
                {t.saveTraining}
              </button>
            </form>
          </div>
        )}

        {/* Master History Table */}
        <div className={`${isViewer ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'my' ? 'သင်တန်းမှတ်တမ်းများ စာရင်း' : 'Completed Training Sessions History'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'my' ? `စုစုပေါင်း: ${totalCalculatedHours.toFixed(1)} နာရီ` : `Total Filtered: ${totalCalculatedHours.toFixed(1)} hrs`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    filter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.allRecords}
                </button>
                <button
                  onClick={() => setFilter('my')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    filter === 'my'
                      ? 'bg-purple-700 text-white shadow-sm font-bold'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  ⭐ {t.myRecordsOnly}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder={language === 'my' ? 'သင်တန်းရှာရန်...' : 'Search training...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Session / Topic</th>
                  <th className="py-3 px-3">Trainer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Timing</th>
                  <th className="py-3 px-3">Break</th>
                  <th className="py-3 px-3">Hours</th>
                  <th className="py-3 px-3">Attendees</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                      {language === 'my' ? 'ကိုက်ညီသော သင်တန်းမှတ်တမ်း မရှိပါ။' : 'No training sessions found.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isMyLog =
                      log.attendeeIds?.includes(currentUser.id) ||
                      log.attendeeNames?.includes(currentUser.name);
                    const canEdit = (isMyLog || isAdmin) && !isViewer;

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMyLog ? 'bg-purple-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                          {log.name}
                        </td>
                        <td className="py-3 px-3 font-semibold text-purple-900">
                          {log.trainerName || '-'}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600">
                          {log.start} ~ {log.end}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600">
                          {log.breakHrs}h
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-700 tabular-nums">
                          {log.calculatedHours.toFixed(1)}h
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {log.attendeeNames && log.attendeeNames.length > 0 ? (
                              log.attendeeNames.map((attName, idx) => {
                                const found = allUsers.find((u) => u.name === attName);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (found) onOpenMemberSheet(found);
                                    }}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded text-[11px] font-semibold transition"
                                    title={`Open sheet for ${attName}`}
                                  >
                                    {attName}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {canEdit ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenEditTraining(log)}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                title={t.edit}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setLogToDelete(log)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title={t.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
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

      <ConfirmModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={() => {
          if (logToDelete) {
            onDeleteTraining(logToDelete.id);
            setLogToDelete(null);
          }
        }}
        title={language === 'my' ? 'သင်တန်းမှတ်တမ်း ဖျက်ရန်' : 'Confirm Training Deletion'}
        message={
          language === 'my'
            ? `"${logToDelete?.name}" မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?`
            : `Delete training log "${logToDelete?.name}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />
    </div>
  );
};
