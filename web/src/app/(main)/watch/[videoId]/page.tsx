import { PlyrPlayer } from "@/components/player/plyr-player";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatViews, formatRelativeTime, formatDuration } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Share2, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import VideoActions from "./video-actions";
import { CommentForm } from "@/components/watch/comment-form";
import { SubscribeButton } from "@/components/watch/subscribe-button";
import type { Comment } from "@/types/comment";

interface WatchPageProps {
  params: Promise<{ videoId: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;
  const session = await auth();

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          isVerified: true,
          _count: {
            select: { subscriptions: true },
          },
        },
      },
    },
  });

  if (!video) {
    notFound();
  }

  // Don't show private videos to non-owners
  if (video.visibility === "PRIVATE") {
    if (!session?.user?.id || video.channel.ownerId !== session.user.id) {
      notFound();
    }
  }

  // Fetch recommended videos (same channel or similar)
  const recommendedVideos = await prisma.video.findMany({
    where: {
      AND: [
        { id: { not: videoId } },
        { status: "READY" },
        { visibility: "PUBLIC" },
        {
          OR: [
            { channelId: video.channelId },
            { title: { contains: video.title.split(" ").slice(0, 3).join(" ") } },
          ],
        },
      ],
    },
    include: {
      channel: { select: { name: true } },
    },
    orderBy: { viewCount: "desc" },
    take: 10,
  });

  const isSubscribed = session?.user?.id
    ? await prisma.subscription.findFirst({
        where: {
          subscriberId: session.user.id,
          channelId: video.channelId,
        },
      })
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <PlyrPlayer
            source={video.source}
            poster={video.poster || undefined}
            className="w-full h-full"
          />
        </div>

        {/* Video info */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{video.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {formatViews(video.viewCount)} views • {formatRelativeTime(video.createdAt)}
            </div>

            <VideoActions
              videoId={video.id}
              likes={video.likeCount}
              initialLiked={false}
            />
          </div>
        </div>

        {/* Channel info */}
        <div className="mt-4 flex items-start gap-4 border-b pb-4">
          <Avatar
            src={video.channel.avatar || undefined}
            fallback={video.channel.name[0]}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/channel/${video.channel.slug}`} className="font-semibold hover:underline">
                {video.channel.name}
              </Link>
              {video.channel.isVerified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatViews(video.channel._count.subscriptions)} subscribers
            </p>
            {!isSubscribed && (
              <SubscribeButton
                channelId={video.channelId}
                isSubscribed={!!isSubscribed}
              />
            )}
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-4 rounded-lg bg-secondary p-4">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
              {video.description}
            </pre>
          </div>
        )}

        {/* Comments section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          <CommentsSection videoId={videoId} />
        </div>
      </div>

      {/* Sidebar - Recommended videos */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0">
        <h3 className="text-lg font-semibold mb-4">Recommended</h3>
        <div className="space-y-4">
          {recommendedVideos.map((rec) => (
            <Link key={rec.id} href={`/watch/${rec.id}`} className="flex gap-2 group">
              <div className="relative w-40 aspect-video shrink-0 overflow-hidden rounded-md bg-secondary">
                {rec.poster ? (
                  <img
                    src={rec.poster}
                    alt={rec.title}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No thumbnail
                  </div>
                )}
                {rec.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(rec.duration)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {rec.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{rec.channel.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(rec.viewCount)} views • {formatRelativeTime(rec.createdAt)}
                </p>
              </div>
            </Link>
          ))}
          {recommendedVideos.length === 0 && (
            <p className="text-sm text-muted-foreground">No recommendations available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

async function CommentsSection({ videoId }: { videoId: string }) {
  const session = await auth();

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { videoId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
        replies: {
          take: 3,
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.comment.count({ where: { videoId, parentId: null } }),
  ]);

  return (
    <div>
      {session?.user && (
        <CommentForm videoId={videoId} />
      )}
      {!session?.user && (
        <p className="text-sm text-muted-foreground mb-4">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to comment.
        </p>
      )}
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
      {total > 10 && (
        <Link href={`/watch/${videoId}/comments`} className="text-sm text-primary hover:underline">
          View all {total} comments
        </Link>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="mb-4">
      <div className="flex gap-3">
        <Avatar
          src={comment.user.image || undefined}
          fallback={comment.user.name?.[0] || "?"}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.user.name || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          {comment._count.replies > 0 && (
            <div className="mt-2 ml-4 border-l-2 pl-4 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar
                    src={reply.user.image || undefined}
                    fallback={reply.user.name?.[0] || "?"}
                    size="sm"
                  />
                  <div>
                    <span className="text-sm font-medium">{reply.user.name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
