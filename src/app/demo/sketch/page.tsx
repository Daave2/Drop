// src/app/demo/sketch/page.tsx
'use client';

import SketchCard from '@/components/ui/SketchCard';
import SketchButton from '@/components/ui/SketchButton';
import Icon from '@/components/ui/Icon';

export default function Page() {
  return (
    <main className="sketch" style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <SketchCard title="NoteDrop (Sketch UI)">
        <p>Prototype vibe: ghost pins, travel-to-reveal. Fonts: Kalam + Patrick Hand.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <Icon id="sk-pin-default" size={32} title="Pin" />
          <Icon id="sk-pin-ghost" size={32} title="Ghost pin" />
          <span className="sk-pill">50m radius</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <SketchButton className="sk-cta">Drop a note</SketchButton>
          <SketchButton disabled>DM (off)</SketchButton>
        </div>
      </SketchCard>

      <div style={{ height: 16 }} />

      <SketchCard title="Wired elements (optional)">
        <p>These are web components that match the sketch aesthetic.</p>
        <wired-card elevation="2" style={{ padding: 16, borderRadius: 16, background: 'var(--paper)' }}>
          <div className="sk-title" style={{ marginTop: 0 }}>Nearby (ghost)</div>
          <p>Walk closer to reveal. Keep your phone up to align the sightline.</p>
          <wired-button elevation="3">Reveal</wired-button>
        </wired-card>
      </SketchCard>
    </main>
  );
}
