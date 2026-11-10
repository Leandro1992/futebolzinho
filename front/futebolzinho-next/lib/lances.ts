export const LATEST_VIDEO_COUNT = 10;

export interface ListedVideo {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

export function selectLatestVideos(objects: ListedVideo[], limit = LATEST_VIDEO_COUNT): ListedVideo[] {
  return objects
    .filter((object) => object.key.toLowerCase().endsWith(".mp4") && !object.key.includes(".."))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified) || b.key.localeCompare(a.key))
    .slice(0, limit);
}

export function lanceTitle(name: string, lastModified: string): string {
  const base = name.replace(/\.mp4$/i, "");
  const parts = base.split("__");
  const stamp = parts.length >= 4 ? parts[parts.length - 2] ?? "" : "";
  if (!/^\d{8}-\d{6}$/.test(stamp)) {
    return new Date(lastModified).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }
  const camera = (parts[1] ?? "").replace(/-/g, " ").trim();
  const label = `${stamp.slice(6, 8)}/${stamp.slice(4, 6)}/${stamp.slice(0, 4)} ${stamp.slice(9, 11)}:${stamp.slice(11, 13)}`;
  return camera ? `${label} · ${camera}` : label;
}

export function isSafeVideoKey(key: string): boolean {
  return key.length > 0 && !key.includes("..") && !key.startsWith("/") && key.toLowerCase().endsWith(".mp4");
}
