export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xl font-bold font-headline ${className}`}>
      <svg
        className="h-6 w-6"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="hsl(var(--primary))"
          d="M32 60c-6.8-8.8-20-19.2-20-32C12 15.2 20.2 7 32 7s20 8.2 20 21c0 12.8-13.2 23.2-20 32z"
        />
        <rect
          fill="hsl(var(--accent))"
          x="23.5"
          y="22.5"
          rx="2.5"
          ry="2.5"
          width="17"
          height="17"
        />
        <path fill="hsl(var(--accent) / 0.8)" d="M40.5 22.5h-6l6 6z" />
      </svg>
      <span className="text-foreground">NoteDrop</span>
    </div>
  );
}
