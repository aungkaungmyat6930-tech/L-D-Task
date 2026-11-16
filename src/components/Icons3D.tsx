import React from 'react';

interface Icon3DProps {
  className?: string;
}

export const Icon3DTasks: React.FC<Icon3DProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="t3d-back" x1="8" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="t3d-face" x1="10" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="45%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id="t3d-check" x1="16" y1="18" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dbeafe" />
      </linearGradient>
    </defs>
    {/* Ambient Base Shadow */}
    <ellipse cx="24" cy="43" rx="14" ry="3" fill="#1e3a8a" fillOpacity="0.22" />
    {/* 3D Extruded Depth Block */}
    <rect x="8" y="10" width="32" height="31" rx="9" fill="url(#t3d-back)" />
    {/* Elevated Front Tile */}
    <rect x="8" y="6" width="32" height="31" rx="9" fill="url(#t3d-face)" />
    {/* Top Specular Rim */}
    <rect x="9" y="7" width="30" height="29" rx="8" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
    {/* Gloss Highlight */}
    <path d="M13 11C18 8.5 30 8.5 35 11" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
    {/* 3D Checkmark */}
    <path
      d="M16.5 22.5L21.5 27.5L32 16.5"
      stroke="#1e3a8a"
      strokeOpacity="0.35"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0, 1.5)"
    />
    <path
      d="M16.5 22.5L21.5 27.5L32 16.5"
      stroke="url(#t3d-check)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Icon3DOverdue: React.FC<Icon3DProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="o3d-back" x1="24" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <linearGradient id="o3d-face" x1="12" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="45%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43" rx="15" ry="3" fill="#7f1d1d" fillOpacity="0.24" />
    {/* 3D Extruded Triangle Base */}
    <path
      d="M21.4 10.8C22.6 8.7 25.4 8.7 26.6 10.8L40.4 35.1C41.6 37.2 40.1 39.8 37.7 39.8H10.3C7.9 39.8 6.4 37.2 7.6 35.1L21.4 10.8Z"
      fill="url(#o3d-back)"
    />
    {/* Front Beveled Prism */}
    <path
      d="M21.4 7.8C22.6 5.7 25.4 5.7 26.6 7.8L40.4 32.1C41.6 34.2 40.1 36.8 37.7 36.8H10.3C7.9 36.8 6.4 34.2 7.6 32.1L21.4 7.8Z"
      fill="url(#o3d-face)"
      stroke="#ffffff"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    {/* Exclamation Shadow & Mark */}
    <rect x="22" y="16.5" width="4" height="10" rx="2" fill="#7f1d1d" fillOpacity="0.35" transform="translate(0,1)" />
    <rect x="22" y="16" width="4" height="10" rx="2" fill="#ffffff" />
    <circle cx="24" cy="30.5" r="2.2" fill="#ffffff" />
  </svg>
);

