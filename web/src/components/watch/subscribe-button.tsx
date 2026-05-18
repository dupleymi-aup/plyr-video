"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
  channelId: string;
  isSubscribed: boolean;
}

export function SubscribeButton({ channelId, isSubscribed }: SubscribeButtonProps) {
  const router = useRouter();

  async function handleClick() {
    if (isSubscribed) {
      await fetch(`/api/subscriptions/${channelId}`, { method: "DELETE" });
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
    }
    router.refresh();
  }

  return (
    <Button className="mt-2" size="sm" onClick={handleClick}>
      {isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
}
