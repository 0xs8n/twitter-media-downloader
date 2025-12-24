async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument?.();
  if (exists) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["BLOBS"],
    justification: "Create a ZIP file from fetched images and download it."
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.action !== "zip_images") return;

    await ensureOffscreen();

    // Ask offscreen to build the zip
    const result = await chrome.runtime.sendMessage({
      action: "offscreen_make_zip",
      username: msg.username || "twitter",
      urls: msg.urls || []
    });

    if (!result?.blobUrl) {
      throw new Error(result?.error || "Failed to create zip");
    }

    const zipName = `${msg.username || "twitter"}_images.zip`;

    await chrome.downloads.download({
      url: result.blobUrl,
      filename: zipName,
      saveAs: true
    });

    sendResponse({ ok: true });
  })().catch((err) => {
    console.error(err);
    sendResponse({ ok: false, error: err.message || String(err) });
  });

  return true; // keep the message channel open for async
});