export const Icon3DDueSoon: React.FC<Icon3DProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="d3d-bell" x1="14" y1="8" x2="34" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="45%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="d3d-clapper" x1="20" y1="34" x2="28" y2="41" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43" rx="13" ry="2.8" fill="#78350f" fillOpacity="0.22" />
    {/* Clapper */}
    <circle cx="24" cy="37" r="4.2" fill="url(#d3d-clapper)" />
    {/* Bell Dome 3D Rim */}
    <path
      d="M24 8C17.4 8 13 12.8 13 19.5V27.2L9.6 31.8C8.8 32.9 9.6 34.5 11 34.5H37C38.4 34.5 39.2 32.9 38.4 31.8L35 27.2V19.5C35 12.8 30.6 8 24 8Z"
      fill="#92400e"
      transform="translate(0, 2)"
    />
    {/* Bell Front */}
    <path
      d="M24 7C17.4 7 13 11.8 13 18.5V26.2L9.6 30.8C8.8 31.9 9.6 33.5 11 33.5H37C38.4 33.5 39.2 31.9 38.4 30.8L35 26.2V18.5C35 11.8 30.6 7 24 7Z"
      fill="url(#d3d-bell)"
      stroke="#ffffff"
      strokeOpacity="0.55"
      strokeWidth="1.2"
    />
    {/* Top Knob */}
    <circle cx="24" cy="6.5" r="2.6" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
    {/* Specular Curve */}
    <path d="M17.5 14.5C18 12.2 19.8 10.6 22 10.2" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Icon3DLeaveCalendar: React.FC<Icon3DProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="c3d-body" x1="8" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f5f3ff" />
        <stop offset="100%" stopColor="#ddd6fe" />
      </linearGradient>
      <linearGradient id="c3d-top" x1="8" y1="8" x2="40" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43" rx="14" ry="2.8" fill="#4c1d95" fillOpacity="0.2" />
    {/* 3D Depth */}
    <rect x="8" y="13" width="32" height="28" rx="8" fill="#5b21b6" />
    {/* Calendar Body */}
    <rect x="8" y="10" width="32" height="28" rx="8" fill="url(#c3d-body)" stroke="#ffffff" strokeWidth="1.2" />
    {/* Calendar Top Header */}
    <path d="M8 18C8 13.58 11.58 10 16 10H32C36.42 10 40 13.58 40 18V20H8V18Z" fill="url(#c3d-top)" />
    {/* Calendar Rings */}
    <rect x="15" y="6" width="3.8" height="8" rx="1.9" fill="#ede9fe" stroke="#5b21b6" strokeWidth="1" />
    <rect x="29.2" y="6" width="3.8" height="8" rx="1.9" fill="#ede9fe" stroke="#5b21b6" strokeWidth="1" />
    {/* Calendar Dots */}
    <rect x="14" y="24" width="5" height="4" rx="1.2" fill="#8b5cf6" />
    <rect x="21.5" y="24" width="5" height="4" rx="1.2" fill="#8b5cf6" />
    <rect x="29" y="24" width="5" height="4" rx="1.2" fill="#c4b5fd" />
    <rect x="14" y="30" width="5" height="4" rx="1.2" fill="#c4b5fd" />
    <rect x="21.5" y="30" width="5" height="4" rx="1.2" fill="#7c3aed" />
  </svg>
);

export const Icon3DTrainingClock: React.FC<Icon3DProps> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cl3d-rim" x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="cl3d-dial" x1="14" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d1fae5" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="14" ry="2.8" fill="#064e3b" fillOpacity="0.22" />
    {/* 3D Extruded Back */}
    <circle cx="24" cy="25.5" r="16.5" fill="#065f46" />
    {/* Front Bezel */}
    <circle cx="24" cy="22.5" r="16.5" fill="url(#cl3d-rim)" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" />
    {/* Inner Dial */}
    <circle cx="24" cy="22.5" r="12" fill="url(#cl3d-dial)" />
    {/* Clock Hands */}
    <path d="M24 15V22.5L29.5 25.5" stroke="#065f46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="22.5" r="2" fill="#10b981" />
  </svg>
);

export const Icon3DTeamDirectory: React.FC<Icon3DProps> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="td3d-bg" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="6" y="9" width="36" height="33" rx="10" fill="#1e3a8a" />
    <rect x="6" y="6" width="36" height="33" rx="10" fill="url(#td3d-bg)" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
    <circle cx="20" cy="18" r="4.5" fill="#ffffff" />
    <path d="M12.5 31C12.5 26.8 15.8 24 20 24C24.2 24 27.5 26.8 27.5 31" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <circle cx="31" cy="19.5" r="3.2" fill="#bfdbfe" />
    <path d="M29 24.5C32.5 24.5 35.5 26.8 35.5 30.2" stroke="#bfdbfe" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const Icon3DOffice: React.FC<Icon3DProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="of3d-main" x1="10" y1="6" x2="36" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="10" y="9" width="28" height="33" rx="6" fill="#064e3b" />
    <rect x="10" y="6" width="28" height="33" rx="6" fill="url(#of3d-main)" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
    <rect x="15" y="12" width="5" height="5" rx="1" fill="#ecfdf5" />
    <rect x="22" y="12" width="5" height="5" rx="1" fill="#ecfdf5" />
    <rect x="29" y="12" width="4" height="5" rx="1" fill="#a7f3d0" />
    <rect x="15" y="20" width="5" height="5" rx="1" fill="#ecfdf5" />
    <rect x="22" y="20" width="5" height="5" rx="1" fill="#ecfdf5" />
    <rect x="29" y="20" width="4" height="5" rx="1" fill="#a7f3d0" />
    <rect x="20" y="29" width="8" height="10" rx="1.5" fill="#064e3b" />
  </svg>
);

