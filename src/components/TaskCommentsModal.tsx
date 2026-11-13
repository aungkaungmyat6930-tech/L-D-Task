import React, { useState } from 'react';
import { TaskItem, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { X, Send, MessageSquare, Clock, Calendar, CheckCircle2, UserCheck, Trash2 } from 'lucide-react';

interface TaskCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  currentUser: UserProfile;
  onAddComment: (taskId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskItem['status']) => void;
  onUpdateFollowupDate: (taskId: string, newFollowup: string) => void;
  language: Language;
}

export const TaskCommentsModal: React.FC<TaskCommentsModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUser,
  onAddComment,
  onDeleteComment,
  onUpdateTaskStatus,
  onUpdateFollowupDate,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [newComment, setNewComment] = useState('');

  if (!isOpen || !task) return null;

  const canEditTask =
    currentUser.roleTier === 'ADMIN' ||
    task.ownerId === currentUser.id ||
    task.ownerName === currentUser.name;

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{task.title}</h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-2">
                <span>{t.assignee}: <strong className="text-white">{task.ownerName}</strong></span>
                <span>•</span>
                <span>{t.dueDate}: <strong className="text-amber-300">{task.due}</strong></span>
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

        {/* Quick Task Status & Follow-up Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{t.status}:</span>
            <select
              value={task.status}
              disabled={!canEditTask && currentUser.roleTier === 'VIEWER'}
              onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskItem['status'])}
              className="text-xs font-semibold px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Active">{t.inProgress}</option>
              <option value="Waiting">{t.waiting}</option>
              <option value="Completed">{t.completed}</option>
              <option value="Overdue">{t.overdue}</option>
              <option value="Cancelled">{t.cancelled}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{t.nextFollowup}:</span>
            <input
              type="date"
              value={task.followup}
              disabled={!canEditTask && currentUser.roleTier === 'VIEWER'}
              onChange={(e) => onUpdateFollowupDate(task.id, e.target.value)}
              className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Note / Objective Reminder */}
        {task.note && (
          <div className="px-6 py-2.5 bg-blue-50/50 border-b border-blue-100 text-xs text-blue-900 flex items-start gap-2">
            <span className="font-bold text-blue-700 shrink-0">
              {language === 'my' ? 'မှတ်စု -' : 'Notes -'}
            </span>
            <p className="text-slate-700">{task.note}</p>
          </div>
        )}

        {/* Comments Stream */}
        <div className="flex-grow p-6 overflow-y-auto space-y-3 bg-slate-50/30">
          {(!task.comments || task.comments.length === 0) ? (
            <div className="text-center py-10 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 italic">{t.noComments}</p>
            </div>
          ) : (
            task.comments.map((comment) => {
              const isMyComment =
                comment.authorId === currentUser.id ||
                comment.authorName === currentUser.name;
              const canDelete = isMyComment || currentUser.roleTier === 'ADMIN';

              return (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    isMyComment
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
                      />
                      <span className="font-bold text-slate-900">
                        {comment.authorName}
                      </span>
                      {isMyComment && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 rounded">
                          {language === 'my' ? 'သင်' : 'You'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {comment.timestamp}
                      </span>
                      {canDelete && currentUser.roleTier !== 'VIEWER' && (
                        <button
                          onClick={() => onDeleteComment(task.id, comment.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded transition"
                          title={t.delete}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-7">
                    {comment.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input Box */}
        {currentUser.roleTier !== 'VIEWER' ? (
          <form onSubmit={handlePost} className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`${t.writeComment} (${currentUser.name} အနေဖြင့်)`}
              className="flex-grow text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.post}</span>
            </button>
          </form>
        ) : (
          <div className="p-3 bg-slate-100 text-slate-500 text-xs text-center border-t border-slate-200">
            {language === 'my' ? 'Viewer Mode ဖြစ်၍ မှတ်ချက် ရေးသားခွင့်မရှိပါ' : 'Read-only viewer mode: cannot post comments'}
          </div>
        )}
      </div>
    </div>
  );
};
