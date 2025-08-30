"use client";
import React from "react";

export function SkeletonCard(): JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
      <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
      <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
      <div className="mt-3 h-4 bg-gray-300 rounded w-1/3" />
    </div>
  );
}

