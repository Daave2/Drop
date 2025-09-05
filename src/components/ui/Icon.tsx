// src/components/ui/Icon.tsx
import * as React from 'react';

type Props = {
  id: string; // e.g., "sk-pin-default"
  size?: number | string; // px or any CSS length
  className?: string;
  title?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
};

export default function Icon({ id, size = 24, className, title, ...rest }: Props) {
  const px = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <use href={`#${id}`} />
    </svg>
  );
}
