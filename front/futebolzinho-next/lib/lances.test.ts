import assert from "node:assert/strict";
import test from "node:test";
import { isSafeVideoKey, lanceTitle, selectLatestVideos, type ListedVideo } from "./lances";

function video(key: string, lastModified: string): ListedVideo {
  return { key, name: key.split("/").pop() ?? key, size: 1000, lastModified };
}

test("selectLatestVideos keeps the ten newest mp4 files", () => {
  const objects = Array.from({ length: 12 }, (_, index) =>
    video(`lance-${String(index).padStart(2, "0")}.mp4`, `2026-11-10T10:${String(index).padStart(2, "0")}:00.000Z`)
  );
  objects.push(video("nota.txt", "2026-11-10T23:00:00.000Z"));
  objects.push(video("../secreto.mp4", "2026-11-10T23:01:00.000Z"));
  const selected = selectLatestVideos(objects);
  assert.equal(selected.length, 10);
  assert.equal(selected[0]?.key, "lance-11.mp4");
  assert.equal(selected.at(-1)?.key, "lance-02.mp4");
  assert.equal(selected.some((item) => item.key.endsWith(".txt")), false);
});

test("lanceTitle reads the recording stamp from the file name", () => {
  assert.equal(
    lanceTitle("futebolzinho__gol__20261105-213045__quinta.mp4", "2026-11-06T00:00:00.000Z"),
    "05/11/2026 21:30 · gol"
  );
});

test("isSafeVideoKey rejects paths outside the bucket listing", () => {
  assert.equal(isSafeVideoKey("lance.mp4"), true);
  assert.equal(isSafeVideoKey("../lance.mp4"), false);
  assert.equal(isSafeVideoKey("/lance.mp4"), false);
  assert.equal(isSafeVideoKey("lance.txt"), false);
});
