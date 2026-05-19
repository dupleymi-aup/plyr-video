"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
  channelId: string;
  isSubscribed?: boolean;
  initialSubscribers?: number;
}

export function SubscribeButton({ channelId, isSubscribed: initialSubscribed = false, initialSubscribers = 0 }: SubscribeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!session) return;
    setLoading(true);

    if (subscribed) {
      await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
      setSubscribed(false);
      setSubscribers((s) => Math.max(0, s - 1));
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      setSubscribed(true);
      setSubscribers((s) => s + 1);
    }
    setLoading(false);
    router.refresh();
  };

  if (!session) {
    return (
      <a href="/login" className="text-sm text-muted-foreground hover:text-primary">
        Войдите, чтобы подписаться
      </a>
    );
  }

  return (
    <Button
      variant={subscribed ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "..." : subscribed ? "Отписаться" : "Подписаться"}
      {initialSubscribers > 0 && ` (${subscribers})`}
    </Button>
  );
}