export const Icon3DProjects: React.FC<Icon3DProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="pr3d-f" x1="6" y1="12" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>
    <path d="M6 15C6 11.7 8.7 9 12 9H19.5L23.5 13H36C39.3 13 42 15.7 42 19V35C42 38.3 39.3 41 36 41H12C8.7 41 6 38.3 6 35V15Z" fill="#312e81" transform="translate(0, 2)" />
    <path d="M6 13C6 9.7 8.7 7 12 7H19.5L23.5 11H36C39.3 11 42 13.7 42 17V33C42 36.3 39.3 39 36 39H12C8.7 39 6 36.3 6 33V13Z" fill="url(#pr3d-f)" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
    <rect x="13" y="21" width="22" height="3.2" rx="1.6" fill="#ffffff" fillOpacity="0.9" />
    <rect x="13" y="27.5" width="14" height="3.2" rx="1.6" fill="#c7d2fe" />
  </svg>
);

export const Icon3DWeeklyBoard: React.FC<Icon3DProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="wb3d-g" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <rect x="6" y="10" width="36" height="31" rx="8" fill="#075985" />
    <rect x="6" y="7" width="36" height="31" rx="8" fill="url(#wb3d-g)" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
    <rect x="11" y="14" width="7" height="18" rx="2" fill="#ffffff" fillOpacity="0.9" />
    <rect x="20.5" y="14" width="7" height="13" rx="2" fill="#e0f2fe" />
    <rect x="30" y="14" width="7" height="16" rx="2" fill="#bae6fd" />
  </svg>
);

export const Icon3DCrown: React.FC<Icon3DProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cr3d-g" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <path d="M4 22L6.5 10L12.5 15.5L16 8L19.5 15.5L25.5 10L28 22H4Z" fill="#78350f" transform="translate(0, 1.5)" />
    <path d="M4 21L6.5 9L12.5 14.5L16 7L19.5 14.5L25.5 9L28 21H4Z" fill="url(#cr3d-g)" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" strokeLinejoin="round" />
    <rect x="4.5" y="21.5" width="23" height="3.2" rx="1.5" fill="#d97706" />
  </svg>
);

export const Icon3DShield: React.FC<Icon3DProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="sh3d-g" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="55%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#581c87" />
      </linearGradient>
    </defs>
    <path d="M16 4L6 8.2V15.5C6 21.8 10.2 26.8 16 28.8C21.8 26.8 26 21.8 26 15.5V8.2L16 4Z" fill="#3b0764" transform="translate(0, 1.5)" />
    <path d="M16 3L6 7.2V14.5C6 20.8 10.2 25.8 16 27.8C21.8 25.8 26 20.8 26 14.5V7.2L16 3Z" fill="url(#sh3d-g)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
    <path d="M12.2 15.2L14.8 17.8L20.2 12.2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Icon3DExcel: React.FC<Icon3DProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="ex3d-g" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="6" y="5" width="20" height="23" rx="4" fill="#064e3b" />
    <rect x="6" y="3.5" width="20" height="23" rx="4" fill="url(#ex3d-g)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
    <path d="M12 10.5L20 19.5M20 10.5L12 19.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
