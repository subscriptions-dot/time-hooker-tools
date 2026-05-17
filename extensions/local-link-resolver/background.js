(function () {
  "use strict";

  const STORE_KEYS = {
    enabled: "llr:enabled",
    rules: "llr:rules"
  };

  const BLOCKED_PROTOCOLS = new Set([
    "about:",
    "chrome:",
    "chrome-extension:",
    "devtools:",
    "edge:",
    "file:",
    "moz-extension:",
    "view-source:"
  ]);

  function normalizeUrl(value) {
    try {
      const url = new URL(value);
      url.hash = "";

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      url.hostname = url.hostname.toLowerCase();
      if (url.pathname !== "/" && url.pathname.endsWith("/")) {
        url.pathname = url.pathname.replace(/\/+$/, "");
      }

      return url.href;
    } catch (error) {
      return null;
    }
  }

  function isAllowedUrl(value) {
    try {
      const url = new URL(value);
      return !BLOCKED_PROTOCOLS.has(url.protocol);
    } catch (error) {
      return false;
    }
  }

  function getStored(keys) {
    return chrome.storage.local.get(keys);
  }

  async function resolveRule(url) {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      return null;
    }

    const data = await getStored([STORE_KEYS.enabled, STORE_KEYS.rules]);
    if (data[STORE_KEYS.enabled] === false) {
      return null;
    }

    const rules = data[STORE_KEYS.rules] || {};
    return rules[normalized] || null;
  }

  async function applyRedirect(tabId, url) {
    if (!url || !isAllowedUrl(url)) {
      return;
    }

    const target = await resolveRule(url);
    if (!target || normalizeUrl(target) === normalizeUrl(url)) {
      return;
    }

    await chrome.tabs.update(tabId, { url: target });
  }

  chrome.runtime.onInstalled.addListener(async () => {
    const data = await getStored([STORE_KEYS.enabled]);
    if (typeof data[STORE_KEYS.enabled] !== "boolean") {
      await chrome.storage.local.set({ [STORE_KEYS.enabled]: true });
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      applyRedirect(tabId, changeInfo.url);
    }
  });

  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0 && details.transitionType === "reload") {
      applyRedirect(details.tabId, details.url);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "LLR_RESOLVE_SIMPLE") {
      return false;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    fetch(message.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store"
    })
      .then((response) => {
        clearTimeout(timer);
        sendResponse({ ok: true, finalUrl: response.url });
      })
      .catch((error) => {
        clearTimeout(timer);
        sendResponse({ ok: false, error: error.message || "Resolve failed" });
      });

    return true;
  });
})();
