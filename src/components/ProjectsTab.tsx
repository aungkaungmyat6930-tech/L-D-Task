import React, { useState } from 'react';
import { StrategicProject, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { FolderKanban, Plus, Calendar, CheckCircle2, TrendingUp, Sparkles, X, Check } from 'lucide-react';

interface ProjectsTabProps {
  projects: StrategicProject[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onAddProject: (proj: Partial<StrategicProject>) => void;
  language: Language;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  currentUser,
  allUsers,
  onAddProject,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [deadline, setDeadline] = useState('2026-12-31');
  const [deliverables, setDeliverables] = useState('');

  const isViewer = currentUser.roleTier === 'VIEWER';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const owner = allUsers.find((u) => u.id === ownerId) || currentUser;

    onAddProject({
      title: title.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      deadline,
      deliverables: deliverables.trim(),
      progress: 10,
      status: 'In Progress',
    });

    setTitle('');
    setDeliverables('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span>{language === 'my' ? 'L&D မဟာဗျူဟာမြောက် စီမံကိန်းများ (Strategic Projects)' : 'Strategic L&D Projects'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'ကမ္ဘောဇ အသက်အာမခံ လေ့ကျင့်ရေး သင်ရိုးညွှန်းတမ်းများ၊ ဒစ်ဂျစ်တယ် LMS နှင့် အေးဂျင့်လိုင်စင် ပရိုဂရမ်များ'
              : 'High-level department blueprints, curriculum development, LMS integration and agent certification'}
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'my' ? 'စီမံကိန်းအသစ် စတင်ရန်' : 'Launch New Project'}</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {proj.status}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {proj.deadline}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {proj.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {proj.deliverables}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Progress</span>
                <span className="text-blue-600">{proj.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>Lead: <strong className="text-slate-800">{proj.ownerName}</strong></span>
                {proj.ownerName === currentUser.name && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded">
                    You
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Launch Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {language === 'my' ? 'စီမံကိန်းအသစ် စတင်ရန်' : 'Launch Strategic L&D Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Agency Onboarding Excellence 2026"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Owner
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allUsers
                      .filter((u) => u.roleTier !== 'VIEWER')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverables & Scope
                </label>
                <textarea
                  rows={3}
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="Summarize courseware, digital assets, or target participants..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
