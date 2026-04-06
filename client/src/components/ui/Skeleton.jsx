import React from "react";
import { cn } from "@/utils/cn"; // Assuming there's a cn utility, if not I'll use simple template strings

/**
 * Skeleton - A base component for loading placeholders
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
