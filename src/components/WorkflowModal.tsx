import React from 'react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { X, Network, CheckSquare, CalendarDays, Clock, ShieldCheck, ArrowDown, User, Sparkles } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'my'
                  ? 'KBZ Life Insurance L&D လုပ်ငန်းစီမံခန့်ခွဲမှု စနစ်ဖွဲ့စည်းပုံ (Org-Chart)'
                  : 'KBZ Life Insurance L&D Work Management Workflow (Org-Chart)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my' ? 'Task၊ Leave၊ Training နာရီနှင့် User အခွင့်အရေး စီးဆင်းမှုပုံစံ' : 'Architecture of Tasks, Leaves, Training Hours and User Self-Service'}
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

        {/* Diagram Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-center bg-slate-50 flex-grow">
          {/* Central Root Node */}
          <div className="inline-block bg-slate-900 text-white px-8 py-3.5 rounded-2xl shadow-md border-t-4 border-amber-400">
            <div className="text-[10px] text-amber-300 uppercase font-extrabold tracking-wider">
              Central Enterprise Portal
            </div>
            <div className="text-sm font-black text-white flex items-center justify-center gap-2 mt-0.5">
              <span>KBZ Life L&D Portal (User Self-Service & Admin Governance)</span>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-400 mx-auto" />
          <div className="w-3/4 h-0.5 bg-slate-400 mx-auto" />

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
            {/* Pillar 1: Tasks */}
            <div className="bg-white p-5 rounded-2xl border-t-4 border-blue-600 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>1. Task & Overdue Track</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {language === 'my'
                  ? 'မိမိနာမည်အောက်တွင် Task ထည့်ခြင်း၊ Due Date၊ Follow-up Date သတ်မှတ်ခြင်းနှင့် မှတ်ချက်များ အပြန်အလှန်ရေးသားခြင်း'
                  : 'Assign tasks to self or team, track due dates, set follow-up reminders, and post activity comments.'}
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[10px] font-bold text-amber-800">
                  ⚡ Pre-Deadline Reminder & Follow-up
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-200 text-[10px] font-bold text-red-800">
                  ⚠️ Overdue Detection & Alerts
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10px] font-bold text-emerald-800">
                  💬 Multi-User Comment Stream & Completion
                </div>
              </div>
            </div>

            {/* Pillar 2: Leaves */}
            <div className="bg-white p-5 rounded-2xl border-t-4 border-teal-600 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <span>2. Leave Request Track</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {language === 'my'
                  ? 'ခွင့်တောင်းခံလွှာများကို ကိုယ့်နာမည်အောက်တွင် တင်သွင်းခြင်း၊ ပြင်ခြင်း၊ ဖျက်ခြင်းနှင့် Admin အတည်ပြုချက်ရယူခြင်း'
                  : 'Submit advance leave plans, edit or cancel requests, and route to Admin for approval evaluation.'}
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[10px] font-bold text-amber-800">
                  ⏳ Advance Leave Submission & Tracking
                </div>
                <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 text-[10px] font-bold text-purple-800">
                  👑 Super Admin Evaluation: Approve / Reject
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10px] font-bold text-emerald-800">
                  📅 Master Leave Calendar & Records
                </div>
              </div>
            </div>

            {/* Pillar 3: Training Hours */}
            <div className="bg-white p-5 rounded-2xl border-t-4 border-purple-600 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>3. Training Hours Track</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {language === 'my'
                  ? 'သင်တန်းနာရီများကို အလိုအလျောက် တွက်ချက်ခြင်း- (ပြီးဆုံးချိန် − စတင်ချိန်) − အနားယူချိန်'
                  : 'Automated formula execution: Training Hours = (End Time − Start Time) − Break Time.'}
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="bg-purple-50 p-2 rounded-lg border border-purple-300 text-[10px] font-bold text-purple-900">
                  ⏱️ Real-time Formula Calculation
                </div>
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-[10px] font-bold text-blue-800">
                  👥 Participant / Attendee Linking
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10px] font-bold text-emerald-800">
                  📊 Per-Member & Department Hours Rollup
                </div>
              </div>
            </div>
          </div>

          {/* User Self-Service Permission Model */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'my' ? 'အသုံးပြုသူ ကိုယ်ပိုင်အခွင့်အရေးနှင့် စီမံခန့်ခွဲမှု စည်းမျဉ်းများ' : 'User Self-Service Permissions'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-blue-800 block">👤 Team Member</span>
                <p className="text-[11px] text-slate-600">
                  {language === 'my'
                    ? 'မိမိ Member Sheet ထဲတွင် Task ဖြည့်/ပြင်/ဖျက်ခွင့်၊ ခွင့်တင်/ဖျက်ခွင့်၊ သင်တန်းနာရီ မှတ်တမ်းတင်ခွင့်ရှိသည်။ Completed ဖြစ်ရန် Admin/Super Admin အတည်ပြုချက် လိုအပ်သည်။'
                    : 'Edit own profile, add/edit/delete tasks inside own Member Sheet, submit leaves & training logs. Task completion requires Admin/Super Admin approval.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                <span className="font-extrabold text-indigo-900 block">🛡️ Admin</span>
                <p className="text-[11px] text-indigo-900">
                  {language === 'my'
                    ? 'ဝန်ထမ်းစီမံခန့်ခွဲမှု၊ Project/Deadline သတ်မှတ်ခြင်း၊ Task ပြီးစီးမှု (Completed) အတည်ပြုခြင်းနှင့် မှတ်တမ်းအားလုံးကို ကြီးကြပ်ခွင့်ရှိသည်။ (Leave Approval မပါဝင်ပါ)'
                    : 'Member onboarding, projects & deadlines, task completion approval, and HR leave note alignment (excludes Leave Approve/Reject).'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                <span className="font-extrabold text-purple-900 block">👑 Super Admin</span>
                <p className="text-[11px] text-purple-900">
                  {language === 'my'
                    ? 'Admin အခွင့်အရေးအားလုံးအပြင် ခွင့်တောင်းခံမှုများကို Approve / Reject အတည်ပြုပေးနိုင်သည့် အမြင့်ဆုံး စီမံခန့်ခွဲသူ ဖြစ်သည်။'
                    : 'Full system governance including all Admin capabilities plus final Leave Approval (Approve / Reject).'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-700 block">👁 Viewer (Guest Auditor)</span>
                <p className="text-[11px] text-slate-500">
                  {language === 'my'
                    ? 'အချက်အလက်များကို ကြည့်ရှုခွင့်သာရှိပြီး ဒေတာများ ပြင်ဆင်/ဖျက်ခွင့် မရှိပါ။'
                    : 'Read-only access for compliance inspection and audits. Editing controls are disabled.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
