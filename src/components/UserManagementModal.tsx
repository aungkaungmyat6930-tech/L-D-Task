import React, { useState, useRef } from 'react';
import { UserProfile, RoleTier, MemberStatus } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { processProfilePhotoFile } from '../utils/imageUpload';
import { isAdminOrSuper } from '../utils/roleHelpers';
import { 
  X, 
  UserPlus, 
  Check, 
  UserMinus, 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ShieldCheck,
  Lock,
  Upload,
  KeyRound
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onAddUser: (user: Partial<UserProfile>) => void;
  onUpdateUserStatus: (userId: string, newStatus: MemberStatus) => void;
  onDeleteUser: (userId: string) => void;
  onOpenEditProfile: (user: UserProfile) => void;
  onOpenChangeAdminPassword?: () => void;
  language: Language;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onAddUser,
  onUpdateUserStatus,
  onDeleteUser,
  onOpenEditProfile,
  onOpenChangeAdminPassword,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'onboard' | 'offboard'>('onboard');
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Form states for onboarding
  const [name, setName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [dept, setDept] = useState('L&D Department');
  const [roleTier, setRoleTier] = useState<RoleTier>('MEMBER');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // States for offboarding/member list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resigned'>('all');

  if (!isOpen) return null;

  if (!isAdminOrSuper(currentUser.roleTier)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'my' ? 'Admin များသာ အသုံးပြုခွင့်ရှိသည်' : 'Admin Access Required'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {language === 'my'
              ? 'ဝန်ထမ်းအသစ် ထည့်သွင်းခြင်း (အဝင်) နှင့် နုတ်ထွက်/ဖယ်ရှားခြင်း (အထွက်) များကို Admin များကသာ ဆောင်ရွက်ခွင့်ရှိပါသည်။'
              : 'Only Admins are authorized to onboard, offboard, or remove team members.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
          >
            {language === 'my' ? 'ပိတ်ရန်' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddUser({
      name: name.trim(),
      roleLabel: roleLabel.trim() || 'L&D Officer',
      dept: dept.trim() || 'L&D Department',
      roleTier,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      joinDate,
      status: 'Active',
      avatar:
        avatar.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    setName('');
    setRoleLabel('');
    setEmail('');
    setPhone('');
    setActiveTab('offboard');
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ];

  const activeCount = allUsers.filter((u) => (u.status || 'Active') === 'Active').length;
  const resignedCount = allUsers.filter((u) => u.status === 'Resigned').length;

  const filteredUsers = allUsers.filter((u) => {
    const uStatus = u.status || 'Active';
    if (statusFilter === 'active' && uStatus !== 'Active') return false;
    if (statusFilter === 'resigned' && uStatus !== 'Resigned') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q) ||
        u.dept.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{language === 'my' ? 'ဝန်ထမ်း အဝင်/အထွက် စီမံခန့်ခွဲမှု (Admin Portal)' : 'HR Staff Onboarding & Offboarding Portal'}</span>
                <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded border border-purple-500/40">
                  ADMIN / SUPER ADMIN
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my'
                  ? 'အဖွဲ့ဝင်အသစ်များ ခန့်အပ်ခြင်း (အဝင်) နှင့် နုတ်ထွက်အဖွဲ့ဝင်များ စာရင်းစစ်ဆေးမှတ်တမ်းတင်ခြင်း (အထွက်)'
                  : 'Manage employee hiring, resignation records, and team directory'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChangeAdminPassword && (
              <button
                type="button"
                onClick={onOpenChangeAdminPassword}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-purple-100 bg-purple-800/80 hover:bg-purple-700 border border-purple-400/40 rounded-lg transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'my' ? 'Admin Password ပြောင်းရန်' : 'Change Password'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('onboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition ${
                activeTab === 'onboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'ဝန်ထမ်းအသစ် ခန့်အပ်ခြင်း (အဝင်)' : 'Onboard New Staff (+)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition ${
                activeTab === 'offboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>
                {language === 'my'
                  ? `ဝန်ထမ်းစာရင်းနှင့် အထွက်စီမံမှု (${allUsers.length})`
                  : `Staff Roster & Offboarding (${allUsers.length})`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active: {activeCount}
            </span>
            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Resigned: {resignedCount}
            </span>
          </div>
        </div>

        {/* Tab 1: Onboard Form */}
        {activeTab === 'onboard' && (
          <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (ဝန်ထမ်းအမည်) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. U Hla Myint / Daw Ei Ei"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role Title (ရာထူး/တာဝန်) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value)}
                  placeholder="e.g. Senior Trainer / L&D Specialist"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department (ဌာနခွဲ)
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Role Tier
                </label>
                <select
                  value={roleTier}
                  onChange={(e) => setRoleTier(e.target.value as RoleTier)}
                  className="w-full text-xs px-3 py-2 border border-purple-300 bg-purple-50 rounded-lg font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MEMBER">Member (Self-Service)</option>
                  <option value="ADMIN">Admin (Management)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Control + Leave Approval)</option>
                  <option value="VIEWER">Viewer (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'my' ? 'စတင်တာဝန်ထမ်းဆောင်သည့်ရက် (Join Date)' : 'Join Date'}
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kbzlife.com.mm"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09-xxxxxxxxx"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'my' ? 'ဝန်ထမ်းဓာတ်ပုံ Upload တင်ရန် / URL' : 'Staff Photo Upload / URL'}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={avatar}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-slate-300 shrink-0"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoError(null);
                    try {
                      const dataUrl = await processProfilePhotoFile(file, 320);
                      setAvatar(dataUrl);
                    } catch (err) {
                      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
                    } finally {
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-800" />
                  <span>{language === 'my' ? 'ဓာတ်ပုံ Upload တင်ရန်' : 'Upload Photo'}</span>
                </button>
              </div>
              {photoError && (
                <p className="text-[11px] text-red-600 font-semibold mb-1">{photoError}</p>
              )}
              <input
                type="text"
                value={avatar.startsWith('data:image/') ? '' : avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder={avatar.startsWith('data:image/') ? 'Uploaded photo ready' : 'https://images.unsplash.com/...'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5 pt-2">
                <span className="text-[10px] text-slate-400">Quick presets:</span>
                {sampleAvatars.map((pic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(pic)}
                    className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform"
                  >
                    <img src={pic} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'my' ? 'ဝန်ထမ်းအသစ် စာရင်းသွင်းရန် (Onboard)' : 'Onboard Team Member'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Staff Roster & Offboarding Management */}
        {activeTab === 'offboard' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Search and Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative flex-grow max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'my' ? 'ဝန်ထမ်းအမည် ရှာဖွေရန်...' : 'Search members...'}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded ${
                    statusFilter === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  All ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-1 rounded ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('resigned')}
                  className={`px-2 py-1 rounded ${
                    statusFilter === 'resigned' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Resigned ({resignedCount})
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Role & Dept</th>
                    <th className="p-3">Status (အဝင်/အထွက်)</th>
                    <th className="p-3 text-center">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        {language === 'my' ? 'ကိုက်ညီသော ဝန်ထမ်းမရှိပါ။' : 'No team members match.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isResigned = user.status === 'Resigned';

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100"
                              />
                              <div>
                                <span className="block font-bold text-slate-900">{user.name}</span>
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {user.email || user.phone || 'No contact'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="block font-medium text-slate-800">{user.roleLabel}</span>
                            <span className="block text-[10px] text-slate-500">{user.dept}</span>
                          </td>

                          <td className="p-3">
                            {isResigned ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span>{language === 'my' ? 'နုတ်ထွက်ပြီး (Resigned)' : 'Resigned'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{language === 'my' ? 'တာဝန်ထမ်းဆောင်ဆဲ (Active)' : 'Active'}</span>
                              </span>
                            )}
                            {user.joinDate && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                Join: {user.joinDate}
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Toggle Offboard / Reactivate */}
                              {isResigned ? (
                                <button
                                  type="button"
                                  onClick={() => onUpdateUserStatus(user.id, 'Active')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs transition"
                                  title="Reactivate staff member"
                                >
                                  {language === 'my' ? 'ပြန်ခန့်ရန် (Reactivate)' : 'Reactivate'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirm({
                                      title: language === 'my' ? 'ဝန်ထမ်းအထွက် သတ်မှတ်ရန်' : 'Offboard Team Member',
                                      message:
                                        language === 'my'
                                          ? `"${user.name}" အား ဝန်ထမ်းအထွက် (Resigned) အဖြစ် သတ်မှတ်ရန် သေချာပါသလား? ၎င်း၏ Task များနှင့် Training မှတ်တမ်းများကို သမိုင်းအဖြစ် ဆက်လက်သိမ်းဆည်းထားမည်ဖြစ်ပါသည်။`
                                          : `Mark "${user.name}" as Resigned / Offboarded? Past records will remain in history.`,
                                      confirmLabel: language === 'my' ? 'နုတ်ထွက်မှတ်မည်' : 'Offboard',
                                      isDestructive: false,
                                      onConfirm: () => onUpdateUserStatus(user.id, 'Resigned'),
                                    })
                                  }
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-xs transition"
                                  title="Offboard staff member"
                                >
                                  {language === 'my' ? 'နုတ်ထွက်မှတ်ရန် (Offboard)' : 'Offboard'}
                                </button>
                              )}

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => onOpenEditProfile(user)}
                                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Edit profile"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Permanently Delete Member */}
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingConfirm({
                                    title: language === 'my' ? 'အဖွဲ့ဝင် ဖျက်ရန် အတည်ပြုပါ' : 'Remove Team Member',
                                    message:
                                      language === 'my'
                                        ? `"${user.name}" အား အဖွဲ့ဝင်စာရင်းမှ အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`
                                        : `Permanently delete member "${user.name}"?`,
                                    confirmLabel: language === 'my' ? 'အပြီးပိုင် ဖျက်မည်' : 'Remove Member',
                                    isDestructive: true,
                                    onConfirm: () => onDeleteUser(user.id),
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete member permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {language === 'my' ? 'ပိတ်ရန်' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.onConfirm();
          setPendingConfirm(null);
        }}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        confirmLabel={pendingConfirm?.confirmLabel}
        isDestructive={pendingConfirm?.isDestructive ?? true}
        language={language}
      />
    </div>
  );
};
