// ==UserScript==

// @name            Time Hooker (V39.0 - StartupLearners Step-State Fix)

// @namespace       https://tampermonkey.net/

// @version         39.0

// @description     Adds conservative StartupLearners step-state guards so VPlink-style flows do not spin on repeated Step 1/3 pages.

// @author          rehan & Pankaj034

// @match           *://*/*

// @match           file:///*

// @run-at          document-start

// @grant           GM_setValue

// @grant           GM_getValue

// @license         GPL-3.0-or-later

// ==/UserScript==

(function() {

    'use strict';

    const STORAGE_KEY = "th_v19_global_settings";



    window.addEventListener('TH_SAVE_GLOBAL', function(e) {

        try {

            GM_setValue(STORAGE_KEY, JSON.stringify(e.detail || {}));

        } catch(e) {}

    });

    let savedData = GM_getValue(STORAGE_KEY);

    const mainPageLogic = function(savedStr) {

        const isIframe = window.top !== window.self;

        const DEFAULTS = { enabled: false, skipTimers: true, speed: 15, aggroBypass: true, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: true, autoClick: false, autoFlowSkip: false, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0, menuLeft: '', menuTop: '', menuExpanded: true };

        const PROFILE_KEYS = ['enabled', 'skipTimers', 'speed', 'aggroBypass', 'smartVerifyFlow', 'waitUntilTimerMoves', 'safeCountdownMode', 'videoSpeed', 'autoClick', 'autoFlowSkip', 'antiAdblock', 'highlight', 'pinMode', 'topOffset'];

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

            'vplink.in': { enabled: true, skipTimers: true, speed: 15, aggroBypass: false, smartVerifyFlow: false, waitUntilTimerMoves: false, safeCountdownMode: true, videoSpeed: false, autoClick: false, autoFlowSkip: true, antiAdblock: true, highlight: true, pinMode: true, topOffset: 0 }

        };

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

                    macros: (parsed.macros && typeof parsed.macros === 'object') ? parsed.macros : {}

                };

            }

            return { global: Object.assign({}, DEFAULTS, parsed || {}), profiles: {}, disabledBuiltins: {}, macros: {} };

        }

        function pickProfile(s) {

            const p = {};

            PROFILE_KEYS.forEach(k => { p[k] = s[k]; });

            return p;

        }

        let store = normalizeStore(savedStr);

        let activeProfile = !!(store.profiles && store.profiles[SITE_KEY]);

        let suggestedProfile = !activeProfile && !!BUILTIN_SITE_PROFILES[SITE_KEY] && !(store.disabledBuiltins && store.disabledBuiltins[SITE_KEY]);

        let S = Object.assign({}, DEFAULTS, store.global, suggestedProfile ? BUILTIN_SITE_PROFILES[SITE_KEY] : {}, activeProfile ? store.profiles[SITE_KEY] : {});

        if (activeProfile && store.profiles[SITE_KEY] && !Object.prototype.hasOwnProperty.call(store.profiles[SITE_KEY], 'autoFlowSkip') && BUILTIN_SITE_PROFILES[SITE_KEY]) {

            S.autoFlowSkip = !!BUILTIN_SITE_PROFILES[SITE_KEY].autoFlowSkip;

        }

        S.smartVerifyFlow = false;

        S.waitUntilTimerMoves = false;

        function saveStore() {

            window.dispatchEvent(new CustomEvent('TH_SAVE_GLOBAL', { detail: JSON.parse(JSON.stringify(store)) }));

        }

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

                    <span style="font-weight:900; color:#00ffcc; font-size:14px;">⚡ Time Hooker V39.0</span>

                    <button id="th-toggle-btn" style="all:unset; cursor:pointer; background:rgba(255,255,255,0.15); border-radius:6px; padding:2px 10px;">${S.menuExpanded ? '−' : '+'}</button>

                </div>

                <div id="th-content" style="display:${S.menuExpanded ? 'flex' : 'none'}; flex-direction:column; gap:8px;">

                    <button id="th-master-btn" style="all:unset; cursor:pointer; text-align:center; border-radius:8px; padding:10px; font-weight:900; letter-spacing:0; background:${S.enabled ? 'linear-gradient(90deg,#00c781,#00a8ff)' : 'linear-gradient(90deg,#444,#222)'}; color:white; border:1px solid rgba(255,255,255,0.18);">${S.enabled ? 'SCRIPT ON' : 'SCRIPT OFF'}</button>

                    <div id="th-profile-status" style="display:none;">Profile: ${activeProfile ? 'this site' : (suggestedProfile ? 'suggested' : 'global')} (${SITE_KEY})</div>

                    <div id="th-gate-status" style="display:none;">${window.th_gate_status || 'Macro: idle'}</div>

                    <label style="display:flex; gap:8px; cursor:pointer;"><input type="checkbox" id="t-skip" ${S.skipTimers?'checked':''}><span style="color:#00ffcc; font-weight:bold;">[✓] Fast-Forward Timers</span></label>

                    <div style="margin-top:4px;"><div style="display:flex; justify-content:space-between; font-size:12px; color:#ccc;"><span>Timer Speed</span><span id="t-speed-label">${S.speed}x</span></div><input type="range" id="t-speed" min="1" max="50" value="${S.speed}" style="width:100%; accent-color:#00ffcc;"></div>

                    <label><input type="checkbox" id="t-video" ${S.videoSpeed?'checked':''}> Video Fast Forward</label>

                    <label><input type="checkbox" id="t-aggro" ${S.aggroBypass?'checked':''}> Aggro Bypass</label>

                    <label><input type="checkbox" id="t-antiad" ${S.antiAdblock?'checked':''}> Kill Ad Overlays</label>

                    <label style="color:#ffffff; font-weight:bold;"><input type="checkbox" id="t-autoclick" ${S.autoClick?'checked':''}> [✓] Auto Click Target</label>

                    <label style="color:#9ee9ff; font-weight:bold;"><input type="checkbox" id="t-flow" ${S.autoFlowSkip?'checked':''}> Auto Flow Skip</label>

                    <label><input type="checkbox" id="t-highlight" ${S.highlight?'checked':''}> Highlight Original</label>

                    <label><input type="checkbox" id="t-pin" ${S.pinMode?'checked':''}> Pin Fake Button</label>

                    <input type="range" id="t-pos" min="0" max="400" value="${S.topOffset}" style="width:100%; accent-color:#00ffcc;">

                    <div style="background:rgba(0,168,255,0.10); border:1px solid rgba(0,168,255,0.32); border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;">

                        <div style="font-size:11px; font-weight:900; color:#9ee9ff; text-align:center;">SITE MACRO</div>

                        <select id="th-macro-select" style="width:100%; background:#181a22; color:#fff; border:1px solid #3a3d4c; border-radius:6px; padding:6px; font-size:11px;"></select>

                        <select id="th-macro-speed" style="width:100%; background:#181a22; color:#fff; border:1px solid #3a3d4c; border-radius:6px; padding:6px; font-size:11px;">

                            <option value="1">Play speed: Normal</option>

                            <option value="2">Play speed: 2x</option>

                            <option value="5">Play speed: 5x</option>

                        </select>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">

                            <button id="th-record-macro" style="all:unset; cursor:pointer; text-align:center; background:#e84972; color:#fff; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">Record</button>

                            <button id="th-stop-macro" style="all:unset; cursor:pointer; text-align:center; background:#444; color:#fff; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">Stop & Save</button>

                            <button id="th-play-macro" style="all:unset; cursor:pointer; text-align:center; background:#00c781; color:#fff; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">Play</button>

                            <button id="th-delete-macro" style="all:unset; cursor:pointer; text-align:center; background:#333; color:#fff; border-radius:6px; padding:7px 4px; font-weight:900; font-size:11px;">Delete</button>

                        </div>

                    </div>

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

                if (status) status.textContent = `Profile: ${activeProfile ? 'this site' : (suggestedProfile ? 'suggested' : 'global')} (${SITE_KEY})`;

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

            bind("t-skip", "skipTimers"); bind("t-aggro", "aggroBypass"); bind("t-video", "videoSpeed"); bind("t-antiad", "antiAdblock"); bind("t-autoclick", "autoClick"); bind("t-flow", "autoFlowSkip"); bind("t-highlight", "highlight"); bind("t-pin", "pinMode");

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

                $("t-autoclick").checked = !!S.autoClick;

                $("t-flow").checked = !!S.autoFlowSkip;

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

                if (status) status.textContent = window.th_gate_status || "Macro: idle";

            }, 1000);

            function refreshMacroSelect() {

                const sel = $("th-macro-select");

                if (!sel) return;

                const macros = getSiteMacros();

                sel.innerHTML = macros.length ? macros.map((m, i) => `<option value="${i}">${m.name || ('Macro ' + (i + 1))} (${(m.steps || []).length})</option>`).join('') : '<option value="-1">No saved macro</option>';

            }

            $("th-record-macro").onclick = () => { startMacroRecording(); refreshMacroSelect(); };

            $("th-stop-macro").onclick = () => { stopAndSaveMacro(); refreshMacroSelect(); };

            $("th-play-macro").onclick = () => { playSelectedMacro(parseInt($("th-macro-select").value, 10), parseFloat($("th-macro-speed").value || '1')); };

            $("th-delete-macro").onclick = () => { deleteSelectedMacro(parseInt($("th-macro-select").value, 10)); refreshMacroSelect(); };

            refreshMacroSelect();

        }

        if (!isIframe) {

            if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createFloatingMenu); else createFloatingMenu();

        }

        // --- CLICKER LOGIC ---

        function simulateClick(el) {

            if (!el) return;

            ['pointerdown','mousedown','mouseup','pointerup'].forEach(ev => el.dispatchEvent(new PointerEvent(ev, { bubbles: true, cancelable: true, view: window })));

            el.click();

        }

        function isAutoFlowHost() {

            return /(^|\.)((vplink\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(location.hostname);

        }

        function shouldAutoFlow() {

            return !!(S.enabled && S.autoClick);

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

            if (isFinalVplinkTarget(el) && !manualFinal) {

                window.th_gate_status = 'Final link ready: manual click';

                return;

            }

            if (isTelegramHref(href) || (location.hostname === 'vplink.in' && /get-?link|gt-link/i.test(el.id || '') && href)) {

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

                    if (found && isVisibleMacroTarget(found) && !isTimeHookerUi(found)) return found;

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

            return /(^|\.)((vplink\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(location.hostname);

        }

        function getVplinkAlias() {

            const cookieAlias = getCookieValue('gt_uc_') || getCookieValue('user_in');

            if (cookieAlias) return cookieAlias;

            const query = location.search || '';

            const m = query.match(/(?:^|[?&])[^=]*=([A-Za-z0-9_-]{5,})/);

            if (m) return m[1];

            const path = location.pathname.split('/').filter(Boolean).pop() || '';

            return /^[A-Za-z0-9_-]{5,}$/.test(path) ? path : 'unknown';

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

                return /(^|\.)((vplink\.in)|(darkguruji\.com)|(startuplearners\.com)|(privatejobbeta\.com)|(rempo\.xyz)|(genas\.xyz))$/i.test(u.hostname);

            } catch(e) { return false; }

        }

        function getFlowTraceKey() {

            return 'th_vplink_flow_' + getVplinkAlias();

        }

        function getFlowTrace() {

            try {

                const trace = JSON.parse(sessionStorage.getItem(getFlowTraceKey()) || '[]');

                return Array.isArray(trace) ? trace : [];

            } catch(e) { return []; }

        }

        function countFlowVisits(url) {

            const normalized = normalizeFlowUrl(url);

            if (!normalized) return 0;

            return getFlowTrace().filter(item => item && item.to === normalized).length;

        }

        function rememberFlowHop(to, label) {

            try {

                const trace = getFlowTrace();

                trace.push({ from: normalizeFlowUrl(location.href), to: normalizeFlowUrl(to), label: label || '', at: Date.now() });

                sessionStorage.setItem(getFlowTraceKey(), JSON.stringify(trace.slice(-14)));

            } catch(e) {}

        }

        function getStepStateKey() {

            return 'th_vplink_step_state_' + getVplinkAlias();

        }

        function getStepState() {

            try {

                const state = JSON.parse(sessionStorage.getItem(getStepStateKey()) || '{}');

                if (!state || typeof state !== 'object') return {};

                if (state.updatedAt && Date.now() - state.updatedAt > 30 * 60 * 1000) return {};

                state.counts = (state.counts && typeof state.counts === 'object') ? state.counts : {};

                return state;

            } catch(e) { return {}; }

        }

        function saveStepState(state) {

            try {

                state.updatedAt = Date.now();

                sessionStorage.setItem(getStepStateKey(), JSON.stringify(state));

            } catch(e) {}

        }

        function getStepSignature(info) {

            const step = info && info.current && info.total ? (info.current + '/' + info.total) : 'unknown';

            return [location.hostname, step].join('|');

        }

        function rememberStepVisit(info) {

            const state = getStepState();

            const signature = getStepSignature(info);

            const url = normalizeFlowUrl(location.href);

            if (state.lastStepUrl !== url || state.lastStepSignature !== signature) {

                state.counts[signature] = (state.counts[signature] || 0) + 1;

                state.lastStepUrl = url;

                state.lastStepSignature = signature;

                saveStepState(state);

            }

            return { state, signature, visits: state.counts[signature] || 1 };

        }

        function markStepVerified(info, href) {

            const state = getStepState();

            state.verified = {

                signature: getStepSignature(info),

                url: normalizeFlowUrl(location.href),

                href: normalizeFlowUrl(href || ''),

                at: Date.now()

            };

            saveStepState(state);

            return state.verified;

        }

        function getStepVerified(info, href) {

            const state = getStepState();

            const verified = state.verified || {};

            const normalizedHref = normalizeFlowUrl(href || '');

            if (verified.signature !== getStepSignature(info)) return null;

            if (verified.url !== normalizeFlowUrl(location.href)) return null;

            if (normalizedHref && verified.href && verified.href !== normalizedHref) return null;

            return verified;

        }

        function blockStepAutomation(info) {

            const state = getStepState();

            state.blockedSignature = getStepSignature(info);

            saveStepState(state);

        }

        function isStepAutomationBlocked(info) {

            const state = getStepState();

            return state.blockedSignature === getStepSignature(info);

        }

        function setStartupLearnersCompatGate() {

            if (!/startuplearners\.com$/i.test(location.hostname)) return;

            try {

                document.cookie = "eonudb=insurance,online_colleges,study_abroad,finance,loan; max-age=200; path=/;";

                localStorage.setItem("iorghupt", String(Date.now() - 12000));

            } catch(e) {}

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

                setProxyStatus(proxy, 'FLOW LOOP: manual');

                return true;

            }

            rememberFlowHop(target, label);

            window.th_gate_status = label || 'FLOW: next';

            setProxyStatus(proxy, label || 'FLOW: next');

            (window.th_nativeSetTimeout || setTimeout)(() => {

                if (shouldSkipFlow()) location.href = target;

            }, 300);

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

        function maybeRunVplinkChain(proxy) {

            if (!shouldSkipFlow() || !isVplinkChainHost()) return false;

            const redirectTarget = getScriptRedirectTarget();

            if (redirectTarget && isSafeVplinkFlowUrl(redirectTarget)) {

                return navigateFlowUrl(redirectTarget, 'FLOW: redirect', proxy);

            }

            const stepInfo = getStepFlowInfo();

            if (stepInfo) {

                prepareStepFlow(stepInfo);

                setStartupLearnersCompatGate();

                const stepLabel = stepInfo.current && stepInfo.total ? ('FLOW: Step ' + stepInfo.current + '/' + stepInfo.total) : 'FLOW: verify';

                const stepVisit = rememberStepVisit(stepInfo);

                proxy = setProxyStatus(proxy, stepLabel);

                window.th_gate_status = stepLabel;

                if (proxy) {

                    proxy.onclick = () => {

                        if (stepInfo.btn6 && document.contains(stepInfo.btn6)) {

                            try { if (typeof window.nextbtn === 'function') window.nextbtn(); else simulateClick(stepInfo.btn6); } catch(e) { simulateClick(stepInfo.btn6); }

                            return;

                        }

                        if (stepInfo.btn7 && document.contains(stepInfo.btn7)) clickIntermediateFlowTarget(stepInfo.btn7);

                    };

                }

                if (isStepAutomationBlocked(stepInfo) || stepVisit.visits >= 4) {

                    blockStepAutomation(stepInfo);

                    window.th_gate_status = 'STEP LOOP: manual';

                    setProxyStatus(proxy, 'STEP LOOP: manual');

                    return true;

                }

                if (stepInfo.btn6 && !stepInfo.btn6.dataset.thFlowClicked) {

                    stepInfo.btn6.dataset.thFlowClicked = '1';

                    (window.th_nativeSetTimeout || setTimeout)(() => {

                        if (!shouldSkipFlow() || !document.contains(stepInfo.btn6)) return;

                        try { if (typeof window.nextbtn === 'function') window.nextbtn(); else simulateClick(stepInfo.btn6); } catch(e) { simulateClick(stepInfo.btn6); }

                        markStepVerified(stepInfo, stepInfo.btn7 && stepInfo.btn7.href);

                    }, 250);

                    window.th_gate_status = stepLabel + ' verify';

                    setProxyStatus(proxy, stepLabel + ' verify');

                    return true;

                }

                if (stepInfo.btn7) {

                    const href = stepInfo.btn7.href || '';

                    if (isTelegramHref(href) || /vplink\.in\/(?:links\/go|go|final)/i.test(href)) {

                        window.th_gate_status = 'FINAL LINK: manual';

                        setProxyStatus(proxy, 'FINAL LINK: manual');

                        return true;

                    }

                    const verified = getStepVerified(stepInfo, href);

                    if (!verified || Date.now() - verified.at < 3000) {

                        window.th_gate_status = stepLabel + ' waiting state';

                        setProxyStatus(proxy, stepLabel + ' waiting');

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

        function cleanupAdsAndPopups() {

            if (!document.body) return;

            document.documentElement.style.setProperty('overflow', 'auto', 'important');

            document.body.style.setProperty('overflow', 'auto', 'important');

            const closeTexts = ['close ad', 'close ads', 'close', '×', 'x', '✕'];

            Array.from(document.querySelectorAll('button, a, [role="button"], span, div')).slice(0, 350).forEach(el => {

                if (isOwnUi(el) || el.dataset.thClosed === '1' || !isVisibleBox(el)) return;

                const text = getActionText(el).toLowerCase();

                if (!closeTexts.includes(text) && !text.startsWith('close ad')) return;

                const rect = el.getBoundingClientRect();

                if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.25) return;

                el.dataset.thClosed = '1';

                try { simulateClick(el); } catch(e) {}

            });

            Array.from(document.querySelectorAll('iframe, ins, [class*="adsbygoogle"], [id*="google_ads"], [id^="google_ads"], [id^="aswift"], [id^="ad_iframe"], [class*="popup"], [class*="modal"], [class*="overlay"]')).slice(0, 250).forEach(el => {

                if (isOwnUi(el) || !isVisibleBox(el)) return;

                const meta = [el.id, el.className, el.src || ''].join(' ').toLowerCase();

                const style = getComputedStyle(el);

                const z = parseInt(style.zIndex || '0', 10) || 0;

                const rect = el.getBoundingClientRect();

                const isAdFrame = el.tagName === 'IFRAME' && /(doubleclick|googlesyndication|adservice|adnxs|taboola|outbrain|data527|adv\.so|adsterra|popads)/i.test(meta);

                const isAdSlot = el.tagName === 'INS' || /(^|\W)(ad|ads|advert|adsbygoogle|popup|overlay)(\W|$)/i.test(meta);

                const isBlockingLayer = z > 999 && (style.position === 'fixed' || style.position === 'absolute') && (rect.width > window.innerWidth * 0.45 || rect.height > window.innerHeight * 0.22);

                if (isAdFrame || isAdSlot || isBlockingLayer) el.style.setProperty('display', 'none', 'important');

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

            if (maybeSkipSchemeProArticle(proxy)) return;

            if (maybeRunVplinkChain(proxy)) return;

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

                    if (S.pinMode && proxy && !proxy.innerText.includes("WAITING")) {

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

                if (!proxy && S.pinMode) {

                    proxy = document.createElement("button"); proxy.id = "th-proxy-btn";

                    proxy.style.cssText = "position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 2147483647; padding: 15px 30px; font-weight: bold; background: linear-gradient(90deg, rgb(255, 0, 85), rgb(255, 170, 0)); color: white; border-radius: 10px; cursor: pointer;";

                    document.body.appendChild(proxy);

                }

                if (safeCountdownState.ready) {

                    if (S.highlight) safeCountdownState.ready.style.setProperty('outline', '4px solid #00ffcc', 'important');

                    if (S.pinMode && proxy && !proxy.innerText.includes("WAITING")) {

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

                if (S.pinMode && proxy && !proxy.innerText.includes("WAITING")) {

                    proxy.innerText = safeCountdownState.timerValue !== null ? ("FAST TIMER: " + safeCountdownState.timerValue + "s") : "FAST TIMER...";

                    proxy.style.top = S.topOffset + 'px'; proxy.style.display = "block";

                }

                return;

            }

            const best = findBestActionTarget();

            if (!best) {

                if (proxy && !proxy.innerText.includes("WAITING")) proxy.style.display = "none";

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

                if (!proxy.innerText.includes("WAITING") && !proxy.innerText.includes("AUTO-CLICKING")) proxy.innerText = "CLICK: " + getTargetLabel(best).slice(0, 32);

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

    scriptEl.textContent = `(${mainPageLogic.toString()})(${JSON.stringify(savedData || null)});`;

    (document.head || document.documentElement).appendChild(scriptEl);

    scriptEl.remove();

})();
