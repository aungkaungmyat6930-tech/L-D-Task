import React from 'react';
import { LeaveAttachment } from '../types';
import { Language } from '../utils/translations';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachmentPreviewModalProps {
  attachment: LeaveAttachment | null;
  onClose: () => void;
  language: Language;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  attachment,
  onClose,
  language,
}) => {
  if (!attachment) return null;

  const sizeKb = attachment.sizeBytes
    ? `${Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB`
    : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              {attachment.kind === 'pdf' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{attachment.name}</h3>
              <p className="text-[11px] text-slate-300">
                {attachment.kind === 'pdf' ? 'PDF Document' : 'Photo Attachment'}
                {sizeKb ? ` · ${sizeKb}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={attachment.dataUrl}
              download={attachment.name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'ဒေါင်းလုဒ်ဆွဲရန်' : 'Download'}</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-100 flex-grow overflow-auto flex items-center justify-center min-h-[320px]">
          {attachment.kind === 'pdf' ? (
            <iframe
              src={attachment.dataUrl}
              title={attachment.name}
              className="w-full h-[68vh] rounded-xl border border-slate-300 bg-white"
            />
          ) : (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};
