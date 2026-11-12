import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Language } from '../utils/translations';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  language?: Language;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  language = 'my',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-grow pt-0.5">
            <h3 className="text-sm font-bold text-slate-900">
              {title || (language === 'my' ? 'ဖျက်ရန် သေချာပါသလား?' : 'Confirm Deletion')}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {message ||
                (language === 'my'
                  ? 'ဤအချက်အလက်ကို ပြန်ဖျက်လိုက်ပါက စနစ်ထဲမှ အပြီးပိုင် ပျက်ပြယ်သွားမည်ဖြစ်ပါသည်။'
                  : 'This action cannot be undone. Are you sure you want to proceed?')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
          >
            {cancelLabel || (language === 'my' ? 'မဖျက်တော့ပါ (Cancel)' : 'Cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel || (language === 'my' ? 'သေချာသည် ဖျက်မည်' : 'Delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
