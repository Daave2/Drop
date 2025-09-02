import { MapPin } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xl font-bold font-headline ${className}`}>
      <MapPin className="h-6 w-6 text-primary" />
      <span>NoteDrop</span>
    </div>
  );
}
