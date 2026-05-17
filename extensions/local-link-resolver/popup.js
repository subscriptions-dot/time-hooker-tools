(function () {
  "use strict";

  const STORE_KEYS = {
    enabled: "llr:enabled",
    rules: "llr:rules"
  };

  const enabledInput = document.getElementById("enabled");
  const sourceInput = document.getElementById("sourceUrl");
  const targetInput = document.getElementById("targetUrl");
  const useCurrentButton = document.getElementById("useCurrent");
  const saveRuleButton = document.getElementById("saveRule");
  const deleteRuleButton = document.getElementById("deleteRule");
  const resolveSimpleButton = document.getElementById("resolveSimple");
  const openTargetButton = document.getElementById("openTarget");
  const statusNode = document.getElementById("status");
  const rulesList = document.getElementById("rulesList");

  function setStatus(text) {
    statusNode.textContent = text;
  }

  function normalizeUrl(value) {
    try {
      const url = new URL(value.trim());
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

  function getStored(keys) {
    return chrome.storage.local.get(keys);
  }

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  }

  async function loadRules() {
    const data = await getStored([STORE_KEYS.enabled, STORE_KEYS.rules]);
    const rules = data[STORE_KEYS.rules] || {};

    enabledInput.checked = data[STORE_KEYS.enabled] !== false;
    rulesList.innerHTML = "";

    const entries = Object.entries(rules).sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No saved rules";
      rulesList.append(option);
      return rules;
    }

    for (const [source, target] of entries) {
      const option = document.createElement("option");
      option.value = source;
      option.textContent = `${source} -> ${target}`;
      rulesList.append(option);
    }

    return rules;
  }

  async function useCurrentTab() {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) {
      setStatus("No active tab URL found");
      return;
    }

    sourceInput.value = tab.url;
    const rules = await loadRules();
    const normalized = normalizeUrl(tab.url);
    targetInput.value = normalized && rules[normalized] ? rules[normalized] : "";
    setStatus("Current tab loaded");
  }

  async function saveRule() {
    const source = normalizeUrl(sourceInput.value);
    const target = normalizeUrl(targetInput.value);

    if (!source) {
      setStatus("Source URL is not valid");
      return;
    }

    if (!target) {
      setStatus("Final URL is not valid");
      return;
    }

    const data = await getStored([STORE_KEYS.rules]);
    const rules = data[STORE_KEYS.rules] || {};
    rules[source] = target;
    await chrome.storage.local.set({ [STORE_KEYS.rules]: rules });
    await loadRules();
    setStatus("Rule saved locally");
  }

  async function deleteRule() {
    const source = normalizeUrl(sourceInput.value || rulesList.value);
    if (!source) {
      setStatus("No source rule selected");
      return;
    }

    const data = await getStored([STORE_KEYS.rules]);
    const rules = data[STORE_KEYS.rules] || {};
    delete rules[source];
    await chrome.storage.local.set({ [STORE_KEYS.rules]: rules });
    targetInput.value = "";
    await loadRules();
    setStatus("Rule deleted");
  }

  async function resolveSimple() {
    const source = normalizeUrl(sourceInput.value);
    if (!source) {
      setStatus("Source URL is not valid");
      return;
    }

    setStatus("Checking normal redirects...");
    resolveSimpleButton.disabled = true;

    chrome.runtime.sendMessage({ type: "LLR_RESOLVE_SIMPLE", url: source }, (result) => {
      resolveSimpleButton.disabled = false;

      if (!result || !result.ok) {
        setStatus(result?.error || "Redirect check failed");
        return;
      }

      targetInput.value = result.finalUrl;
      setStatus(result.finalUrl === source ? "No HTTP redirect found" : "Final URL detected");
    });
  }

  async function openTarget() {
    const target = normalizeUrl(targetInput.value);
    if (!target) {
      setStatus("Final URL is not valid");
      return;
    }

    await chrome.tabs.create({ url: target });
  }

  enabledInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ [STORE_KEYS.enabled]: enabledInput.checked });
    setStatus(enabledInput.checked ? "Auto redirect enabled" : "Auto redirect disabled");
  });

  useCurrentButton.addEventListener("click", useCurrentTab);
  saveRuleButton.addEventListener("click", saveRule);
  deleteRuleButton.addEventListener("click", deleteRule);
  resolveSimpleButton.addEventListener("click", resolveSimple);
  openTargetButton.addEventListener("click", openTarget);

  rulesList.addEventListener("change", async () => {
    const source = rulesList.value;
    const data = await getStored([STORE_KEYS.rules]);
    const rules = data[STORE_KEYS.rules] || {};
    sourceInput.value = source;
    targetInput.value = rules[source] || "";
  });

  loadRules().then(useCurrentTab);
})();
