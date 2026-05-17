"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface ChannelSubscribeProps {
  channelId: string;
  initialSubscribers: number;
}

export function ChannelSubscribe({ channelId, initialSubscribers }: ChannelSubscribeProps) {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) return;
    setLoading(true);

    if (subscribed) {
      await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
      setSubscribed(false);
      setSubscribers((s) => s - 1);
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
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading ? "..." : subscribed ? "Отписаться" : "Подписаться"}
    </Button>
  );
}
