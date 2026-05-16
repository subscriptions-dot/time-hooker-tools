(function () {
  "use strict";

  const TIMER_ID = "hrone-punch-timer";
  const WORK_TARGET_MINUTES = 8 * 60 + 30;
  const SCAN_INTERVAL_MS = 2500;
  const TICK_INTERVAL_MS = 30 * 1000;
  const STORAGE_PREFIX = "hrone:firstPunch:";

  let timerNode = null;
  let punchDate = null;
  let punchSource = "Last punch";
  let syncedFirstPunchTime = null;
  let statusText = "Safe mode: no auto page open";
  let tickTimer = null;
  let scanTimer = null;
  let scanQueued = false;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  function dateKeyFromParts(day, month, year) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  function dateFromKeyAndTime(dateKey, timeText) {
    const match = String(timeText || "").match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
      return null;
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day, Number(match[1]), Number(match[2]), 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function hasExtensionContext() {
    try {
      return typeof chrome !== "undefined" && Boolean(chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  function storageGet(key, callback) {
    if (!hasExtensionContext() || !chrome.storage || !chrome.storage.local) {
      callback(null);
      return;
    }

    try {
      chrome.storage.local.get(key, (items) => callback(items[key] || null));
    } catch (error) {
      callback(null);
    }
  }

  function storageSet(key, value) {
    if (!hasExtensionContext() || !chrome.storage || !chrome.storage.local) {
      return;
    }

    try {
      chrome.storage.local.set({ [key]: value });
    } catch (error) {
      // Old content scripts can survive briefly after extension reload.
    }
  }

  function todayStorageKey() {
    return `${STORAGE_PREFIX}${todayKey()}`;
  }

  function setStatus(text) {
    statusText = text;
    renderTimer();
  }

  function setFirstPunchFromTime(dateKey, timeText) {
    const date = dateFromKeyAndTime(dateKey, timeText);

    if (!date || dateKey !== todayKey()) {
      return false;
    }

    punchDate = date;
    punchSource = "In-Time";
    syncedFirstPunchTime = timeText;
    setStatus(`Synced from In-Time ${timeText}`);
    ensureTimerFromHome();
    return true;
  }

  function loadSyncedFirstPunch() {
    storageGet(todayStorageKey(), (timeText) => {
      if (!timeText || !setFirstPunchFromTime(todayKey(), timeText)) {
        setStatus("Safe mode: open calendar drawer once");
      }
    });
  }

  function parseLastPunch(text) {
    const normalized = normalizeText(text);
    const match = normalized.match(/Last\s*punch\s*[\-–—:]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s*[AP]\.?M\.?)/i);

    if (!match) {
      return null;
    }

    const parsed = new Date(match[1].replace(/\./g, ""));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function parseCalendarFirstPunch() {
    const text = document.body ? document.body.innerText : "";
    const normalized = normalizeText(text);
    const dateMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    const inTimeMatch = normalized.match(/\bIn-?Time\s+(\d{1,2}:\d{2})\b/i);

    if (!inTimeMatch) {
      return null;
    }

    const dateKey = dateMatch
      ? dateKeyFromParts(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]))
      : todayKey();
    const timeText = inTimeMatch[1];
    const date = dateFromKeyAndTime(dateKey, timeText);

    if (!date) {
      return null;
    }

    return { dateKey, timeText, date };
  }

  function saveCalendarFirstPunchIfVisible() {
    const parsed = parseCalendarFirstPunch();

    if (!parsed) {
      return false;
    }

    storageSet(`${STORAGE_PREFIX}${parsed.dateKey}`, parsed.timeText);
    setFirstPunchFromTime(parsed.dateKey, parsed.timeText);
    return true;
  }

  function formatDuration(totalMinutes) {
    const safeMinutes = Math.max(0, Math.floor(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${hours}h ${pad2(minutes)}m`;
  }

  function findLastPunchElement() {
    if (!document.body) {
      return null;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = normalizeText(node.nodeValue);

        if (!text.includes("Last punch") || !parseLastPunch(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (node.parentElement && node.parentElement.closest(`#${TIMER_ID}`)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNode = walker.nextNode();

    if (textNode && textNode.parentElement) {
      return textNode.parentElement;
    }

    const candidates = Array.from(document.querySelectorAll("body *")).filter((element) => {
      if (element.id === TIMER_ID || element.closest(`#${TIMER_ID}`)) {
        return false;
      }

      const text = normalizeText(element.textContent);
      return text.includes("Last punch") && parseLastPunch(text);
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((a, b) => normalizeText(a.textContent).length - normalizeText(b.textContent).length)[0];
  }

  function findAttendanceContainer(targetElement) {
    let current = targetElement;

    while (current && current !== document.body) {
      const text = normalizeText(current.textContent);

      if (text.includes("Mark attendance") && text.includes("Last punch")) {
        return current;
      }

      current = current.parentElement;
    }

    return targetElement.parentElement || targetElement;
  }

  function findAttendanceContainerFromPage() {
    const candidates = Array.from(document.querySelectorAll("body *")).filter((element) => {
      if (element.id === TIMER_ID || element.closest(`#${TIMER_ID}`)) {
        return false;
      }

      const text = normalizeText(element.textContent);
      return text.includes("Mark attendance") && text.includes("Last punch");
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((a, b) => normalizeText(a.textContent).length - normalizeText(b.textContent).length)[0];
  }

  function createTimerNode() {
    if (timerNode) {
      return;
    }

    timerNode = document.createElement("div");
    timerNode.id = TIMER_ID;
    timerNode.className = "hrone-punch-timer";
    timerNode.innerHTML = `
      <div class="hrone-punch-timer__meta">Safe mode: no auto page open</div>
      <div class="hrone-punch-timer__row">
        <span class="hrone-punch-timer__label">Worked</span>
        <span class="hrone-punch-timer__value">0h 00m / 8h30m</span>
        <span class="hrone-punch-timer__left">8h 30m left</span>
      </div>
      <div class="hrone-punch-timer__bar" aria-hidden="true">
        <span class="hrone-punch-timer__bar-fill"></span>
      </div>
    `;
  }

  function renderTimer() {
    if (!timerNode || !punchDate) {
      return;
    }

    const elapsedMinutes = (Date.now() - punchDate.getTime()) / 60000;
    const remainingMinutes = Math.max(0, WORK_TARGET_MINUTES - elapsedMinutes);
    const progress = Math.min(100, Math.max(0, (elapsedMinutes / WORK_TARGET_MINUTES) * 100));
    const sourceText = punchSource === "In-Time" && syncedFirstPunchTime
      ? `Synced from In-Time ${syncedFirstPunchTime}`
      : statusText;

    timerNode.querySelector(".hrone-punch-timer__meta").textContent = sourceText;
    timerNode.querySelector(".hrone-punch-timer__value").textContent = `${formatDuration(elapsedMinutes)} / 8h30m`;
    timerNode.querySelector(".hrone-punch-timer__left").textContent = remainingMinutes <= 0
      ? "Completed"
      : `${formatDuration(remainingMinutes)} left`;
    timerNode.querySelector(".hrone-punch-timer__bar-fill").style.width = `${progress}%`;
  }

  function ensureTicking() {
    if (!tickTimer) {
      tickTimer = window.setInterval(renderTimer, TICK_INTERVAL_MS);
    }
  }

  function ensureTimerFromHome() {
    const lastPunchElement = findLastPunchElement();
    const pageLastPunchDate = parseLastPunch(document.body ? document.body.innerText : "");

    if (!lastPunchElement && !pageLastPunchDate && punchSource !== "In-Time") {
      return;
    }

    const lastPunchDate = lastPunchElement ? parseLastPunch(lastPunchElement.textContent) : pageLastPunchDate;
    const selectedDate = punchSource === "In-Time" ? punchDate : lastPunchDate;

    if (!selectedDate) {
      return;
    }

    punchDate = selectedDate;

    if (punchSource !== "In-Time") {
      punchSource = "Last punch";
      setStatus("Fallback: using Last punch");
    }

    createTimerNode();
    const host = lastPunchElement
      ? findAttendanceContainer(lastPunchElement)
      : findAttendanceContainerFromPage();

    if (!host) {
      return;
    }

    host.appendChild(timerNode);
    renderTimer();
    ensureTicking();
  }

  function scan() {
    saveCalendarFirstPunchIfVisible();
    loadSyncedFirstPunch();
    ensureTimerFromHome();
  }

  function queueScan() {
    if (scanQueued) {
      return;
    }

    scanQueued = true;
    window.setTimeout(() => {
      scanQueued = false;
      scan();
    }, 250);
  }

  const observer = new MutationObserver(() => queueScan());

  if (hasExtensionContext() && chrome.storage && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        const todayChange = changes[todayStorageKey()];

        if (areaName === "local" && todayChange && todayChange.newValue) {
          setFirstPunchFromTime(todayKey(), todayChange.newValue);
        }
      });
    } catch (error) {
      // Page refresh attaches a fresh listener.
    }
  }

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  scan();
  scanTimer = window.setInterval(scan, SCAN_INTERVAL_MS);

  window.addEventListener("beforeunload", () => {
    observer.disconnect();
    window.clearInterval(scanTimer);
    window.clearInterval(tickTimer);
  });
})();
