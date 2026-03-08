/* =============================================
   NIMBUSSHARE — script.js  (Phase 2 rebuild)
   Real API · localStorage · Bundle links
   =============================================
   API: POST https://svzju8smoa.execute-api.ap-south-1.amazonaws.com/prod/upload
   Body: { file_name, file_type, file_content (base64) }
   Returns: { message, download_url }
   ============================================= */

const API_URL = "https://svzju8smoa.execute-api.ap-south-1.amazonaws.com/prod/upload";
const LS_KEY  = "nimbus_uploads_v1"; // localStorage key

// ── State ──────────────────────────────────────
let selectedFiles  = [];   // File objects chosen by user
let isUploading    = false;

// ── DOM ────────────────────────────────────────
const navbar        = document.getElementById("navbar");
const dropzone      = document.getElementById("dropzone");
const dzEmpty       = document.getElementById("dzEmpty");
const dzFiles       = document.getElementById("dzFiles");
const dzFilesCount  = document.getElementById("dzFilesCount");
const dzFileList    = document.getElementById("dzFileList");
const dzClearBtn    = document.getElementById("dzClearBtn");
const fileInput     = document.getElementById("fileInput");

const errorStrip    = document.getElementById("errorStrip");
const errorMsg      = document.getElementById("errorMsg");

const uploadBtn     = document.getElementById("uploadBtn");
const btnNormal     = document.getElementById("btnNormal");
const btnLoading    = document.getElementById("btnLoading");

const progressArea  = document.getElementById("progressArea");
const progLabel     = document.getElementById("progLabel");
const progPct       = document.getElementById("progPct");
const progFill      = document.getElementById("progFill");
const progFilesStatus = document.getElementById("progFilesStatus");

const successLine   = document.getElementById("successLine");

const resultCard    = document.getElementById("resultCard");
const resultSub     = document.getElementById("resultSub");
const bundleLinkWrap= document.getElementById("bundleLinkWrap");
const bundleCopyBtn = document.getElementById("bundleCopyBtn");
const bundleCopyText= document.getElementById("bundleCopyText");
const bundleCopyIcon= document.getElementById("bundleCopyIcon");
const fileLinksLabel= document.getElementById("fileLinksLabel");
const fileLinksList = document.getElementById("fileLinksList");
const newUploadBtn  = document.getElementById("newUploadBtn");

const recentBody    = document.getElementById("recentBody");
const recentBadge   = document.getElementById("recentBadge");
const rsFiles       = document.getElementById("rsFiles");
const rsBundles     = document.getElementById("rsBundles");
const rsSize        = document.getElementById("rsSize");

// ── Helpers ────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/(1024*1024)).toFixed(2) + " MB";
}
function getExt(name) {
  const p = name.split(".");
  return p.length >= 2 ? p[p.length-1].toUpperCase() : "FILE";
}
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function genBundleId() { return "bundle_" + Date.now(); }

// ── File Validation ────────────────────────────
function validateFile(file) {
  if (!file.name || !file.name.trim())
    return `File has no name.`;
  if (file.size === 0)
    return `"${file.name}" is empty (0 bytes).`;
  const parts = file.name.split(".");
  if (parts.length < 2 || !parts[parts.length-1].trim())
    return `"${file.name}" has no file extension.`;
  if (file.size > 10*1024*1024)
    return `"${file.name}" exceeds 10MB (${formatSize(file.size)}).`;
  return null;
}

