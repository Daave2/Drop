// src/components/ui/SketchButton.tsx
import * as React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'cta';
};

export default function SketchButton({ variant = 'default', className, ...rest }: Props) {
  return (
    <button
      className={['sk-btn', variant === 'cta' && 'sk-cta', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
