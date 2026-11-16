import React, { useState, useEffect, useRef } from 'react';
import { AppearanceSettings, FontScaleOption } from '../types';
import { Language } from '../utils/translations';
import { processLogoImageFile, processBannerImageFile } from '../utils/imageUpload';
import {
  X,
  Check,
  Palette,
  Type,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trash2,
  Maximize2,
} from 'lucide-react';

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onSaveSettings: (next: AppearanceSettings) => void;
  onResetSettings: () => void;
  language: Language;
}

const FONT_SIZE_PRESETS: Array<{
  scale: FontScaleOption;
  px: number;
  labelEn: string;
  labelMy: string;
}> = [
  { scale: 'sm', px: 14, labelEn: 'Compact (14px)', labelMy: 'အသေး (14px)' },
  { scale: 'md', px: 16, labelEn: 'Standard (16px)', labelMy: 'ပုံမှန် (16px)' },
  { scale: 'lg', px: 18, labelEn: 'Large (18px)', labelMy: 'အကြီး (18px)' },
  { scale: 'xl', px: 20, labelEn: 'Extra Large (20px)', labelMy: 'အကြီးဆုံး (20px)' },
];

const TEXT_COLOR_PRESETS: Array<{
  color: string;
  labelEn: string;
  labelMy: string;
}> = [
  { color: '#1e293b', labelEn: 'Default Slate', labelMy: 'မူလ Slate' },
  { color: '#0f172a', labelEn: 'Deep Charcoal', labelMy: 'အနက်ရင့်' },
  { color: '#1e3a8a', labelEn: 'Royal Navy', labelMy: 'အပြာရင့်' },
  { color: '#312e81', labelEn: 'Deep Indigo', labelMy: 'Indigo' },
  { color: '#064e3b', labelEn: 'Forest Emerald', labelMy: 'အစိမ်းရင့်' },
  { color: '#581c87', labelEn: 'Royal Plum', labelMy: 'ခရမ်းရင့်' },
  { color: '#7c2d12', labelEn: 'Warm Espresso', labelMy: 'အညိုရင့်' },
];

const THEME_COLOR_PRESETS: Array<{
  themeColor: string;
  accentColor: string;
  labelEn: string;
  labelMy: string;
}> = [
  { themeColor: '#0f172a', accentColor: '#2563eb', labelEn: 'KBZ Midnight', labelMy: 'မူလ Midnight' },
  { themeColor: '#172554', accentColor: '#0284c7', labelEn: 'Royal Navy', labelMy: 'အပြာရင့် (Navy)' },
  { themeColor: '#064e3b', accentColor: '#10b981', labelEn: 'Emerald Jade', labelMy: 'မြစိမ်းရောင်' },
  { themeColor: '#312e81', accentColor: '#7c3aed', labelEn: 'Royal Indigo', labelMy: 'Indigo ခရမ်း' },
  { themeColor: '#4c0519', accentColor: '#e11d48', labelEn: 'Crimson Ruby', labelMy: 'ပတ္တမြားနီ' },
  { themeColor: '#18181b', accentColor: '#d97706', labelEn: 'Obsidian Gold', labelMy: 'ရွှေညိုရောင်' },
];

function scaleToDefaultPx(scale: FontScaleOption): number {
  switch (scale) {
    case 'sm':
      return 14;
    case 'lg':
      return 18;
    case 'xl':
      return 20;
    default:
      return 16;
  }
}

