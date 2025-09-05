// src/components/ui/SketchSprite.tsx
'use client';

import * as React from 'react';

/**
 * Renders the hand-drawn SVG sprite (symbols) once per document.
 * Place in layout.tsx just before </body>.
 */
export default function SketchSprite() {
  // SVG content kept as a raw string to avoid JSX attribute pitfalls.
  const sprite = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <defs>
    <filter id="sketch" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="0.8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <style>
      .i { stroke:#333; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; fill:none; }
      .paper { fill:#f2f2f2; }
      .ink { fill:#333; }
      .accent { fill:#ffd24a; }
      .muted { stroke:#666; fill:none; }
    </style>
  </defs>

  <!-- Pins -->
  <symbol id="sk-pin-default" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 60 C28 55 12 42 12 29 c0-9 8-17 20-17s20 8 20 17c0 13-16 26-20 31z"/>
      <rect x="22" y="21" width="20" height="18" rx="4" class="accent"/>
      <path class="i" d="M24 26 h16 M24 31 h16 M24 36 h10"/>
    </g>
  </symbol>

  <symbol id="sk-pin-ghost" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i muted" d="M32 58 C28 53 14 42 14 31 c0-8 7-15 18-15s18 7 18 15c0 11-14 22-18 27z"/>
      <circle cx="32" cy="28" r="10" class="i muted"/>
    </g>
  </symbol>

  <symbol id="sk-pin-limited" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 60 C28 55 12 42 12 29 c0-9 8-17 20-17s20 8 20 17c0 13-16 26-20 31z"/>
      <rect x="22" y="21" width="20" height="18" rx="4" class="accent"/>
      <path class="i" d="M51 13 l5 3 -3 5 -5 -3 z"/>
    </g>
  </symbol>

  <symbol id="sk-pin-lowtrust" viewBox="0 0 64 64">
    <g filter="url(#sketch)" opacity="0.6">
      <path class="i" d="M32 60 C28 55 12 42 12 29 c0-9 8-17 20-17s20 8 20 17c0 13-16 26-20 31z"/>
      <rect x="22" y="21" width="20" height="18" rx="4" class="accent"/>
    </g>
  </symbol>

  <symbol id="sk-pin-selected" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 60 C28 55 12 42 12 29 c0-9 8-17 20-17s20 8 20 17c0 13-16 26-20 31z"/>
      <circle cx="32" cy="28" r="18" class="i"/>
      <rect x="22" y="21" width="20" height="18" rx="4" class="accent"/>
    </g>
  </symbol>

  <symbol id="sk-pin-reported" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 60 C28 55 12 42 12 29 c0-9 8-17 20-17s20 8 20 17c0 13-16 26-20 31z"/>
      <rect x="22" y="21" width="20" height="18" rx="4" fill="#fff3f3"/>
      <path class="i" d="M22 21 l20 18 M42 21 l-20 18" />
    </g>
  </symbol>

  <!-- Map/AR helpers -->
  <symbol id="sk-cluster" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="24" class="i"/>
      <circle cx="32" cy="32" r="18" class="i" opacity="0.4"/>
    </g>
  </symbol>

  <symbol id="sk-compass" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="26" class="i"/>
      <path class="accent" d="M32 10 l8 18 -8 4 -8-4 z"/>
      <circle cx="32" cy="32" r="3" class="ink"/>
    </g>
  </symbol>

  <symbol id="sk-sight-arc" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M6 32 a26 26 0 0 1 52 0"/>
      <path class="i" d="M16 32 a16 16 0 0 1 32 0" />
    </g>
  </symbol>

  <symbol id="sk-lock" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <rect x="14" y="28" width="36" height="24" rx="8" class="i"/>
      <path class="i" d="M20 28 v-6 c0-7 5-12 12-12 s12 5 12 12 v6"/>
      <circle cx="32" cy="40" r="3" class="i"/>
    </g>
  </symbol>

  <symbol id="sk-camera" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <rect x="8" y="18" width="48" height="30" rx="8" class="i"/>
      <circle cx="32" cy="33" r="9" class="i"/>
      <rect x="14" y="12" width="12" height="10" rx="3" class="i"/>
    </g>
  </symbol>

  <symbol id="sk-countdown" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="24" class="i"/>
      <path class="i" d="M32 16 v16 l10 6"/>
    </g>
  </symbol>

  <!-- UI actions / system -->
  <symbol id="sk-heart" viewBox="0 0 64 64">
    <path class="i" d="M32 54 s-18-11.4-22-22.3 C7.8 26.5 12.2 20 19.3 20 c4.7 0 8.1 2.6 10.7 5.8 C32.6 22.6 36 20 40.7 20 47.8 20 52.2 26.5 54 31.7 50 42.6 32 54 32 54z" filter="url(#sketch)"/>
  </symbol>

  <symbol id="sk-bookmark" viewBox="0 0 64 64">
    <path class="i" d="M18 10 h28 a4 4 0 0 1 4 4 v40 l-18-9 -18 9 V14 a4 4 0 0 1 4-4 z" filter="url(#sketch)"/>
  </symbol>

  <symbol id="sk-reply" viewBox="0 0 64 64">
    <path class="i" d="M12 30 l16-12 v8 h12 c8.8 0 16 7.2 16 16 v4 c-3-4-8-8-16-8 H28 v8 L12 34 z" filter="url(#sketch)"/>
  </symbol>

  <symbol id="sk-share" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="20" cy="36" r="6" class="i"/>
      <circle cx="44" cy="22" r="6" class="i"/>
      <circle cx="44" cy="46" r="6" class="i"/>
      <path class="i" d="M24 34 l16-10 M24 38 l16 8"/>
    </g>
  </symbol>

  <symbol id="sk-flag" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M14 10 v44"/>
      <path class="i" d="M18 12 h28 l-6 8 6 8 H18 z"/>
    </g>
  </symbol>

  <symbol id="sk-user" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="24" r="10" class="i"/>
      <rect x="16" y="36" width="32" height="16" rx="8" class="i"/>
    </g>
  </symbol>

  <symbol id="sk-settings" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="6" class="i"/>
      <path class="i" d="M32 14 l4 4 6-2 4 6 -4 4 2 6 -6 4 -4-4 -6 2 -4-6 4-4 -2-6 6-4 z"/>
    </g>
  </symbol>

  <symbol id="sk-accessibility" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="12" r="6" class="i"/>
      <path class="i" d="M14 26 h36 M32 18 v28 M22 34 l-8 22 M42 34 l8 22"/>
    </g>
  </symbol>

  <symbol id="sk-ar" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <rect x="8" y="18" width="48" height="28" rx="6" class="i"/>
      <path class="i" d="M26 26 l6-4 6 4 v8 l-6 4 -6-4 z"/>
    </g>
  </symbol>

  <symbol id="sk-location-on" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 58 c-10-12-18-21-18-30 a18 18 0 1 1 36 0 c0 9-8 18-18 30 z"/>
      <circle cx="32" cy="28" r="8" class="i"/>
    </g>
  </symbol>

  <symbol id="sk-location-off" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <path class="i" d="M32 58 c-10-12-18-21-18-30 a18 18 0 1 1 36 0 c0 9-8 18-18 30 z"/>
      <path class="i" d="M18 18 l28 28"/>
    </g>
  </symbol>

  <!-- Badges -->
  <symbol id="sk-badge-starter" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="26" class="i"/>
      <path class="i" d="M32 16 l5.5 10.8 12 1.8 -8.7 8.4 2.1 11.9 -10.9-5.7 -10.9 5.7 2.1-11.9 -8.7-8.4 12-1.8 z"/>
    </g>
  </symbol>

  <symbol id="sk-badge-verified" viewBox="0 0 64 64">
    <g filter="url(#sketch)">
      <circle cx="32" cy="32" r="26" class="i"/>
      <path class="i" d="M26 34 l-5-5 -4 4 9 9 16-16 -4-4 z"/>
    </g>
  </symbol>
</svg>
  `.trim();

  return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: sprite }} />;
}
