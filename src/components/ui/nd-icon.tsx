import * as React from "react";
import { cn } from "@/lib/utils";

export interface NdIconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
}

export function NdIcon({ name, className, ...props }: NdIconProps) {
  return (
    <svg
      {...props}
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <use href={`#nd-${name}`} />
    </svg>
  );
}