export const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSettings,
  language,
}) => {
  const [fontScale, setFontScale] = useState<FontScaleOption>(settings.fontScale);
  const [customFontSizePx, setCustomFontSizePx] = useState<number>(
    settings.customFontSizePx || scaleToDefaultPx(settings.fontScale)
  );
  const [textColor, setTextColor] = useState<string>(settings.textColor || '#1e293b');
  const [themeColor, setThemeColor] = useState<string>(settings.themeColor || '#0f172a');
  const [accentColor, setAccentColor] = useState<string>(settings.accentColor || '#2563eb');
  const [logoType, setLogoType] = useState<'badge' | 'image'>(settings.logoType || 'badge');
  const [logoText, setLogoText] = useState<string>(settings.logoText || 'KBZ');
  const [logoImageDataUrl, setLogoImageDataUrl] = useState<string>(
    settings.logoImageDataUrl || ''
  );
  const [logoSize, setLogoSize] = useState<'md' | 'lg' | 'xl'>(settings.logoSize || 'lg');
  const [navbarImageDataUrl, setNavbarImageDataUrl] = useState<string>(
    settings.navbarImageDataUrl || ''
  );
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [navbarUploadError, setNavbarUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const navbarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFontScale(settings.fontScale);
    setCustomFontSizePx(
      settings.customFontSizePx || scaleToDefaultPx(settings.fontScale)
    );
    setTextColor(settings.textColor || '#1e293b');
    setThemeColor(settings.themeColor || '#0f172a');
    setAccentColor(settings.accentColor || '#2563eb');
    setLogoType(settings.logoType || 'badge');
    setLogoText(settings.logoText || 'KBZ');
    setLogoImageDataUrl(settings.logoImageDataUrl || '');
    setLogoSize(settings.logoSize || 'lg');
    setNavbarImageDataUrl(settings.navbarImageDataUrl || '');
    setLogoUploadError(null);
    setNavbarUploadError(null);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const clampedPx = Math.min(24, Math.max(12, Number(customFontSizePx) || 16));

  const handleFontPxChange = (px: number) => {
    const safePx = Math.min(24, Math.max(12, Math.round(px)));
    setCustomFontSizePx(safePx);
    if (safePx <= 14) setFontScale('sm');
    else if (safePx <= 16) setFontScale('md');
    else if (safePx <= 18) setFontScale('lg');
    else setFontScale('xl');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploadError(null);
      const dataUrl = await processLogoImageFile(file, 400);
      setLogoImageDataUrl(dataUrl);
      setLogoType('image');
    } catch (err) {
      setLogoUploadError(err instanceof Error ? err.message : 'Failed to upload logo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleNavbarImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setNavbarUploadError(null);
      const dataUrl = await processBannerImageFile(file, 1440);
      setNavbarImageDataUrl(dataUrl);
    } catch (err) {
      setNavbarUploadError(err instanceof Error ? err.message : 'Failed to upload navbar image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      fontScale,
      customFontSizePx: clampedPx,
      textColor,
      themeColor,
      accentColor,
      logoType: logoType === 'image' && logoImageDataUrl ? 'image' : 'badge',
      logoText: logoText.trim() || 'KBZ',
      logoImageDataUrl: logoImageDataUrl || undefined,
      logoSize,
      navbarImageDataUrl: navbarImageDataUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className="text-white px-6 py-4 flex items-center justify-between border-b border-white/10"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'my'
                  ? 'Portal Logo, Theme Color နှင့် Font Style ပြင်ဆင်ရန် (Admin / Super Admin)'
                  : 'Portal Logo, Theme Color & Typography Settings'}
              </h3>
              <p className="text-[11px] text-slate-200">
                {language === 'my'
                  ? 'Portal Logo၊ Theme အရောင်၊ Font Size (စိတ်ကြိုက် px) နှင့် စာလုံးအရောင်များကို စိတ်ကြိုက်ပြင်ဆင်နိုင်သည်'
                  : 'Customize portal logo, header theme color, free custom font size, and body font color'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Portal Logo Customization */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>{language === 'my' ? 'Portal Logo ပြင်ဆင်ရန်' : 'Portal Logo'}</span>
              </label>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLogoType('badge')}
                  className={`px-2.5 py-1 rounded transition ${
                    logoType === 'badge' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'my' ? 'စာသား Logo' : 'Text Badge'}
                </button>
                <button
                  type="button"
                  onClick={() => setLogoType('image')}
                  className={`px-2.5 py-1 rounded transition ${
                    logoType === 'image' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'my' ? 'Logo ပုံ Upload' : 'Upload Logo Image'}
                </button>
              </div>
            </div>

            {logoType === 'badge' ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center font-extrabold text-slate-950 text-sm shadow-sm ring-2 ring-amber-400/40 shrink-0 px-1 truncate">
                  {logoText.trim() || 'KBZ'}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'my' ? 'Logo စာသား (ဥပမာ KBZ, L&D)' : 'Logo Badge Text (max 6 chars)'}
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    placeholder="KBZ"
                    className="w-full text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {logoImageDataUrl ? (
                    <img
                      src={logoImageDataUrl}
                      alt="Custom Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'my' ? 'Logo ပုံရွေးရန် (PNG/JPG)' : 'Choose Logo Image'}</span>
                  </button>
                  {logoImageDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoImageDataUrl('');
                        setLogoType('badge');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'my' ? 'ပုံဖယ်ရှားရန်' : 'Remove'}</span>
                    </button>
                  )}
                </div>
                {logoUploadError && (
                  <p className="w-full text-[11px] text-red-600 font-semibold">{logoUploadError}</p>
                )}
              </div>
            )}

            {/* Logo Size Preset */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'my' ? 'KBZ Logo အရွယ်အစား' : 'Logo Display Size'}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'md' as const, labelEn: 'Medium (48px)', labelMy: 'အလတ် (48px)' },
                  { id: 'lg' as const, labelEn: 'Large (64px)', labelMy: 'အကြီး (64px)' },
                  { id: 'xl' as const, labelEn: 'Extra Large (80px)', labelMy: 'အထူးကြီး (80px)' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setLogoSize(sz.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                      logoSize === sz.id
                        ? 'border-amber-600 bg-amber-100 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'my' ? sz.labelMy : sz.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1B. Navi Bar / Header Banner Image (Admin & Super Admin) */}
          <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'my'
                      ? 'Navi Bar / Header ပုံတင်ရန်နှင့် ပြင်ဆင်ရန်'
                      : 'Navigation Bar Banner Image (Optional)'}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'my'
                    ? 'Admin နှင့် Super Admin များမှ Navigation Bar နောက်ခံပုံကို တင်ခြင်း၊ ပြောင်းလဲခြင်း ပြုလုပ်နိုင်ပါသည်'
                    : 'Upload or edit a background image displayed across the portal header & navigation bar'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={navbarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleNavbarImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => navbarInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {navbarImageDataUrl
                      ? language === 'my'
                        ? 'ပုံပြောင်းတင်ရန်'
                        : 'Replace Image'
                      : language === 'my'
                      ? 'Navi Bar ပုံတင်ရန်'
                      : 'Upload Nav Image'}
                  </span>
                </button>
                {navbarImageDataUrl && (
                  <button
                    type="button"
                    onClick={() => setNavbarImageDataUrl('')}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'my' ? 'ဖယ်ရှားရန်' : 'Remove'}</span>
                  </button>
                )}
              </div>
            </div>
            {navbarImageDataUrl && (
              <div
                className="h-16 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-between px-4 text-white text-xs font-bold"
                style={{
                  backgroundImage: `linear-gradient(rgba(15,23,42,0.62), rgba(15,23,42,0.75)), url(${navbarImageDataUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span>{language === 'my' ? 'Navi Bar နောက်ခံပုံ Preview' : 'Nav Bar Image Preview'}</span>
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px]">Active</span>
              </div>
            )}
            {navbarUploadError && (
              <p className="text-[11px] text-red-600 font-semibold">{navbarUploadError}</p>
            )}
          </div>

          {/* 2. Portal Theme Color & Accent Color */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{language === 'my' ? 'Portal Theme Color (Header & Navigation)' : 'Portal Theme & Accent Color'}</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {THEME_COLOR_PRESETS.map((preset) => {
                const active =
                  themeColor.toLowerCase() === preset.themeColor.toLowerCase() &&
                  accentColor.toLowerCase() === preset.accentColor.toLowerCase();
                return (
                  <button
                    key={preset.labelEn}
                    type="button"
                    onClick={() => {
                      setThemeColor(preset.themeColor);
                      setAccentColor(preset.accentColor);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                      active
                        ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0"
                      style={{ backgroundColor: preset.themeColor }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full -ml-3 border border-white shrink-0"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    <span className="text-slate-800">
                      {language === 'my' ? preset.labelMy : preset.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    {language === 'my' ? 'Theme Header အရောင်' : 'Header Theme'}
                  </span>
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full text-[11px] font-mono px-2 py-0.5 mt-0.5 border border-slate-300 rounded bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    {language === 'my' ? 'Active Tab Accent အရောင်' : 'Active Accent'}
                  </span>
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full text-[11px] font-mono px-2 py-0.5 mt-0.5 border border-slate-300 rounded bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Custom Free Font Size Selection (Slider + Exact PX + Presets) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'my'
                    ? 'စာလုံးအရွယ်အစား (စိတ်ကြိုက် px ရွေးချယ်ရန်)'
                    : 'Custom Font Size (Free px Selection)'}
                </span>
              </label>
              <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded tabular-nums">
                {clampedPx}px
              </span>
            </div>

            {/* Free Slider + Exact Numeric Input */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-500 tabular-nums">12px</span>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={clampedPx}
                onChange={(e) => handleFontPxChange(Number(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-500 tabular-nums">24px</span>
              <input
                type="number"
                min={12}
                max={24}
                value={clampedPx}
                onChange={(e) => handleFontPxChange(Number(e.target.value))}
                className="w-16 text-xs font-bold text-center px-2 py-1 border border-slate-300 rounded-lg bg-white text-slate-900 tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_SIZE_PRESETS.map((opt) => {
                const active = clampedPx === opt.px;
                return (
                  <button
                    key={opt.scale}
                    type="button"
                    onClick={() => handleFontPxChange(opt.px)}
                    className={`px-3 py-2 rounded-xl border text-left transition flex items-center justify-between ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold">
                      {language === 'my' ? opt.labelMy : opt.labelEn}
                    </span>
                    <span
                      className={`font-black ${active ? 'text-blue-700' : 'text-slate-400'}`}
                      style={{ fontSize: `${opt.px}px` }}
                    >
                      Aa
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Font Color Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>{language === 'my' ? 'စာလုံးအရောင် (Font Color)' : 'Font Text Color'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">{textColor.toUpperCase()}</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {TEXT_COLOR_PRESETS.map((preset) => {
                const active = textColor.toLowerCase() === preset.color.toLowerCase();
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setTextColor(preset.color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                      active
                        ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span style={{ color: preset.color }}>
                      {language === 'my' ? preset.labelMy : preset.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5"
                title="Pick custom font color"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 block">
                  {language === 'my' ? 'စိတ်ကြိုက် Font Color ရွေးရန်' : 'Custom Font Hex Color'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'my'
                    ? 'အရောင်ဘောက်စ်ကို နှိပ်၍ နှစ်သက်ရာ စာလုံးအရောင် ရွေးနိုင်ပါသည်'
                    : 'Click swatch to pick any custom text color'}
                </span>
              </div>
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-24 text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Live Portal Preview (Header + Body Typography) */}
          <div className="rounded-xl border border-slate-300 overflow-hidden shadow-xs">
            <div
              className="px-4 py-3 text-white flex items-center justify-between gap-2"
              style={
                navbarImageDataUrl
                  ? {
                      backgroundColor: themeColor,
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.78)), url(${navbarImageDataUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { backgroundColor: themeColor }
              }
            >
              <div className="flex items-center gap-2.5">
                {logoType === 'image' && logoImageDataUrl ? (
                  <img
                    src={logoImageDataUrl}
                    alt="Preview Logo"
                    className={`${
                      logoSize === 'xl' ? 'h-12' : logoSize === 'md' ? 'h-9' : 'h-11'
                    } w-auto max-w-[120px] rounded-lg object-contain bg-white/10 p-0.5`}
                  />
                ) : (
                  <div
                    className={`${
                      logoSize === 'xl'
                        ? 'h-12 px-3 text-sm'
                        : logoSize === 'md'
                        ? 'h-9 px-2 text-xs'
                        : 'h-11 px-2.5 text-sm'
                    } rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex flex-col items-center justify-center font-extrabold text-slate-950 leading-none`}
                  >
                    <span>{logoText.trim() || 'KBZ'}</span>
                    {(logoText.trim() || 'KBZ').toUpperCase() === 'KBZ' && (
                      <span className="text-[8px] font-black tracking-widest mt-0.5">LIFE</span>
                    )}
                  </div>
                )}
                <span className="text-sm font-extrabold text-white">KBZ Life L&D Portal</span>
              </div>
              <span
                className="text-[10px] font-bold text-white px-2.5 py-1 rounded-md"
                style={{ backgroundColor: accentColor }}
              >
                Active Tab
              </span>
            </div>

            <div className="bg-slate-50 p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'my' ? 'နမူနာမြင်ကွင်း (Live Preview)' : 'Live Preview'} · {clampedPx}px
              </span>
              <p
                className="font-bold leading-snug"
                style={{ fontSize: `${clampedPx}px`, color: textColor }}
              >
                KBZ Life L&D Portal — လုပ်ငန်းတာဝန်နှင့် သင်တန်းစီမံခန့်ခွဲမှု စနစ်
              </p>
              <p
                className="opacity-85"
                style={{
                  fontSize: `${Math.max(11, Math.round(clampedPx * 0.85))}px`,
                  color: textColor,
                }}
              >
                {language === 'my'
                  ? 'Portal Logo၊ Theme Color၊ စာလုံးအရွယ်အစားနှင့် အရောင်သည် Portal တစ်ခုလုံးတွင် သက်ရောက်ပါမည်။'
                  : 'Logo, theme colors, font size, and text color will apply across the portal.'}
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onResetSettings();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'မူလအတိုင်း ပြန်ထား' : 'Reset Default'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'my' ? 'သိမ်းဆည်းအသုံးပြုမည်' : 'Apply Theme & Style'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
