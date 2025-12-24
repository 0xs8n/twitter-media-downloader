function guessExtFromUrl(url) {
  // pbs.twimg.com often uses ?format=jpg&name=orig
  try {
    const u = new URL(url);
    const fmt = u.searchParams.get("format");
    if (fmt) return fmt.toLowerCase();
  } catch {}
  // fallback
  if (url.includes(".png")) return "png";
  if (url.includes(".gif")) return "gif";
  if (url.includes(".webp")) return "webp";
  return "jpg";
}

async function fetchAsArrayBuffer(url) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.arrayBuffer();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.action !== "offscreen_make_zip") return;

    const username = msg.username || "twitter";
    const urls = Array.isArray(msg.urls) ? msg.urls : [];

    if (!urls.length) {
      sendResponse({ blobUrl: null, error: "No image URLs provided." });
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`${username}_images`);

    // Limit to avoid huge memory spikes (tweak if you want)
    const MAX = 200;
    const slice = urls.slice(0, MAX);

    for (let i = 0; i < slice.length; i++) {
      const url = slice[i];
      const ext = guessExtFromUrl(url);
      const name = `${String(i + 1).padStart(4, "0")}.${ext}`;

      const data = await fetchAsArrayBuffer(url);
      folder.file(name, data);
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    const blobUrl = URL.createObjectURL(blob);
    sendResponse({ blobUrl });
  })().catch((err) => {
    console.error(err);
    sendResponse({ blobUrl: null, error: err.message || String(err) });
  });

  return true;
});
