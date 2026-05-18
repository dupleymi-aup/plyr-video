"use client";

import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, Plus } from "lucide-react";
import { useState } from "react";

interface VideoActionsProps {
  videoId: string;
  likes: number;
  initialLiked?: boolean;
}

export default function VideoActions({ videoId, likes, initialLiked = false }: VideoActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={liked ? "text-primary" : ""}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        {likeCount}
      </Button>
      <Button variant="outline" size="sm">
        <ThumbsDown className="h-4 w-4 mr-1" />
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
      <Button variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Save
      </Button>
    </div>
  );
}