// ── Toast ──────────────────────────────────────
function toast(msg, type="info") {
  document.querySelectorAll(".ns-toast").forEach(t => t.remove());
  const colors = {
    error:   {bg:"#1a0a0a",bdr:"rgba(239,68,68,.32)",  ic:"#ef4444",tx:"#fca5a5"},
    success: {bg:"#0a180d",bdr:"rgba(34,197,94,.32)",   ic:"#22c55e",tx:"#86efac"},
    warning: {bg:"#1a1000",bdr:"rgba(245,158,11,.32)",  ic:"#f59e0b",tx:"#fcd34d"},
    info:    {bg:"#0a0e1a",bdr:"rgba(79,140,255,.32)",  ic:"#4f8cff",tx:"#93c5fd"},
  };
  const icons = {
    error:  `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    success:`<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    warning:`<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    info:   `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  };
  const c = colors[type] || colors.info;
  const el = document.createElement("div");
  el.className = "ns-toast";
  el.style.cssText = `background:${c.bg};border:1px solid ${c.bdr};color:${c.tx}`;
  el.innerHTML = `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="color:${c.ic};flex-shrink:0;margin-top:1px">${icons[type]||icons.info}</svg>
    <span style="flex:1">${msg}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:${c.tx};opacity:.5;font-size:16px;padding:0;margin-left:8px">×</button>`;
  document.body.appendChild(el);
  setTimeout(() => {
    if (!el.parentElement) return;
    el.style.animation = "toast-out .25s ease forwards";
    setTimeout(() => el.remove(), 260);
  }, 4200);
}

// ── Error strip ────────────────────────────────
let _errT = null;
function showError(msg) {
  errorMsg.textContent    = msg;
  errorStrip.style.display = "flex";
  clearTimeout(_errT);
  _errT = setTimeout(hideError, 5000);
  toast(msg, "error");
}
function hideError() {
  errorStrip.style.display = "none";
  clearTimeout(_errT);
}
errorStrip.addEventListener("click", hideError);

// ── Offline ────────────────────────────────────
window.addEventListener("offline", () => toast("You're offline. Check your connection.", "warning"));
window.addEventListener("online",  () => toast("You're back online!", "success"));

// ── Navbar scroll ──────────────────────────────
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 10);
}, { passive:true });

// ── File selection UI ──────────────────────────
function refreshFileList() {
  if (selectedFiles.length === 0) {
    dzEmpty.style.display = "flex";
    dzFiles.style.display = "none";
    uploadBtn.classList.remove("pulse");
    return;
  }
  dzEmpty.style.display = "none";
  dzFiles.style.display = "block";
  dzFilesCount.textContent = selectedFiles.length === 1
    ? "1 file selected"
    : `${selectedFiles.length} files selected`;

  dzFileList.innerHTML = "";
  selectedFiles.forEach((file, idx) => {
    const item = document.createElement("div");
    item.className = "dz-file-item";
    item.innerHTML = `
      <div class="dz-file-ext">${getExt(file.name)}</div>
      <div class="dz-file-info">
        <span class="dz-file-name">${escHtml(file.name)}</span>
        <span class="dz-file-size">${formatSize(file.size)}</span>
      </div>
      <button class="dz-file-remove" data-idx="${idx}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>`;
    item.querySelector(".dz-file-remove").addEventListener("click", (e) => {
      const i = parseInt(e.currentTarget.dataset.idx);
      selectedFiles.splice(i, 1);
      refreshFileList();
    });
    dzFileList.appendChild(item);
  });
  uploadBtn.classList.add("pulse");
}

function addFiles(newFiles) {
  hideError();

  const errors   = []; // { name, reason, type }
  const added    = [];
  const dupes    = [];

  newFiles.forEach(f => {
    const err = validateFile(f);

    if (err) {
      // categorise the error so we can style it properly
      if (f.size > 10 * 1024 * 1024) {
        errors.push({
          name:   f.name,
          reason: `File is ${formatSize(f.size)} — exceeds the 10MB limit.`,
          type:   "size",
        });
      } else if (f.size === 0) {
        errors.push({ name: f.name, reason: "File is empty (0 bytes).", type: "empty" });
      } else if (!f.name.includes(".")) {
        errors.push({ name: f.name, reason: "File has no extension.", type: "ext" });
      } else {
        errors.push({ name: f.name, reason: err, type: "other" });
      }
      return;
    }

    const dup = selectedFiles.some(x => x.name === f.name && x.size === f.size);
    if (dup) { dupes.push(f.name); return; }

    selectedFiles.push(f);
    added.push(f.name);
  });

  // ── show inline error cards for each rejected file ──────────────────────────
  if (errors.length > 0) {
    // remove any previous file error banners
    document.querySelectorAll(".file-error-banner").forEach(b => b.remove());

    const container = document.getElementById("dzFileErrors");

    errors.forEach((e, idx) => {
      const banner = document.createElement("div");
      banner.className = "file-error-banner";
      banner.style.animationDelay = (idx * 0.06) + "s";
      banner.innerHTML = `
        <div class="feb-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="feb-info">
          <span class="feb-name">${escHtml(e.name)}</span>
          <span class="feb-reason">${escHtml(e.reason)}</span>
        </div>
        <button class="feb-close" title="Dismiss">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>`;
      banner.querySelector(".feb-close").addEventListener("click", () => {
        banner.style.animation = "feb-out .2s ease forwards";
        setTimeout(() => banner.remove(), 210);
      });
      container.appendChild(banner);

      // auto-dismiss after 7 seconds
      setTimeout(() => {
        if (banner.parentElement) {
          banner.style.animation = "feb-out .2s ease forwards";
          setTimeout(() => banner.remove(), 210);
        }
      }, 7000);
    });
  }

  // dupe toast (less important, just a subtle info)
  if (dupes.length && !errors.length && !added.length) {
    toast(`Already added: ${dupes.join(", ")}`, "info");
  }

  refreshFileList();
}

