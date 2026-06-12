// ==UserScript==

// @name            Time Hooker (V56.0 - Honest Two-Step Learning)

// @namespace       https://tampermonkey.net/

// @version         56.0

// @description     Unknown flows now require two real user-confirmed steps before trusted replay, while known VPlink chains keep guarded fast automation and isolated loop recovery.

// @author          rehan & Pankaj034

// @match           *://*/*

// @match           file:///*

// @run-at          document-start

// @grant           GM_setValue

// @grant           GM_getValue

// @grant           GM_xmlhttpRequest

// @connect         raw.githubusercontent.com

// @connect         githubusercontent.com

// @connect         github.io

// @license         GPL-3.0-or-later

// @homepageURL     https://greasyfork.org/en/scripts/569833

// @supportURL      https://greasyfork.org/en/scripts/569833/feedback

// @updateURL       https://raw.githubusercontent.com/subscriptions-dot/time-hooker-tools/main/userscripts/time-hooker.user.js

// @downloadURL     https://raw.githubusercontent.com/subscriptions-dot/time-hooker-tools/main/userscripts/time-hooker.user.js

// @icon            https://www.google.com/s2/favicons?sz=64&domain=greasyfork.org

// ==/UserScript==

(function() {

    'use strict';

    const STORAGE_KEY = "th_v19_global_settings";

    // --- REMOTE RULES SYNC (stable, optional) ---

    // One hosted JSON adds/updates site rules for every device with NO re-publish.

    // Change this URL to your own raw JSON (and add a matching @connect host above).

    // If the URL is unreachable, the script silently keeps using cached + built-in rules — it never blocks the page.

    const REMOTE_RULES_URL = "https://raw.githubusercontent.com/subscriptions-dot/time-hooker-tools/main/rules/time-hooker-rules.json";

    const REMOTE_CACHE_KEY = "th_remote_rules_cache";

    const REMOTE_TS_KEY = "th_remote_rules_ts";

    const REMOTE_REFRESH_MS = 86400000; // refresh at most once per day



    window.addEventListener('TH_SAVE_GLOBAL', function(e) {

        try {

            GM_setValue(STORAGE_KEY, JSON.stringify(e.detail || {}));

        } catch(e) {}

    });

    let savedData = GM_getValue(STORAGE_KEY);

    let remoteRulesCached = null;

    try { remoteRulesCached = GM_getValue(REMOTE_CACHE_KEY) || null; } catch(e) { remoteRulesCached = null; }

    const mainPageLogic = function(savedStr, remoteStr) {

        const isIframe = window.top !== window.self;

        const DEFAULTS = { enabled: false, skipTimers: true, speed: 15, aggroBypass: true, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: true, autoClick: false, autoFlowSkip: false, universalFlow: false, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0, menuLeft: '', menuTop: '', menuExpanded: true };

        const PROFILE_KEYS = ['enabled', 'skipTimers', 'speed', 'aggroBypass', 'smartVerifyFlow', 'waitUntilTimerMoves', 'safeCountdownMode', 'videoSpeed', 'autoClick', 'autoFlowSkip', 'universalFlow', 'antiAdblock', 'highlight', 'pinMode', 'topOffset'];

        const SITE_KEY = (location.hostname || (location.protocol === 'file:' ? 'local-file' : location.host) || 'unknown-site').toLowerCase();

        const BUILTIN_SITE_PROFILES = {

            'sb1.schemepro.org': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'sb2.schemepro.org': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'lksfy.com': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, videoSpeed: false, autoClick: false, autoFlowSkip: false, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'darkguruji.com': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'startuplearners.com': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'privatejobbeta.com': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'rempo.xyz': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'genas.xyz': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'vplink.in': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 },

            'vacancymode.in': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, universalFlow: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 }

        };

        // Applied to sites the script has learned on its own (or that the user added via "Add This Site").

        // Universal pattern detection stays on so unknown-but-similar pages keep working safely.

        const LEARNED_PROFILE = { enabled: true, skipTimers: true, speed: 15, aggroBypass: true, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, universalFlow: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 };

        // Remote rules: validated, sanitised per-site flags fetched from the hosted JSON (cached in GM storage).

        // Only known PROFILE_KEYS are copied and type-coerced, so a malformed remote file can never break the engine.

        let REMOTE_PROFILES = {};

        (function() {

            try {

                const r = remoteStr ? (typeof remoteStr === 'string' ? JSON.parse(remoteStr) : remoteStr) : null;

                if (r && typeof r === 'object' && r.sites && typeof r.sites === 'object') {

                    Object.keys(r.sites).forEach(function(host) {

                        const raw = r.sites[host];

                        if (!raw || typeof raw !== 'object') return;

                        const clean = {};

                        PROFILE_KEYS.forEach(function(k) {

                            if (!Object.prototype.hasOwnProperty.call(raw, k)) return;

                            if (k === 'speed' || k === 'topOffset') { const n = parseInt(raw[k], 10); if (Number.isFinite(n)) clean[k] = n; }

                            else clean[k] = !!raw[k];

                        });

                        const key = String(host || '').toLowerCase().trim();

                        if (key && Object.keys(clean).length) REMOTE_PROFILES[key] = clean;

                    });

                }

            } catch(e) { REMOTE_PROFILES = {}; }

        })();

        function sanitizeRecipes(raw) {

            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

            const clean = {};

            const safeNumber = (value, max) => {

                const number = Number(value);

                return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : 0;

            };

            Object.keys(raw).slice(0, 160).forEach(function(key) {

                const item = raw[key];

                if (!item || typeof item !== 'object' || Array.isArray(item)) return;

                const step = item.step;

                if (!step || typeof step !== 'object' || Array.isArray(step)) return;

                const host = String(item.host || '').toLowerCase().slice(0, 180);

                const shape = String(item.shape || '').slice(0, 240);

                if (!host || !shape) return;

                clean[String(key).slice(0, 460)] = {

                    host,

                    shape,

                    step: {

                        id: String(step.id || '').slice(0, 120),

                        text: String(step.text || '').slice(0, 120),

                        tag: String(step.tag || '').slice(0, 24),

                        role: String(step.role || '').slice(0, 40),

                        selector: String(step.selector || '').slice(0, 260),

                        hrefSig: String(step.hrefSig || '').slice(0, 320),

                        kind: step.kind === 'navigate' ? 'navigate' : 'click'

                    },

                    hits: safeNumber(item.hits, 999),

                    fails: safeNumber(item.fails, 999),

                    confirmations: safeNumber(item.confirmations, 999),

                    consecutiveFails: safeNumber(item.consecutiveFails, 20),

                    updatedAt: safeNumber(item.updatedAt, Number.MAX_SAFE_INTEGER),

                    lastFailAt: safeNumber(item.lastFailAt, Number.MAX_SAFE_INTEGER)

                };

            });

            return clean;

        }

        function normalizeStore(saved) {

            let parsed = {};

            if (saved) {

                try { parsed = (typeof saved === 'string') ? JSON.parse(saved) : saved; } catch(e) { parsed = {}; }

            }

            if (parsed && typeof parsed === 'object' && (parsed.global || parsed.profiles)) {

                return {

                    global: Object.assign({}, DEFAULTS, parsed.global || {}),

                    profiles: (parsed.profiles && typeof parsed.profiles === 'object') ? parsed.profiles : {},

                    disabledBuiltins: (parsed.disabledBuiltins && typeof parsed.disabledBuiltins === 'object') ? parsed.disabledBuiltins : {},

                    macros: (parsed.macros && typeof parsed.macros === 'object') ? parsed.macros : {},

                    learnedSites: (parsed.learnedSites && typeof parsed.learnedSites === 'object') ? parsed.learnedSites : {},

                    siteTricks: (parsed.siteTricks && typeof parsed.siteTricks === 'object') ? parsed.siteTricks : {},

                    recipes: sanitizeRecipes(parsed.recipes)

                };

            }

            return { global: Object.assign({}, DEFAULTS, parsed || {}), profiles: {}, disabledBuiltins: {}, macros: {}, learnedSites: {}, siteTricks: {}, recipes: {} };

        }

        function pickProfile(s) {

            const p = {};

            PROFILE_KEYS.forEach(k => { p[k] = s[k]; });

            return p;

        }

        let store = normalizeStore(savedStr);

        function isLearnedSite() { return !!(store.learnedSites && store.learnedSites[SITE_KEY]); }

        let activeProfile = !!(store.profiles && store.profiles[SITE_KEY]);

        let builtinSuggest = !activeProfile && !!BUILTIN_SITE_PROFILES[SITE_KEY] && !(store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]);

        let remoteSuggest = !activeProfile && !builtinSuggest && !!REMOTE_PROFILES[SITE_KEY] && !(store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]);

        let learnedSuggest = !activeProfile && !builtinSuggest && !remoteSuggest && isLearnedSite() && !(store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]);

        let suggestedProfile = builtinSuggest || remoteSuggest || learnedSuggest;

        const suggestedData = builtinSuggest ? BUILTIN_SITE_PROFILES[SITE_KEY] : (remoteSuggest ? Object.assign({}, LEARNED_PROFILE, REMOTE_PROFILES[SITE_KEY]) : (learnedSuggest ? LEARNED_PROFILE : {}));

        let S = Object.assign({}, DEFAULTS, store.global, suggestedProfile ? suggestedData : {}, activeProfile ? store.profiles[SITE_KEY] : {});

        if (activeProfile && store.profiles[SITE_KEY] && !Object.prototype.hasOwnProperty.call(store.profiles[SITE_KEY], 'autoFlowSkip') && BUILTIN_SITE_PROFILES[SITE_KEY]) {

            S.autoFlowSkip = !!BUILTIN_SITE_PROFILES[SITE_KEY].autoFlowSkip;

        }

        S.smartVerifyFlow = false;

        S.waitUntilTimerMoves = false;

        function saveStore() {

            window.dispatchEvent(new CustomEvent('TH_SAVE_GLOBAL', { detail: JSON.parse(JSON.stringify(store)) }));

        }

        let recipesDirty = false;

        let recipeSaveTimer = null;

        function flushRecipeStore() {

            if (!recipesDirty) return;

            recipesDirty = false;

            if (recipeSaveTimer) {

                (window.th_nativeClearTimeout || clearTimeout)(recipeSaveTimer);

                recipeSaveTimer = null;

            }

            saveStore();

        }

        function markRecipesDirty() {

            recipesDirty = true;

            if (recipeSaveTimer) return;

            recipeSaveTimer = (window.th_nativeSetTimeout || setTimeout)(flushRecipeStore, 10000);

        }

        window.addEventListener('pagehide', flushRecipeStore);

        function saveGlobalFromS() {

            store.global = Object.assign({}, store.global, S);

            saveStore();

        }

        function saveUiState() {

            store.global = Object.assign({}, store.global, {

                menuLeft: S.menuLeft,

                menuTop: S.menuTop,

                menuExpanded: S.menuExpanded

            });

            saveStore();

        }

        function refreshLiveFlags(s) {

            window.th_masterEnabled = !!s.enabled;

            window.th_skipTimersWanted = !!s.skipTimers;

            window.th_smart_gate_armed = true;

            window.th_gate_boost_armed = true;

            window.th_skipTimersEnabled = !!s.skipTimers;

        }

        function setS(s) {

            refreshLiveFlags(s);

            if (suggestedProfile || activeProfile) saveSiteProfile();

            else if (!activeProfile) saveGlobalFromS();

        }

        function saveSiteProfile() {

            store.profiles = store.profiles || {};

            store.profiles[SITE_KEY] = pickProfile(S);

            if (store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]) delete store.disabledBuiltins[SITE_KEY];

            activeProfile = true;

            suggestedProfile = false;

            saveStore();

        }

        function useGlobalProfile() {

            if (store.profiles && store.profiles[SITE_KEY]) delete store.profiles[SITE_KEY];

            store.disabledBuiltins = store.disabledBuiltins || {};

            store.disabledBuiltins[SITE_KEY] = true;

            activeProfile = false;

            suggestedProfile = false;

            S = Object.assign(S, DEFAULTS, store.global);

            refreshLiveFlags(S);

            saveStore();

        }

        function isLearnableSite() {

            return !!SITE_KEY && SITE_KEY !== 'unknown-site' && SITE_KEY !== 'local-file' && !BUILTIN_SITE_PROFILES[SITE_KEY];

        }

        function learnedSiteCount() {

            return store.learnedSites ? Object.keys(store.learnedSites).length : 0;

        }

        function learnCurrentSite(reason) {

            if (!isLearnableSite()) return false;

            store.learnedSites = store.learnedSites || {};

            const existing = store.learnedSites[SITE_KEY];

            store.learnedSites[SITE_KEY] = {

                reason: reason || (existing && existing.reason) || 'auto',

                hits: ((existing && existing.hits) || 0) + 1,

                ts: Math.floor(Date.now())

            };

            if (store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]) delete store.disabledBuiltins[SITE_KEY];

            saveStore();

            return true;

        }

        function forgetCurrentSite() {

            let changed = false;

            if (store.learnedSites && store.learnedSites[SITE_KEY]) { delete store.learnedSites[SITE_KEY]; changed = true; }

            if (store.profiles && store.profiles[SITE_KEY]) { delete store.profiles[SITE_KEY]; changed = true; activeProfile = false; }

            store.disabledBuiltins = store.disabledBuiltins || {};

            store.disabledBuiltins[SITE_KEY] = true;

            suggestedProfile = false;

            S = Object.assign(S, DEFAULTS, store.global);

            refreshLiveFlags(S);

            saveStore();

            return changed;

        }

        // Manual "Add This Site": save a strong per-site profile AND remember it for the learned list.

        function addSiteProfileManually() {

            if (!isLearnableSite() && !BUILTIN_SITE_PROFILES[SITE_KEY]) return false;

            S = Object.assign(S, LEARNED_PROFILE);

            learnCurrentSite('manual');

            saveSiteProfile();

            refreshLiveFlags(S);

            return true;

        }

        // Auto-learn during runtime: called when universal/flow logic confidently advances an unknown page.

        let th_autoLearnArmed = !activeProfile && !builtinSuggest;

        function autoLearnIfNew(reason) {

            if (!th_autoLearnArmed || !isLearnableSite()) return;

            if (store.learnedSites && store.learnedSites[SITE_KEY]) { th_autoLearnArmed = false; return; }

            if (learnCurrentSite(reason || 'auto')) th_autoLearnArmed = false;

        }

        // Per-site trick learning: remember whether this site needed FORCE (stuck) or flowed normally as a TIMER,

        // so next visit can act faster (lower the stuck threshold on known force-sites).

        function getSiteTrick() {

            return (store.siteTricks && store.siteTricks[SITE_KEY]) || '';

        }

        function recordSiteTrick(trick) {

            if (!SITE_KEY || SITE_KEY === 'unknown-site' || SITE_KEY === 'local-file') return;

            store.siteTricks = store.siteTricks || {};

            if (store.siteTricks[SITE_KEY] === trick) return;

            store.siteTricks[SITE_KEY] = trick;

            saveStore();

        }

        function getStuckThreshold() {

            return getSiteTrick() === 'force' ? 3 : 8;

        }

        window.isProActive = false;

        window.proEngineInitialized = false;

        window.th_masterEnabled = !!S.enabled;

        window.th_skipTimersWanted = !!S.skipTimers;

        window.th_smart_gate_armed = true;

        window.th_gate_boost_armed = true;

        window.th_skipTimersEnabled = !!S.skipTimers;

        window.th_flowManualMode = false;

        window.th_timer_last_value = null;

        window.th_timer_observed_value = null;

        window.th_timer_moving_since = 0;

        window.th_gate_clicked = false;

        window.th_gate_status = 'Macro: idle';

        window.th_auto_executed = false; // 🔥 Global Lock for current target

        window.th_auto_target_key = '';

        window.th_verify_aggro_until = 0;

        // --- ENGINE 1: V8.0 (Fast Engine) ---

        function hookLogic(initialSpeed, S_enabled, S_skipTimers, S_smartFlow, S_waitUntilMoving, S_aggro, S_video) {

            window.pankajSpeed = initialSpeed;

            window.th_masterEnabled = !!S_enabled;

            window.th_skipTimersWanted = !!S_skipTimers;

            window.th_smart_gate_armed = true;

            window.th_gate_boost_armed = true;

            window.th_skipTimersEnabled = !!S_skipTimers;

            const makeNative = (func, name) => { try { func.toString = () => `function ${name}() { [native code] }`; } catch(e){} };

            const isCloudflare = () => Array.from(document.querySelectorAll('*')).some(el => {

                if (!el || !el.textContent || el.textContent.length > 500) return false;

                const t = el.textContent.toLowerCase(); return t.includes("checking") || t.includes("cloudflare");

            });

            const origSetInterval = window.setInterval;

            const origSetTimeout = window.setTimeout;

            const origDateNow = Date.now;

            window.th_nativeSetTimeout = origSetTimeout;

            let timeAppDate = origDateNow(); let lastTickDate = origDateNow();

            const isSafeCountdownPage = () => {

                try {

                    if (window.th_safeCountdownDetected) return true;

                    const hasTpGate = !!(document.getElementById('tpForm') && document.getElementById('tp98') && document.getElementById('tp-time'));

                    const hasDarkGurujiGate = !!(document.getElementById('tp-time') && (document.getElementById('tp-snp2') || document.getElementById('tp-generate') || document.getElementById('tp-wait1')));

                    const hasStartupGate = !!((document.getElementById('ce-time') || document.getElementById('link1s-time') || document.getElementById('countdown')) && (document.getElementById('btn6') || document.getElementById('btn7') || document.getElementById('startCountdownBtn') || document.getElementById('cross-snp2')));

                    const hasVpLinkGate = location.hostname === 'vplink.in' && !!(document.getElementById('get-link') || document.getElementById('gt-link') || document.getElementById('go-link'));

                    if (hasTpGate || hasDarkGurujiGate || hasStartupGate || hasVpLinkGate) return true;

                    const body = (document.body && document.body.innerText || '').toLowerCase();

                    return /\bplease\s+wait\s+\d{1,3}\s*seconds?\b/.test(body) && !!document.querySelector('form[name="tp"], #tpForm, #tp98, #tp-snp2, #tp-generate, #btn6, #btn7, #startCountdownBtn, #cross-snp2');

                } catch(e) { return false; }

            };

            const getSpeedToUse = (kind) => {

                if (window.th_captcha_present) return 1;

                if (!(window.th_masterEnabled && window.th_skipTimersEnabled && !window.isProActive && !isCloudflare())) return 1;

                if (window.th_flowManualMode && isSafeCountdownPage()) return 1;

                if (kind === 'date' && isSafeCountdownPage()) return 1;

                return window.pankajSpeed;

            };

            window.setTimeout = function(cb, delay, ...args) {

                let speedToUse = getSpeedToUse('timeout');

                return origSetTimeout(cb, delay / speedToUse, ...args);

            };

            window.setInterval = function(cb, interval, ...args) {

                let speedToUse = getSpeedToUse('interval');

                return origSetInterval(cb, interval / speedToUse, ...args);

            };

            Date.now = function() {

                let now = origDateNow(); let delta = now - lastTickDate; lastTickDate = now;

                let speedToUse = getSpeedToUse('date');

                timeAppDate += (delta * speedToUse); return Math.floor(timeAppDate);

            };

            // Hook performance.now() with the SAME speed factor as Date.now, so requestAnimationFrame / perf-based

            // countdowns also fast-forward, and Date.now vs performance.now stay consistent (avoids tamper detection).

            try {

                const perf = window.performance;

                const origPerfNow = (perf && typeof perf.now === 'function') ? perf.now.bind(perf) : null;

                if (origPerfNow) {

                    let timeAppPerf = origPerfNow(); let lastTickPerf = origPerfNow();

                    perf.now = function() {

                        let now = origPerfNow(); let delta = now - lastTickPerf; lastTickPerf = now;

                        let speedToUse = getSpeedToUse('date');

                        timeAppPerf += (delta * speedToUse); return timeAppPerf;

                    };

                    makeNative(perf.now, 'now');

                }

            } catch(e) {}

            makeNative(window.setTimeout, 'setTimeout'); makeNative(window.setInterval, 'setInterval'); makeNative(Date.now, 'now');

        }

        try {

            const script = document.createElement('script');

            script.textContent = `(${hookLogic.toString()})(${S.speed}, ${S.enabled}, ${S.skipTimers}, ${S.smartVerifyFlow}, ${S.waitUntilTimerMoves}, ${S.aggroBypass}, ${S.videoSpeed});`;

            (document.head || document.documentElement).appendChild(script);

            script.remove();

        } catch (e) { hookLogic(S.speed, S.enabled, S.skipTimers, S.smartVerifyFlow, S.waitUntilTimerMoves, S.aggroBypass, S.videoSpeed); }

        // --- PRO ENGINE LIVE INJECTION ---

        function initProEngine(initialSpeed) {

            window.isDOMLoaded = true; window.isDOMRendered = true;

            ~function (global) {

                var helper = function (eHookContext, timerContext, util) {

                    return {

                        applyUI: function () {},

                        applyGlobalAction: function (timer) {

                            global.setPankajProSpeed = function(speedMultiplier) { if (timer) timer.change(speedMultiplier > 0 ? 1 / speedMultiplier : 1); };

                        },

                        applyHooking: function () {

                            var _this = this;

                            eHookContext.hookReplace(window, 'setInterval', function (s) { return _this.getHookedTimerFunction('interval', s); });

                            eHookContext.hookReplace(window, 'setTimeout', function (s) { return _this.getHookedTimerFunction('timeout', s) });

                            eHookContext.hookBefore(window, 'clearInterval', function (m, a) { _this.redirectNewestId(a); });

                            eHookContext.hookBefore(window, 'clearTimeout', function (m, a) { _this.redirectNewestId(a); });

                            eHookContext.hookClass(window, 'Date', this.getHookedDateConstructor(), '_innerDate', ['now']);

                            timerContext._mDate = window.Date;

                        },

                        getHookedDateConstructor: function () { return function() { Object.defineProperty(this, '_innerDate', { value: new timerContext._Date(arguments.length ? arguments[0] : timerContext._Date.now()), writable: false }); }; },

                        getHookedTimerFunction: function (t, o) { return function() { arguments[1] *= timerContext._percentage; return o.apply(window, arguments); }; },

                        redirectNewestId: function (a) {}, registerShortcutKeys: function (t) {}, percentageChangeHandler: function (p) {}, hookShadowRoot: function () {}, hookDefine: function () {}, hookDefineDetails: function (t, k, o) { return [t, k, o]; }, suppressEvent: function (e, n) {}, changePlaybackRate: function (e, r) {}

                    }

                };

                var generate = function () { return function (u) { var ehc = this; var th = { _intervalIds: {}, _timeoutIds: {}, _auoUniqueId: 1, __percentage: 1.0/initialSpeed, _setInterval: window['setInterval'], _clearInterval: window['clearInterval'], _clearTimeout: window['clearTimeout'], _setTimeout: window['setTimeout'], _Date: window['Date'], __lastDatetime: new Date().getTime(), __lastMDatetime: new Date().getTime(), init: function () { var tc = this; var h = helper(ehc, tc, u); h.applyHooking(); Object.defineProperty(tc, '_percentage', { get: function () { return tc.__percentage; }, set: function (p) { tc.__percentage = p; return p; } }); h.applyGlobalAction(tc); }, change: function (p) { this._percentage = p; } }; th.init(); return th; } };

                if (global.eHook) { global.eHook.plugins({ name: 'timer', mount: generate() }); }

                else {

                    var s = document.createElement('script'); s.src = "https://greasyfork.org/scripts/372672-everything-hook/code/Everything-Hook.js";

                    s.onload = function() { global.eHook.plugins({ name: 'timer', mount: generate() }); };

                    document.documentElement.appendChild(s);

                }

            }(window);

            window.proEngineInitialized = true;

        }

        // --- PANKAJ UI ---

        function createFloatingMenu() {

            if (document.getElementById("th-panel-root")) return;

            const container = document.createElement("div"); container.id = "th-panel-root";

            let pos = (S.menuLeft && S.menuTop) ? `left: ${S.menuLeft}; top: ${S.menuTop};` : `right: 20px; top: 20px;`;

            container.style.cssText = `position: fixed; z-index: 2147483647; user-select: none; touch-action: none; ${pos}`;

            document.body.appendChild(container);

            const shadow = container.attachShadow({ mode: 'open' });

            const panel = document.createElement("div");

            panel.style.cssText = "width: 270px; background: rgba(15,15,20,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-family: 'Segoe UI', sans-serif; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); backdrop-filter: blur(8px); font-size: 13px;";

            panel.innerHTML = `

                <div id="th-header" style="display:flex; justify-content:space-between; align-items:center; cursor:grab; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-bottom:10px;">

                    <span style="font-weight:900; background:linear-gradient(90deg,#00ffcc,#00a8ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; font-size:14px;">⚡ Time Hooker V51.0</span>

                    <button id="th-toggle-btn" style="all:unset; cursor:pointer; background:rgba(255,255,255,0.15); border-radius:6px; padding:2px 10px;">${S.menuExpanded ? '−' : '+'}</button>

                </div>

                <div id="th-content" style="display:${S.menuExpanded ? 'flex' : 'none'}; flex-direction:column; gap:8px;">

                    <button id="th-master-btn" style="all:unset; cursor:pointer; text-align:center; border-radius:8px; padding:10px; font-weight:900; letter-spacing:0; background:${S.enabled ? 'linear-gradient(90deg,#00c781,#00a8ff)' : 'linear-gradient(90deg,#444,#222)'}; color:white; border:1px solid rgba(255,255,255,0.18);">${S.enabled ? 'SCRIPT ON' : 'SCRIPT OFF'}</button>

                    <div id="th-gate-status" style="font-size:11px; color:#9ee9ff; background:rgba(0,255,204,0.08); border:1px solid rgba(0,255,204,0.22); border-radius:6px; padding:6px 8px; text-align:center; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.th_gate_status || 'Idle'}</div>

                    <div id="th-profile-status" style="font-size:10px; color:#8a93a6; text-align:center;">Profile: ${activeProfile ? 'this site' : (suggestedProfile ? (builtinSuggest ? 'built-in' : (remoteSuggest ? 'remote' : 'learned')) : 'global')} · ${SITE_KEY}</div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">

                        <button id="th-add-site" style="all:unset; cursor:pointer; text-align:center; background:linear-gradient(90deg,#00c781,#00a8ff); color:#fff; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">➕ Add Site</button>

                        <button id="th-forget-site" style="all:unset; cursor:pointer; text-align:center; background:#3a2230; color:#ff9bb3; border:1px solid #5a2a3c; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">🗑 Forget</button>

                    </div>

                    <div id="th-learned-count" style="font-size:10px; color:#8a93a6; text-align:center;">Learned sites: ${learnedSiteCount()}</div>

                    <button id="th-force-skip" style="all:unset; cursor:pointer; text-align:center; border-radius:8px; padding:9px; font-weight:900; letter-spacing:0.5px; background:linear-gradient(90deg,#ff7a18,#ffd200); color:#1a1a1a; border:1px solid rgba(255,255,255,0.18);">⚡ FORCE SKIP NOW</button>

                    <label style="display:flex; gap:8px; cursor:pointer;"><input type="checkbox" id="t-skip" ${S.skipTimers?'checked':''}><span style="color:#00ffcc; font-weight:bold;">[✓] Fast-Forward Timers</span></label>

                    <div style="margin-top:4px;"><div style="display:flex; justify-content:space-between; font-size:12px; color:#ccc;"><span>Timer Speed</span><span id="t-speed-label">${S.speed}x</span></div><input type="range" id="t-speed" min="1" max="50" value="${S.speed}" style="width:100%; accent-color:#00ffcc;"></div>

                    <label><input type="checkbox" id="t-video" ${S.videoSpeed?'checked':''}> Video Fast Forward</label>

                    <label><input type="checkbox" id="t-aggro" ${S.aggroBypass?'checked':''}> Aggro Bypass</label>

                    <label><input type="checkbox" id="t-antiad" ${S.antiAdblock?'checked':''}> Kill Ad Overlays</label>


                    <label style="color:#9ee9ff; font-weight:bold;"><input type="checkbox" id="t-flow" ${S.autoFlowSkip?'checked':''}> Auto Flow Skip</label>

                    <label style="color:#ffd58a; font-weight:bold;"><input type="checkbox" id="t-universal" ${S.universalFlow?'checked':''}> Universal Pattern Mode</label>

                    <label><input type="checkbox" id="t-highlight" ${S.highlight?'checked':''}> Highlight Original</label>

                    <label><input type="checkbox" id="t-pin" ${S.pinMode?'checked':''}> Pin Fake Button</label>

                    <input type="range" id="t-pos" min="0" max="400" value="${S.topOffset}" style="width:100%; accent-color:#00ffcc;">


                </div>

            `;

            shadow.appendChild(panel);

            const $ = (id) => shadow.getElementById(id);

            $("th-toggle-btn").onclick = () => { let h = $("th-content").style.display === "none"; $("th-content").style.display = h ? "flex" : "none"; $("th-toggle-btn").textContent = h ? "−" : "+"; S.menuExpanded = h; saveUiState(); };

            const paintMaster = () => {

                const b = $("th-master-btn");

                b.textContent = S.enabled ? "SCRIPT ON" : "SCRIPT OFF";

                b.style.background = S.enabled ? "linear-gradient(90deg,#00c781,#00a8ff)" : "linear-gradient(90deg,#444,#222)";

            };

            const paintProfile = () => {

                const status = $("th-profile-status");

                if (status) status.textContent = `Profile: ${activeProfile ? 'this site' : (suggestedProfile ? (builtinSuggest ? 'built-in' : (remoteSuggest ? 'remote' : 'learned')) : 'global')} · ${SITE_KEY}`;

                const lc = $("th-learned-count");

                if (lc) lc.textContent = "Learned sites: " + learnedSiteCount();

                const useGlobal = $("th-use-global");

                if (useGlobal) useGlobal.style.opacity = activeProfile ? "1" : "0.55";

            };

            $("th-master-btn").onclick = () => {

                S.enabled = !S.enabled;

                if (!S.enabled) {

                    window.isProActive = false;

                    if (window.setPankajProSpeed) window.setPankajProSpeed(0);

                    document.querySelectorAll('video, audio').forEach(m => { try { m.playbackRate = 1; } catch(e) {} });

                    const proxy = document.getElementById("th-proxy-btn");

                    if (proxy) proxy.style.display = "none";

                }

                setS(S);

                paintMaster();

                paintProfile();

            };

            const saveSiteBtn = $("th-save-site");

            if (saveSiteBtn) saveSiteBtn.onclick = () => {

                saveSiteProfile();

                paintProfile();

            };

            const useGlobalBtn = $("th-use-global");

            if (useGlobalBtn) useGlobalBtn.onclick = () => {

                useGlobalProfile();

                refreshControls();

                paintMaster();

                paintProfile();

            };

            const addSiteBtn = $("th-add-site");

            if (addSiteBtn) addSiteBtn.onclick = () => {

                if (addSiteProfileManually()) {

                    refreshControls();

                    paintMaster();

                    paintProfile();

                    window.th_gate_status = "Saved this site ✓";

                } else {

                    window.th_gate_status = "Cannot add this page";

                }

            };

            const forgetBtn = $("th-forget-site");

            if (forgetBtn) forgetBtn.onclick = () => {

                forgetCurrentSite();

                refreshControls();

                paintMaster();

                paintProfile();

                window.th_gate_status = "Forgot this site";

            };

            const forceBtn = $("th-force-skip");

            if (forceBtn) forceBtn.onclick = () => {

                try {

                    if (!S.enabled) { S.enabled = true; setS(S); paintMaster(); }

                    window.th_gate_status = "Force skip…";

                    // 1) zero out any standalone visible countdown number (0-180)

                    Array.from(document.querySelectorAll('span,div,b,strong,p,h1,h2,h3,td,#tp-time,#ce-time,#link1s-time,#timer,#countdown')).slice(0, 500).forEach(el => {

                        if (isOwnUi(el) || el.children.length !== 0) return;

                        const t = (el.textContent || '').trim();

                        if (/^\d{1,3}$/.test(t) && parseInt(t, 10) <= 180) { try { el.textContent = '0'; } catch(e){} }

                    });

                    // 2) finish a recognised gate (reveals/zeros its own elements)

                    const st = getSafeCountdownState();

                    if (st && st.detected) finishSafeCountdown(st);

                    // 3) reveal + click the best continue/get-link target; keep final/Telegram links manual

                    const target = getFlowReadyTarget() || findBestActionTarget();

                    if (target) {

                        revealFlowElement(target);

                        if (isFinalVplinkTarget(target) || isTelegramHref(target.href || '')) {

                            if (S.highlight) target.style.setProperty('outline', '4px solid #00ffcc', 'important');

                            window.th_gate_status = "Final link ready — tap it";

                        } else {

                            simulateClick(target);

                            window.th_gate_status = "Force: clicked " + (getTargetLabel(target) || '').slice(0, 22);

                        }

                    } else {

                        // No clickable target — scan the page code for a hidden next-URL and go there.

                        const scannedNext = (getDeepScanAutoTarget() || (scanPageForNextUrl()[0] || ''));

                        if (scannedNext) { window.th_gate_status = "Force: next link →"; location.href = scannedNext; }

                        else window.th_gate_status = "Force: no target found";

                    }

                } catch(e) { window.th_gate_status = "Force skip error"; }

            };



            let isD = false, sx, sy, ix, iy;

            const getPoint = (e) => {

                const t = e.touches && e.touches[0];

                return { x: t ? t.clientX : e.clientX, y: t ? t.clientY : e.clientY };

            };

            const startDrag = (e) => {

                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

                const p = getPoint(e);

                isD = true; sx = p.x; sy = p.y; ix = container.offsetLeft; iy = container.offsetTop; container.style.right = 'auto';

                if (e.cancelable) e.preventDefault();

            };

            const moveDrag = (e) => {

                if (!isD) return;

                const p = getPoint(e);

                container.style.left = (ix + (p.x - sx)) + 'px';

                container.style.top = (iy + (p.y - sy)) + 'px';

                if (e.cancelable) e.preventDefault();

            };

            const endDrag = () => { if(isD){ isD=false; S.menuLeft=container.style.left; S.menuTop=container.style.top; saveUiState(); } };

            $("th-header").addEventListener("mousedown", startDrag);

            $("th-header").addEventListener("touchstart", startDrag, { passive: false });

            document.addEventListener("mousemove", moveDrag);

            document.addEventListener("touchmove", moveDrag, { passive: false });

            document.addEventListener("mouseup", endDrag);

            document.addEventListener("touchend", endDrag);

            const bind = (id, key) => { $(id).onchange = (e) => { S[key] = e.target.checked; setS(S); if (key === 'aggroBypass' && S[key]) window.th_live_aggro_request = Date.now(); }; };

            bind("t-skip", "skipTimers"); bind("t-aggro", "aggroBypass"); bind("t-video", "videoSpeed"); bind("t-antiad", "antiAdblock"); bind("t-flow", "autoFlowSkip"); bind("t-universal", "universalFlow"); bind("t-highlight", "highlight"); bind("t-pin", "pinMode");

            $("t-speed").oninput = (e) => { S.speed = e.target.value; setS(S); window.pankajSpeed = parseFloat(S.speed); const lab = $("t-speed-label"); if (lab) lab.textContent = S.speed + "x"; if (window.isProActive && window.setPankajProSpeed) window.setPankajProSpeed(parseFloat(S.speed)); };

            $("t-pos").oninput = (e) => { S.topOffset = e.target.value; setS(S); };

            shadow.querySelectorAll('.pro-btn').forEach(btn => {

                btn.onclick = (e) => {

                    let v = parseInt(e.target.getAttribute('data-val'));

                    if (!S.enabled && v !== 0) { S.enabled = true; setS(S); paintMaster(); }

                    if (v === 0) { window.isProActive = false; if(window.setPankajProSpeed) window.setPankajProSpeed(0); }

                    else { window.isProActive = true; if(!window.proEngineInitialized) initProEngine(v); else if(window.setPankajProSpeed) window.setPankajProSpeed(v); }

                };

            });

            function refreshControls() {

                $("t-skip").checked = !!S.skipTimers;

                $("t-aggro").checked = !!S.aggroBypass;

                $("t-video").checked = !!S.videoSpeed;

                $("t-antiad").checked = !!S.antiAdblock;

                $("t-flow").checked = !!S.autoFlowSkip;

                $("t-universal").checked = !!S.universalFlow;

                $("t-highlight").checked = !!S.highlight;

                $("t-pin").checked = !!S.pinMode;

                $("t-speed").value = S.speed;

                const lab = $("t-speed-label"); if (lab) lab.textContent = S.speed + "x";

                $("t-pos").value = S.topOffset;

                window.pankajSpeed = parseFloat(S.speed);

            }

            paintProfile();

            setInterval(() => {

                const status = $("th-gate-status");

                if (status) {

                    const brain = window.th_page_brain;

                    const idle = !window.th_gate_status || window.th_gate_status === 'Macro: idle';

                    status.textContent = idle && brain ? ('BRAIN: ' + brain.state + ' — ' + brain.reason) : (window.th_gate_status || 'BRAIN: observing page');

                    status.title = brain ? (brain.state + ': ' + brain.reason + (brain.target ? (' → ' + brain.target) : '')) : '';

                }

            }, 1000);

        }

        if (!isIframe) {

            if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createFloatingMenu); else createFloatingMenu();

            // Self-healing panel: shortlink/timer pages often rebuild <body> or wipe the DOM, which removes the menu.

            // Re-inject it instantly (MutationObserver) and via a periodic safety net, and keep it on top.

            const ensurePanel = () => {

                try {

                    if (!document.body) return;

                    const root = document.getElementById("th-panel-root");

                    if (!root || !document.documentElement.contains(root)) { createFloatingMenu(); return; }

                    if (root.style.zIndex !== "2147483647") root.style.zIndex = "2147483647";

                } catch(e) {}

            };

            try {

                let pending = false;

                const mo = new MutationObserver(() => {

                    if (pending) return;

                    pending = true;

                    (window.th_nativeSetTimeout || setTimeout)(() => { pending = false; ensurePanel(); }, 150);

                });

                const startObserver = () => { try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch(e) {} };

                if (document.documentElement) startObserver(); else document.addEventListener("DOMContentLoaded", startObserver);

            } catch(e) {}

            setInterval(ensurePanel, 1500);

        }

        // --- CLICKER LOGIC ---

        function simulateClick(el) {

            if (!el) return;

            ['pointerdown','mousedown','mouseup','pointerup'].forEach(ev => el.dispatchEvent(new PointerEvent(ev, { bubbles: true, cancelable: true, view: window })));

            el.click();

        }

        function isAutoFlowHost() {

            return /(^|\.)((vplink\.in)|(vacancymode\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(location.hostname);

        }

        function shouldAutoFlow() {

            // Auto Click Target was merged into Auto Flow Skip — one toggle now drives both.

            return !!(S.enabled && (S.autoClick || S.autoFlowSkip));

        }

        function shouldSkipFlow() {

            return !!(S.enabled && S.autoFlowSkip);

        }

        function isTelegramHref(href) {

            return /^https?:\/\/(t\.me|telegram\.me)\//i.test(href || '');

        }

        function isFinalVplinkTarget(el) {

            if (!el || location.hostname !== 'vplink.in') return false;

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            return !!(/^(get-link|gt-link)$/i.test(el.id || '') || isTelegramHref(href));

        }

        function clickFlowTarget(el, manualFinal) {

            if (!el) return;

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            if ((isFinalVplinkTarget(el) || isTelegramHref(href)) && !manualFinal) {

                window.th_gate_status = 'Final link ready: manual click';

                return;

            }

            if ((isTelegramHref(href) && manualFinal) || (location.hostname === 'vplink.in' && /get-?link|gt-link/i.test(el.id || '') && href)) {

                location.href = href;

                return;

            }

            simulateClick(el);

        }

        function clickIntermediateFlowTarget(el) {

            if (!el) return false;

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            if (isTelegramHref(href) || isFinalVplinkTarget(el)) {

                window.th_gate_status = 'Final link ready: manual click';

                return false;

            }

            clickFlowTarget(el, false);

            return true;

        }

        function getTargetKey(el) {

            if (!el) return '';

            const text = (el.innerText || el.value || el.textContent || '').toLowerCase().trim().slice(0, 80);

            const href = el.href || el.action || '';

            return [el.tagName, el.id || '', el.className || '', href, text].join('|');

        }

        const INVALID_TARGET_TEXT = ['click on ads', 'please wait', 'generating', 'wait', 'seconds', 'scroll down link is ready', 'join telegram channel', 'join whatsapp channel'];

        const VALID_TARGET_TEXT = ['human veification', 'human verification', 'click to verify', 'click to continue', 'continue', 'get link', 'download link', 'get destination link', 'go to link', 'open link'];

        window.th_click_cooldowns = window.th_click_cooldowns || {};

        const macroState = { recording: false, playing: false, steps: [], startedAt: 0, lastAt: 0 };

        function getSiteMacros() {

            store.macros = store.macros || {};

            return Array.isArray(store.macros[SITE_KEY]) ? store.macros[SITE_KEY] : [];

        }

        function setSiteMacros(macros) {

            store.macros = store.macros || {};

            store.macros[SITE_KEY] = macros;

            saveStore();

        }

        function isTimeHookerUi(el) {

            return !!(el && el.closest && el.closest('#th-panel-root, #th-proxy-btn, #th-dns-helper'));

        }

        function isVisibleMacroTarget(el) {

            if (!el || isTimeHookerUi(el)) return false;

            const r = el.getBoundingClientRect();

            const style = getComputedStyle(el);

            return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0.05;

        }

        function getActionText(el) {

            return (el && (el.innerText || el.value || el.textContent) || '').replace(/\s+/g, ' ').trim();

        }

        function getTargetLabel(el) {

            const text = getActionText(el);

            if (text) return text;

            if (el && el.tagName === 'IMG') return (el.alt || el.title || 'image').replace(/\s+/g, ' ').trim();

            return el && el.tagName ? el.tagName.toLowerCase() : 'target';

        }

        function visibleById(id) {

            const el = document.getElementById(id);

            return el && isVisibleAction(el) && !isDisabledAction(el) ? el : null;

        }

        function getFlowReadyTarget() {

            const priority = [

                'get-link',

                'gt-link',

                'btn7',

                'cross-snp2',

                'tp98',

                'tp-snp2',

                'btn6',

                'startCountdownBtn'

            ];

            for (const id of priority) {

                const el = visibleById(id);

                if (!el) continue;

                const text = getActionText(el).toLowerCase();

                const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

                if (id === 'startCountdownBtn' && !text.includes('verify') && !text.includes('click')) continue;

                if ((id === 'get-link' || id === 'gt-link') && !href) continue;

                return el;

            }

            return null;

        }

        function getSafeCountdownState() {

            const form = document.getElementById('tpForm') || document.querySelector('form[name="tp"]');

            const btn = getFlowReadyTarget() || document.getElementById('tp98') || document.getElementById('tp-snp2') || document.getElementById('btn6') || document.getElementById('startCountdownBtn') || document.getElementById('cross-snp2') || document.getElementById('btn7');

            const timerEl = document.getElementById('tp-time') || document.getElementById('ce-time') || document.getElementById('link1s-time') || document.getElementById('timer');

            const bodyText = (document.body && document.body.innerText || '').replace(/\s+/g, ' ').toLowerCase();

            const hasTextGate = /\bplease\s+wait\s+\d{1,3}\s*seconds?\b/.test(bodyText);

            const hasDarkGurujiGate = !!(timerEl && (document.getElementById('tp-snp2') || document.getElementById('tp-generate') || document.getElementById('tp-wait1')));

            const hasStartupGate = !!(timerEl && (document.getElementById('btn6') || document.getElementById('btn7') || document.getElementById('startCountdownBtn') || document.getElementById('cross-snp2') || document.getElementById('countdown')));

            const hasVpLinkGate = location.hostname === 'vplink.in' && !!(document.getElementById('get-link') || document.getElementById('gt-link') || document.getElementById('go-link'));

            const detected = !!(S.safeCountdownMode && ((form && btn && timerEl) || hasDarkGurujiGate || hasStartupGate || hasVpLinkGate || (hasTextGate && (form || btn))));

            if (detected) window.th_safeCountdownDetected = true;

            const timerValue = timerEl ? parseInt((timerEl.textContent || '').replace(/[^\d-]/g, ''), 10) : parseVisibleTimerValue(bodyText);

            const ready = btn && isVisibleAction(btn) && !isDisabledAction(btn) ? btn : null;

            return { detected, form, btn, timerEl, timerValue: Number.isFinite(timerValue) ? timerValue : null, ready };

        }

        function isSafeCountdownPage() {

            return getSafeCountdownState().detected;

        }

        function exposeSafeCountdownTarget(state) {

            if (!state || !state.detected) return;

            if (state.ready) {

                window.th_gate_status = 'Safe timer ready: ' + getTargetLabel(state.ready).slice(0, 40);

                return;

            }

            window.th_gate_status = state.timerValue !== null ? ('Safe timer: ' + state.timerValue + 's fast') : 'Safe timer: waiting';

        }

        function revealSafeReadyButton(el) {

            if (!el) return false;

            const target = (el.closest && el.closest('a')) || el;

            [target, el].forEach(node => {

                if (!node || !node.style) return;

                node.style.setProperty('display', node.tagName === 'A' ? 'inline-block' : 'block', 'important');

                node.style.setProperty('visibility', 'visible', 'important');

                node.style.setProperty('opacity', '1', 'important');

                try { node.removeAttribute('disabled'); node.setAttribute('aria-disabled', 'false'); } catch(e) {}

            });

            return true;

        }

        function finishSafeCountdown(state) {

            if (!state || !state.detected) return false;

            const ready = getFlowReadyTarget();

            if (ready && revealSafeReadyButton(ready)) {

                window.th_gate_status = 'Aggro: ready button shown';

                return true;

            }

            const candidates = ['tp98', 'tp-snp2', 'btn7', 'cross-snp2', 'btn6', 'get-link', 'gt-link'].map(id => document.getElementById(id)).filter(Boolean);

            for (const el of candidates) {

                if (revealSafeReadyButton(el)) {

                    window.th_gate_status = 'Aggro: ' + getTargetLabel(el).slice(0, 36);

                    return true;

                }

            }

            if (state.timerEl) state.timerEl.textContent = '0';

            ['tp-wait1', 'countdown', 'link'].forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'none', 'important'); });

            ['tp-generate'].forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'block', 'important'); });

            window.th_gate_status = 'Aggro: timer finished';

            return true;

        }

        function isManualGateTarget(el, text) {

            if (!text || !isVisibleAction(el) || isDisabledAction(el)) return false;

            if (text.includes('click any image') || text.includes('click any link') || text.includes('click here')) return true;

            if (text.includes('click to verify') && text.length <= 120) return true;

            return false;

        }

        function escCss(value) {

            if (window.CSS && CSS.escape) return CSS.escape(value);

            return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

        }

        function cssPath(el) {

            if (!el || !el.tagName || el === document.body) return '';

            if (el.id && !el.id.includes('th-')) return '#' + escCss(el.id);

            const parts = [];

            let node = el;

            while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {

                let part = node.tagName.toLowerCase();

                const cls = (node.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);

                if (cls.length) part += '.' + cls.map(c => escCss(c)).join('.');

                const parent = node.parentElement;

                if (parent) {

                    const same = Array.from(parent.children).filter(x => x.tagName === node.tagName);

                    if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;

                }

                parts.unshift(part);

                node = parent;

            }

            return parts.join(' > ');

        }

        function buildMacroStep(el, delay) {

            const rect = el.getBoundingClientRect();

            return {

                delay: Math.max(0, Math.round(delay)),

                text: getActionText(el).slice(0, 120),

                tag: (el.tagName || '').toLowerCase(),

                role: el.getAttribute && (el.getAttribute('role') || ''),

                href: el.href || el.action || '',

                id: el.id || '',

                className: (el.className || '').toString().slice(0, 160),

                selector: cssPath(el),

                xPct: Math.round(((rect.left + rect.width / 2) / Math.max(1, window.innerWidth)) * 10000) / 10000,

                yPct: Math.round(((rect.top + rect.height / 2) / Math.max(1, window.innerHeight)) * 10000) / 10000,

                nearby: ((el.closest && el.closest('article, main, section, div')) ? getActionText(el.closest('article, main, section, div')) : '').slice(0, 180)

            };

        }

        function startMacroRecording() {

            macroState.recording = true;

            macroState.playing = false;

            macroState.steps = [];

            macroState.startedAt = Date.now();

            macroState.lastAt = macroState.startedAt;

            window.th_gate_status = 'Recording step 1';

        }

        function stopAndSaveMacro() {

            if (!macroState.recording) {

                window.th_gate_status = 'Macro: not recording';

                return;

            }

            macroState.recording = false;

            if (!macroState.steps.length) {

                window.th_gate_status = 'Macro: no steps saved';

                return;

            }

            const macros = getSiteMacros();

            macros.push({ name: 'Macro ' + new Date().toLocaleTimeString(), createdAt: new Date().toISOString(), steps: macroState.steps.slice() });

            setSiteMacros(macros);

            window.th_gate_status = 'Macro saved: ' + macroState.steps.length + ' steps';

        }

        function deleteSelectedMacro(index) {

            const macros = getSiteMacros();

            if (index < 0 || index >= macros.length) {

                window.th_gate_status = 'Macro: nothing to delete';

                return;

            }

            macros.splice(index, 1);

            setSiteMacros(macros);

            window.th_gate_status = 'Macro deleted';

        }

        document.addEventListener('click', function(e) {

            if (!macroState.recording || macroState.playing || isTimeHookerUi(e.target)) return;

            const now = Date.now();

            macroState.steps.push(buildMacroStep(e.target, now - macroState.lastAt));

            macroState.lastAt = now;

            window.th_gate_status = 'Recording step ' + (macroState.steps.length + 1);

        }, true);

        function scoreMacroCandidate(el, step) {

            if (!el || isTimeHookerUi(el) || !isVisibleMacroTarget(el)) return -1;

            const text = getActionText(el).toLowerCase();

            const stepText = (step.text || '').toLowerCase();

            const rect = el.getBoundingClientRect();

            const cx = (rect.left + rect.width / 2) / Math.max(1, window.innerWidth);

            const cy = (rect.top + rect.height / 2) / Math.max(1, window.innerHeight);

            let score = 0;

            if (step.id && el.id === step.id) score += 1000;

            if (step.href && (el.href || el.action || '') === step.href) score += 800;

            if (step.tag && (el.tagName || '').toLowerCase() === step.tag) score += 250;

            if (step.role && el.getAttribute && el.getAttribute('role') === step.role) score += 150;

            if (stepText && text === stepText) score += 700;

            else if (stepText && text.includes(stepText.slice(0, 40))) score += 350;

            const dx = Math.abs(cx - (step.xPct || 0.5));

            const dy = Math.abs(cy - (step.yPct || 0.5));

            score += Math.max(0, 300 - Math.round((dx + dy) * 600));

            return score;

        }

        function findMacroTarget(step) {

            if (step.selector) {

                try {

                    const found = document.querySelector(step.selector);

                    if (found && scoreMacroCandidate(found, step) > 120) return found;

                } catch(e) {}

            }

            const nodes = Array.from(document.querySelectorAll("a, button, input[type='button'], input[type='submit'], [role='button'], [role='link'], img, [onclick]"));

            return nodes.map(el => ({ el, score: scoreMacroCandidate(el, step) })).filter(x => x.score > 120).sort((a, b) => b.score - a.score)[0]?.el || null;

        }

        function sleep(ms) {

            return new Promise(resolve => (window.th_nativeSetTimeout || setTimeout)(resolve, ms));

        }

        async function playSelectedMacro(index, speed) {

            const macros = getSiteMacros();

            const macro = macros[index];

            if (!macro || !Array.isArray(macro.steps) || !macro.steps.length) {

                window.th_gate_status = 'Macro: select saved macro';

                return;

            }

            macroState.playing = true;

            macroState.recording = false;

            const rate = speed > 0 ? speed : 1;

            for (let i = 0; i < macro.steps.length; i++) {

                const step = macro.steps[i];

                const delay = i === 0 ? Math.max(1200, step.delay || 0) : Math.max(150, Math.round((step.delay || 0) / rate));

                window.th_gate_status = 'Playing step ' + (i + 1) + '/' + macro.steps.length;

                await sleep(delay);

                let target = null;

                for (let tries = 0; tries < 12 && !target; tries++) {

                    target = findMacroTarget(step);

                    if (!target) {

                        window.th_gate_status = 'Waiting for target ' + (i + 1);

                        await sleep(500);

                    }

                }

                if (!target) {

                    window.th_gate_status = 'Step failed: target not found';

                    macroState.playing = false;

                    return;

                }

                simulateClick(target);

            }

            macroState.playing = false;

            window.th_gate_status = 'Macro complete';

        }

        function isVisibleAction(el) {

            if (!el || el.id === "th-proxy-btn" || (el.id || '').includes("th-")) return false;

            if (el === document.body || el === document.documentElement) return false;

            const r = el.getBoundingClientRect();

            return r.width > 0 && r.height > 0 && r.width <= window.innerWidth * 1.05 && r.height <= window.innerHeight * 0.9;

        }

        function isDisabledAction(el) {

            return !!(el.disabled || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' || (el.className || '').toString().toLowerCase().includes('disabled'));

        }

        function isAllowedNextTarget(el, text) {

            if (text !== 'next') return false;

            const host = location.hostname.toLowerCase();

            const href = (el && el.href || '').toLowerCase();

            return /^(sb1|sb2)\.schemepro\.org$/.test(host) && href.includes('lksfy.com');

        }

        function isSchemeProHost() {

            return /^(sb1|sb2)\.schemepro\.org$/i.test(location.hostname);

        }

        function getCookieValue(name) {

            const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));

            return m ? decodeURIComponent(m[1]) : '';

        }

        function setCookieValue(name, value, maxAgeSeconds) {

            document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + String(maxAgeSeconds);

        }

        function deleteCookieValue(name) {

            document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';

        }

        function parseSchemeProStep() {

            if (!isSchemeProHost() || !document.documentElement) return null;

            const html = document.documentElement.innerHTML || '';

            const bodyText = (document.body && document.body.innerText || '').replace(/\s+/g, ' ');

            const stepMatch = bodyText.match(/Step\s*([1-4])\s*\/\s*4/i) || html.match(/Step\s*([1-4])\s*\/\s*4/i);

            const targetMatch = html.match(/tagrget_url\s*=\s*["']([^"']+)["']/i) || html.match(/target_url\s*=\s*["']([^"']+)["']/i);

            if (!stepMatch || !targetMatch) return null;

            let decoded = '';

            try { decoded = atob(targetMatch[1]).trim(); } catch(e) { decoded = ''; }

            if (!/^https?:\/\//i.test(decoded)) return null;

            const step = parseInt(stepMatch[1], 10);

            const alias = getCookieValue('alias') || getCookieValue('ref' + (location.pathname.split('/').filter(Boolean)[0] || '')) || '';

            return { step, target: decoded, alias };

        }

        function getSchemeProSkipKey(info) {

            return 'th_schemepro_skip_' + location.hostname + '_' + location.pathname + '_' + (info ? info.step + '_' + info.target : '');

        }

        function rememberSchemeProStep(info) {

            try {

                const key = 'th_schemepro_trace_' + (info.alias || 'latest');

                const trace = JSON.parse(sessionStorage.getItem(key) || '[]');

                trace.push({ host: location.hostname, step: info.step, from: location.href, to: info.target, at: Date.now() });

                sessionStorage.setItem(key, JSON.stringify(trace.slice(-8)));

            } catch(e) {}

        }

        function maybeSkipSchemeProArticle(proxy) {

            if (!S.enabled || !isSchemeProHost()) return false;

            const info = parseSchemeProStep();

            if (!info) return false;

            const skipKey = getSchemeProSkipKey(info);

            if (sessionStorage.getItem(skipKey) === '1' || window.th_schemepro_skip_pending) return true;

            const current = location.href.replace(/\/$/, '');

            const target = info.target.replace(/\/$/, '');

            if (current === target) return false;

            sessionStorage.setItem(skipKey, '1');

            window.th_schemepro_skip_pending = true;

            rememberSchemeProStep(info);

            if (info.step === 1 || info.step === 3) setCookieValue('user_step', '1', 180);

            else deleteCookieValue('user_step');

            window.th_gate_status = 'SchemePro: skipping step ' + info.step + '/4';

            if (!proxy && S.pinMode && document.body) {

                proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, #5b42f3, #00ddeb); color: white; border-radius: 10px; cursor: pointer;";

                document.body.appendChild(proxy);

            }

            if (S.pinMode && proxy) {

                proxy.innerText = 'SKIP STEP ' + info.step + '/4';

                proxy.style.top = S.topOffset + 'px';

                proxy.style.display = 'block';

            }

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (S.enabled) location.href = info.target;

            }, 350);

            return true;

        }

        function isVplinkChainHost() {

            return /(^|\.)((vplink\.in)|(vacancymode\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(location.hostname);

        }

        function getVplinkAlias() {

            const cleanAlias = value => {

                const alias = String(value || '').trim();

                return /^[A-Za-z0-9_-]{3,80}$/.test(alias) ? alias : '';

            };

            const params = new URLSearchParams(location.search || '');

            const knownParams = ['studiissinsucrnce', 'alias', 'code', 'id', 'slug', 'key'];

            for (let i = 0; i < knownParams.length; i++) {

                const candidate = cleanAlias(params.get(knownParams[i]));

                if (candidate) {

                    try { sessionStorage.setItem('th_vplink_active_alias_v55', candidate); } catch(e) {}

                    return candidate;

                }

            }

            const cookieAlias = cleanAlias(getCookieValue('gt_uc_') || getCookieValue('user_in'));

            if (cookieAlias) {

                try { sessionStorage.setItem('th_vplink_active_alias_v55', cookieAlias); } catch(e) {}

                return cookieAlias;

            }

            const path = cleanAlias(location.pathname.split('/').filter(Boolean).pop() || '');

            if (location.hostname === 'vplink.in' && path) {

                try { sessionStorage.setItem('th_vplink_active_alias_v55', path); } catch(e) {}

                return path;

            }

            try {

                const active = cleanAlias(sessionStorage.getItem('th_vplink_active_alias_v55'));

                if (active) return active;

            } catch(e) {}

            const fallback = [location.hostname, location.pathname].join('|').split('').reduce((hash, ch) => ((hash * 31 + ch.charCodeAt(0)) >>> 0), 2166136261).toString(36);

            return 'page-' + fallback;

        }

        function normalizeFlowUrl(url) {

            try {

                const u = new URL(url, location.href);

                u.hash = '';

                return u.href.replace(/\/$/, '');

            } catch(e) { return ''; }

        }

        function isSafeVplinkFlowUrl(url) {

            try {

                const u = new URL(url, location.href);

                return /(^|\.)((vplink\.in)|(vacancymode\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(u.hostname);

            } catch(e) { return false; }

        }

        function getFlowTraceKey() {

            return 'th_vplink_flow_v55_' + getVplinkAlias();

        }

        function getFlowTrace() {

            try {

                const trace = JSON.parse(sessionStorage.getItem(getFlowTraceKey()) || '[]');

                const cutoff = Date.now() - 5 * 60000;

                return Array.isArray(trace) ? trace.filter(item => item && Number(item.at || 0) >= cutoff) : [];

            } catch(e) { return []; }

        }

        function countFlowVisits(url) {

            const normalized = normalizeFlowUrl(url);

            if (!normalized) return 0;

            const cutoff = Date.now() - 45000;

            return getFlowTrace().filter(item => item && item.to === normalized && Number(item.at || 0) >= cutoff).length;

        }

        function rememberFlowHop(to, label) {

            try {

                const trace = getFlowTrace();

                trace.push({ from: normalizeFlowUrl(location.href), to: normalizeFlowUrl(to), label: label || '', at: Date.now() });

                sessionStorage.setItem(getFlowTraceKey(), JSON.stringify(trace.slice(-14)));

            } catch(e) {}

        }

        const BRAIN_HISTORY_KEY = 'th_page_brain_v54';

        function getServerErrorState() {

            if (!document.body) return null;

            const title = String(document.title || '').toLowerCase();

            const text = (document.body.innerText || document.body.textContent || '').replace(/\s+/g, ' ').toLowerCase().slice(0, 2200);

            const codeMatch = (title + ' ' + text).match(/(?:^|\D)(429|5[0-2][0-9])(?=\D|$)/);

            const allowedCodes = ['429', '500', '502', '503', '504', '520', '521', '522', '523', '524'];

            const code = codeMatch && allowedCodes.includes(codeMatch[1]) ? codeMatch[1] : '';

            const cloudflareHostError = /bad gateway|web server reported|host error|connection timed out|origin is unreachable|web server is down/.test(text);

            if (!code && !cloudflareHostError) return null;

            return {

                code: code || '5xx',

                reason: cloudflareHostError ? 'website host/server unavailable' : 'temporary website server error'

            };

        }

        function getPageBrainState() {

            if (!document.body) return { state: 'LOADING', confidence: 1, reason: 'document body pending' };

            if (window.th_captcha_present || detectChallenge()) return { state: 'CAPTCHA', confidence: 1, reason: 'human verification detected' };

            const serverError = getServerErrorState();

            if (serverError) return { state: 'SERVER_ERROR', confidence: 1, reason: serverError.reason, target: serverError.code };

            if (getVacancymodeManualGate()) return { state: 'MANUAL_GATE', confidence: 1, reason: 'server confirmation cookie required' };

            const redirect = getScriptRedirectTarget();

            if (redirect) return { state: 'REDIRECT', confidence: isSafeVplinkFlowUrl(redirect) || isSafeUniversalFlowUrl(redirect) ? 1 : 0.6, reason: 'page-owned redirect found', target: normalizeFlowUrl(redirect) };

            const finalTarget = document.querySelector('#get-link, #gt-link, #go-link, a[href^="https://t.me/"], a[href^="https://telegram.me/"]');

            if (finalTarget) {

                const href = finalTarget.href || (finalTarget.closest && finalTarget.closest('a') && finalTarget.closest('a').href) || '';

                return { state: 'FINAL', confidence: 1, reason: 'final or Telegram target detected', target: normalizeFlowUrl(href) };

            }

            const stepInfo = getStepFlowInfo();

            if (stepInfo) return { state: 'STEP', confidence: 0.95, reason: stepInfo.current && stepInfo.total ? ('structured step ' + stepInfo.current + '/' + stepInfo.total) : 'structured verify controls' };

            const countdown = getSafeCountdownState();

            if (countdown && countdown.detected) return { state: countdown.ready ? 'READY' : 'TIMER', confidence: 0.9, reason: countdown.ready ? 'continue target is ready' : ('countdown' + (countdown.timerValue !== null ? ' ' + countdown.timerValue + 's' : '') + ' detected') };

            const bodyText = (document.body.innerText || document.body.textContent || '').replace(/\s+/g, ' ').toLowerCase().slice(0, 5000);

            const hasFlowHint = /please\s+wait|count(?:ing)?\s*down|skip\s+timer|click\s+(?:to\s+)?verify|continue|get\s+link|opening\s+link|generating\s+link/.test(bodyText);

            const best = shouldRunUniversalFlow() && hasFlowHint ? getBestUniversalAction() : null;

            if (best && best.el && best.score >= 90) return { state: 'ACTION', confidence: Math.min(1, best.score / 160), reason: 'high-confidence intermediate action', target: getTargetLabel(best.el).slice(0, 60) };

            return { state: 'UNKNOWN', confidence: 0.2, reason: 'no safe flow pattern yet' };

        }

        function rememberBrainState(brain) {

            if (!brain || !brain.state) return;

            window.th_page_brain = brain;

            try {

                const history = JSON.parse(sessionStorage.getItem(BRAIN_HISTORY_KEY) || '[]');

                const list = Array.isArray(history) ? history : [];

                const last = list[list.length - 1];

                const signature = [location.hostname, location.pathname, brain.state, brain.reason].join('|');

                if (!last || last.signature !== signature) {

                    list.push({ signature, state: brain.state, reason: brain.reason, target: brain.target || '', url: normalizeFlowUrl(location.href), at: Date.now() });

                    sessionStorage.setItem(BRAIN_HISTORY_KEY, JSON.stringify(list.slice(-24)));

                }

            } catch(e) {}

        }

        function maybeHandleServerError(proxy) {

            const error = getServerErrorState();

            if (!error) return false;

            clearPendingRecipe();

            window.th_navigating = false;

            window.th_gate_status = 'SERVER ' + error.code + ': retry later';

            rememberBrainState({ state: 'SERVER_ERROR', confidence: 1, reason: error.reason, target: error.code });

            proxy = setProxyStatus(proxy, 'SERVER ' + error.code + ': retry page');

            if (proxy) {

                proxy.onclick = () => { if (S.enabled) location.reload(); };

            }

            return true;

        }

        const RECIPE_PENDING_KEY = 'th_recipe_pending_v52';

        const RECIPE_IDS = ['btn6', 'btn7', 'tp-snp2', 'tp98', 'cross-snp2', 'startCountdownBtn', 'get-link', 'gt-link', 'go-link', 'tp-time', 'ce-time', 'countdown', 'link1s-time'];

        function getRecipeShape() {

            if (!document.body || window.th_captcha_present) return '';

            const ids = RECIPE_IDS.filter(id => !!document.getElementById(id)).sort();

            const text = (document.body.innerText || '').replace(/\s+/g, ' ').toLowerCase().slice(0, 5000);

            const step = text.match(/step\s*([0-9]+)\s*\/\s*([0-9]+)/i);

            const flags = [

                step ? ('step:' + step[1] + '/' + step[2]) : '',

                /\bplease\s+wait\s+\d{1,3}\s*seconds?\b/.test(text) ? 'wait' : '',

                /click\s+(?:to\s+)?verify|click\s+any\s+(?:image|link)/i.test(text) ? 'verify' : '',

                /count(?:ing)?\s*down|skip\s+timer/i.test(text) ? 'countdown' : '',

                getScriptRedirectTarget() ? 'script-redirect' : ''

            ].filter(Boolean);

            if (!ids.length && !flags.length) return '';

            return ids.join(',') + '|' + flags.join(',');

        }

        function recipeKey(host, shape) {

            return String(host || '').toLowerCase() + '::' + String(shape || '');

        }

        function hrefSignature(href) {

            if (!href) return '';

            try {

                const u = new URL(href, location.href);

                const keys = Array.from(u.searchParams.keys()).sort().slice(0, 12);

                return [u.hostname.toLowerCase(), u.pathname.replace(/\/+$/, '') || '/', keys.join(',')].join('|');

            } catch(e) { return ''; }

        }

        function isUnstableRecipeSelector(selector) {

            return !selector || selector.includes(':nth-of-type') || /[.#][A-Za-z_-]*[0-9a-f]{7,}/i.test(selector) || /#(?:google_ads|aswift|adsbygoogle|adngin|div-gpt|ad_iframe)/i.test(selector);

        }

        function isAdLikeRecipeTarget(el) {

            if (!el || isTimeHookerUi(el) || isOwnUi(el)) return true;

            const meta = [el.id, el.className, el.src || ''].join(' ').toLowerCase();

            if (/(^|\W)(google_ads|aswift|adsbygoogle|adngin|div-gpt|ad_iframe|popup|interstitial)(\W|$)/i.test(meta)) return true;

            try {

                const style = getComputedStyle(el);

                const rect = el.getBoundingClientRect();

                const fixedish = style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky';

                if (fixedish && rect.width >= window.innerWidth * 0.6 && rect.height >= window.innerHeight * 0.6) return true;

            } catch(e) {}

            return false;

        }

        function isLearnableRecipeTarget(el) {

            if (!el || !isVisibleMacroTarget(el) || isAdLikeRecipeTarget(el)) return false;

            const text = getActionText(el).toLowerCase();

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            if (INVALID_TARGET_TEXT.some(k => text.includes(k))) return false;

            if (isFinalVplinkTarget(el) || isTelegramHref(href) || (href && isFinalUniversalUrl(href))) return false;

            if (/^(get-link|gt-link|go-link)$/i.test(el.id || '')) return false;

            if (href) {

                try {

                    const u = new URL(href, location.href);

                    if (u.hostname !== location.hostname) return false;

                } catch(e) { return false; }

            }

            return true;

        }

        function buildRecipeStep(el, kind) {

            if (!isLearnableRecipeTarget(el)) return null;

            const selector = cssPath(el);

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            return {

                id: String(el.id || '').slice(0, 120),

                text: getActionText(el).slice(0, 120),

                tag: String((el.tagName || '').toLowerCase()).slice(0, 24),

                role: String((el.getAttribute && el.getAttribute('role')) || '').slice(0, 40),

                selector: isUnstableRecipeSelector(selector) ? '' : selector.slice(0, 260),

                hrefSig: hrefSignature(href),

                kind: kind === 'navigate' ? 'navigate' : 'click'

            };

        }

        function pruneRecipes() {

            store.recipes = sanitizeRecipes(store.recipes);

            const now = Date.now();

            Object.keys(store.recipes).forEach(key => {

                const item = store.recipes[key];

                const tooOld = item.updatedAt && now - item.updatedAt > 45 * 86400000;

                const unhealthy = item.consecutiveFails >= 3 || (item.fails > item.hits && item.fails >= 4);

                if (tooOld || unhealthy) delete store.recipes[key];

            });

            const keys = Object.keys(store.recipes).sort((a, b) => (store.recipes[b].updatedAt || 0) - (store.recipes[a].updatedAt || 0));

            keys.slice(80).forEach(key => { delete store.recipes[key]; });

        }

        pruneRecipes();

        function readPendingRecipe() {

            try {

                const pending = JSON.parse(sessionStorage.getItem(RECIPE_PENDING_KEY) || 'null');

                return pending && typeof pending === 'object' ? pending : null;

            } catch(e) { return null; }

        }

        function clearPendingRecipe() {

            try { sessionStorage.removeItem(RECIPE_PENDING_KEY); } catch(e) {}

        }

        function stageRecipeAction(el, kind) {

            if (window.th_captcha_present || detectChallenge() || readPendingRecipe()) return false;

            const shape = getRecipeShape();

            const step = shape ? buildRecipeStep(el, kind) : null;

            if (!step) return false;

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            const targetUrl = href ? normalizeFlowUrl(href) : '';

            const stableId = /^(btn6|btn7|tp-snp2|tp98|cross-snp2|startCountdownBtn)$/i.test(step.id || '');

            const sameHostTarget = !targetUrl || (() => { try { return new URL(targetUrl).hostname === location.hostname; } catch(e) { return false; } })();

            const brain = getPageBrainState();

            const pending = {

                id: Math.random().toString(36).slice(2) + Date.now().toString(36),

                host: SITE_KEY,

                shape,

                key: recipeKey(SITE_KEY, shape),

                step,

                fromUrl: normalizeFlowUrl(location.href),

                targetUrl,

                traceLen: getFlowTrace().length,

                hadAutoRedirect: !!getScriptRedirectTarget() || !!document.querySelector('meta[http-equiv="refresh" i]'),

                strongEvidence: !!(stableId && sameHostTarget && ['STEP', 'READY', 'TIMER', 'ACTION'].includes(brain.state)),

                brainState: brain.state,

                ts: Date.now()

            };

            try {

                sessionStorage.setItem(RECIPE_PENDING_KEY, JSON.stringify(pending));

                el.dataset.thRecipeFired = pending.id;

                return true;

            } catch(e) { return false; }

        }

        function failRecipe(key) {

            const item = store.recipes && store.recipes[key];

            if (!item) return;

            item.hits = Math.floor(Number(item.hits || 0) / 2);

            item.fails = Math.min(999, Number(item.fails || 0) + 1);

            item.consecutiveFails = Math.min(20, Number(item.consecutiveFails || 0) + 1);

            item.lastFailAt = Date.now();

            item.updatedAt = Date.now();

            if (item.consecutiveFails >= 3) delete store.recipes[key];

            pruneRecipes();

            markRecipesDirty();

        }

        function commitPendingRecipe(pending, strongTransition) {

            store.recipes = store.recipes || {};

            const existing = store.recipes[pending.key] || {

                host: pending.host,

                shape: pending.shape,

                step: pending.step,

                hits: 0,

                fails: 0,

                confirmations: 0,

                consecutiveFails: 0,

                updatedAt: 0,

                lastFailAt: 0

            };

            existing.step = pending.step;

            const strong = !!(pending.strongEvidence && strongTransition);

            existing.hits = Math.min(999, Number(existing.hits || 0) + (strong ? 2 : 1));

            existing.confirmations = Math.min(999, Number(existing.confirmations || 0) + 1);

            existing.consecutiveFails = 0;

            existing.updatedAt = Date.now();

            store.recipes[pending.key] = existing;

            pruneRecipes();

            markRecipesDirty();

        }

        function evaluatePendingRecipe() {

            const pending = readPendingRecipe();

            if (!pending) return false;

            if (window.th_captcha_present || detectChallenge()) {

                clearPendingRecipe();

                return false;

            }

            const age = Date.now() - Number(pending.ts || 0);

            const currentUrl = normalizeFlowUrl(location.href);

            if (pending.host && pending.host !== SITE_KEY) {

                failRecipe(pending.key);

                clearPendingRecipe();

                window.th_gate_status = 'LEARNING CANCELLED: website changed';

                return false;

            }

            const currentShape = getRecipeShape();

            const urlChanged = !!(currentUrl && pending.fromUrl && currentUrl !== pending.fromUrl);

            const shapeChanged = !!(currentShape && pending.shape && currentShape !== pending.shape);

            const traceAdvanced = getFlowTrace().length > Number(pending.traceLen || 0);

            const reachedTarget = !!(pending.targetUrl && currentUrl === pending.targetUrl);

            const finalLanding = isFinalUniversalUrl(currentUrl) || /^(get-link|gt-link|go-link)$/i.test((document.activeElement && document.activeElement.id) || '');

            if ((urlChanged || shapeChanged) && !pending.hadAutoRedirect && !finalLanding && (reachedTarget || traceAdvanced || shapeChanged)) {

                commitPendingRecipe(pending, !!(shapeChanged || reachedTarget));

                clearPendingRecipe();

                return false;

            }

            if (age > 8000 && !urlChanged && !shapeChanged) {

                failRecipe(pending.key);

                clearPendingRecipe();

                window.th_gate_status = 'LEARNING FAILED: page did not advance';

                return false;

            }

            if (age > 60000 || (urlChanged && (!reachedTarget || finalLanding))) {

                failRecipe(pending.key);

                clearPendingRecipe();

                window.th_gate_status = 'LEARNING REJECTED: wrong or final route';

                return false;

            }

            return true;

        }

        function scoreRecipeCandidate(el, step) {

            if (!el || !step || !isLearnableRecipeTarget(el)) return -1;

            const text = getActionText(el).toLowerCase();

            const expected = String(step.text || '').toLowerCase();

            const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

            let score = 0;

            if (step.id && el.id === step.id) score += 1000;

            if (step.hrefSig && hrefSignature(href) === step.hrefSig) score += 900;

            if (expected && text === expected) score += 700;

            else if (expected && text.includes(expected.slice(0, 40))) score += 300;

            if (step.tag && (el.tagName || '').toLowerCase() === step.tag) score += 120;

            if (step.role && el.getAttribute && el.getAttribute('role') === step.role) score += 80;

            return score;

        }

        function findRecipeTarget(step) {

            const candidates = [];

            if (step && step.selector) {

                try {

                    const selected = document.querySelector(step.selector);

                    if (selected) candidates.push(selected);

                } catch(e) {}

            }

            Array.from(document.querySelectorAll("a, button, input[type='button'], input[type='submit'], [role='button'], [role='link'], [onclick]")).slice(0, 320).forEach(el => {

                if (!candidates.includes(el)) candidates.push(el);

            });

            return candidates.map(el => ({ el, score: scoreRecipeCandidate(el, step) })).filter(item => item.score >= 900).sort((a, b) => b.score - a.score)[0] || null;

        }

        function recipeIsConfident(recipe) {

            const hits = Number(recipe && recipe.hits || 0);

            const fails = Number(recipe && recipe.fails || 0);

            const confirmations = Number(recipe && recipe.confirmations || 0);

            const ratio = hits / Math.max(1, hits + fails);

            return (confirmations >= 2 || hits >= 3) && ratio >= 0.8 && fails < 2 && Number(recipe.consecutiveFails || 0) === 0 && Date.now() - Number(recipe.updatedAt || 0) < 30 * 86400000;

        }

        function getTemplateRecipe(shape) {

            if (!shape) return null;

            return Object.values(store.recipes || {}).filter(item => item && item.shape === shape && item.host !== SITE_KEY).sort((a, b) => Number(b.hits || 0) - Number(a.hits || 0))[0] || null;

        }

        function maybeRunLearnedRecipe(proxy) {

            if (!shouldRunUniversalFlow() || isVplinkChainHost() || window.th_captcha_present || !document.body) return false;

            if (evaluatePendingRecipe()) {

                const pending = readPendingRecipe();

                const existing = pending && store.recipes && store.recipes[pending.key];

                const done = Math.min(1, Number(existing && existing.confirmations || 0));

                window.th_gate_status = 'LEARNING ' + done + '/2: verifying page progress';

                setProxyStatus(proxy, 'LEARNING ' + done + '/2: verifying');

                return true;

            }

            const shape = getRecipeShape();

            if (!shape) return false;

            const key = recipeKey(SITE_KEY, shape);

            const localRecipe = store.recipes && store.recipes[key];

            const recipe = localRecipe || getTemplateRecipe(shape);

            if (!recipe) return false;

            const found = findRecipeTarget(recipe.step);

            if (!found) {

                window.th_recipe_misses = window.th_recipe_misses || {};

                window.th_recipe_misses[key] = Number(window.th_recipe_misses[key] || 0) + 1;

                if (localRecipe && window.th_recipe_misses[key] >= 12) {

                    failRecipe(key);

                    window.th_recipe_misses[key] = 0;

                }

                return false;

            }

            window.th_recipe_misses = window.th_recipe_misses || {};

            window.th_recipe_misses[key] = 0;

            revealFlowElement(found.el);

            const href = found.el.href || (found.el.closest && found.el.closest('a') && found.el.closest('a').href) || '';

            if (!localRecipe || !recipeIsConfident(localRecipe)) {

                const confirmations = Number(localRecipe && localRecipe.confirmations || 0);

                const label = localRecipe ? ('LEARNING ' + Math.min(1, confirmations) + '/2: tap Continue') : 'LEARNED TEMPLATE: tap once';

                return setUniversalManual(proxy, label, found.el);

            }

            if (href) {

                if (!isSafeUniversalFlowUrl(href) || isFinalUniversalUrl(href)) return setUniversalManual(proxy, 'FINAL LINK: manual', found.el);

                return navigateUniversalUrl(href, 'LEARNED: continue', proxy, found.el);

            }

            if (window.th_recipe_clicking) return true;

            window.th_recipe_clicking = true;

            stageRecipeAction(found.el, 'click');

            window.th_gate_status = 'LEARNED: verified click';

            setProxyStatus(proxy, 'LEARNED: verified click');

            (window.th_nativeSetTimeout || setTimeout)(() => {

                try { clickIntermediateFlowTarget(found.el); }

                finally { window.th_recipe_clicking = false; }

            }, 180);

            return true;

        }

        function setProxyStatus(proxy, text) {

            if (!S.pinMode || !document.body) return proxy;

            if (!proxy) {

                proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, #ff0055, #ffaa00); color: white; border-radius: 10px; cursor: pointer;";

                document.body.appendChild(proxy);

            }

            proxy.innerText = text;

            proxy.style.top = S.topOffset + 'px';

            proxy.style.display = 'block';

            return proxy;

        }

        function navigateFlowUrl(url, label, proxy) {

            const target = normalizeFlowUrl(url);

            if (!target || !isSafeVplinkFlowUrl(target)) return false;

            if (countFlowVisits(target) >= 3) {

                window.th_gate_status = 'FLOW LOOP: manual';

                rememberBrainState({ state: 'LOOP', confidence: 1, reason: 'same guarded route attempted three times', target });

                setProxyStatus(proxy, 'FLOW LOOP: manual');

                return true;

            }

            window.th_gate_status = label || 'FLOW: next';

            setProxyStatus(proxy, label || 'FLOW: next');

            // Fast auto-walk + anti-crash guard: only one navigation may be scheduled at a time.

            if (window.th_navigating) return true;

            window.th_navigating = true;

            const navStartedAt = Date.now();

            window.th_navigating_since = navStartedAt;

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (window.th_navigating && window.th_navigating_since === navStartedAt) window.th_navigating = false;

            }, 4000);

            rememberFlowHop(target, label);

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (shouldSkipFlow()) location.href = target; else window.th_navigating = false;

            }, 150);

            return true;

        }

        function getScriptRedirectTarget() {

            if (!document.documentElement) return '';

            const html = document.documentElement.innerHTML || '';

            const text = (document.body && document.body.innerText || '').replace(/\s+/g, ' ').toLowerCase();

            if (!/(please wait|opening link|generating link|redirect after a delay|redirecting)/i.test(text)) return '';

            const m = html.match(/(?:window|document)\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i) || html.match(/document\.location\s*=\s*["']([^"']+)["']/i);

            return m ? m[1] : '';

        }

        function getStepFlowInfo() {

            if (!document.body) return null;

            const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ');

            const stepMatch = bodyText.match(/step\s*([0-9]+)\s*\/\s*([0-9]+)/i);

            const btn6 = document.getElementById('btn6');

            const btn7 = document.getElementById('btn7');

            if (!stepMatch && !btn6 && !btn7) return null;

            return { current: stepMatch ? parseInt(stepMatch[1], 10) : 0, total: stepMatch ? parseInt(stepMatch[2], 10) : 0, btn6, btn7 };

        }

        function revealFlowElement(el) {

            if (!el) return false;

            [el, (el.closest && el.closest('a'))].forEach(node => {

                if (!node || !node.style) return;

                node.style.setProperty('display', node.tagName === 'A' ? 'inline-block' : 'block', 'important');

                node.style.setProperty('visibility', 'visible', 'important');

                node.style.setProperty('opacity', '1', 'important');

                try { node.removeAttribute('disabled'); node.setAttribute('aria-disabled', 'false'); } catch(e) {}

            });

            return true;

        }

        function prepareStepFlow(info) {

            ['ce-wait1', 'tp-wait1'].forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'none', 'important'); });

            ['ce-text', 'tp-generate'].forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'block', 'important'); });

            document.querySelectorAll("[id='loading-container'], #continue1").forEach(el => el.style.setProperty('display', 'none', 'important'));

            if (info.btn6) revealFlowElement(info.btn6);

            if (info.btn7) revealFlowElement(info.btn7);

        }

        function getVacancymodeManualGate() {

            if (!/(^|\.)vacancymode\.in$/i.test(location.hostname) || getCookieValue('adcadg')) return null;

            const timer = document.getElementById('tp-time');

            const button = document.getElementById('tp-snp2');

            const gate = document.getElementById('gcont');

            if (!timer || !button || !gate) return null;

            const text = (gate.innerText || gate.textContent || '').replace(/\s+/g, ' ').toLowerCase();

            if (!/click (?:on )?(?:the )?ads? to continue|click ads wait\s*&?\s*back|support the developer/.test(text)) return null;

            return { timer, button, gate };

        }

        function maybeHandleVacancymodeManualGate(proxy) {

            const manualGate = getVacancymodeManualGate();

            if (!manualGate) return false;

            window.th_skipTimersEnabled = false;

            window.th_flowManualMode = true;

            window.th_gate_status = 'MANUAL GATE: open ad, wait 15s, return';

            recordSiteTrick('manual');

            proxy = setProxyStatus(proxy, 'MANUAL GATE: open ad & return');

            if (proxy) {

                proxy.style.cursor = 'pointer';

                proxy.onclick = () => {

                    try { manualGate.gate.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) {}

                };

            }

            return true;

        }

        function maybeRunVplinkChain(proxy) {

            if (!shouldSkipFlow() || !isVplinkChainHost()) return false;

            if (maybeHandleVacancymodeManualGate(proxy)) return true;

            const redirectTarget = getScriptRedirectTarget();

            if (redirectTarget && isSafeVplinkFlowUrl(redirectTarget)) {

                return navigateFlowUrl(redirectTarget, 'FLOW: redirect', proxy);

            }

            const stepInfo = getStepFlowInfo();

            if (stepInfo) {

                prepareStepFlow(stepInfo);

                const stepLabel = stepInfo.current && stepInfo.total ? ('FLOW: Step ' + stepInfo.current + '/' + stepInfo.total) : 'FLOW: verify';

                setProxyStatus(proxy, stepLabel);

                window.th_gate_status = stepLabel;

                if (stepInfo.btn6 && !stepInfo.btn6.dataset.thFlowClicked) {

                    stepInfo.btn6.dataset.thFlowClicked = '1';

                    (window.th_nativeSetTimeout || setTimeout)(() => {

                        if (!shouldSkipFlow() || !document.contains(stepInfo.btn6)) return;

                        try { if (typeof window.nextbtn === 'function') window.nextbtn(); else simulateClick(stepInfo.btn6); } catch(e) { simulateClick(stepInfo.btn6); }

                    }, 250);

                    return true;

                }

                if (stepInfo.btn7) {

                    const href = stepInfo.btn7.href || '';

                    if (isTelegramHref(href) || /vplink\.in\/(?:links\/go|go|final)/i.test(href)) {

                        window.th_gate_status = 'FINAL LINK: manual';

                        setProxyStatus(proxy, 'FINAL LINK: manual');

                        return true;

                    }

                    return navigateFlowUrl(href, 'FLOW: Continue', proxy);

                }

                return true;

            }

            const tpBtn = document.getElementById('tp-snp2');

            if (tpBtn && document.getElementById('tp-time')) {

                finishSafeCountdown(getSafeCountdownState());

                if (tpBtn && (tpBtn.href || (tpBtn.closest && tpBtn.closest('a') && tpBtn.closest('a').href))) {

                    const href = tpBtn.href || (tpBtn.closest && tpBtn.closest('a') && tpBtn.closest('a').href);

                    return navigateFlowUrl(href, 'FLOW: timer continue', proxy);

                }

                window.th_gate_status = 'FLOW: timer ready';

                setProxyStatus(proxy, 'FLOW: timer ready');

                return true;

            }

            return false;

        }

        function shouldRunUniversalFlow() {

            return !!(S.enabled && S.autoFlowSkip && S.universalFlow && !isVplinkChainHost());

        }

        function isSafeUniversalFlowUrl(url) {

            try {

                const u = new URL(url, location.href);

                if (!/^https?:$/i.test(u.protocol)) return false;

                if (isTelegramHref(u.href)) return false;

                if (u.hostname === location.hostname) return true;

                return isSafeVplinkFlowUrl(u.href);

            } catch(e) { return false; }

        }

        function isFinalUniversalUrl(url) {

            try {

                const u = new URL(url, location.href);

                if (isTelegramHref(u.href)) return true;

                if (u.hostname !== location.hostname && !isSafeVplinkFlowUrl(u.href)) return true;

                return /(?:\/(?:go|final|links\/go)(?:\/|$)|[?&](?:final|destination|target)=)/i.test(u.pathname + u.search);

            } catch(e) { return true; }

        }

        function setUniversalManual(proxy, label, el) {

            proxy = setProxyStatus(proxy, label);

            window.th_gate_status = label;

            if (proxy && el) {

                proxy.onclick = () => {

                    if (!S.enabled || !S.universalFlow) return;

                    revealFlowElement(el);

                    stageRecipeAction(el, (el.href || (el.closest && el.closest('a') && el.closest('a').href)) ? 'navigate' : 'click');

                    clickIntermediateFlowTarget(el);

                };

            }

            return true;

        }

        function navigateUniversalUrl(url, label, proxy, recipeTarget) {

            const target = normalizeFlowUrl(url);

            if (!target || !isSafeUniversalFlowUrl(target)) return false;

            if (isFinalUniversalUrl(target)) {

                window.th_gate_status = 'FINAL LINK: manual';

                setProxyStatus(proxy, 'FINAL LINK: manual');

                return true;

            }

            if (countFlowVisits(target) >= 3) {

                window.th_gate_status = 'UNIVERSAL LOOP: manual';

                rememberBrainState({ state: 'LOOP', confidence: 1, reason: 'same universal route attempted three times', target });

                setProxyStatus(proxy, 'UNIVERSAL LOOP: manual');

                return true;

            }

            window.th_gate_status = label || 'UNIVERSAL: next';

            setProxyStatus(proxy, label || 'UNIVERSAL: next');

            // Fast auto-walk + anti-crash guard: only one navigation may be scheduled at a time.

            if (window.th_navigating) return true;

            window.th_navigating = true;

            const navStartedAt = Date.now();

            window.th_navigating_since = navStartedAt;

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (window.th_navigating && window.th_navigating_since === navStartedAt) window.th_navigating = false;

            }, 4000);

            if (recipeTarget) stageRecipeAction(recipeTarget, 'navigate');

            rememberFlowHop(target, label);

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (shouldRunUniversalFlow()) location.href = target; else window.th_navigating = false;

            }, 150);

            return true;

        }

        function getUniversalActionCandidates() {

            const selectors = [

                '#btn6', '#btn7', '#tp-snp2', '#tp98', '#cross-snp2', '#startCountdownBtn',

                'a[href]', 'button', 'input[type="button"]', 'input[type="submit"]'

            ];

            return Array.from(document.querySelectorAll(selectors.join(','))).filter(el => {

                if (!el || isOwnUi(el) || isDisabledAction(el)) return false;

                const text = getActionText(el).toLowerCase();

                const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

                if (INVALID_TARGET_TEXT.some(k => text.includes(k))) return false;

                if (isTelegramHref(href)) return true;

                if (/^(btn6|btn7|tp-snp2|tp98|cross-snp2|startCountdownBtn)$/i.test(el.id || '')) return true;

                return VALID_TARGET_TEXT.some(k => text.includes(k)) || /continue|verify|get\s*link|download\s*link|open\s*link/i.test(text);

            });

        }

        function getBestUniversalAction() {

            const candidates = getUniversalActionCandidates();

            let best = null;

            let bestScore = -1;

            candidates.forEach(el => {

                revealFlowElement(el);

                const text = getActionText(el).toLowerCase();

                const href = el.href || (el.closest && el.closest('a') && el.closest('a').href) || '';

                let score = 10;

                if (/^(btn7|tp-snp2|tp98|cross-snp2)$/i.test(el.id || '')) score += 80;

                if (/^(btn6|startCountdownBtn)$/i.test(el.id || '')) score += 65;

                if (/get\s*link|download\s*link|open\s*link/.test(text)) score += 50;

                if (/continue|verify|click\s*to\s*verify/.test(text)) score += 40;

                if (href && isSafeUniversalFlowUrl(href)) score += 25;

                if (href && isFinalUniversalUrl(href)) score -= 90;

                if (isVisibleAction(el)) score += 10;

                if (score > bestScore) { bestScore = score; best = el; }

            });

            return { el: best, score: bestScore };

        }

        // Deep page scanner: read the page's own HTML + inline scripts to find a hidden "next" URL even when there is

        // no obvious button — JS location assignments, meta-refresh, data-* attributes, and base64-encoded URLs.

        function scanPageForNextUrl() {

            const found = [];

            try {

                const html = (document.documentElement && document.documentElement.innerHTML) || '';

                let m;

                const re1 = /(?:window\.|document\.)?location(?:\.href)?\s*=\s*["']([^"']{4,})["']/gi;

                while ((m = re1.exec(html))) found.push(m[1]);

                const re2 = /location\.replace\(\s*["']([^"']{4,})["']\s*\)/gi;

                while ((m = re2.exec(html))) found.push(m[1]);

                const meta = document.querySelector('meta[http-equiv="refresh" i]');

                if (meta) { const mm = (meta.getAttribute('content') || '').match(/url=([^;]+)$/i); if (mm) found.push(mm[1].trim()); }

                let b64count = 0;

                const re3 = /["']([A-Za-z0-9+/]{24,}={0,2})["']/g;

                while ((m = re3.exec(html)) && b64count < 80) { b64count++; try { const d = atob(m[1]).trim(); if (/^https?:\/\/[^\s"'<>]+$/i.test(d)) found.push(d); } catch(e) {} }

                document.querySelectorAll('[data-url],[data-href],[data-link]').forEach(el => {

                    const u = el.getAttribute('data-url') || el.getAttribute('data-href') || el.getAttribute('data-link');

                    if (u) found.push(u);

                });

            } catch(e) {}

            const here = normalizeFlowUrl(location.href);

            const seen = {};

            const out = [];

            found.forEach(u => {

                const n = normalizeFlowUrl(u);

                if (!n || !/^https?:/i.test(n) || n === here || seen[n]) return;

                seen[n] = 1;

                out.push(n);

            });

            return out;

        }

        // Pick a SAFE same-host/known-intermediate scanned URL for auto-navigation (final/external/Telegram are excluded).

        function getDeepScanAutoTarget() {

            const cands = scanPageForNextUrl();

            for (let i = 0; i < cands.length; i++) {

                if (isFinalUniversalUrl(cands[i])) continue;

                if (isSafeUniversalFlowUrl(cands[i]) && countFlowVisits(cands[i]) < 3) return cands[i];

            }

            return '';

        }

        function maybeRunUniversalPatternFlow(proxy) {

            if (!shouldRunUniversalFlow() || !document.body) return false;

            const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').toLowerCase();

            const hasFlowShape = /step\s*[0-9]+\s*\/\s*[0-9]+|you are currently on step|please\s+wait\s+\d{1,3}\s*seconds?|count(?:ing)?\s*down|click\s+(?:to\s+)?verify|click\s+any\s+image|skip\s+timer|get\s+link/i.test(bodyText) || !!(document.getElementById('btn6') || document.getElementById('btn7') || document.getElementById('tp-snp2'));

            if (!hasFlowShape) return false;

            // This unknown page matches the shortlink/countdown shape while Universal mode is on — remember it.

            autoLearnIfNew('universal');

            const redirectTarget = getScriptRedirectTarget();

            if (redirectTarget && isSafeUniversalFlowUrl(redirectTarget)) {

                return navigateUniversalUrl(redirectTarget, 'UNIVERSAL: redirect', proxy);

            }

            const stepInfo = getStepFlowInfo();

            if (stepInfo) {

                prepareStepFlow(stepInfo);

                const stepLabel = stepInfo.current && stepInfo.total ? ('UNIVERSAL: Step ' + stepInfo.current + '/' + stepInfo.total) : 'UNIVERSAL: verify';

                if (stepInfo.btn6 && !stepInfo.btn6.dataset.thUniversalClicked) {

                    stepInfo.btn6.dataset.thUniversalClicked = '1';

                    return setUniversalManual(proxy, 'LEARNING 0/2: tap Continue', stepInfo.btn6);

                }

                if (stepInfo.btn7) {

                    const href = stepInfo.btn7.href || '';

                    if (href && isSafeUniversalFlowUrl(href) && !isFinalUniversalUrl(href)) return navigateUniversalUrl(href, 'UNIVERSAL: Continue', proxy, stepInfo.btn7);

                    return setUniversalManual(proxy, 'UNIVERSAL: proxy click', stepInfo.btn7);

                }

                return true;

            }

            const safeCountdownState = getSafeCountdownState();

            if (safeCountdownState.detected) finishSafeCountdown(safeCountdownState);

            const found = getBestUniversalAction();

            if (!found.el || found.score < 55) {

                // No confident button — read the page code for a hidden next-URL.

                const scanned = getDeepScanAutoTarget();

                if (scanned) return navigateUniversalUrl(scanned, 'UNIVERSAL: scanned link', proxy);

                const all = scanPageForNextUrl();

                if (all.length) {

                    // A next-URL exists but it is external/final — offer one-tap rather than auto-jumping somewhere unsafe.

                    const next = all[0];

                    const p = setProxyStatus(proxy, '➡️ NEXT PAGE');

                    window.th_gate_status = 'Next link found — tap to go';

                    if (p) p.onclick = () => { if (S.enabled) location.href = next; };

                    return true;

                }

                window.th_gate_status = 'LOW CONFIDENCE: manual';

                setProxyStatus(proxy, 'LOW CONFIDENCE: manual');

                return true;

            }

            const href = found.el.href || (found.el.closest && found.el.closest('a') && found.el.closest('a').href) || '';

            if (href && isSafeUniversalFlowUrl(href) && !isFinalUniversalUrl(href) && found.score >= 90) {

                return navigateUniversalUrl(href, 'UNIVERSAL: timer continue', proxy, found.el);

            }

            return setUniversalManual(proxy, 'UNIVERSAL: proxy click', found.el);

        }

        function isSmartVerifyTarget(el, text) {

            return !!(S.smartVerifyFlow && text.includes('click to verify') && text.length <= 90 && isVisibleAction(el) && !isDisabledAction(el));

        }

        function hasSmartGateText(text) {

            return !!(text && (text.includes('click to verify') || text.includes('click any image') || text.includes('counting down') || text.includes('wait ') || text.includes('scroll down')));

        }

        function parseVisibleTimerValue(text) {

            if (!text) return null;

            const values = [];

            let m;

            const secRe = /\b(-?\d{1,3})\s*(?:seconds?|secs?|s)\b/g;

            while ((m = secRe.exec(text))) {

                const n = parseInt(m[1], 10);

                if (n >= 0 && n <= 180) values.push(n);

            }

            const mmssRe = /\b([0-5]?\d):([0-5]\d)\b/g;

            while ((m = mmssRe.exec(text))) {

                const n = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

                if (n >= 0 && n <= 180) values.push(n);

            }

            return values.length ? Math.min.apply(null, values) : null;

        }

        function updateTimerMovementState(state) {

            const current = state.timerValue;

            window.th_timer_observed_value = current;

            if (current === null) {

                window.th_gate_status = S.waitUntilTimerMoves ? (state.gateVisible ? 'Gate: waiting for timer' : 'Timer: waiting') : 'Timer: normal mode';

                return;

            }

            const last = window.th_timer_last_value;

            if (last !== null && current < last) {

                window.th_timer_moving_since = Date.now();

                window.th_gate_boost_armed = true;

                window.th_smart_gate_armed = true;

                window.th_gate_status = 'Timer: moving, boost armed';

            } else if (!window.th_gate_boost_armed) {

                window.th_gate_status = 'Timer: stuck at ' + current + 's';

            } else {

                window.th_gate_status = 'Timer: boost armed';

            }

            window.th_timer_last_value = current;

        }

        function getSmartVerifyState() {

            if (!S.smartVerifyFlow && !S.waitUntilTimerMoves) return { verify: null, timerText: '', timerValue: null, gateVisible: false };

            const candidates = Array.from(document.querySelectorAll("a, button, input[type='button'], input[type='submit'], [role='button']"));

            const verify = candidates.find(el => isSmartVerifyTarget(el, getActionText(el).toLowerCase())) || null;

            const bodyText = (document.body && document.body.innerText || '').replace(/\s+/g, ' ').toLowerCase();

            const timerMatch = bodyText.match(/\b-?\d+\s*seconds?\b/);

            return { verify, timerText: timerMatch ? timerMatch[0] : '', timerValue: parseVisibleTimerValue(bodyText), gateVisible: hasSmartGateText(bodyText) };

        }

        function armSmartGate(el) {

            if (!S.smartVerifyFlow) return;

            const key = el ? getTargetKey(el) : 'smart-gate-manual-click';

            window.th_smart_gate_armed = true;

            window.th_gate_clicked = true;

            if (!S.waitUntilTimerMoves) window.th_gate_boost_armed = true;

            window.th_skipTimersEnabled = !!(window.th_skipTimersWanted && (!S.waitUntilTimerMoves || window.th_gate_boost_armed));

            window.th_verify_aggro_until = Date.now() + 2500;

            window.th_gate_status = S.waitUntilTimerMoves ? 'Gate: clicked, watching timer' : 'Gate: clicked, boost armed';

            window.th_click_cooldowns[key] = Date.now();

        }

        document.addEventListener('click', function(e) {

            if (!S.smartVerifyFlow || window.th_smart_gate_armed || isOwnUi(e.target)) return;

            const tag = (e.target && e.target.tagName || '').toLowerCase();

            const text = (document.body && document.body.innerText || '').toLowerCase();

            if (tag === 'img' || tag === 'picture' || hasSmartGateText(text)) armSmartGate(e.target);

        }, true);

        function isValidActionTarget(el) {

            if (!isVisibleAction(el) || isDisabledAction(el)) return false;

            const t = getActionText(el).toLowerCase();

            if (!t) return false;

            if (S.safeCountdownMode && el && /^(tp98|tp-snp2|btn6|btn7|cross-snp2|get-link|gt-link|startCountdownBtn)$/.test(el.id || '') && /continue|verify|get link|getting link|click to verify/.test(t)) return true;

            if (t === 'next') return isAllowedNextTarget(el, t);

            if (isManualGateTarget(el, t)) return true;

            if (isSmartVerifyTarget(el, t)) return true;

            if (INVALID_TARGET_TEXT.some(k => t.includes(k))) return false;

            return VALID_TARGET_TEXT.some(k => t.includes(k));

        }

        function targetScore(el) {

            if (!isValidActionTarget(el)) return -1;

            const text = getActionText(el).toLowerCase();

            const rect = el.getBoundingClientRect();

            let score = rect.top + window.scrollY;

            if (S.safeCountdownMode && /^(get-link|gt-link)$/.test(el.id || '')) score += 3800;

            else if (S.safeCountdownMode && /^(btn7|cross-snp2)$/.test(el.id || '')) score += 3600;

            else if (S.safeCountdownMode && /^(tp98|tp-snp2|btn6|startCountdownBtn)$/.test(el.id || '')) score += 3000;

            else if (isAllowedNextTarget(el, text)) score += 2400;

            else if (isManualGateTarget(el, text)) score += 2350;

            else if (isSmartVerifyTarget(el, text)) score += 2300;

            else if (text.includes('click to continue')) score += 2200;

            else if (text === 'continue') score += 1800;

            else if (text.includes('human veification') || text.includes('human verification')) score += 1500;

            else if (text.includes('get link') || text.includes('download link')) score += 1200;

            if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') score += 300;

            if (el.querySelector && el.querySelector('button')) score += 250;

            if (el.closest && el.closest('nav, header, aside, [role="navigation"], [role="complementary"]')) score -= 1200;

            return score;

        }

        function findBestActionTarget() {

            const nodes = Array.from(document.querySelectorAll("a, button, input[type='button'], input[type='submit'], [role='button'], [role='link'], [onclick]"));

            const best = nodes.map(el => ({ el, score: targetScore(el) })).filter(x => x.score >= 0).sort((a, b) => b.score - a.score)[0]?.el || null;

            if (best) return best;

            const bodyText = (document.body && document.body.innerText || '').toLowerCase();

            if (!bodyText.includes('click any image')) return null;

            return findFirstVisibleContentImage();

        }

        function findFirstVisibleContentImage() {

            const imgs = Array.from(document.querySelectorAll('article img, main img, .inside-article img, .entry-content img, img'));

            return imgs.find(img => {

                if (!isVisibleAction(img) || isOwnUi(img)) return false;

                const rect = img.getBoundingClientRect();

                const src = (img.currentSrc || img.src || '').toLowerCase();

                if (rect.width < 80 || rect.height < 60) return false;

                if (/logo|icon|avatar|spinner|loader|adsbygoogle|doubleclick|googlesyndication/.test(src)) return false;

                return true;

            }) || null;

        }

        function getLinkShortifyState() {

            if (!/lksfy\.com$/i.test(location.hostname)) return null;

            const bodyText = (document.body && document.body.innerText || '').toLowerCase();

            if (!bodyText.includes('your link is almost ready')) return null;

            const hasTurnstile = !!document.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"], [data-sitekey]');

            const tokenEl = document.querySelector('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]');

            const turnstileToken = tokenEl && (tokenEl.value || '').trim();

            const needsTurnstile = !!(hasTurnstile && !turnstileToken);

            const waiting = Array.from(document.querySelectorAll('a, button')).find(el => getActionText(el).toLowerCase().includes('please wait'));

            const ready = needsTurnstile ? null : Array.from(document.querySelectorAll('a, button')).find(el => {

                const text = getActionText(el).toLowerCase();

                const href = el.href || '';

                if (!isVisibleAction(el) || isDisabledAction(el)) return false;

                if (INVALID_TARGET_TEXT.some(k => text.includes(k)) || text.includes('linkshortify')) return false;

                if (href && href !== 'javascript: void(0)' && !href.endsWith('#') && !href.includes('linkshortify.com') && !href.includes('/pages/')) return true;

                return ['get link', 'go to link', 'open link', 'get destination link'].some(k => text.includes(k));

            });

            return { waiting, ready, needsTurnstile };

        }

        function nudgeLinkShortifyTimer(proxy) {

            if (window.th_lksfy_nudged) return;

            window.th_lksfy_nudged = true;

            try {

                document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));

                window.dispatchEvent(new Event('load'));

                window.dispatchEvent(new Event('focus'));

            } catch(e) {}

            if (proxy) {

                proxy.innerText = '⏱ FINAL TIMER...';

                proxy.style.top = S.topOffset + 'px';

                proxy.style.display = 'block';

            }

        }

        // Detect a captcha / Cloudflare / human-verification challenge that needs a real human.

        // When present, Time Hooker fully pauses: no timer speed-up, no skip, no auto-click.

        function detectChallenge() {

            try {

                const bodyText = (document.body && document.body.innerText || '');

                if (bodyText.length < 2500) {

                    const t = bodyText.toLowerCase();

                    if (/just a moment|checking your browser|verify you are human|verifying you are human|needs to review the security of your connection|enable javascript and cookies to continue|attention required/i.test(t)) return true;

                }

                const widgets = document.querySelectorAll('.cf-turnstile, iframe[src*="challenges.cloudflare.com"], .g-recaptcha, iframe[src*="recaptcha/api2"], iframe[src*="google.com/recaptcha"], iframe[src*="hcaptcha.com"], .h-captcha, #cf-challenge-running, #challenge-form');

                for (let i = 0; i < widgets.length; i++) {

                    const w = widgets[i];

                    if (isOwnUi(w)) continue;

                    const r = w.getBoundingClientRect();

                    const st = getComputedStyle(w);

                    if (r.width > 40 && r.height > 40 && st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity || '1') > 0.1) return true;

                }

                return false;

            } catch(e) { return false; }

        }

        function getDnsBlockMessage() {

            const host = location.hostname.toLowerCase();

            const bodyText = (document.body && document.body.innerText || '').toLowerCase();

            const blockedHost = host.includes('whalebone.io') || host.includes('dns.google') || host.includes('familyshield') || host.includes('block');

            const blockedText = bodyText.includes('detected threats') || bodyText.includes('malware') || bodyText.includes('considers to be harmful') || bodyText.includes('security warning');

            if (!blockedHost && !blockedText) return '';

            return 'DNS/security block detected. Userscript cannot toggle DNS. Turn off Private DNS/security DNS in browser/device settings, then reload.';

        }

        function showDnsBlockHelper(message) {

            if (!message || !document.body || document.getElementById('th-dns-helper')) return;

            const helper = document.createElement('div');

            helper.id = 'th-dns-helper';

            helper.textContent = message;

            helper.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483647;background:rgba(15,15,20,0.96);color:#fff;border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:12px 14px;font:600 13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,0.35);';

            document.body.appendChild(helper);

        }

        function isOwnUi(el) {

            return !!(el && el.closest && el.closest('#th-panel-root, #th-proxy-btn, #th-dns-helper'));

        }

        function isVisibleBox(el) {

            const rect = el.getBoundingClientRect();

            const style = getComputedStyle(el);

            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0.05;

        }

        // Don't hide a container that holds the real flow (timer/continue/get-link) or our own UI.

        function hasFlowInside(el) {

            try {

                if (el.querySelector && el.querySelector('#th-panel-root, #th-proxy-btn, #th-dns-helper, #get-link, #gt-link, #btn6, #btn7, #tp-snp2, #tp98, #startCountdownBtn, #cross-snp2, #tp-time, #countdown, #ce-time, #link1s-time')) return true;

                const t = (el.innerText || '').toLowerCase();

                if (t && t.length < 400 && /continue|get\s*link|download\s*link|click to (verify|continue)|go to link|open link/.test(t)) return true;

            } catch(e) {}

            return false;

        }

        function cleanupAdsAndPopups() {

            if (!document.body) return;

            // Undo scroll-locks that overlays add to the page.

            document.documentElement.style.setProperty('overflow', 'auto', 'important');

            document.body.style.setProperty('overflow', 'auto', 'important');

            try { if (getComputedStyle(document.body).position === 'fixed') document.body.style.setProperty('position', 'static', 'important'); } catch(e) {}

            ['modal-open', 'no-scroll', 'noscroll', 'overflow-hidden', 'stop-scrolling', 'sweet-alert-open', 'fc-html-overlay-active'].forEach(c => { try { document.body.classList.remove(c); document.documentElement.classList.remove(c); } catch(e) {} });

            const closeTexts = ['close ad', 'close ads', 'close', '×', 'x', '✕', 'skip ad', 'skip'];

            Array.from(document.querySelectorAll('button, a, [role="button"], span, div')).slice(0, 400).forEach(el => {

                if (isOwnUi(el) || el.dataset.thClosed === '1' || !isVisibleBox(el)) return;

                const text = getActionText(el).toLowerCase();

                if (!closeTexts.includes(text) && !text.startsWith('close ad') && !text.startsWith('skip ad')) return;

                const rect = el.getBoundingClientRect();

                if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.25) return;

                el.dataset.thClosed = '1';

                try { simulateClick(el); } catch(e) {}

            });

            Array.from(document.querySelectorAll('iframe, ins, [class*="adsbygoogle"], [id*="google_ads"], [id^="aswift"], [id^="ad_iframe"], [id*="popup"], [class*="popup"], [class*="modal"], [class*="overlay"], [class*="backdrop"], [class*="interstitial"], [aria-modal="true"]')).slice(0, 320).forEach(el => {

                if (isOwnUi(el) || !isVisibleBox(el) || hasFlowInside(el)) return;

                const meta = [el.id, el.className, el.src || ''].join(' ').toLowerCase();

                const style = getComputedStyle(el);

                const z = parseInt(style.zIndex || '0', 10) || 0;

                const rect = el.getBoundingClientRect();

                const fixedish = style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky';

                const isAdFrame = el.tagName === 'IFRAME' && /(doubleclick|googlesyndication|adservice|adnxs|taboola|outbrain|data527|adv\.so|adsterra|popads|propeller|hilltopads|monetag|onclickads|popcash)/i.test(meta);

                const isAdSlot = el.tagName === 'INS' || /(^|\W)(ad|ads|advert|adsbygoogle|popup|overlay|backdrop|interstitial|modal)(\W|$)/i.test(meta);

                const coversScreen = fixedish && rect.width >= window.innerWidth * 0.6 && rect.height >= window.innerHeight * 0.6;

                const isBlockingLayer = fixedish && z >= 100 && (rect.width > window.innerWidth * 0.45 || rect.height > window.innerHeight * 0.22);

                if (isAdFrame || isAdSlot || isBlockingLayer || coversScreen) el.style.setProperty('display', 'none', 'important');

            });

        }

        setInterval(function() {

            if (isIframe) return;

            let proxy = document.getElementById("th-proxy-btn");

            const dnsBlockMessage = getDnsBlockMessage();

            if (dnsBlockMessage) {

                showDnsBlockHelper(dnsBlockMessage);

                if (proxy) proxy.style.display = "none";

                return;

            }

            if (!S.enabled) {

                if (proxy) proxy.style.display = "none";

                return;

            }

            if (maybeHandleServerError(proxy)) return;

            // 🔒 CAPTCHA / CLOUDFLARE GUARD: if a human-verification challenge is on the page, fully pause —

            // no timer speed-up (flag read by the timer engine), no skip, no auto-click. Just show "SOLVE CAPTCHA".

            if (detectChallenge()) {

                window.th_captcha_present = true;

                clearPendingRecipe();

                window.th_gate_status = 'Captcha/Cloudflare — paused, solve it';

                rememberBrainState({ state: 'CAPTCHA', confidence: 1, reason: 'human verification detected' });

                recordSiteTrick('manual');

                if (S.pinMode) {

                    if (!proxy) {

                        proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                        proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, #d7263d, #f46036); color: white; border-radius: 10px; cursor: default;";

                        document.body.appendChild(proxy);

                    }

                    proxy.innerText = '🔒 SOLVE CAPTCHA';

                    proxy.style.top = S.topOffset + 'px';

                    proxy.style.display = 'block';

                    proxy.onclick = null;

                }

                return;

            }

            window.th_captcha_present = false;

            rememberBrainState(getPageBrainState());

            if (maybeSkipSchemeProArticle(proxy)) return;

            if (maybeRunVplinkChain(proxy)) return;

            try { if (maybeRunLearnedRecipe(proxy)) return; } catch(e) { window.th_gate_status = 'LEARNED: safe fallback'; }

            if (maybeRunUniversalPatternFlow(proxy)) return;

            window.th_skipTimersEnabled = !!S.skipTimers;

            const safeCountdownState = getSafeCountdownState();

            window.th_flowManualMode = !!(safeCountdownState.detected && isAutoFlowHost() && !S.autoClick);

            exposeSafeCountdownTarget(safeCountdownState);

            if (safeCountdownState.detected && S.aggroBypass && window.th_live_aggro_request && Date.now() - window.th_live_aggro_request < 4000) {

                finishSafeCountdown(safeCountdownState);

                window.th_live_aggro_request = 0;

            }

            const effectiveAggroBypass = !!(S.aggroBypass && !safeCountdownState.detected);

            if (effectiveAggroBypass) {

                window.isClicked = true; window.adClicked = true;

                if (typeof window.count !== "undefined") window.count = 0; if (typeof window.timer !== "undefined") window.timer = 0;

            }

            if (S.antiAdblock) cleanupAdsAndPopups();

            if (S.videoSpeed) {

                document.querySelectorAll('video, audio').forEach(m => { if(m.playbackRate != S.speed) m.playbackRate = (S.speed > 16 ? 16 : S.speed); });

            }

            const linkShortifyState = getLinkShortifyState();

            if (linkShortifyState) {

                if (!proxy && S.pinMode) {

                    proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                    proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, #5b42f3, #00ddeb); color: white; border-radius: 10px; cursor: pointer;";

                    document.body.appendChild(proxy);

                }

                if (linkShortifyState.ready) {

                    if (S.highlight) linkShortifyState.ready.style.setProperty('outline', '4px solid #00ffcc', 'important');

                    if (S.pinMode && proxy && !String(proxy.innerText || '').includes("WAITING")) {

                        proxy.innerText = "CLICK: " + getTargetLabel(linkShortifyState.ready).slice(0, 32);

                        proxy.style.top = S.topOffset + 'px'; proxy.style.display = "block";

                        proxy.onclick = () => { proxy.innerText = "⏳ WAITING..."; clickFlowTarget(linkShortifyState.ready); };

                    }

                    return;

                }

                if (linkShortifyState.needsTurnstile) {

                    if (linkShortifyState.waiting && S.pinMode && proxy) nudgeLinkShortifyTimer(proxy);

                    if (S.pinMode && proxy) {

                        proxy.innerText = 'SOLVE TURNSTILE';

                        proxy.style.top = S.topOffset + 'px';

                        proxy.style.display = 'block';

                        proxy.onclick = null;

                    }

                    window.th_gate_status = 'Final page: Turnstile required';

                    return;

                }

                if (linkShortifyState.waiting && S.pinMode && proxy) nudgeLinkShortifyTimer(proxy);

                if (linkShortifyState.waiting) return;

            }

            if (safeCountdownState.detected) {

                // Stuck-timer auto-recovery: if the visible countdown value has not changed for several loop ticks

                // (e.g. an ad callback never fired, or it is a server/perf timer we cannot speed), force the gate to finish.

                if (safeCountdownState.timerValue !== null && safeCountdownState.timerValue > 0) {

                    if (window.th_stuck_val === safeCountdownState.timerValue) window.th_stuck_count = (window.th_stuck_count || 0) + 1;

                    else { window.th_stuck_val = safeCountdownState.timerValue; window.th_stuck_count = 0; }

                    if ((window.th_stuck_count || 0) >= getStuckThreshold()) {

                        finishSafeCountdown(safeCountdownState);

                        recordSiteTrick('force');

                        window.th_gate_status = 'Timer stuck → forced finish';

                        window.th_stuck_count = 0;

                    }

                } else {

                    window.th_stuck_count = 0;

                }

                if (!proxy && S.pinMode) {

                    proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                    proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, rgb(255, 0, 85), rgb(255, 170, 0)); color: white; border-radius: 10px; cursor: pointer;";

                    document.body.appendChild(proxy);

                }

                if (safeCountdownState.ready) {

                    recordSiteTrick('timer');

                    if (S.highlight) safeCountdownState.ready.style.setProperty('outline', '4px solid #00ffcc', 'important');

                    if (S.pinMode && proxy && !String(proxy.innerText || '').includes("WAITING")) {

                        proxy.innerText = "CLICK: " + getTargetLabel(safeCountdownState.ready).slice(0, 32);

                        proxy.style.top = S.topOffset + 'px'; proxy.style.display = "block";

                        proxy.onclick = () => { proxy.innerText = "WAITING..."; clickFlowTarget(safeCountdownState.ready, true); };

                    }

                    if (isFinalVplinkTarget(safeCountdownState.ready)) {

                        window.th_gate_status = 'Final link ready: manual click';

                    } else if (shouldAutoFlow()) {

                        const key = getTargetKey(safeCountdownState.ready);

                        const last = window.th_click_cooldowns[key] || 0;

                        if (Date.now() - last > 12000) {

                            window.th_click_cooldowns[key] = Date.now();

                            setTimeout(() => {

                                if (S.enabled && shouldAutoFlow() && document.contains(safeCountdownState.ready) && isVisibleAction(safeCountdownState.ready) && !isDisabledAction(safeCountdownState.ready)) clickFlowTarget(safeCountdownState.ready);

                            }, 450);

                        }

                    }

                    return;

                }

                if (S.pinMode && proxy && !String(proxy.innerText || '').includes("WAITING")) {

                    proxy.innerText = safeCountdownState.timerValue !== null ? ("FAST TIMER: " + safeCountdownState.timerValue + "s") : "FAST TIMER...";

                    proxy.style.top = S.topOffset + 'px'; proxy.style.display = "block";

                }

                return;

            }

            const best = findBestActionTarget();

            if (!best) {

                if (proxy && !String(proxy.innerText || '').includes("WAITING")) proxy.style.display = "none";

                return;

            }

            const targetKey = getTargetKey(best);

            if (targetKey && targetKey !== window.th_auto_target_key) {

                window.th_auto_target_key = targetKey;

                window.th_auto_executed = false;

            }

            if (S.highlight) best.style.setProperty('outline', '4px solid #00ffcc', 'important');

            if (S.pinMode) {

                if (!proxy) {

                    proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                    proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, #ff0055, #ffaa00); color: white; border-radius: 10px; cursor: pointer;";

                    document.body.appendChild(proxy);

                }

                if (!String(proxy.innerText || '').includes("WAITING") && !String(proxy.innerText || '').includes("AUTO-CLICKING")) proxy.innerText = "CLICK: " + getTargetLabel(best).slice(0, 32);

                proxy.style.top = S.topOffset + 'px'; proxy.style.display = "block";

                proxy.onclick = () => { proxy.innerText = "⏳ WAITING..."; if (isSmartVerifyTarget(best, getActionText(best).toLowerCase())) armSmartGate(best); clickFlowTarget(best, true); setTimeout(() => { proxy.innerText = "CLICK: " + getTargetLabel(best).slice(0, 32); }, 3000); };

            }

            // 🔥 FIXED AUTO-CLICK: target-level lock plus delayed safety checks

            if (shouldAutoFlow() && !isFinalVplinkTarget(best) && !window.th_auto_executed && best.dataset.thDone !== "1") {

                const t = getActionText(best).toLowerCase();

                if (isValidActionTarget(best)) {

                    const cooldownKey = getTargetKey(best);

                    if (window.th_click_cooldowns[cooldownKey] && Date.now() - window.th_click_cooldowns[cooldownKey] < 8000) return;

                    best.dataset.thDone = "1"; // Lock element

                    window.th_auto_executed = true; // Lock page

                    setTimeout(() => {

                        const latestText = getActionText(best).toLowerCase();

                        if (!S.enabled || !shouldAutoFlow() || !document.contains(best) || !isValidActionTarget(best) || INVALID_TARGET_TEXT.some(k => latestText.includes(k))) return;

                        if(proxy) proxy.innerText = "⏳ AUTO-CLICKING...";

                        window.th_click_cooldowns[cooldownKey] = Date.now();

                        if (isSmartVerifyTarget(best, latestText)) armSmartGate(best);

                        clickFlowTarget(best);

                        setTimeout(() => { if(proxy) proxy.innerText = "CLICK: " + getTargetLabel(best).slice(0, 32); }, 3000);

                    }, 1000);

                }

            }

        }, 1500);

    };

    const scriptEl = document.createElement('script');

    scriptEl.textContent = `(${mainPageLogic.toString()})(${JSON.stringify(savedData || null)}, ${JSON.stringify(remoteRulesCached || null)});`;

    (document.head || document.documentElement).appendChild(scriptEl);

    scriptEl.remove();

    // Background, throttled remote-rules refresh. Runs in the userscript sandbox (GM_xmlhttpRequest only exists here),

    // fully guarded, size-limited and validated. Never blocks the page; only updates the cache for the NEXT load.

    try {

        const lastTs = parseInt(GM_getValue(REMOTE_TS_KEY) || '0', 10) || 0;

        if (REMOTE_RULES_URL && (Date.now() - lastTs > REMOTE_REFRESH_MS) && typeof GM_xmlhttpRequest === 'function') {

            GM_xmlhttpRequest({

                method: 'GET',

                url: REMOTE_RULES_URL,

                timeout: 15000,

                onload: function(res) {

                    try {

                        if (res && res.status >= 200 && res.status < 300 && typeof res.responseText === 'string' && res.responseText.length < 200000) {

                            const parsed = JSON.parse(res.responseText);

                            if (parsed && typeof parsed === 'object' && parsed.sites && typeof parsed.sites === 'object') {

                                GM_setValue(REMOTE_CACHE_KEY, JSON.stringify(parsed));

                            }

                        }

                    } catch(e) {}

                    try { GM_setValue(REMOTE_TS_KEY, String(Date.now())); } catch(e) {}

                },

                onerror: function() { try { GM_setValue(REMOTE_TS_KEY, String(Date.now())); } catch(e) {} },

                ontimeout: function() { try { GM_setValue(REMOTE_TS_KEY, String(Date.now())); } catch(e) {} }

            });

        }

    } catch(e) {}

})();
