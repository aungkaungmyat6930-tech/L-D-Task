import React, { useState, useMemo, useEffect } from 'react';
import { TrainingLog, TrainerHourEntry, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { isAdminOrSuper } from '../utils/roleHelpers';
import {
  TRAINING_TOPIC_SUGGESTIONS,
  composeBreakHours,
  formatBreakDuration,
  getTrainerEntriesForLog,
  formatTotalTrainerHours,
} from '../utils/trainingHelpers';
import { 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Calculator, 
  Search, 
  Users
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

interface QuickTrainerRow {
  rowId: string;
  userId?: string;
  name: string;
  role: 'Lead Trainer' | 'Co-Trainer';
  topic: string;
  hoursPart: number;
  minutesPart: number;
}

const makeQuickRowId = () => `qtr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const TrainingTab: React.FC<TrainingTabProps> = ({
  trainingLogs,
  currentUser,
  allUsers,
  onOpenAddTraining,
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
  const [qBreakHoursPart, setQBreakHoursPart] = useState(1);
  const [qBreakMinutesPart, setQBreakMinutesPart] = useState(0);
  const [qCoTrainers, setQCoTrainers] = useState<string[]>([]);
  const [qTrainerRows, setQTrainerRows] = useState<QuickTrainerRow[]>([
    {
      rowId: makeQuickRowId(),
      userId: currentUser.id,
      name: currentUser.name,
      role: 'Lead Trainer',
      topic: '',
      hoursPart: 1,
      minutesPart: 0,
    },
  ]);

  const assignableTrainers = useMemo(
    () => allUsers.filter((u) => u.roleTier !== 'VIEWER'),
    [allUsers]
  );

  const qBreak = useMemo(
    () => composeBreakHours(qBreakHoursPart, qBreakMinutesPart),
    [qBreakHoursPart, qBreakMinutesPart]
  );

  useEffect(() => {
    setQTrainer(currentUser.name);
    setQCoTrainers([]);
    setQTrainerRows([
      {
        rowId: makeQuickRowId(),
        userId: currentUser.id,
        name: currentUser.name,
        role: 'Lead Trainer',
        topic: '',
        hoursPart: 1,
        minutesPart: 0,
      },
    ]);
  }, [currentUser.id, currentUser.name]);

  const isAdmin = isAdminOrSuper(currentUser.roleTier);
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

  const handleQuickLeadChange = (nextLead: string) => {
    setQTrainer(nextLead);
    const matched = allUsers.find((u) => u.name === nextLead);
    setQTrainerRows((prev) => {
      if (prev.length === 0) {
        return [
          {
            rowId: makeQuickRowId(),
            userId: matched?.id,
            name: nextLead,
            role: 'Lead Trainer',
            topic: '',
            hoursPart: 1,
            minutesPart: 0,
          },
        ];
      }
      const next = [...prev];
      const idx = next.findIndex((r) => r.role === 'Lead Trainer');
      if (idx >= 0) {
        next[idx] = { ...next[idx], userId: matched?.id, name: nextLead };
      }
      return next;
    });
  };

  const handleToggleQuickCoTrainer = (uid: string) => {
    const userObj = allUsers.find((u) => u.id === uid);
    const isSel = qCoTrainers.includes(uid);
    setQCoTrainers((prev) => (isSel ? prev.filter((id) => id !== uid) : [...prev, uid]));

    if (!isSel && userObj) {
      setQTrainerRows((prev) => {
        if (prev.some((r) => r.userId === uid || r.name === userObj.name)) return prev;
        return [
          ...prev,
          {
            rowId: makeQuickRowId(),
            userId: userObj.id,
            name: userObj.name,
            role: 'Co-Trainer',
            topic: '',
            hoursPart: 1,
            minutesPart: 0,
          },
        ];
      });
    } else if (isSel && userObj) {
      setQTrainerRows((prev) => {
        const filtered = prev.filter(
          (r) => !(r.role === 'Co-Trainer' && (r.userId === uid || r.name === userObj.name))
        );
        return filtered.length > 0 ? filtered : prev;
      });
    }
  };

  const handleAddQuickRow = () => {
    const used = new Set(qTrainerRows.map((r) => r.name));
    const candidate =
      assignableTrainers.find((u) => !used.has(u.name)) ||
      assignableTrainers[0] ||
      currentUser;
    setQTrainerRows((prev) => [
      ...prev,
      {
        rowId: makeQuickRowId(),
        userId: candidate.id,
        name: candidate.name,
        role: prev.length === 0 ? 'Lead Trainer' : 'Co-Trainer',
        topic: '',
        hoursPart: 1,
        minutesPart: 0,
      },
    ]);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName.trim()) return;

    const validRows = qTrainerRows.filter((r) => r.name.trim());
    const finalTrainer = qTrainer.trim() || validRows[0]?.name || currentUser.name;
    const trainerUser = allUsers.find((u) => u.name === finalTrainer);

    const trainerHours: TrainerHourEntry[] =
      validRows.length > 0
        ? validRows.map((r) => {
            const matched = allUsers.find((u) => u.id === r.userId || u.name === r.name);
            return {
              userId: r.userId || matched?.id,
              name: r.name.trim(),
              role: r.role,
              topic: r.topic.trim() || undefined,
              hours: composeBreakHours(r.hoursPart, r.minutesPart),
            };
          })
        : [
            {
              userId: trainerUser?.id,
              name: finalTrainer,
              role: 'Lead Trainer',
              hours: calculatedHours,
            },
          ];

    const rowCoIds = trainerHours
      .filter((th) => th.role === 'Co-Trainer' && th.userId)
      .map((th) => th.userId as string);
    const mergedCoIds = Array.from(
      new Set([...qCoTrainers, ...rowCoIds].filter((id) => id !== trainerUser?.id))
    );
    const mergedCoNames = Array.from(
      new Set([
        ...mergedCoIds
          .map((id) => allUsers.find((u) => u.id === id)?.name)
          .filter((n): n is string => Boolean(n)),
        ...trainerHours
          .filter((th) => th.role === 'Co-Trainer' && th.name !== finalTrainer)
          .map((th) => th.name),
      ])
    );

    const combinedIds = Array.from(
      new Set([
        ...(trainerUser ? [trainerUser.id] : []),
        ...mergedCoIds,
        ...trainerHours.map((th) => th.userId).filter((id): id is string => Boolean(id)),
      ])
    );
    const combinedNames = Array.from(
      new Set([finalTrainer, ...mergedCoNames, ...trainerHours.map((th) => th.name)])
    );

    onQuickSaveTraining({
      name: qName.trim(),
      date: qDate,
      start: qStart,
      end: qEnd,
      breakHrs: Number(qBreak) || 0,
      calculatedHours,
      coTrainerIds: mergedCoIds,
      coTrainerNames: mergedCoNames,
      trainerHours,
      attendeeIds: combinedIds,
      attendeeNames: combinedNames,
      trainerName: finalTrainer,
    });

    setQName('');
    setQCoTrainers([]);
    setQTrainerRows([
      {
        rowId: makeQuickRowId(),
        userId: trainerUser?.id || currentUser.id,
        name: finalTrainer,
        role: 'Lead Trainer',
        topic: '',
        hoursPart: 1,
        minutesPart: 0,
      },
    ]);
  };

  const filteredLogs = trainingLogs.filter((tr) => {
    if (filter === 'my') {
      const isMine =
        tr.attendeeIds?.includes(currentUser.id) ||
        tr.attendeeNames?.includes(currentUser.name) ||
        tr.coTrainerIds?.includes(currentUser.id) ||
        tr.coTrainerNames?.includes(currentUser.name) ||
        tr.trainerName === currentUser.name;
      if (!isMine) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tr.name.toLowerCase().includes(q) ||
        (tr.trainerName && tr.trainerName.toLowerCase().includes(q)) ||
        (tr.coTrainerNames && tr.coTrainerNames.some((n) => n.toLowerCase().includes(q))) ||
        (tr.attendeeNames && tr.attendeeNames.some((n) => n.toLowerCase().includes(q))) ||
        (tr.trainerHours &&
          tr.trainerHours.some(
            (th) =>
              th.name.toLowerCase().includes(q) ||
              (th.topic && th.topic.toLowerCase().includes(q))
          )) ||
        (tr.editedBy && tr.editedBy.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCalculatedHours = filteredLogs.reduce(
    (sum, tr) => sum + formatTotalTrainerHours(tr),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-700" />
            <span>
              {language === 'my'
                ? 'သင်တန်းနာရီ အလိုအလျောက်တွက်ချက်မှုနှင့် မှတ်တမ်းစနစ်'
                : 'Training Hours Auto-Calculator & Master Log'}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'Main Topic တစ်ခုတည်းအောက်တွင် Trainer အလိုက် ခေါင်းစဉ်နှင့် သင်ကြားချိန် (နာရီ/မိနစ်) များ ရွေးချယ်မှတ်တမ်းတင်နိုင်ပါသည်'
              : 'Formula: Training Hours = (End Time − Start Time) − Break Time • Per-trainer sub-topics & durations'}
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
                  {language === 'my' ? 'ပင်မသင်တန်းခေါင်းစဉ် (Main Topic)' : 'Main Topic'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="quick-main-topic-list"
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  placeholder="e.g. Two Week Training"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
                />
                <datalist id="quick-main-topic-list">
                  <option value="Two Week Training" />
                  <option value="New Agent Onboarding" />
                  <option value="Bancassurance Sales Mastery" />
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.trainerName}
                </label>
                <input
                  type="text"
                  list="quick-trainer-list"
                  value={qTrainer}
                  onChange={(e) => handleQuickLeadChange(e.target.value)}
                  placeholder={language === 'my' ? 'သင်တန်းဆရာအမည်...' : 'Trainer / Facilitator name...'}
                  className="w-full text-xs px-3 py-1.5 border border-purple-300 bg-purple-50/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
                />
                <datalist id="quick-trainer-list">
                  {assignableTrainers.map((u) => (
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{language === 'my' ? 'နားချိန် (နာရီ / မိနစ်)' : 'Break (Hr / Min)'}</span>
                  <span className="text-[10px] font-bold text-purple-700">
                    {formatBreakDuration(qBreak)}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={qBreakHoursPart}
                    onChange={(e) => setQBreakHoursPart(Number(e.target.value))}
                    className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 font-semibold"
                  >
                    {[0, 1, 2, 3, 4].map((h) => (
                      <option key={h} value={h}>
                        {h} {language === 'my' ? 'နာရီ' : 'hr'}
                      </option>
                    ))}
                  </select>
                  <select
                    value={qBreakMinutesPart}
                    onChange={(e) => setQBreakMinutesPart(Number(e.target.value))}
                    className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 font-semibold"
                  >
                    {[0, 5, 10, 15, 20, 30, 40, 45, 50].map((m) => (
                      <option key={m} value={m}>
                        {m} {language === 'my' ? 'မိနစ်' : 'min'}
                      </option>
                    ))}
                  </select>
                </div>
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
                  ({qEnd} - {qStart}) − {formatBreakDuration(qBreak)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {t.coTrainer}
                </label>
                <div className="space-y-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {assignableTrainers.map((u) => {
                    const isSel = qCoTrainers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-1.5 cursor-pointer text-[11px] hover:text-purple-700"
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => handleToggleQuickCoTrainer(u.id)}
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

              {/* Per-trainer selectable Sub-Topic & Hours/Minutes under this Main Topic */}
              <div className="bg-purple-50/75 border border-purple-200 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-purple-900 flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-700" />
                    <span>
                      {language === 'my'
                        ? 'Trainer အလိုက် ခေါင်းစဉ်နှင့် အချိန်'
                        : 'Trainer Sub-Topic & Time'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuickRow}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'my' ? 'ထပ်ထည့်' : 'Add'}</span>
                  </button>
                </div>

                <datalist id="quick-subtopic-suggestions">
                  {TRAINING_TOPIC_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>

                <div className="space-y-1.5">
                  {qTrainerRows.map((row) => (
                    <div
                      key={row.rowId}
                      className="bg-white border border-purple-200 rounded-lg p-2 space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <select
                          value={row.userId || ''}
                          onChange={(e) => {
                            const chosen = assignableTrainers.find((u) => u.id === e.target.value);
                            if (chosen) {
                              setQTrainerRows((prev) =>
                                prev.map((r) =>
                                  r.rowId === row.rowId
                                    ? { ...r, userId: chosen.id, name: chosen.name }
                                    : r
                                )
                              );
                            }
                          }}
                          className="flex-1 min-w-0 text-[11px] font-bold px-1.5 py-1 border border-slate-300 rounded bg-white"
                        >
                          {!row.userId && row.name && <option value="">{row.name}</option>}
                          {assignableTrainers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                        {qTrainerRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQTrainerRows((prev) => prev.filter((r) => r.rowId !== row.rowId))
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title={language === 'my' ? 'ဖယ်ရှားရန်' : 'Remove'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-1.5">
                        <input
                          type="text"
                          list="quick-subtopic-suggestions"
                          value={row.topic}
                          onChange={(e) =>
                            setQTrainerRows((prev) =>
                              prev.map((r) =>
                                r.rowId === row.rowId ? { ...r, topic: e.target.value } : r
                              )
                            )
                          }
                          placeholder={language === 'my' ? 'ခေါင်းစဉ် (Universal Life...)' : 'Sub-topic...'}
                          className="col-span-6 text-[11px] font-semibold px-2 py-1 border border-purple-300 rounded bg-purple-50/20"
                        />
                        <select
                          value={row.hoursPart}
                          onChange={(e) =>
                            setQTrainerRows((prev) =>
                              prev.map((r) =>
                                r.rowId === row.rowId
                                  ? { ...r, hoursPart: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="col-span-3 text-[11px] font-bold px-1 py-1 border border-slate-300 rounded bg-white tabular-nums"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                            <option key={h} value={h}>
                              {h}h
                            </option>
                          ))}
                        </select>
                        <select
                          value={row.minutesPart}
                          onChange={(e) =>
                            setQTrainerRows((prev) =>
                              prev.map((r) =>
                                r.rowId === row.rowId
                                  ? { ...r, minutesPart: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                          className="col-span-3 text-[11px] font-bold px-1 py-1 border border-slate-300 rounded bg-white tabular-nums"
                        >
                          {[0, 15, 30, 45].map((m) => (
                            <option key={m} value={m}>
                              {m}m
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
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
                {language === 'my'
                  ? `စုစုပေါင်း: ${totalCalculatedHours.toFixed(1)} နာရီ`
                  : `Total Filtered: ${totalCalculatedHours.toFixed(1)} hrs`}
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
                  <th className="py-3 px-3">Main Topic</th>
                  <th className="py-3 px-3">Lead</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Timing</th>
                  <th className="py-3 px-3">Break</th>
                  <th className="py-3 px-3">Hours</th>
                  <th className="py-3 px-3 min-w-[200px]">
                    {language === 'my' ? 'Trainer · ခေါင်းစဉ် · အချိန်' : 'Trainer · Sub-Topic · Time'}
                  </th>
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
                      log.attendeeNames?.includes(currentUser.name) ||
                      log.coTrainerIds?.includes(currentUser.id) ||
                      log.coTrainerNames?.includes(currentUser.name) ||
                      log.trainerName === currentUser.name;
                    const canEdit = !isViewer;
                    const canDelete = (isMyLog || isAdmin) && !isViewer;
                    const trainerEntries = getTrainerEntriesForLog(log);
                    const topicTotalHours = formatTotalTrainerHours(log);

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMyLog ? 'bg-purple-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                          <div>{log.name}</div>
                          {log.editedBy && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <span>
                                {language === 'my' ? 'ပြင်ဆင်သူ:' : 'Edited by:'} {log.editedBy}
                              </span>
                              {log.editedAt && (
                                <span className="text-amber-600 tabular-nums">
                                  · {log.editedAt}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-purple-900">
                          {log.trainerName || '-'}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600 whitespace-nowrap">
                          {log.start} ~ {log.end}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-slate-600">
                          {formatBreakDuration(log.breakHrs)}
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-700 tabular-nums">
                          <div>{log.calculatedHours.toFixed(1)}h</div>
                          {log.trainerHours && log.trainerHours.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-semibold">
                              Σ {topicTotalHours.toFixed(1)}h
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {trainerEntries.length > 0 ? (
                              trainerEntries.map((entry, idx) => {
                                const found = allUsers.find(
                                  (u) => u.id === entry.userId || u.name === entry.name
                                );
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (found) onOpenMemberSheet(found);
                                    }}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold transition inline-flex items-center gap-1 text-left"
                                    title={`Open sheet for ${entry.name} (${entry.role})`}
                                  >
                                    <span>{entry.name}</span>
                                    {entry.topic && (
                                      <span className="px-1 py-0.2 bg-white text-indigo-800 border border-indigo-200 rounded text-[10px] font-bold">
                                        {entry.topic}
                                      </span>
                                    )}
                                    <span className="font-extrabold text-purple-700 tabular-nums">
                                      {formatBreakDuration(entry.hours)}
                                    </span>
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
                              {canDelete && (
                                <button
                                  onClick={() => setLogToDelete(log)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title={t.delete}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