function clearAll() {
  selectedFiles = [];
  fileInput.value = "";
  document.querySelectorAll(".file-error-banner").forEach(b => b.remove());
  refreshFileList();
  hideError();
}

// ── Drag & Drop ────────────────────────────────
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!isUploading) dropzone.classList.add("drag-over");
});
dropzone.addEventListener("dragleave", (e) => {
  if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove("drag-over");
});
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  if (isUploading) { toast("Upload in progress. Please wait.", "warning"); return; }
  addFiles(Array.from(e.dataTransfer.files));
});
dropzone.addEventListener("click", (e) => {
  if (isUploading) return;
  if (e.target.closest(".dz-file-remove")) return;
  if (e.target.closest(".dz-clear-btn"))   return;
  if (e.target.closest(".dz-add-more"))    return;
  if (e.target.closest("label"))           return;
  if (dzFiles.style.display === "block")   return;
  fileInput.click();
});
fileInput.addEventListener("change", () => {
  addFiles(Array.from(fileInput.files));
  fileInput.value = "";
});
dzClearBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!isUploading) clearAll();
});

// ── Base64 encoder ─────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // strip data:...;base64, prefix
      const b64 = reader.result.split(",")[1];
      resolve(b64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ── Upload single file to API ──────────────────
async function uploadSingleFile(file, bundleId) {
  const b64 = await fileToBase64(file);
  const payload = {
    file_name:    file.name,
    file_type:    file.type || "application/octet-stream",
    file_content: b64,
  };
  if (bundleId) payload.bundle_id = bundleId;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    console.log(`[NimbusShare] Uploading: ${file.name} (${(file.size/1024).toFixed(1)}KB)`);

    const res = await fetch(API_URL, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timeout);

    console.log(`[NimbusShare] Response status: ${res.status}`);

    // read raw text first so we can log it regardless of parse success
    const rawText = await res.text();
    console.log(`[NimbusShare] Raw response:`, rawText);

    if (!res.ok) {
      let errMsg = `Server error ${res.status}`;
      try {
        const errJson = JSON.parse(rawText);
        errMsg = errJson.message || errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("API returned invalid JSON. Check console for details.");
    }

    console.log(`[NimbusShare] Parsed response:`, data);

    if (!data.download_url) {
      throw new Error(`No download_url in response. Got: ${Object.keys(data).join(", ")}`);
    }

    return {
      download_url: data.download_url,
      s3_key:       data.s3_key    || null,
      bundle_url:   data.bundle_url || null,
      bundle_id:    data.bundle_id  || bundleId || null,
    };

  } catch (err) {
    clearTimeout(timeout);
    console.error(`[NimbusShare] Upload error for "${file.name}":`, err);
    if (err.name === "AbortError") throw new Error(`"${file.name}" upload timed out (60s). File may be too large or connection too slow.`);
    // CORS errors show as "Failed to fetch" — give helpful message
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      throw new Error(`Network error — this is usually a CORS issue. Open browser console (F12) and check the error. Make sure you're running from a local server, not by opening the HTML file directly.`);
    }
    throw err;
  }
}

