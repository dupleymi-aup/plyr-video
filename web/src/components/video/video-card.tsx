import Link from "next/link";
import Image from "next/image";
import { formatDuration, formatViews, formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  channelName?: string;
  channelAvatar?: string;
  views?: number;
  createdAt?: string;
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  channelName,
  channelAvatar,
  views = 0,
  createdAt,
}: VideoCardProps) {
  return (
    <Link href={`/watch/${id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted-foreground" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 flex gap-3">
        {channelAvatar && (
          <Avatar src={channelAvatar} fallback={channelName?.[0]} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary">
            {title}
          </h3>
          {channelName && (
            <p className="mt-1 text-xs text-muted-foreground">{channelName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatViews(views)} views
            {createdAt && ` • ${formatRelativeTime(createdAt)}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
