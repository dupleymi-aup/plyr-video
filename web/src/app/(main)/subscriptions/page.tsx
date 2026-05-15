import { VideoGrid } from "@/components/video/video-grid";

export default function SubscriptionsPage() {
  // Placeholder - will require authentication
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Latest videos from channels you follow</p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Sign in to see videos from your subscriptions
        </p>
      </div>
    </div>
  );
}