// ── Progress helpers ───────────────────────────
function setProgress(pct, label) {
  progFill.style.width  = pct + "%";
  progPct.textContent   = pct + "%";
  progLabel.textContent = label;
}

function buildFileStatusList(files) {
  progFilesStatus.innerHTML = "";
  return files.map(f => {
    const row = document.createElement("div");
    row.className = "prog-file-line";
    row.innerHTML = `<span class="prog-file-dot dot-pending"></span><span>${escHtml(f.name)}</span>`;
    progFilesStatus.appendChild(row);
    return row;
  });
}

function setFileStatus(row, status) {
  const dot = row.querySelector(".prog-file-dot");
  dot.className = "prog-file-dot dot-" + status; // pending | uploading | done | error
}

// ── Main Upload Handler ────────────────────────
uploadBtn.addEventListener("click", handleUpload);

async function handleUpload() {
  hideError();
  if (!navigator.onLine) { toast("You're offline.", "error"); return; }
  if (selectedFiles.length === 0) { showError("Please select at least one file."); return; }

  isUploading = true;
  uploadBtn.classList.remove("pulse");
  uploadBtn.disabled      = true;
  btnNormal.style.display = "none";
  btnLoading.style.display = "flex";
  progressArea.style.display = "block";
  successLine.style.display  = "none";
  resultCard.style.display   = "none";

  const filesToUpload = [...selectedFiles];
  const statusRows    = buildFileStatusList(filesToUpload);
  const results       = []; // { file, url, error }
  const total         = filesToUpload.length;

  setProgress(0, `Uploading 0 of ${total}...`);

  // generate one bundle_id for all files in this batch (null for single file)
  const batchBundleId = filesToUpload.length > 1 ? genBundleId() : null;

  for (let i = 0; i < total; i++) {
    const file = filesToUpload[i];
    const row  = statusRows[i];
    setFileStatus(row, "uploading");
    setProgress(Math.round((i / total) * 90), `Uploading ${i+1} of ${total} — ${file.name}`);

    try {
      const resp = await uploadSingleFile(file, batchBundleId);
      results.push({
        file,
        url:        resp.download_url,
        s3_key:     resp.s3_key,
        bundle_url: resp.bundle_url,
        bundle_id:  resp.bundle_id,
        error:      null,
      });
      setFileStatus(row, "done");
    } catch (err) {
      results.push({ file, url: null, s3_key: null, error: err.message });
      setFileStatus(row, "error");
      toast(`Failed: ${file.name} — ${err.message}`, "error");
    }
  }

  const succeeded = results.filter(r => r.url);
  const failed    = results.filter(r => r.error);

  setProgress(100, failed.length === 0 ? "All files uploaded!" : `${succeeded.length}/${total} uploaded`);
  await sleep(700);

  // fade out progress bar
  progressArea.style.transition = "opacity .35s ease";
  progressArea.style.opacity    = "0";
  await sleep(370);
  progressArea.style.display    = "none";
  progressArea.style.opacity    = "";
  progressArea.style.transition = "";
  setProgress(0, "");

  if (succeeded.length === 0) {
    showError("All uploads failed. Please try again.");
    resetBtn();
    isUploading = false;
    return;
  }

  // ── FIX 2: clear dropzone on success ──────────
  clearAll();

  // show success line briefly
  successLine.style.display = "flex";
  setTimeout(() => { successLine.style.display = "none"; }, 3500);

  // build result
  showResult(succeeded);
  saveToStorage(succeeded);

  if (failed.length > 0) toast(`${failed.length} file(s) failed to upload.`, "warning");
  else toast(succeeded.length > 1 ? `${succeeded.length} files uploaded!` : "File uploaded!", "success");

  resetBtn();
  isUploading = false;
}

function resetBtn() {
  uploadBtn.disabled       = false;
  uploadBtn.classList.remove("pulse");
  btnNormal.style.display  = "flex";
  btnLoading.style.display = "none";
}

