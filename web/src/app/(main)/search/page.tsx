"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoGrid } from "@/components/video/video-grid";

const searchResults = [
  {
    id: "1",
    title: "Search Result: Getting Started with Plyr",
    thumbnail: "https://cdn.plyr.io/static/demo/thumbs/View_From_A_Blue_Moon_Trailer-HD.jpg",
    duration: 180,
    channelName: "Plyr Official",
    views: 15420,
    createdAt: "2024-01-15T10:00:00Z",
  },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            Results for &quot;{query}&quot;
          </p>
        )}
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Search functionality will be connected to the API
        </p>
      </div>
    </div>
  );
}
