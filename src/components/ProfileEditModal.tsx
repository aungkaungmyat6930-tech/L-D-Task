import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, RoleTier, MemberStatus } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { processProfilePhotoFile } from '../utils/imageUpload';
import { isAdminOrSuper } from '../utils/roleHelpers';
import { X, UserPen, Check, Camera, Sparkles, Shield, UserCheck, Upload, AlertCircle } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  userToEdit?: UserProfile | null;
  onSaveProfile: (updated: UserProfile, oldName: string) => void;
  language: Language;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userToEdit,
  onSaveProfile,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const targetUser = userToEdit || currentUser;
  const isEditingSelf = currentUser.id === targetUser.id;
  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(targetUser.name);
  const [roleLabel, setRoleLabel] = useState(targetUser.roleLabel);
  const [dept, setDept] = useState(targetUser.dept);
  const [avatar, setAvatar] = useState(targetUser.avatar);
  const [email, setEmail] = useState(targetUser.email || '');
  const [phone, setPhone] = useState(targetUser.phone || '');
  const [status, setStatus] = useState<MemberStatus>(targetUser.status || 'Active');
  const [roleTier, setRoleTier] = useState<RoleTier>(targetUser.roleTier);
  const [notes, setNotes] = useState(targetUser.notes || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name);
      setRoleLabel(targetUser.roleLabel);
      setDept(targetUser.dept);
      setAvatar(targetUser.avatar);
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setStatus(targetUser.status || 'Active');
      setRoleTier(targetUser.roleTier);
      setNotes(targetUser.notes || '');
      setPhotoError(null);
      setUploadedFileName(null);
    }
  }, [targetUser, isOpen]);

  if (!isOpen) return null;

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const dataUrl = await processProfilePhotoFile(file, 320);
      setAvatar(dataUrl);
      setUploadedFileName(file.name);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const oldName = targetUser.name;
    const updated: UserProfile = {
      ...targetUser,
      name: name.trim(),
      roleLabel: roleLabel.trim() || targetUser.roleLabel,
      dept: dept.trim() || targetUser.dept,
      avatar: avatar.trim() || targetUser.avatar,
      email: email.trim(),
      phone: phone.trim(),
      status,
      roleTier: isAdmin ? roleTier : targetUser.roleTier,
      notes: notes.trim(),
      resignedDate:
        status === 'Resigned' && !targetUser.resignedDate
          ? new Date().toISOString().split('T')[0]
          : status === 'Active'
          ? undefined
          : targetUser.resignedDate,
    };

    onSaveProfile(updated, oldName);
    onClose();
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
              <UserPen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditingSelf
                  ? (language === 'my' ? 'သင့်ကိုယ်ပိုင် Profile ပြင်ဆင်ရန်' : 'Edit Your Profile')
                  : (language === 'my' ? `"${targetUser.name}" ၏ Profile ပြင်ဆင်ရန်` : `Edit Profile: ${targetUser.name}`)}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'my'
                  ? 'အမည်၊ ဓာတ်ပုံ၊ ရာထူး၊ ဌာန နှင့် အဝင်/အထွက် အခြေအနေများ ပြောင်းလဲခြင်း'
                  : 'Update personal identity, photo, designation & active/resigned status'}
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

        {/* Informative Note */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {language === 'my'
              ? 'အမည်ပြောင်းလဲပါက ထိုသူနှင့် သက်ဆိုင်သော Task များ၊ Leave ခွင့်ရက်များနှင့် Training နာရီမှတ်တမ်းများအားလုံးတွင် အလိုအလျောက် တပြိုင်နက် update ဖြစ်သွားပါမည်။'
              : 'Name changes automatically sync across all assigned tasks, leaves, and training hours.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Avatar Preview, File Upload & URL */}
          <div className="flex items-start gap-4 pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400"
              title={language === 'my' ? 'ဓာတ်ပုံ Upload တင်ရန် နှိပ်ပါ' : 'Click to upload photo'}
            >
              <img
                src={avatar || targetUser.avatar}
                alt="Avatar Preview"
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-full border-2 border-amber-400 object-cover shadow-md bg-slate-100"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-[9px] font-bold text-white mt-0.5">Upload</span>
              </div>
            </button>

            <div className="flex-grow space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-800" />
                  <span>
                    {photoUploading
                      ? language === 'my' ? 'တင်နေသည်...' : 'Processing...'
                      : language === 'my' ? 'ဓာတ်ပုံ Upload တင်ရန်' : 'Upload Photo from Device'}
                  </span>
                </button>
                {uploadedFileName && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ {uploadedFileName}
                  </span>
                )}
              </div>

              {photoError && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  {language === 'my' ? 'သို့မဟုတ် ဓာတ်ပုံ URL ထည့်ရန်' : 'Or paste image URL'}
                </label>
                <input
                  type="text"
                  value={avatar.startsWith('data:image/') ? '' : avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setUploadedFileName(null);
                  }}
                  placeholder={
                    avatar.startsWith('data:image/')
                      ? (language === 'my' ? 'စက်ထဲမှ ဓာတ်ပုံ Upload တင်ထားပြီးဖြစ်သည်' : 'Uploaded photo ready (paste URL to replace)')
                      : 'https://images.unsplash.com/...'
                  }
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Quick pick:</span>
                {sampleAvatars.map((pic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(pic);
                      setUploadedFileName(null);
                    }}
                    className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform"
                  >
                    <img src={pic} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name Input - Core Requirement */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>{t.fullName} <span className="text-red-500">*</span></span>
              <span className="text-[11px] font-normal text-blue-600">
                {language === 'my' ? '(မှတ်တမ်းများအားလုံးတွင် အလိုအလျောက်ချိတ်ဆက်မည်)' : '(Will sync with all records)'}
              </span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aung Kyaw / မောင်အောင်ကျော်"
              className="w-full text-sm font-semibold px-3 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/20"
            />
          </div>

          {/* Job Title / Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.jobTitle}
              </label>
              <input
                type="text"
                required
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                placeholder="e.g. Senior Trainer"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.department}
              </label>
              <input
                type="text"
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. Agency Channel"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Status: Active / Resigned (အဝင် / အထွက်) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'my' ? 'ဝန်ထမ်းအခြေအနေ (အဝင်/အထွက်)' : 'Member Status (Onboard/Offboard)'}</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className={`w-full text-xs px-3 py-2 border rounded-lg font-bold focus:outline-none focus:ring-2 ${
                  status === 'Active'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : status === 'Resigned'
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <option value="Active">Active (တာဝန်ထမ်းဆောင်ဆဲ - အဝင်)</option>
                <option value="Resigned">Resigned (နုတ်ထွက်ပြီး - အထွက်)</option>
                <option value="Transferred">Transferred (အခြားဌာနသို့ ပြောင်းရွှေ့)</option>
                <option value="On Leave">On Leave (ခွင့်ရက်ရှည် ယူထားဆဲ)</option>
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>Admin: Role Tier</span>
                </label>
                <select
                  value={roleTier}
                  onChange={(e) => setRoleTier(e.target.value as RoleTier)}
                  className="w-full text-xs px-3 py-2 border border-purple-300 bg-purple-50 text-purple-900 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MEMBER">Member (Self-Service)</option>
                  <option value="ADMIN">Admin (Management)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Control + Leave Approval)</option>
                  <option value="VIEWER">Viewer (Read-Only)</option>
                </select>
              </div>
            )}
          </div>

          {/* Contact Details */}
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
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Optional HR/Offboarding Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'my' ? 'မှတ်ချက် / အဝင်အထွက် အကြောင်းအရာ (HR Notes)' : 'HR / Member Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                language === 'my'
                  ? 'ဥပမာ- ၂၀၂၄ ခုနှစ်တွင် စတင်တာဝန်ထမ်းဆောင်၊ သို့မဟုတ် နုတ်ထွက်ရသည့် အကြောင်းအရာ'
                  : 'e.g. Joined Jan 2024 or Resignation details...'
              }
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Action Buttons */}
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
