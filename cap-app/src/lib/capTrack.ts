import type { CapTrack } from "./types";

export const TRACK_LOGOS: Record<CapTrack, string> = {
  mercancias: "/img/logo.png",
  viajeros: "/img/logo-viajeros.jpg",
};

export function logoForTrack(track: CapTrack | null | undefined): string {
  return TRACK_LOGOS[track === "viajeros" ? "viajeros" : "mercancias"];
}
