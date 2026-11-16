import React, { useState, useEffect, useMemo } from 'react';
import { TrainingLog, TrainerHourEntry, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  WEEKDAY_CODES,
  getMonthKey,
  getDayOfWeekCode,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekOrdinal,
  getDefaultDateForMonthWeek,
  getDateForWeekAndWeekday,
  formatMonthLabel,
} from '../utils/weekHelpers';
import {
  TRAINING_TOPIC_SUGGESTIONS,
  decomposeBreakHours,
  composeBreakHours,
  formatBreakDuration,
  getTrainerEntriesForLog,
} from '../utils/trainingHelpers';
import { X, Check, Clock, Calculator, UserCheck, Users, Plus, Trash2 } from 'lucide-react';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingToEdit: TrainingLog | null;
  targetMember?: UserProfile | null;
  defaultDate?: string;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveTraining: (trainingData: Partial<TrainingLog>) => void;
  language: Language;
}

interface TrainerTopicRow {
  rowId: string;
  userId?: string;
  name: string;
  role: 'Lead Trainer' | 'Co-Trainer';
  topic: string;
  hoursPart: number;
  minutesPart: number;
}

const createRowId = () => `tr-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  trainingToEdit,
  targetMember,
  defaultDate,
  currentUser,
  allUsers,
  onSaveTraining,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [breakHoursPart, setBreakHoursPart] = useState(1);
  const [breakMinutesPart, setBreakMinutesPart] = useState(0);
  const [trainerName, setTrainerName] = useState('');
  const [coTrainerIds, setCoTrainerIds] = useState<string[]>([]);
  const [trainerTopicRows, setTrainerTopicRows] = useState<TrainerTopicRow[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const assignableTrainers = useMemo(
    () => allUsers.filter((u) => u.roleTier !== 'VIEWER'),
    [allUsers]
  );

  const breakHrs = useMemo(
    () => composeBreakHours(breakHoursPart, breakMinutesPart),
    [breakHoursPart, breakMinutesPart]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (trainingToEdit) {
      setName(trainingToEdit.name);
      setDate(trainingToEdit.date);
      setStart(trainingToEdit.start);
      setEnd(trainingToEdit.end);
      const { hours, minutes } = decomposeBreakHours(trainingToEdit.breakHrs);
      setBreakHoursPart(hours);
      setBreakMinutesPart(minutes);
      setTrainerName(trainingToEdit.trainerName || '');

      const existingCoIds =
        trainingToEdit.coTrainerIds ??
        (trainingToEdit.attendeeIds || []).filter((id) => {
          const u = allUsers.find((usr) => usr.id === id);
          return u && u.name !== trainingToEdit.trainerName;
        });
      setCoTrainerIds(existingCoIds);

      const entries = getTrainerEntriesForLog(trainingToEdit);
      if (entries.length > 0) {
        setTrainerTopicRows(
          entries.map((entry) => {
            const parts = decomposeBreakHours(entry.hours);
            const matchedUser =
              allUsers.find((u) => u.id === entry.userId || u.name === entry.name) || undefined;
            return {
              rowId: createRowId(),
              userId: entry.userId || matchedUser?.id,
              name: entry.name,
              role: entry.role,
              topic: entry.topic || '',
              hoursPart: parts.hours,
              minutesPart: parts.minutes,
            };
          })
        );
      } else {
        const leadUser = allUsers.find((u) => u.name === (trainingToEdit.trainerName || currentUser.name));
        const parts = decomposeBreakHours(trainingToEdit.calculatedHours || 1);
        setTrainerTopicRows([
          {
            rowId: createRowId(),
            userId: leadUser?.id,
            name: trainingToEdit.trainerName || currentUser.name,
            role: 'Lead Trainer',
            topic: '',
            hoursPart: parts.hours,
            minutesPart: parts.minutes,
          },
        ]);
      }

      setLocation(trainingToEdit.location || '');
      setNotes(trainingToEdit.notes || '');
    } else {
      const initialLead = targetMember || currentUser;
      setName('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStart('09:00');
      setEnd('17:00');
      setBreakHoursPart(1);
      setBreakMinutesPart(0);
      setTrainerName(initialLead.name);
      setCoTrainerIds([]);
      setTrainerTopicRows([
        {
          rowId: createRowId(),
          userId: initialLead.id,
          name: initialLead.name,
          role: 'Lead Trainer',
          topic: '',
          hoursPart: 1,
          minutesPart: 0,
        },
      ]);
      setLocation('KBZ Life Training Room / Online');
      setNotes('');
    }
  }, [trainingToEdit, targetMember, defaultDate, currentUser, allUsers, isOpen]);

  // Real-time formula computation: (End - Start) - Break
  const calculatedHours = useMemo(() => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    if (isNaN(sH) || isNaN(eH)) return 0;

    const diff = (eH + eM / 60) - (sH + sM / 60);
    const net = diff - (Number(breakHrs) || 0);
    return Math.max(0, parseFloat(net.toFixed(1)));
  }, [start, end, breakHrs]);

  const totalAllocatedHours = useMemo(
    () =>
      trainerTopicRows.reduce(
        (sum, row) => sum + composeBreakHours(row.hoursPart, row.minutesPart),
        0
      ),
    [trainerTopicRows]
  );

  if (!isOpen) return null;

  const selectedMonthKey = getMonthKey(date);
  const selectedWeek = getWeekOfMonth(date);
  const selectedWeekday = getDayOfWeekCode(date);
  const weeksInMonth = getWeeksInMonth(selectedMonthKey);

  const handleLeadTrainerChange = (nextLeadName: string) => {
    setTrainerName(nextLeadName);
    const matchedUser = allUsers.find((u) => u.name === nextLeadName);
    setTrainerTopicRows((prev) => {
      if (prev.length === 0) {
        return [
          {
            rowId: createRowId(),
            userId: matchedUser?.id,
            name: nextLeadName,
            role: 'Lead Trainer',
            topic: '',
            hoursPart: 1,
            minutesPart: 0,
          },
        ];
      }
      const next = [...prev];
      const leadIdx = next.findIndex((r) => r.role === 'Lead Trainer');
      if (leadIdx >= 0) {
        next[leadIdx] = {
          ...next[leadIdx],
          userId: matchedUser?.id,
          name: nextLeadName,
        };
      }
      return next;
    });
  };

  const handleToggleCoTrainer = (uid: string) => {
    const userObj = allUsers.find((u) => u.id === uid);
    const isCurrentlySelected = coTrainerIds.includes(uid);

    setCoTrainerIds((prev) =>
      isCurrentlySelected ? prev.filter((id) => id !== uid) : [...prev, uid]
    );

    if (!isCurrentlySelected && userObj) {
      setTrainerTopicRows((prev) => {
        const alreadyInRows = prev.some(
          (r) => r.userId === uid || r.name === userObj.name
        );
        if (alreadyInRows) return prev;
        return [
          ...prev,
          {
            rowId: createRowId(),
            userId: userObj.id,
            name: userObj.name,
            role: 'Co-Trainer',
            topic: '',
            hoursPart: 1,
            minutesPart: 0,
          },
        ];
      });
    } else if (isCurrentlySelected && userObj) {
      setTrainerTopicRows((prev) => {
        const filtered = prev.filter(
          (r) => !(r.role === 'Co-Trainer' && (r.userId === uid || r.name === userObj.name))
        );
        return filtered.length > 0 ? filtered : prev;
      });
    }
  };

  const handleAddTrainerTopicRow = () => {
    // Pick next trainer not yet added if available, else default to lead/first user
    const usedNames = new Set(trainerTopicRows.map((r) => r.name));
    const nextCandidate =
      assignableTrainers.find((u) => !usedNames.has(u.name)) ||
      assignableTrainers[0] ||
      currentUser;

    setTrainerTopicRows((prev) => [
      ...prev,
      {
        rowId: createRowId(),
        userId: nextCandidate.id,
        name: nextCandidate.name,
        role: prev.length === 0 ? 'Lead Trainer' : 'Co-Trainer',
        topic: '',
        hoursPart: 1,
        minutesPart: 0,
      },
    ]);
  };

  const handleUpdateRow = (rowId: string, patch: Partial<TrainerTopicRow>) => {
    setTrainerTopicRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setTrainerTopicRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validRows = trainerTopicRows.filter((r) => r.name.trim());
    const finalLeadRow = validRows.find((r) => r.role === 'Lead Trainer') || validRows[0];
    const finalTrainerName = trainerName.trim() || finalLeadRow?.name || currentUser.name;
    const trainerUser = allUsers.find((u) => u.name === finalTrainerName);

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
              name: finalTrainerName,
              role: 'Lead Trainer',
              hours: calculatedHours,
            },
          ];

    // Derive combined co-trainers and attendees from rows + checked co-trainers
    const rowCoIds = trainerHours
      .filter((th) => th.role === 'Co-Trainer' && th.userId)
      .map((th) => th.userId as string);
    const mergedCoIds = Array.from(
      new Set([...coTrainerIds, ...rowCoIds].filter((id) => id !== trainerUser?.id))
    );
    const mergedCoNames = Array.from(
      new Set([
        ...mergedCoIds
          .map((id) => allUsers.find((u) => u.id === id)?.name)
          .filter((n): n is string => Boolean(n)),
        ...trainerHours
          .filter((th) => th.role === 'Co-Trainer' && th.name !== finalTrainerName)
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
      new Set([finalTrainerName, ...mergedCoNames, ...trainerHours.map((th) => th.name)])
    );

    onSaveTraining({
      id: trainingToEdit?.id,
      name: name.trim(),
      date,
      start,
      end,
      breakHrs: Number(breakHrs) || 0,
      calculatedHours,
      trainerName: finalTrainerName,
      coTrainerIds: mergedCoIds,
      coTrainerNames: mergedCoNames,
      trainerHours,
      attendeeIds: combinedIds,
      attendeeNames: combinedNames,
      location: location.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {trainingToEdit
                  ? language === 'my'
                    ? 'သင်တန်းမှတ်တမ်း ပြင်ဆင်ရန်'
                    : 'Edit Training Session'
                  : t.saveTraining}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my'
                  ? 'Main Topic တစ်ခုတည်းအောက်တွင် Trainer အလိုက် ခေါင်းစဉ်နှင့် အချိန်နာရီ ရွေးချယ်သတ်မှတ်ခြင်း'
                  : 'Assign trainer, sub-topic & teaching duration under one Main Topic'}
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

        {/* Formula Real-time Preview Banner */}
        <div className="bg-purple-50/80 border-b border-purple-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-700" />
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-700 block tracking-wider">
                {t.calculatedHours}
              </span>
              <span className="text-[11px] text-purple-900">{t.formulaNote}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block">
                {language === 'my' ? 'ခွဲဝေစုစုပေါင်း' : 'Allocated Sum'}
              </span>
              <span className="text-sm font-extrabold text-indigo-800 tabular-nums">
                {totalAllocatedHours.toFixed(1)} hrs
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-purple-900 tabular-nums">
                {calculatedHours.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-purple-700 ml-1">hrs</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[72vh]">
          {trainingToEdit?.editedBy && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-[11px] text-amber-900 flex items-center justify-between gap-2">
              <span className="font-bold">
                {language === 'my' ? 'နောက်ဆုံးပြင်ဆင်ထားသူ' : 'Last Edited By'}:{' '}
                {trainingToEdit.editedBy}
              </span>
              {trainingToEdit.editedAt && (
                <span className="text-[10px] font-semibold text-amber-700 tabular-nums">
                  {trainingToEdit.editedAt}
                </span>
              )}
            </div>
          )}

          {/* Main Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'my' ? 'ပင်မသင်တန်းခေါင်းစဉ် (Main Topic)' : 'Main Topic / Program Title'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="main-topic-presets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Two Week Training / Bancassurance 2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            />
            <datalist id="main-topic-presets">
              <option value="Two Week Training" />
              <option value="New Agent Onboarding" />
              <option value="Bancassurance Sales Mastery" />
              <option value="Product Refresher Workshop" />
              <option value="FRD Compliance & Ethics" />
            </datalist>
          </div>

          {/* Date & Lead Trainer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  {t.trainingDate} <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] font-bold text-purple-700">
                  {formatMonthLabel(selectedMonthKey, language)} · {getWeekOrdinal(selectedWeek)} ·{' '}
                  {selectedWeekday}
                </span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  {t.trainerName} <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleLeadTrainerChange(currentUser.name)}
                  className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-0.5"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>{language === 'my' ? 'မိမိအမည်ထည့်' : 'Use Me'}</span>
                </button>
              </label>
              <input
                type="text"
                required
                list="training-modal-trainer-list"
                value={trainerName}
                onChange={(e) => handleLeadTrainerChange(e.target.value)}
                placeholder={
                  language === 'my'
                    ? 'သင်တန်းဆရာအမည် ရိုက်ထည့်ပါ...'
                    : 'Enter or pick trainer name...'
                }
                className="w-full text-xs px-3 py-2 border border-purple-300 bg-purple-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
              />
              <datalist id="training-modal-trainer-list">
                {assignableTrainers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.roleLabel}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Auto-Synced Week & Weekday Quick Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div>
              <span className="block text-[10px] font-bold text-slate-600 mb-1.5">
                {language === 'my'
                  ? 'လအလိုက် အပတ်စဉ် (Date ရွေးလျှင် အလိုအလျောက်ရွေးပေးမည်)'
                  : 'Week of Month (auto-syncs with date)'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weeksInMonth.map((wk) => (
                  <button
                    key={wk}
                    type="button"
                    onClick={() =>
                      setDate(getDefaultDateForMonthWeek(selectedMonthKey, wk, selectedWeekday))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedWeek === wk
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {getWeekOrdinal(wk)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-600 mb-1.5">
                {language === 'my'
                  ? 'နေ့ရက် (Mon – Sun တိုက်ရိုက်ရွေးရန်)'
                  : 'Weekday (Mon – Sun quick select)'}
              </span>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_CODES.map((wd) => (
                  <button
                    key={wd}
                    type="button"
                    onClick={() =>
                      setDate(getDateForWeekAndWeekday(selectedMonthKey, selectedWeek, wd))
                    }
                    className={`py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedWeekday === wd
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {wd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start, End, Break Times (Hours + Minutes) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.startTime} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.endTime} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{language === 'my' ? 'နားချိန် (နာရီ/မိနစ်)' : 'Break (Hr / Min)'}</span>
                <span className="text-[10px] font-bold text-purple-700">
                  {formatBreakDuration(breakHrs)}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={breakHoursPart}
                  onChange={(e) => setBreakHoursPart(Number(e.target.value))}
                  className="text-xs px-1.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  {[0, 1, 2, 3, 4].map((h) => (
                    <option key={h} value={h}>
                      {h} {language === 'my' ? 'နာရီ' : 'hr'}
                    </option>
                  ))}
                </select>
                <select
                  value={breakMinutesPart}
                  onChange={(e) => setBreakMinutesPart(Number(e.target.value))}
                  className="text-xs px-1.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  {Array.from(new Set([0, 5, 10, 15, 20, 30, 40, 45, 50, breakMinutesPart]))
                    .sort((a, b) => a - b)
                    .map((m) => (
                      <option key={m} value={m}>
                        {m} {language === 'my' ? 'မိနစ်' : 'min'}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Co-Trainer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t.coTrainer}</span>
              <span className="text-[11px] font-normal text-purple-700">
                ({coTrainerIds.length} selected)
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto">
              {assignableTrainers.map((u) => {
                const isSelected = coTrainerIds.includes(u.id);
                const isCurrent = u.id === currentUser.id;
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCoTrainer(u.id)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="truncate">
                      {u.name} {isCurrent && '(You)'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Trainer + Selectable Sub-Topic + Time/Duration Breakdown Under Main Topic */}
          <div className="bg-purple-50/75 border border-purple-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  <span>
                    {language === 'my'
                      ? 'Main Topic အောက် Trainer အလိုက် ခေါင်းစဉ်နှင့် သင်ကြားချိန် ရွေးချယ်ရန်'
                      : 'Trainer Sub-Topic & Duration Assignment'}
                  </span>
                </span>
                <p className="text-[10px] text-purple-700 mt-0.5">
                  {language === 'my'
                    ? 'ဥပမာ- Myat Thura Kyaw (Universal Life · 1h), Ag Zaw Myo (PA · 1h) စသဖြင့် ခေါင်းစဉ်နှင့် အချိန် ရွေးထည့်နိုင်သည်'
                    : 'Assign specific topic & duration (hours/mins) per trainer under this Main Topic'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTrainerTopicRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'Trainer & ခေါင်းစဉ် ထပ်ထည့်' : 'Add Trainer & Topic'}</span>
              </button>
            </div>

            <datalist id="training-modal-subtopic-list">
              {TRAINING_TOPIC_SUGGESTIONS.map((topicOpt) => (
                <option key={topicOpt} value={topicOpt} />
              ))}
            </datalist>

            <div className="space-y-2">
              {trainerTopicRows.map((row, idx) => (
                <div
                  key={row.rowId}
                  className="bg-white border border-purple-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  {/* Trainer Select */}
                  <div className="sm:col-span-4">
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                      #{idx + 1} {language === 'my' ? 'သင်တန်းဆရာ' : 'Trainer'}
                    </label>
                    <select
                      value={row.userId || ''}
                      onChange={(e) => {
                        const chosen = assignableTrainers.find((u) => u.id === e.target.value);
                        if (chosen) {
                          handleUpdateRow(row.rowId, {
                            userId: chosen.id,
                            name: chosen.name,
                          });
                        }
                      }}
                      className="w-full text-xs font-bold text-slate-900 px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    >
                      {!row.userId && row.name && (
                        <option value="">{row.name}</option>
                      )}
                      {assignableTrainers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Topic Select / Input */}
                  <div className="sm:col-span-4">
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                      {language === 'my' ? 'သင်ကြားမည့် ခေါင်းစဉ်' : 'Sub-Topic'}
                    </label>
                    <input
                      type="text"
                      list="training-modal-subtopic-list"
                      value={row.topic}
                      onChange={(e) => handleUpdateRow(row.rowId, { topic: e.target.value })}
                      placeholder={
                        language === 'my' ? 'ဥပမာ Universal Life, PA...' : 'e.g. Universal Life, PA...'
                      }
                      className="w-full text-xs font-semibold text-slate-900 px-2 py-1.5 border border-purple-300 rounded-lg bg-purple-50/20 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  {/* Time / Duration (Hours + Minutes) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">
                      {language === 'my' ? 'သင်ကြားချိန် (နာရီ/မိနစ်)' : 'Time (Hr / Min)'}
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={row.hoursPart}
                        onChange={(e) =>
                          handleUpdateRow(row.rowId, { hoursPart: Number(e.target.value) })
                        }
                        className="text-xs font-bold px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 tabular-nums"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                          <option key={h} value={h}>
                            {h}{language === 'my' ? 'နာရီ' : 'h'}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.minutesPart}
                        onChange={(e) =>
                          handleUpdateRow(row.rowId, { minutesPart: Number(e.target.value) })
                        }
                        className="text-xs font-bold px-1.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 tabular-nums"
                      >
                        {Array.from(new Set([0, 15, 30, 45, row.minutesPart]))
                          .sort((a, b) => a - b)
                          .map((m) => (
                            <option key={m} value={m}>
                              {m}{language === 'my' ? 'မိနစ်' : 'm'}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Remove Row */}
                  <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                    {trainerTopicRows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.rowId)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title={language === 'my' ? 'ဖယ်ရှားရန်' : 'Remove row'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                        Lead
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Training Venue
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Yangon Head Office Hall A or Zoom"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>
                {trainingToEdit
                  ? language === 'my'
                    ? 'သိမ်းဆည်းရန်'
                    : 'Save Changes'
                  : t.saveTraining}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
