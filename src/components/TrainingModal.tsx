import React, { useState, useEffect, useMemo } from 'react';
import { TrainingLog, UserProfile } from '../types';
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
import { X, Check, Clock, Calculator, UserCheck } from 'lucide-react';

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
  const [breakHrs, setBreakHrs] = useState(1.0);
  const [trainerName, setTrainerName] = useState('');
  const [coTrainerIds, setCoTrainerIds] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (trainingToEdit) {
      setName(trainingToEdit.name);
      setDate(trainingToEdit.date);
      setStart(trainingToEdit.start);
      setEnd(trainingToEdit.end);
      setBreakHrs(trainingToEdit.breakHrs);
      setTrainerName(trainingToEdit.trainerName || '');
      const existingCoIds =
        trainingToEdit.coTrainerIds ??
        (trainingToEdit.attendeeIds || []).filter((id) => {
          const u = allUsers.find((usr) => usr.id === id);
          return u && u.name !== trainingToEdit.trainerName;
        });
      setCoTrainerIds(existingCoIds);
      setLocation(trainingToEdit.location || '');
      setNotes(trainingToEdit.notes || '');
    } else {
      setName('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStart('09:00');
      setEnd('17:00');
      setBreakHrs(1.0);
      setTrainerName(targetMember ? targetMember.name : currentUser.name);
      setCoTrainerIds([]);
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

  if (!isOpen) return null;

  const selectedMonthKey = getMonthKey(date);
  const selectedWeek = getWeekOfMonth(date);
  const selectedWeekday = getDayOfWeekCode(date);
  const weeksInMonth = getWeeksInMonth(selectedMonthKey);

  const handleToggleCoTrainer = (uid: string) => {
    setCoTrainerIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalTrainerName = trainerName.trim() || currentUser.name;
    const trainerUser = allUsers.find((u) => u.name === finalTrainerName);
    const selectedCoTrainers = allUsers.filter((u) => coTrainerIds.includes(u.id));

    const combinedIds = Array.from(
      new Set([...(trainerUser ? [trainerUser.id] : []), ...coTrainerIds])
    );
    const combinedNames = Array.from(
      new Set([finalTrainerName, ...selectedCoTrainers.map((u) => u.name)])
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
      coTrainerIds,
      coTrainerNames: selectedCoTrainers.map((u) => u.name),
      attendeeIds: combinedIds,
      attendeeNames: combinedNames,
      location: location.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {trainingToEdit ? (language === 'my' ? 'သင်တန်းမှတ်တမ်း ပြင်ဆင်ရန်' : 'Edit Training Session') : t.saveTraining}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my' ? 'သင်တန်းခေါင်းစဉ်၊ သင်တန်းဆရာအမည်နှင့် နာရီ မှတ်တမ်းတင်ခြင်း' : 'Record topic, trainer name & training hours'}
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
        <div className="bg-purple-50/80 border-b border-purple-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-700" />
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-700 block tracking-wider">
                {t.calculatedHours}
              </span>
              <span className="text-[11px] text-purple-900">
                {t.formulaNote}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-purple-900 tabular-nums">
              {calculatedHours.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-purple-700 ml-1">hrs</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
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
          {/* Course / Topic Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.sessionName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bancassurance 2026 Sales Mastery"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            />
          </div>

          {/* Date & Trainer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>{t.trainingDate} <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-bold text-purple-700">
                  {formatMonthLabel(selectedMonthKey, language)} · {getWeekOrdinal(selectedWeek)} · {selectedWeekday}
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
                <span>{t.trainerName} <span className="text-red-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setTrainerName(currentUser.name)}
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
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder={language === 'my' ? 'သင်တန်းဆရာအမည် ရိုက်ထည့်ပါ...' : 'Enter or pick trainer name...'}
                className="w-full text-xs px-3 py-2 border border-purple-300 bg-purple-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
              />
              <datalist id="training-modal-trainer-list">
                {allUsers
                  .filter((u) => u.roleTier !== 'VIEWER')
                  .map((u) => (
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
                {language === 'my' ? 'လအလိုက် အပတ်စဉ် (Date ရွေးလျှင် အလိုအလျောက်ရွေးပေးမည်)' : 'Week of Month (auto-syncs with date)'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weeksInMonth.map((wk) => (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => setDate(getDefaultDateForMonthWeek(selectedMonthKey, wk, selectedWeekday))}
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
                {language === 'my' ? 'နေ့ရက် (Mon – Sun တိုက်ရိုက်ရွေးရန်)' : 'Weekday (Mon – Sun quick select)'}
              </span>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_CODES.map((wd) => (
                  <button
                    key={wd}
                    type="button"
                    onClick={() => setDate(getDateForWeekAndWeekday(selectedMonthKey, selectedWeek, wd))}
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

          {/* Start, End, Break Times */}
          <div className="grid grid-cols-3 gap-2">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.breakHours}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={breakHrs}
                onChange={(e) => setBreakHrs(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
            <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
              {allUsers
                .filter((u) => u.roleTier !== 'VIEWER')
                .map((u) => {
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

          {/* Location & Notes */}
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
              <span>{trainingToEdit ? (language === 'my' ? 'သိမ်းဆည်းရန်' : 'Save Changes') : t.saveTraining}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
