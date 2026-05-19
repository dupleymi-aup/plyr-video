"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

interface VideoActionsProps {
  videoId: string;
  channelId: string;
  initialLikes: number;
  initialDislikes: number;
}

export function VideoActions({ videoId, channelId, initialLikes, initialDislikes }: VideoActionsProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [dislikeCount, setDislikeCount] = useState(initialDislikes);
  const [copied, setCopied] = useState(false);

  useSWR(
    session ? `/api/videos/${videoId}/like` : null,
    fetcher,
    {
      onSuccess: (data) => {
        if (data?.liked) setLiked(true);
      },
    }
  );

  const handleLike = async () => {
    if (!session) return;

    const wasLiked = liked;
    const wasDisliked = disliked;

    if (liked) {
      try {
        const res = await fetch(`/api/videos/${videoId}/like`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } catch {
        setLiked(wasLiked);
        setDisliked(wasDisliked);
      }
    } else {
      try {
        const res = await fetch(`/api/videos/${videoId}/like`, { method: "POST" });
        if (!res.ok) throw new Error("Failed");
        setLiked(true);
        setLikeCount((c) => c + 1);
        if (disliked) {
          setDisliked(false);
          setDislikeCount((c) => Math.max(0, c - 1));
        }
      } catch {
        setLiked(wasLiked);
        setDisliked(wasDisliked);
      }
    }
  };

  const handleDislike = async () => {
    if (!session) return;

    const wasLiked = liked;
    const wasDisliked = disliked;

    if (disliked) {
      setDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    } else {
      setDisliked(true);
      setDislikeCount((c) => c + 1);
      if (liked) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={liked ? "default" : "outline"}
        size="sm"
        onClick={handleLike}
        className={liked ? "bg-blue-600 hover:bg-blue-700" : ""}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        {likeCount}
      </Button>
      <Button
        variant={disliked ? "default" : "outline"}
        size="sm"
        onClick={handleDislike}
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        {dislikeCount}
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? (
          <Check className="h-4 w-4 mr-1" />
        ) : (
          <Share2 className="h-4 w-4 mr-1" />
        )}
        {copied ? "Скопировано" : "Поделиться"}
      </Button>
    </div>
  );
}
