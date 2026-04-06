import React from "react";
import { Skeleton } from "../ui/Skeleton";

/**
 * ClubCardSkeleton - A loading placeholder that mimics the ClubCard layout
 */
const ClubCardSkeleton = () => {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-sm p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          {/* Logo Skeleton */}
          <Skeleton className="w-16 h-16 border-2" />
          {/* Category Badge Skeleton */}
          <Skeleton className="w-20 h-5" />
        </div>

        {/* Title Skeleton */}
        <Skeleton className="w-3/4 h-8 mb-4" />

        {/* Description Skeletons */}
        <div className="space-y-2 mb-6">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
        </div>

        {/* Coordinator Boxes Skeletons */}
        <div className="mt-6 space-y-3">
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-8 flex items-center gap-4 border-t-2 border-gray-100 pt-6">
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <Skeleton className="flex-1 h-10" />
      </div>
    </div>
  );
};

export default ClubCardSkeleton;