// ── Show Result ────────────────────────────────
function showResult(items) {
  const isMulti = items.length > 1;

  resultCard.style.display = "block";
  resultCard.style.animation = "none";
  void resultCard.offsetWidth;
  resultCard.style.animation = "";

  resultSub.textContent = isMulti
    ? `${items.length} files ready to share`
    : `${items[0].file.name} is ready to share`;

  // ── bundle link card (multi-file only) ──────────────────────────────────────
  if (isMulti) {
    bundleLinkWrap.style.display = "block";
    // always point to preview.html, never the raw API URL
    const bundleId_result = items[0].bundle_id || genBundleId();
    const bundleLink = buildBundleUrl(bundleId_result, items);

    // store URL on button as data attr — never show raw URL in DOM
    const copyBtn = document.getElementById("bundleCopyBtn");
    const copyText = document.getElementById("bundleCopyText");
    const hintEl   = document.getElementById("bundleUrlHint");
    copyBtn.dataset.url = bundleLink;
    if (hintEl) hintEl.textContent = "Click to copy · " + items.length + " files";

    // clone to remove old listeners
    const freshBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(freshBtn, copyBtn);
    freshBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(bundleLink).then(() => {
        freshBtn.classList.add("copied");
        freshBtn.querySelector("span").textContent = "Copied!";
        freshBtn.querySelector("svg").innerHTML = `<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        if (hintEl) hintEl.textContent = "✓ Link copied to clipboard!";
        setTimeout(() => {
          freshBtn.classList.remove("copied");
          freshBtn.querySelector("span").textContent = "Copy Link";
          freshBtn.querySelector("svg").innerHTML = `<rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>`;
          if (hintEl) hintEl.textContent = "Click to copy · " + items.length + " files";
        }, 2200);
        toast("Bundle link copied!", "success");
      }).catch(() => toast("Could not copy — try again.", "error"));
    });
    fileLinksLabel.style.display = "flex";
  } else {
    bundleLinkWrap.style.display = "none";
    fileLinksLabel.style.display = "flex";
  }

  // ── individual file link cards ───────────────────────────────────────────────
  fileLinksList.innerHTML = "";
  items.forEach(item => {
    const previewUrl = buildSinglePreviewUrl(item.url);
    const row = document.createElement("div");
    row.className = "file-link-row";
    row.innerHTML = `
      <div class="flr-ext">${getExt(item.file.name)}</div>
      <div class="flr-info">
        <span class="flr-name">${escHtml(item.file.name)}</span>
        <span class="flr-size">${formatSize(item.file.size)}</span>
      </div>
      <button class="flr-copy">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Copy
      </button>`;
    const btn = row.querySelector(".flr-copy");
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(previewUrl).then(() => {
        btn.classList.add("copied");
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/></svg> Copy`;
        }, 2000);
        toast(`"${item.file.name}" link copied!`, "success");
      }).catch(() => toast("Could not copy.", "error"));
    });
    fileLinksList.appendChild(row);
  });
}

// build a preview URL that encodes all file URLs in query params
function buildBundleUrl(bundleId, items) {
  // generates a preview.html link — preview.html calls GET API to list bundle files
  const href = window.location.href;
  const base = href.includes("index.html")
    ? href.replace("index.html", "")
    : href.replace(/\/[^\/]*$/, "/");
  return `${base}preview.html?bundle_id=${encodeURIComponent(bundleId)}`;
}

function buildSinglePreviewUrl(url) {
  // generates a preview.html link for a single file
  const href = window.location.href;
  const base = href.includes("index.html")
    ? href.replace("index.html", "")
    : href.replace(/\/[^\/]*$/, "/");
  return `${base}preview.html?f=${encodeURIComponent(url)}`;
}

// ── Copy helpers ───────────────────────────────
function copyToClipboard(text, btn, textEl, iconEl) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.classList.add("copied");
      if (textEl) textEl.textContent = "Copied!";
      else btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = origHtml;
      }, 2000);
    }
    toast("Link copied!", "success");
  }).catch(() => toast("Could not copy — please copy manually.", "error"));
}

function setupCopyBtn(btn, textEl, iconEl, url) {
  // remove old listeners by cloning
  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener("click", () => {
    copyToClipboard(url, fresh, fresh.querySelector("span"), fresh.querySelector("svg"));
  });
}

