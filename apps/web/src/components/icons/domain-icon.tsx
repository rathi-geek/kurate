"use client";

import { ApplePodcastsIcon } from "./apple-podcasts-icon";
import { SpotifyIcon } from "./spotify-icon";
import { VimeoIcon } from "./vimeo-icon";
import { YouTubeIcon } from "./youtube-icon";
import { cn } from "@/app/_libs/utils/cn";

interface DomainIconProps {
  url: string;
  className?: string;
}

const iconClassName = "size-8 shrink-0";

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

export function DomainIcon({ url, className }: DomainIconProps) {
  const hostname = getHostname(url);
  if (hostname === null) {
    return <div className={cn("bg-muted rounded", iconClassName, className)} />;
  }

  if (hostname === "youtube.com" || hostname === "youtu.be") {
    return <YouTubeIcon className={cn(iconClassName, className)} />;
  }
  if (hostname === "spotify.com" || hostname === "open.spotify.com") {
    return <SpotifyIcon className={cn(iconClassName, className)} />;
  }
  if (hostname === "vimeo.com") {
    return <VimeoIcon className={cn(iconClassName, className)} />;
  }
  if (hostname === "podcasts.apple.com") {
    return <ApplePodcastsIcon className={cn(iconClassName, className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
      alt=""
      className={cn("shrink-0 rounded", iconClassName, className)}
    />
  );
}
