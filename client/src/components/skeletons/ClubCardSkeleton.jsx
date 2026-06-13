import React from "react";
import { Skeleton } from "../ui/Skeleton";

/**
 * ClubCardSkeleton - A loading placeholder that mimics the ClubCard layout
 */
const ClubCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#0d0d0d] border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-6 flex flex-col h-full shadow-sm">
      <div className="flex-grow">
        
        {/* Top: Logo, Category & Title */}
        <div className="flex items-start gap-4">
          {/* Logo Skeleton */}
          <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
          
          <div className="space-y-2 flex-grow mt-1">
            {/* Category Skeleton */}
            <Skeleton className="w-20 h-4 rounded" />
            {/* Title Skeleton */}
            <Skeleton className="w-3/4 h-6 rounded" />
          </div>
        </div>

        {/* Description Skeletons */}
        <div className="space-y-2 mt-5">
          <Skeleton className="w-full h-4 rounded" />
          <Skeleton className="w-5/6 h-4 rounded" />
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100 dark:border-neutral-800/80 my-5" />

        {/* Coordinators List (Stacked Rows) */}
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Skeleton className="w-12 h-2.5 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="w-12 h-2.5 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
          </div>
        </div>
      </div>

      {/* Footer Skeletons */}
      <div className="mt-6 space-y-4">
        {/* Social Icons Skeletons Row */}
        <div>
          <Skeleton className="w-12 h-2.5 rounded mb-2" />
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
        
        {/* Action Button Skeleton Row */}
        <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
          <Skeleton className="w-full h-[38px] rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default ClubCardSkeleton;