// ── New Upload ─────────────────────────────────
newUploadBtn.addEventListener("click", () => {
  resultCard.style.display = "none";
  successLine.style.display = "none";
  fileLinksList.innerHTML = "";
  clearAll();
  window.scrollTo({ top:0, behavior:"smooth" });
});

// ── localStorage ──────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(items) {
  const existing = loadFromStorage();
  const isBundle = items.length > 1;
  const bundleId = items[0].bundle_id || genBundleId();
  const entry = {
    id:        bundleId,
    ts:        Date.now(),
    isBundle,
    files: items.map(i => ({
      name:   i.file.name,
      size:   i.file.size,
      url:    i.url,
      s3_key: i.s3_key || null,
    })),
    // ALWAYS use local preview.html URL — never the raw API bundle_url
    bundleUrl: isBundle ? buildBundleUrl(bundleId, items) : null,
  };
  const updated = [entry, ...existing].slice(0, 20);
  try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
  renderRecent();
}

// ── Render Recent Uploads ──────────────────────
// ── Delete entry ──────────────────────────────────────────────────────────────
async function deleteEntry(entryId) {
  const uploads  = loadFromStorage();
  const entry    = uploads.find(u => u.id === entryId);
  if (!entry) return;

  // DELETE each file from cloud via API
  for (const f of entry.files) {
    if (!f.s3_key) continue;
    try {
      await fetch(API_URL, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ s3_key: f.s3_key }),
      });
    } catch (err) {
      console.warn("Cloud delete failed for", f.s3_key, err);
    }
  }

  // remove from localStorage
  const updated = uploads.filter(u => u.id !== entryId);
  try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
  renderRecent();
  toast("File deleted successfully.", "success");
}

