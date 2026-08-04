import React from "react";

export function SilhouetteSenam({ className = "w-64 h-64 text-slate-200/15" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} fill-current select-none pointer-events-none transition-opacity duration-500`}
      aria-hidden="true"
    >
      <circle cx="50" cy="18" r="7" />
      <path d="M50 28 c-3 0 -6 2 -8 5 l-12 15 c-1.5 2 -1 5 1 6.5 s5 1 6.5 -1 l9 -11 v20 l-10 22 c-1 2 -0.5 5 1.5 6 s5 0.5 6 -1.5 l8 -18 l8 18 c1 2 4 2.5 6 1.5 s2.5 -4 1.5 -6 l-10 -22 v-20 l9 11 c1.5 2 4.5 2.5 6.5 1 s2 -4.5 0.5 -6.5 l-12 -15 c-2 -3 -5 -5 -8 -5 z" />
    </svg>
  );
}

export function SilhouetteJalanSehat({ className = "w-64 h-64 text-slate-200/15" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} fill-current select-none pointer-events-none transition-opacity duration-500`}
      aria-hidden="true"
    >
      <circle cx="55" cy="15" r="7" />
      <path d="M52 25 c-2.5 0 -4.5 1.5 -5 4 l-3 12 l-12 -3 c-2 -0.5 -4.5 1 -5 3.5 s1 4.5 3.5 5 l15 4 c2 0.5 4 -0.5 5 -2.5 l3.5 -8.5 l6 10.5 l-11 18 c-1.5 2.5 -1 5.5 1.5 7 s5.5 1 7 -1.5 l10 -16 l12 12 c1.5 1.5 4 1.5 5.5 0 s1.5 -4 0 -5.5 l-14 -14 l4 -13 c1 -3.5 -1 -7.5 -4.5 -8.5 l-12 -3 c-0.5 -0.1 -1 -0.1 -1.5 -0.1 z" />
    </svg>
  );
}

export function SilhouetteMedis({ className = "w-64 h-64 text-slate-200/15" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} fill-current select-none pointer-events-none transition-opacity duration-500`}
      aria-hidden="true"
    >
      <circle cx="45" cy="20" r="7" />
      <path d="M45 30 c-3 0 -6 2 -7 5 l-5 12 c-1 2.5 0.5 5.5 3 6.5 s5.5 -0.5 6.5 -3 l3 -7 v25 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-15 h2 v15 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-22 l10 10 c1.5 1.5 4 1.5 5.5 0 s1.5 -4 0 -5.5 l-15 -15 c-1.5 -2 -4 -3.5 -7 -3.5 z" />
      <rect x="68" y="15" width="22" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="79" y1="30" x2="79" y2="45" stroke="currentColor" strokeWidth="3" />
      <line x1="72" y1="45" x2="86" y2="45" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function SilhouettePemeriksaan({ className = "w-64 h-64 text-slate-200/15" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} select-none pointer-events-none transition-opacity duration-500`}
      aria-hidden="true"
    >
      <path d="M12 40 C12 25, 30 15, 50 35 C70 15, 88 25, 88 40 C88 62, 50 85, 50 85 C50 85, 12 62, 12 40 Z" fill="currentColor" opacity="0.1" />
      <path d="M15 45 h10 l5 -15 l8 35 l7 -25 l5 10 h15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function SilhouetteKerumunan({ className = "w-64 h-64 text-slate-200/15" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={`${className} fill-current select-none pointer-events-none transition-opacity duration-500`}
      aria-hidden="true"
    >
      {/* Left Person */}
      <circle cx="25" cy="35" r="6" />
      <path d="M25 44 c-2 0 -4 1 -5 3 l-8 10 c-1 1.5 -1 3.5 0.5 4.5 s3.5 1 4.5 -0.5 l6 -8 v25 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-15 h2 v15 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-25 l6 8 c1 1.5 3 2 4.5 0.5 s2 -3 0.5 -4.5 l-8 -10 c-1 -2 -3 -3 -5 -3 z" />
      {/* Center Person */}
      <circle cx="60" cy="25" r="7" />
      <path d="M60 35 c-2.5 0 -4.5 1.5 -5.5 3.5 l-10 15 c-1.2 1.8 -0.8 4.2 1 5.4 s4.2 0.8 5.4 -1 l7 -10.4 v25 c0 2.2 1.8 4 4 4 s4 -1.8 4 -4 v-18 h2 v18 c0 2.2 1.8 4 4 4 s4 -1.8 4 -4 v-25 l7 10.4 c1.2 1.8 3.6 2.2 5.4 1 s2.2 -3.6 1 -5.4 l-10 -15 c-1 -2 -3 -3.5 -5.5 -3.5 z" />
      {/* Right Person */}
      <circle cx="95" cy="35" r="6" />
      <path d="M95 44 c-2 0 -4 1 -5 3 l-8 10 c-1 1.5 -1 3.5 0.5 4.5 s3.5 1 4.5 -0.5 l6 -8 v25 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-15 h2 v15 c0 2 1.5 3.5 3.5 3.5 s3.5 -1.5 3.5 -3.5 v-25 l6 8 c1 1.5 3 2 4.5 0.5 s2 -3 0.5 -4.5 l-8 -10 c-1 -2 -3 -3 -5 -3 z" />
    </svg>
  );
}
