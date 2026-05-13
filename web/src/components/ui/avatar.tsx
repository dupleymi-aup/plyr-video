import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-xl",
  };

  return (
    <div className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-secondary", sizeClasses[size], className)}>
      {src ? (
        <img className="aspect-square h-full w-full object-cover" src={src} alt={alt || ""} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-muted-foreground">
          {fallback || "?"}
        </div>
      )}
    </div>
  );
}
