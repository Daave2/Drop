// src/components/ui/SketchCard.tsx
import * as React from 'react';

type Props = React.PropsWithChildren<{
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

export default function SketchCard({ title, className, style, children }: Props) {
  return (
    <div className={['sk-card', className].filter(Boolean).join(' ')} style={style}>
      {title ? <h2 className="sk-title" style={{ marginTop: 0 }}>{title}</h2> : null}
      {children}
    </div>
  );
}