function renderRecent() {
  const uploads = loadFromStorage();
  recentBadge.textContent = uploads.length + (uploads.length === 1 ? " file" : " files");

  // update stats bar
  const totalFiles   = uploads.reduce((s, u) => s + u.files.length, 0);
  const totalBundles = uploads.filter(u => u.isBundle).length;
  const totalBytes   = uploads.reduce((s, u) => s + u.files.reduce((ss, f) => ss + (f.size || 0), 0), 0);
  if (rsFiles)   rsFiles.textContent   = totalFiles;
  if (rsBundles) rsBundles.textContent = totalBundles;
  if (rsSize)    rsSize.textContent    = formatSize(totalBytes) !== "—" ? formatSize(totalBytes) : "0 KB";

  recentBody.innerHTML = "";

  if (uploads.length === 0) {
    recentBody.innerHTML = `
      <div class="recent-empty">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" opacity=".35">
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" stroke-width="1.5"/>
          <polyline points="13 2 13 9 20 9" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>No uploads yet</span>
      </div>`;
    return;
  }

  uploads.forEach((entry, idx) => {
    const el = document.createElement("div");
    el.className = "recent-item";
    el.style.animationDelay = (idx * 0.05) + "s";

    const displayName = entry.isBundle
      ? `Bundle (${entry.files.length} files)`
      : entry.files[0].name;
    const displaySize = entry.isBundle
      ? formatSize(entry.files.reduce((s,f) => s+f.size, 0))
      : formatSize(entry.files[0].size);

    el.innerHTML = `
      <div class="ri-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          ${entry.isBundle
            ? `<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/>`
            : `<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" stroke-width="1.5"/>
               <polyline points="13 2 13 9 20 9" stroke="currentColor" stroke-width="1.5"/>`
          }
        </svg>
      </div>
      <div class="ri-info">
        <span class="ri-name">${escHtml(displayName)}</span>
        <div class="ri-meta">
          <span class="ri-size">${displaySize}</span>
          ${entry.isBundle ? `<span class="ri-count">${entry.files.length} files</span>` : ""}
        </div>
      </div>
      <button class="ri-copy" title="Copy link">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      <button class="ri-delete" title="Delete file" data-id="${entry.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>`;

    // click row → open modal (not on action buttons)
    el.addEventListener("click", (e) => {
      if (e.target.closest(".ri-copy"))   return;
      if (e.target.closest(".ri-delete")) return;
      openModal(entry);
    });

    // copy button
    const copyBtn = el.querySelector(".ri-copy");
    const linkToCopy = entry.bundleUrl || buildSinglePreviewUrl(entry.files[0].url);
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(linkToCopy).then(() => {
        copyBtn.style.color       = "var(--green)";
        copyBtn.style.borderColor = "var(--green)";
        setTimeout(() => { copyBtn.style.color = ""; copyBtn.style.borderColor = ""; }, 1500);
        toast("Link copied!", "success");
      }).catch(() => toast("Could not copy.", "error"));
    });

    // delete button — premium inline confirm (no browser alert)
    const delBtn = el.querySelector(".ri-delete");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // if confirm UI already open on this item, close it
      if (el.querySelector(".ri-delete-confirm")) {
        el.querySelector(".ri-delete-confirm").remove();
        el.classList.remove("deleting");
        return;
      }
      // close any other open confirms
      document.querySelectorAll(".ri-delete-confirm").forEach(c => {
        c.closest(".recent-item")?.classList.remove("deleting");
        c.remove();
      });

      el.classList.add("deleting");
      const confirm = document.createElement("div");
      confirm.className = "ri-delete-confirm";
      confirm.innerHTML = `
        <span class="ri-dc-msg">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Delete permanently?
        </span>
        <div class="ri-dc-actions">
          <button class="ri-dc-cancel">Cancel</button>
          <button class="ri-dc-confirm">Delete</button>
        </div>`;

      el.appendChild(confirm);
      // animate in
      requestAnimationFrame(() => confirm.classList.add("visible"));

      confirm.querySelector(".ri-dc-cancel").addEventListener("click", (e) => {
        e.stopPropagation();
        confirm.classList.remove("visible");
        setTimeout(() => { confirm.remove(); el.classList.remove("deleting"); }, 200);
      });
      confirm.querySelector(".ri-dc-confirm").addEventListener("click", (e) => {
        e.stopPropagation();
        confirm.remove();
        el.classList.remove("deleting");
        // animate row out
        el.style.transition = "opacity .25s, transform .25s";
        el.style.opacity = "0";
        el.style.transform = "translateX(12px)";
        setTimeout(() => deleteEntry(entry.id), 280);
      });

      // auto-close after 5s
      setTimeout(() => {
        if (confirm.parentElement) {
          confirm.classList.remove("visible");
          setTimeout(() => { confirm.remove(); el.classList.remove("deleting"); }, 200);
        }
      }, 5000);
    });

    recentBody.appendChild(el);
  });
}

