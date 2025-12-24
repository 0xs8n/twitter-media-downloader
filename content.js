let ui = null;
let isRunning = false;

const DEFAULTS = {
  maxImages: 300,          // cap to keep memory sane (offscreen also caps if you set it)
  maxScrollSeconds: 60,    // how long to keep trying to load more
  settleMs: 1200,          // wait after each scroll for new content
  noNewRoundsStop: 6       // stop after N rounds with no new images
};

function log(...args) {
  console.log("[ImageZipper]", ...args);
}

function createUI() {
  if (ui && document.body.contains(ui)) return;

  ui = document.createElement("div");
  ui.id = "twitter-image-zipper-ui";
  ui.style.cssText = `
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483647;
    width: 260px;
    font: 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    color: #0f1419;
  `;

  ui.innerHTML = `
    <div style="
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(15,20,25,0.12);
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      border-radius: 14px;
      overflow: hidden;
    ">
      <div style="padding: 10px 12px; display:flex; align-items:center; justify-content:space-between;">
        <div style="font-weight:700;">ZIP Images</div>
        <button id="iz-close" title="Hide" style="
          border:none; background:transparent; cursor:pointer;
          width:26px; height:26px; border-radius:8px;
        ">✕</button>
      </div>

      <div style="padding: 0 12px 10px 12px; display:grid; gap:10px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <label style="display:grid; gap:4px;">
            <span style="font-size:12px; color:#536471;">Max images</span>
            <input id="iz-max" type="number" min="1" max="1000" value="${DEFAULTS.maxImages}" style="
              padding:8px; border-radius:10px; border:1px solid rgba(15,20,25,0.15);
              outline:none;
            "/>
          </label>
          <label style="display:grid; gap:4px;">
            <span style="font-size:12px; color:#536471;">Scroll seconds</span>
            <input id="iz-seconds" type="number" min="5" max="300" value="${DEFAULTS.maxScrollSeconds}" style="
              padding:8px; border-radius:10px; border:1px solid rgba(15,20,25,0.15);
              outline:none;
            "/>
          </label>
        </div>

        <div id="iz-status" style="
          padding:8px 10px;
          background: rgba(29,161,242,0.10);
          border: 1px solid rgba(29,161,242,0.20);
          border-radius: 12px;
          color:#0f1419;
        ">Idle</div>

        <div style="display:flex; gap:8px;">
          <button id="iz-run" style="
            flex:1;
            padding:10px 12px;
            border:none;
            border-radius:12px;
            background:#1DA1F2;
            color:white;
            font-weight:700;
            cursor:pointer;
          ">Find + ZIP</button>

          <button id="iz-stop" disabled style="
            width:84px;
            padding:10px 12px;
            border:1px solid rgba(15,20,25,0.15);
            border-radius:12px;
            background: #f7f9f9;
            color:#0f1419;
            font-weight:700;
            cursor:not-allowed;
          ">Stop</button>
        </div>

        <div style="font-size:12px; color:#536471;">
          Tip: open <b>/media</b>, then click “Find + ZIP”.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(ui);

  ui.querySelector("#iz-close").addEventListener("click", () => {
    ui.style.display = "none";
  });

  ui.querySelector("#iz-run").addEventListener("click", start);
  ui.querySelector("#iz-stop").addEventListener("click", stop);
}

function setStatus(text) {
  const el = ui?.querySelector("#iz-status");
  if (el) el.textContent = text;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getUsername() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] || null;
}

function isOnMediaPage() {
  return window.location.pathname.includes("/media");
}

function forceOrig(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("pbs.twimg.com")) {
      if (u.searchParams.has("format")) u.searchParams.set("name", "orig");
      if (u.searchParams.has("name")) u.searchParams.set("name", "orig");
      return u.toString();
    }
  } catch {}
  return url
    .replace(/&name=\w+/, "&name=orig")
    .replace(/\?format=(\w+)&name=\w+/, "?format=$1&name=orig");
}

function collectImageUrls() {
  const urls = new Set();
  document.querySelectorAll('img[src*="pbs.twimg.com/media/"]').forEach(img => {
    const src = img?.src || "";
    if (!src) return;
    urls.add(forceOrig(src));
  });
  return urls;
}

let stopFlag = false;

async function smartAutoScroll({ maxScrollSeconds, settleMs, noNewRoundsStop, maxImages }) {
  stopFlag = false;
  const startTime = Date.now();

  let all = collectImageUrls();
  let lastCount = all.size;
  let noNewRounds = 0;

  setStatus(`Scrolling… found ${all.size} images`);

  while (!stopFlag) {
    // Time limit
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= maxScrollSeconds) break;

    // Image cap
    if (all.size >= maxImages) break;

    // Scroll down
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(settleMs);

    // Some pages need a tiny extra nudge
    window.scrollBy(0, 400);
    await sleep(Math.max(250, settleMs / 2));

    const now = collectImageUrls();
    // merge
    for (const u of now) all.add(u);

    if (all.size === lastCount) {
      noNewRounds += 1;
    } else {
      noNewRounds = 0;
      lastCount = all.size;
    }

    setStatus(`Scrolling… found ${all.size} images`);

    // If we’re not getting new images repeatedly, stop (means end reached or throttled)
    if (noNewRounds >= noNewRoundsStop) break;
  }

  return Array.from(all).slice(0, maxImages);
}

async function requestZipDownload(urls, username) {
  return await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "zip_images", urls, username },
      (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(resp || { ok: false, error: "No response from background." });
        }
      }
    );
  });
}

async function start() {
  if (isRunning) return;
  isRunning = true;

  const runBtn = ui.querySelector("#iz-run");
  const stopBtn = ui.querySelector("#iz-stop");

  runBtn.disabled = true;
  runBtn.style.opacity = "0.7";
  runBtn.style.cursor = "not-allowed";

  stopBtn.disabled = false;
  stopBtn.style.cursor = "pointer";
  stopBtn.style.opacity = "1";

  try {
    const username = getUsername();
    if (!username) {
      setStatus("Couldn’t detect username from URL.");
      return;
    }

    if (!isOnMediaPage()) {
      setStatus("Opening /media …");
      window.location.href = `/${username}/media`;
      return;
    }

    const maxImages = clampInt(ui.querySelector("#iz-max").value, 1, 1000, DEFAULTS.maxImages);
    const maxScrollSeconds = clampInt(ui.querySelector("#iz-seconds").value, 5, 300, DEFAULTS.maxScrollSeconds);

    setStatus("Starting scroll…");
    const urls = await smartAutoScroll({
      maxImages,
      maxScrollSeconds,
      settleMs: DEFAULTS.settleMs,
      noNewRoundsStop: DEFAULTS.noNewRoundsStop
    });

    if (!urls.length) {
      setStatus("No images found. Scroll a bit and try again.");
      return;
    }

    setStatus(`Zipping ${urls.length} images…`);
    const resp = await requestZipDownload(urls, username);

    if (!resp?.ok) {
      setStatus(`ZIP failed: ${resp?.error || "Unknown error"}`);
      return;
    }

    setStatus(`ZIP started (${urls.length} images). Check Downloads.`);
  } catch (e) {
    console.error(e);
    setStatus("Error: " + (e?.message || String(e)));
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runBtn.style.opacity = "1";
    runBtn.style.cursor = "pointer";

    stopBtn.disabled = true;
    stopBtn.style.cursor = "not-allowed";
    stopBtn.style.opacity = "0.7";
  }
}

function stop() {
  stopFlag = true;
  setStatus("Stopping…");
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(String(v), 10);
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  return fallback;
}

// SPA URL change watcher so UI appears reliably
let lastUrl = location.href;
function ensureUI() {
  if (!document.body) return;
  createUI();
  // show UI only on profile-ish pages
  const parts = window.location.pathname.split("/").filter(Boolean);
  const isProfileish = parts.length === 1 || (parts.length === 2 && parts[1] === "media");
  ui.style.display = isProfileish ? "block" : "none";
}

new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(ensureUI, 600);
  }
}).observe(document.documentElement, { subtree: true, childList: true });

setTimeout(ensureUI, 1500);
