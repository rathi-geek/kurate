export interface LinkCopy {
  heading: string;
  subtitles: string[];
}

type TranslateFn = (key: string) => string;

export function getLinkCopy(url: string, t: TranslateFn): LinkCopy {
  const almost = t("loading_subtitle_almost");
  try {
    const hostname = new URL(url).hostname.replace("www.", "");

    if (hostname === "youtube.com" || hostname === "youtu.be") {
      return {
        heading: t("loading_heading_youtube"),
        subtitles: [t("loading_subtitle_1_youtube"), t("loading_subtitle_2_youtube"), almost],
      };
    }
    if (hostname === "open.spotify.com" || hostname === "spotify.com") {
      const isTrack = url.includes("/track/") || url.includes("/album/");
      return isTrack
        ? {
            heading: t("loading_heading_spotify_track"),
            subtitles: [
              t("loading_subtitle_1_spotify_track"),
              t("loading_subtitle_2_spotify_track"),
              almost,
            ],
          }
        : {
            heading: t("loading_heading_spotify_episode"),
            subtitles: [
              t("loading_subtitle_1_spotify_episode"),
              t("loading_subtitle_2_spotify_episode"),
              almost,
            ],
          };
    }
    if (hostname === "podcasts.apple.com") {
      return {
        heading: t("loading_heading_spotify_episode"),
        subtitles: [
          t("loading_subtitle_1_spotify_episode"),
          t("loading_subtitle_2_spotify_episode"),
          almost,
        ],
      };
    }
    if (hostname === "vimeo.com") {
      return {
        heading: t("loading_heading_vimeo"),
        subtitles: [t("loading_subtitle_1_vimeo"), t("loading_subtitle_2_vimeo"), almost],
      };
    }
    if (hostname === "twitter.com" || hostname === "x.com") {
      return {
        heading: t("loading_heading_twitter"),
        subtitles: [t("loading_subtitle_1_twitter"), t("loading_subtitle_2_twitter"), almost],
      };
    }
    if (hostname === "github.com") {
      return {
        heading: t("loading_heading_github"),
        subtitles: [t("loading_subtitle_1_github"), t("loading_subtitle_2_github"), almost],
      };
    }
    if (hostname === "reddit.com" || hostname === "old.reddit.com") {
      return {
        heading: t("loading_heading_reddit"),
        subtitles: [t("loading_subtitle_1_reddit"), t("loading_subtitle_2_reddit"), almost],
      };
    }
  } catch {
    // invalid URL — fall through
  }

  return {
    heading: t("loading_heading_default"),
    subtitles: [t("loading_subtitle_1_default"), t("loading_subtitle_2_default"), almost],
  };
}
