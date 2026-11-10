import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isSafeVideoKey, selectLatestVideos, type ListedVideo } from "@/lib/lances";

const LIST_CACHE_TTL_MS = 30 * 1000;
const URL_EXPIRES_SECONDS = 60 * 60;

let client: S3Client | null = null;
let cache: { at: number; videos: ListedVideo[]; total: number } | null = null;

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function r2Config(): { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string } | null {
  const endpoint = readEnv("R2_ENDPOINT");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY");
  const bucket = readEnv("R2_BUCKET");
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

function getClient(config: NonNullable<ReturnType<typeof r2Config>>): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return client;
}

export async function listLatestLances(): Promise<{ videos: ListedVideo[]; total: number }> {
  const config = r2Config();
  if (!config) {
    throw new Error("Armazenamento de vídeos não configurado");
  }
  if (cache && Date.now() - cache.at < LIST_CACHE_TTL_MS) {
    return { videos: cache.videos, total: cache.total };
  }

  const s3 = getClient(config);
  const prefix = readEnv("R2_PREFIX") || undefined;
  const objects: ListedVideo[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: config.bucket, Prefix: prefix, ContinuationToken: token })
    );
    for (const item of page.Contents ?? []) {
      if (!item.Key || !item.LastModified || !item.Key.toLowerCase().endsWith(".mp4")) continue;
      objects.push({
        key: item.Key,
        name: item.Key.split("/").pop() ?? item.Key,
        size: item.Size ?? 0,
        lastModified: item.LastModified.toISOString(),
      });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  const videos = selectLatestVideos(objects);
  cache = { at: Date.now(), videos, total: objects.length };
  return { videos, total: objects.length };
}

export async function signLanceUrl(key: string): Promise<string | null> {
  if (!isSafeVideoKey(key)) return null;
  const { videos } = await listLatestLances();
  if (!videos.some((video) => video.key === key)) return null;

  const config = r2Config();
  if (!config) return null;
  return getSignedUrl(getClient(config), new GetObjectCommand({ Bucket: config.bucket, Key: key }), {
    expiresIn: URL_EXPIRES_SECONDS,
  });
}
