import React, { useState } from 'react';
import { TaskItem, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { Calendar, MessageSquare, Plus, Clock, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface WeeklyBoardTabProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenComments: (task: TaskItem) => void;
  language: Language;
}

export const WeeklyBoardTab: React.FC<WeeklyBoardTabProps> = ({
  tasks,
  currentUser,
  allUsers,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onOpenMemberSheet,
  onOpenComments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const isAdmin = currentUser.roleTier === 'ADMIN';
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const days: Array<{ code: TaskItem['day']; labelEn: string; labelMy: string }> = [
    { code: 'Mon', labelEn: 'Monday', labelMy: 'တနင်္လာ' },
    { code: 'Tue', labelEn: 'Tuesday', labelMy: 'အင်္ဂါ' },
    { code: 'Wed', labelEn: 'Wednesday', labelMy: 'ဗုဒ္ဓဟူး' },
    { code: 'Thu', labelEn: 'Thursday', labelMy: 'ကြာသပတေး' },
    { code: 'Fri', labelEn: 'Friday', labelMy: 'သောကြာ' },
    { code: 'Sat', labelEn: 'Saturday', labelMy: 'စနေ' },
    { code: 'Sun', labelEn: 'Sunday', labelMy: 'တနင်္ဂနွေ' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>{language === 'my' ? '၇ ရက်တာ အပတ်စဉ် လုပ်ငန်းခွင် ဇယား (Monday – Sunday)' : 'Weekly Workload Summary Board'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'အဖွဲ့ဝင်အားလုံး၏ နေ့ရက်အလိုက် လုပ်ငန်းတာဝန်များ ခွဲဝေမှုနှင့် ပြီးစီးမှုအခြေအနေ (ကိုယ့် Task များကို တိုက်ရိုက် Edit/Delete လုပ်နိုင်သည်)'
              : 'Weekly schedule distribution across all L&D department personnel with direct Edit & Delete options'}
          </p>
        </div>

        {currentUser.roleTier !== 'VIEWER' && (
          <button
            onClick={() => onOpenAddTask()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMyTask}</span>
          </button>
        )}
      </div>

      {/* 7 Columns Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {days.map((d) => {
          const dayTasks = tasks.filter((t) => t.day === d.code);

          return (
            <div
              key={d.code}
              className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 flex flex-col min-h-[460px]"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    {language === 'my' ? d.labelMy : d.labelEn}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">{d.code}</span>
                </div>
                <span className="text-xs font-extrabold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full shadow-2xs">
                  {dayTasks.length}
                </span>
              </div>

              {/* Tasks in this day */}
              <div className="space-y-2 flex-grow overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className="text-[11px] text-slate-400 text-center py-8 italic border border-dashed border-slate-300 rounded-lg">
                    {language === 'my' ? 'တာဝန်မရှိပါ' : 'No tasks'}
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    const isOverdue = task.status === 'Overdue';
                    const isMyTask =
                      task.ownerId === currentUser.id || task.ownerName === currentUser.name;
                    const canEdit = (isMyTask || isAdmin) && currentUser.roleTier !== 'VIEWER';

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenComments(task)}
                        className={`bg-white p-3 rounded-xl border cursor-pointer hover:shadow-md transition space-y-2 relative group ${
                          isOverdue
                            ? 'border-red-300 bg-red-50/20'
                            : isMyTask
                            ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300/40'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              task.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'Overdue'
                                ? 'bg-red-100 text-red-800'
                                : task.status === 'Waiting'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {task.due}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {task.title}
                        </h5>

                        {isMyTask && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                              {language === 'my' ? 'သင့် Task' : 'Your Task'}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const found = allUsers.find(
                                (u) => u.id === task.ownerId || u.name === task.ownerName
                              );
                              if (found) onOpenMemberSheet(found);
                            }}
                            className="font-bold text-slate-700 hover:text-blue-600 hover:underline truncate max-w-[90px] text-left"
                            title={`Open sheet for ${task.ownerName}`}
                          >
                            {task.ownerName}
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-bold flex items-center gap-0.5 mr-1" title="Comments">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments ? task.comments.length : 0}
                            </span>

                            {/* Direct Edit / Delete buttons on the card (Core Requirement) */}
                            {canEdit && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditTask(task);
                                  }}
                                  className="p-1 text-amber-600 hover:bg-amber-50 rounded transition"
                                  title={language === 'my' ? 'Task ပြင်ရန်' : 'Edit task'}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskToDelete(task);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                  title={language === 'my' ? 'Task ဖျက်ရန်' : 'Delete task'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guaranteed In-App Delete Confirmation Modal (no browser window.confirm) */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        title={language === 'my' ? 'Task ကို ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Task Deletion'}
        message={
          language === 'my'
            ? `"${taskToDelete?.title}" ကို စနစ်ထဲမှ အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`
            : `Are you sure you want to delete "${taskToDelete?.title}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Task'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />
    </div>
  );
};