// ── Recent Item Modal ──────────────────────────
function openModal(entry) {
  document.querySelectorAll(".ns-overlay").forEach(o => o.remove());

  const isBundle    = entry.isBundle;
  const masterLink  = entry.bundleUrl || buildSinglePreviewUrl(entry.files[0].url);
  const displayName = isBundle ? `Bundle — ${entry.files.length} files` : entry.files[0].name;
  const displaySize = isBundle
    ? formatSize(entry.files.reduce((s,f) => s+f.size, 0))
    : formatSize(entry.files[0].size);
  const timeAgo     = getTimeAgo(entry.ts);

  const overlay = document.createElement("div");
  overlay.className = "ns-overlay";
  overlay.innerHTML = `
    <div class="ns-modal">
      <button class="modal-close" id="modalClose">×</button>
      <p class="modal-filename">${escHtml(displayName)}</p>
      <p class="modal-meta-line">${displaySize} · Uploaded ${timeAgo} · Stored permanently</p>
      <div class="modal-divider"></div>

      <span class="modal-section-label">${isBundle ? "Bundle Link (all files)" : "Shareable Link"}</span>
      <div class="link-card" style="margin-bottom:14px">
        <div class="link-card-left">
          <div class="link-card-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="link-card-text">
            <span class="link-card-label">${isBundle ? "Share all files" : "Shareable link"}</span>
            <span class="link-card-hint">Click to copy</span>
          </div>
        </div>
        <button class="link-copy-btn" id="modalMasterCopy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>Copy Link</span>
        </button>
      </div>

      ${isBundle ? `
        <span class="modal-section-label" style="margin-top:4px">Individual Files</span>
        <div class="modal-file-rows" id="modalFileRows"></div>
      ` : ""}
    </div>`;

  document.body.appendChild(overlay);

  // master copy
  const masterCopyBtn = overlay.querySelector("#modalMasterCopy");
  masterCopyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(masterLink).then(() => {
      masterCopyBtn.classList.add("copied");
      const spanEl = masterCopyBtn.querySelector("span");
      const svgEl  = masterCopyBtn.querySelector("svg");
      if (spanEl) spanEl.textContent = "Copied!";
      if (svgEl)  svgEl.innerHTML = `<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      setTimeout(() => {
        masterCopyBtn.classList.remove("copied");
        if (spanEl) spanEl.textContent = "Copy Link";
        if (svgEl)  svgEl.innerHTML = `<rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>`;
      }, 2000);
      toast("Link copied!", "success");
    }).catch(() => toast("Could not copy.", "error"));
  });

  // individual files in bundle
  if (isBundle) {
    const rowsContainer = overlay.querySelector("#modalFileRows");
    entry.files.forEach(f => {
      const previewUrl = buildSinglePreviewUrl(f.url);
      const row = document.createElement("div");
      row.className = "modal-file-row";
      row.innerHTML = `
        <div class="mfr-ext">${getExt(f.name)}</div>
        <span class="mfr-name">${escHtml(f.name)}</span>
        <span class="mfr-size">${formatSize(f.size)}</span>
        <button class="mfr-copy">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Copy
        </button>`;
      const copyBtn = row.querySelector(".mfr-copy");
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(previewUrl).then(() => {
          copyBtn.classList.add("copied");
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.classList.remove("copied");
            copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/></svg> Copy`;
          }, 2000);
          toast(`Link for "${f.name}" copied!`, "success");
        }).catch(() => toast("Could not copy.", "error"));
      });
      rowsContainer.appendChild(row);
    });
  }

  // close handlers
  overlay.querySelector("#modalClose").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document._mKeyH = (e) => { if (e.key === "Escape") closeModal(); };
  document.addEventListener("keydown", document._mKeyH);
}

function closeModal() {
  const overlay = document.querySelector(".ns-overlay");
  if (!overlay) return;
  overlay.style.animation = "ov-out .18s ease forwards";
  setTimeout(() => overlay.remove(), 190);
  if (document._mKeyH) { document.removeEventListener("keydown", document._mKeyH); delete document._mKeyH; }
}

// ── Time ago helper ────────────────────────────
function getTimeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

/* =============================================
   PHASE 3 POLISH
   ============================================= */

// Scroll reveal
(function() {
  const targets = [document.querySelector(".recent-card"), document.querySelector(".footer")].filter(Boolean);
  targets.forEach((el,i) => { el.classList.add("reveal"); if(i) el.classList.add("reveal-d1"); });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold:.1 });
  targets.forEach(el => obs.observe(el));
})();

// Hero count-up
(function() {
  const config = [{el:null,target:10,suffix:"MB"},{el:null,target:null,suffix:""},{el:null,target:null,suffix:""}];
  document.querySelectorAll(".hstat-n").forEach((el,i) => {
    if(!config[i]) return;
    const {target,suffix} = config[i];
    if (!target) return; // skip non-animatable stats
    let start=null;
    function step(ts){
      if(!start) start=ts;
      const p=Math.min((ts-start)/900,1);
      el.textContent=Math.round((1-Math.pow(1-p,3))*target)+suffix;
      if(p<1) requestAnimationFrame(step);
    }
    setTimeout(()=>requestAnimationFrame(step),300+i*100);
  });
})();

// Skeleton then render recent
(function() {
  // show 3 skeletons
  for(let i=0;i<3;i++){
    const s=document.createElement("div");
    s.className="skel-item";
    s.innerHTML=`<div class="skel-box skel-icon"></div><div class="skel-lines"><div class="skel-box skel-a"></div><div class="skel-box skel-b"></div></div><div class="skel-box skel-btn2"></div>`;
    recentBody.appendChild(s);
  }
  setTimeout(()=>{ document.querySelectorAll(".skel-item").forEach(e=>e.remove()); renderRecent(); }, 900);
})();