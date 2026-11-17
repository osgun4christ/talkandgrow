/* Talk & Grow — core: storage, sync, records, sign-in, layout, small UI helpers. */
(function () {
  'use strict';
  var C = window.TG_CONTENT;
  var CFG = window.TG_CONFIG || {};
  var TG = window.TG = {};
  TG.C = C;

  /* ------------------------------------------------------------ utilities */
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dstr(new Date()); }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function parseD(s) { var p = String(s || '').split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
  function addDays(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); }
  function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(s, withYear) {
    if (!s) return '';
    var d = parseD(s), t = today();
    if (s === t) return 'Today';
    if (s === addDays(t, -1)) return 'Yesterday';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + (withYear || d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  }
  function ageMonths(birth, at) {
    if (!birth) return null;
    var b = parseD(birth), a = at ? parseD(at) : new Date();
    var m = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
    if (a.getDate() < b.getDate()) m--;
    return Math.max(0, m);
  }
  function ageText(m) {
    if (m === null || m === undefined) return '';
    if (m < 24) return m + ' months';
    var y = Math.floor(m / 12), r = m % 12;
    return y + ' year' + (y > 1 ? 's' : '') + (r ? ' ' + r + ' month' + (r > 1 ? 's' : '') : '');
  }
  function weekKey(s) { // Monday-start week id
    var d = parseD(s || today()); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dstr(d);
  }
  function seeded(seedStr) { var h = 2166136261; for (var i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function plural(n, w, p) { return n + ' ' + (n === 1 ? w : (p || w + 's')); }
  function sum(a) { return a.reduce(function (x, y) { return x + (+y || 0); }, 0); }

  async function sha256Hex(s) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  async function pinHash(pin, salt) { var h = String(pin); for (var i = 0; i < 100; i++) h = await sha256Hex(salt + ':' + h); return h; }

  Object.assign(TG, { esc: esc, uid: uid, today: today, nowTime: nowTime, parseD: parseD, dstr: dstr, addDays: addDays, daysBetween: daysBetween,
    fmtDate: fmtDate, ageMonths: ageMonths, ageText: ageText, weekKey: weekKey, seeded: seeded, byId: byId, plural: plural, sum: sum, MONTHS: MONTHS });

  /* ------------------------------------------------------------ storage (IndexedDB, falls back to localStorage) */
  var DBNAME = 'talk-and-grow', KEY = 'state';
  var idb = null;
  function openDb() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open(DBNAME, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { idb = r.result; res(); };
        r.onerror = function () { res(); };
      } catch (e) { res(); }
    });
  }
  function dbGet() {
    return new Promise(function (res) {
      if (!idb) { try { res(JSON.parse(localStorage.getItem(DBNAME) || 'null')); } catch (e) { res(null); } return; }
      var tx = idb.transaction('kv', 'readonly').objectStore('kv').get(KEY);
      tx.onsuccess = function () { res(tx.result || null); };
      tx.onerror = function () { res(null); };
    });
  }
  var saveTimer = null;
  function persist(now) {
    clearTimeout(saveTimer);
    var go = function () {
      var copy = JSON.parse(JSON.stringify(S));
      if (idb) { try { idb.transaction('kv', 'readwrite').objectStore('kv').put(copy, KEY); return; } catch (e) {} }
      try { localStorage.setItem(DBNAME, JSON.stringify(copy)); } catch (e) { toast('This device is out of storage space.'); }
    };
    if (now) go(); else saveTimer = setTimeout(go, 250);
  }

  /* ------------------------------------------------------------ state */
  var S = {
    v: 1, mode: '', api: '', device: null, familyName: '', users: [], records: {}, queue: [], rejected: [],
    lastPull: '', lastSync: '', settings: { masteryPercent: 80, masterySessions: 3 },
    session: null, childId: '', prefs: { theme: 'auto', faith: false }, seen: {}
  };
  TG.S = function () { return S; };

  function isGas() { return typeof google !== 'undefined' && google.script && google.script.run; }
  TG.isGas = isGas;

  /* ------------------------------------------------------------ server calls */
  function api(action, body) {
    var payload = Object.assign({ action: action }, body || {});
    if (S.device) { payload.deviceId = S.device.id; payload.deviceKey = S.device.key; }
    if (isGas()) {
      return new Promise(function (res, rej) {
        google.script.run.withSuccessHandler(function (t) { try { res(JSON.parse(t)); } catch (e) { rej(new Error('Bad answer from the server')); } })
          .withFailureHandler(function (e) { rej(new Error((e && e.message) || 'Server error')); }).apiRun(JSON.stringify(payload));
      });
    }
    var url = S.api;
    if (!url) return Promise.reject(new Error('No server address yet.'));
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        try { return JSON.parse(t); }
        catch (e) {
          if (/accounts\.google|ServiceLogin/i.test(t)) throw new Error('Google asked for a sign-in. In Apps Script set "Who has access" to Anyone and deploy a new version.');
          throw new Error('The server address is not your Apps Script web app (it must end in /exec).');
        }
      });
  }
  TG.api = api;

  /* ------------------------------------------------------------ sync */
  var syncing = false, syncTimer = null;
  function online() { return navigator.onLine !== false; }
  function scheduleSync(ms) { clearTimeout(syncTimer); syncTimer = setTimeout(function () { sync(); }, ms === undefined ? 3000 : ms); }

  async function sync(manual) {
    if (S.mode !== 'live' || !S.device || syncing) { renderStatus(); return; }
    if (!online()) { renderStatus(); if (manual) toast('No internet. Your entries are safe on this device.'); return; }
    syncing = true; renderStatus();
    try {
      while (S.queue.length) {
        var ids = S.queue.slice(0, 200);
        var sent = {};
        var batch = ids.map(function (id) { return S.records[id]; }).filter(Boolean).map(function (x) { sent[x.id] = x.ua; return outRecord(x); });
        S.queue = S.queue.filter(function (id) { return !!S.records[id]; });
        if (!batch.length) break;
        var r = await api('push', { records: batch });
        if (!r.ok) throw new Error(r.message || r.error);
        var done = {};
        r.accepted.forEach(function (id) { done[id] = 1; });
        (r.rejected || []).forEach(function (x) {
          done[x.id] = 1;
          S.rejected.push({ id: x.id, error: x.error, at: new Date().toISOString(), record: S.records[x.id] });
        });
        // keep anything edited again while it was being sent
        S.queue = S.queue.filter(function (id) { return !done[id] || (S.records[id] && S.records[id].ua !== sent[id]); });
        if (!r.accepted.length && !(r.rejected || []).length) break;
      }
      var p = await api('pull', { since: S.lastPull });
      if (!p.ok) {
        if (p.error === 'DEVICE') { toast('This device was disconnected. Connect again with the family code.'); S.device = null; persist(true); route(); return; }
        throw new Error(p.message || p.error);
      }
      mergePull(p);
      S.lastPull = p.serverTime; S.lastSync = new Date().toISOString();
      persist();
      if (manual) toast('Synced ✓');
      if (p.records.length) rerenderSoft();
    } catch (e) {
      if (manual) toast('Sync failed: ' + e.message);
      S.syncError = e.message;
    } finally {
      syncing = false; renderStatus();
    }
  }
  TG.sync = sync;

  function mergePull(p) {
    if (p.users) S.users = p.users;
    if (p.settings) { S.settings = Object.assign(S.settings, p.settings); if (p.settings.familyName) S.familyName = p.settings.familyName; }
    (p.records || []).forEach(function (r) {
      if (S.queue.indexOf(r.id) >= 0) { var mine = S.records[r.id]; if (mine && mine.ua > r.ua) return; }
      S.records[r.id] = { id: r.id, type: r.type, childId: r.childId || '', date: r.date || '', summary: r.summary || '', data: r.data || {},
        by: r.by, at: r.at, ub: r.ub || r.by, ua: r.ua || r.at, del: !!r.del };
    });
  }
  function outRecord(r) { return { id: r.id, type: r.type, childId: r.childId, date: r.date, summary: r.summary, data: r.data, by: r.by, at: r.at, ub: r.ub, ua: r.ua, del: !!r.del }; }

  /* ------------------------------------------------------------ records */
  function me() { return S.session && byId(S.users, S.session.userId); }
  TG.me = me;
  function userName(id) { var u = byId(S.users, id); return u ? u.name : 'Someone'; }
  function userColor(id) { var u = byId(S.users, id); return u ? u.color : '#888'; }
  TG.userName = userName; TG.userColor = userColor;

  function save(type, data, opt) {
    opt = opt || {};
    var who = (me() || {}).id;
    var now = new Date().toISOString();
    var id = opt.id || uid();
    var old = S.records[id];
    var r = old ? Object.assign({}, old) : { id: id, type: type, by: who, at: now };
    r.type = type;
    r.childId = opt.childId !== undefined ? opt.childId : (old ? old.childId : S.childId);
    r.date = opt.date || (old && old.date) || today();
    r.data = data;
    r.summary = (opt.summary || summarize(type, data)).slice(0, 200);
    r.ub = who; r.ua = now; r.del = false;
    S.records[id] = r;
    if (S.mode === 'live' && S.queue.indexOf(id) < 0) S.queue.push(id);
    persist(); scheduleSync();
    return r;
  }
  function remove(id) {
    var r = S.records[id]; if (!r) return;
    r.del = true; r.ub = (me() || {}).id; r.ua = new Date().toISOString();
    if (S.mode === 'live' && S.queue.indexOf(id) < 0) S.queue.push(id);
    persist(); scheduleSync();
  }
  function restore(id) { var r = S.records[id]; if (r) { save(r.type, r.data, { id: id, date: r.date, childId: r.childId, summary: r.summary }); } }
  function list(type, childId) {
    var out = [];
    for (var k in S.records) {
      var r = S.records[k];
      if (r.del || (type && r.type !== type)) continue;
      if (childId !== undefined && childId !== null && r.childId !== childId) continue;
      out.push(r);
    }
    return out.sort(function (a, b) { return (b.date + (b.data.time || '') + b.at).localeCompare(a.date + (a.data.time || '') + a.at); });
  }
  function rec(id) { var r = S.records[id]; return r && !r.del ? r : null; }
  Object.assign(TG, { save: save, remove: remove, restore: restore, list: list, rec: rec, persist: persist });

  function summarize(type, d) {
    switch (type) {
      case 'child': return 'Child: ' + d.name;
      case 'word': return (d.kind || 'word') + ': ' + d.word + ' (' + (d.how || '') + ')';
      case 'session': return 'Practice ' + (d.minutes || 0) + ' min' + (d.activityId ? ' — ' + ((byId(C.ACTIVITIES, d.activityId) || {}).title || '') : '');
      case 'goal': return 'Goal: ' + goalTitle(d) + ' [' + d.status + ']';
      case 'behaviour': return 'Behaviour: ' + (d.behaviours || []).join(', ');
      case 'toilet': return 'Toilet: ' + d.kind + ' — ' + d.where;
      case 'sleep': return 'Sleep: ' + (d.bed || '') + '–' + (d.wake || '');
      case 'meal': return 'Meal: ' + d.meal + ' (' + (d.groups || []).join(', ') + ')';
      case 'checkin': return 'Day: mood ' + (d.mood || '');
      case 'milestone': return 'Milestone ' + d.item + ': ' + d.answer;
      case 'journal': return 'Journal: ' + (d.title || '');
      case 'tools': return 'Child tools settings';
      case 'menu': return 'Menu for week of ' + d.week;
      case 'plan': return 'Weekly focus: ' + d.focus;
      case 'reading': return 'Reading ' + (d.minutes || 0) + ' min: ' + (d.book || '');
      default: return type;
    }
  }
  function goalTitle(d) { if (d.custom) return d.custom; var g = byId(C.GOALS, d.goalId); return g ? g.title : d.goalId; }
  TG.goalTitle = goalTitle;

  /* ------------------------------------------------------------ children */
  function children() { return list('child').sort(function (a, b) { return a.at.localeCompare(b.at); }); }
  function child() { var c = rec(S.childId); if (c && c.type === 'child') return c; var all = children(); if (all[0]) { S.childId = all[0].id; return all[0]; } return null; }
  function childAge() { var c = child(); return c ? ageMonths(c.data.birth) : null; }
  Object.assign(TG, { children: children, child: child, childAge: childAge });

  /* ------------------------------------------------------------ small UI helpers */
  var main, toastEl;
  function toast(msg, action) {
    toastEl = toastEl || document.getElementById('toast');
    toastEl.innerHTML = esc(msg) + (action ? ' <button class="toast-btn">' + esc(action.label) + '</button>' : '');
    toastEl.classList.add('show');
    if (action) toastEl.querySelector('button').onclick = function () { action.fn(); toastEl.classList.remove('show'); };
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, action ? 6000 : 2600);
  }
  TG.toast = toast;

  /* Bottom sheet / dialog */
  function sheet(title, html, onReady) {
    closeSheet();
    var wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="sheet-head"><h2>' + esc(title) +
      '</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div><div class="sheet-body">' + html + '</div></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]')) closeSheet(); });
    requestAnimationFrame(function () { wrap.classList.add('open'); });
    if (onReady) onReady(wrap.querySelector('.sheet-body'));
    return wrap.querySelector('.sheet-body');
  }
  function closeSheet() { var w = document.querySelector('.sheet-wrap'); if (w) w.remove(); }
  TG.sheet = sheet; TG.closeSheet = closeSheet;

  function confirmBox(text, okLabel, fn) {
    sheet('Are you sure?', '<p>' + esc(text) + '</p><div class="row gap"><button class="btn" data-close>Cancel</button><button class="btn danger" id="cfOk">' + esc(okLabel || 'Yes') + '</button></div>',
      function (b) { b.querySelector('#cfOk').onclick = function () { closeSheet(); fn(); }; });
  }
  TG.confirmBox = confirmBox;

  /* Form widgets. Each returns HTML; read values with TG.val(form). */
  function chips(name, options, selected, multi) {
    selected = selected || [];
    if (!Array.isArray(selected)) selected = [selected];
    return '<div class="chips" data-name="' + esc(name) + '" data-multi="' + (multi ? 1 : 0) + '">' + options.map(function (o) {
      var v = typeof o === 'string' ? o : o.v, l = typeof o === 'string' ? o : o.l;
      return '<button type="button" class="chip' + (selected.indexOf(v) >= 0 ? ' on' : '') + '" data-v="' + esc(v) + '">' + l + '</button>';
    }).join('') + '</div>';
  }
  function counter(name, label, value, cls) {
    return '<div class="counter ' + (cls || '') + '" data-name="' + esc(name) + '"><span class="counter-label">' + label + '</span><button type="button" class="cbtn" data-d="-1" aria-label="less">−</button><output>' + (value || 0) + '</output><button type="button" class="cbtn plus" data-d="1" aria-label="more">+</button></div>';
  }
  function bindWidgets(root) {
    root.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip && chip.parentElement.classList.contains('chips')) {
        var box = chip.parentElement;
        if (box.dataset.multi === '1') chip.classList.toggle('on');
        else { var was = chip.classList.contains('on'); box.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); }); if (!was || box.dataset.required) chip.classList.add('on'); }
        box.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      var cb = e.target.closest('.cbtn');
      if (cb) {
        var out = cb.parentElement.querySelector('output');
        out.textContent = Math.max(0, (+out.textContent || 0) + (+cb.dataset.d));
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (er) {}
        cb.parentElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  function val(root) {
    var o = {};
    root.querySelectorAll('input[name],select[name],textarea[name]').forEach(function (el) {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'number') o[el.name] = el.value === '' ? '' : +el.value;
      else o[el.name] = el.value.trim();
    });
    root.querySelectorAll('.chips[data-name]').forEach(function (box) {
      var on = Array.from(box.querySelectorAll('.chip.on')).map(function (c) { return c.dataset.v; });
      o[box.dataset.name] = box.dataset.multi === '1' ? on : (on[0] || '');
    });
    root.querySelectorAll('.counter[data-name]').forEach(function (c) { o[c.dataset.name] = +c.querySelector('output').textContent || 0; });
    return o;
  }
  Object.assign(TG, { chips: chips, counter: counter, bindWidgets: bindWidgets, val: val });

  /* Simple SVG charts */
  function lineChart(points, opt) {
    opt = opt || {};
    if (!points.length) return '<p class="muted small">Not enough entries yet for a chart.</p>';
    var W = 320, H = opt.h || 140, P = 26;
    var max = Math.max.apply(null, points.map(function (p) { return p.y; }).concat([opt.max || 1]));
    var n = points.length;
    var x = function (i) { return P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1)); };
    var y = function (v) { return H - P - (v / max) * (H - 2 * P); };
    var path = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.y).toFixed(1); }).join(' ');
    var area = path + ' L' + x(n - 1).toFixed(1) + ' ' + (H - P) + ' L' + x(0).toFixed(1) + ' ' + (H - P) + ' Z';
    var step = Math.max(1, Math.ceil(n / 6));
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opt.label || 'chart') + '">' +
      '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" class="axis"/>' +
      '<text x="' + (P - 4) + '" y="' + (y(max) + 4) + '" class="tick" text-anchor="end">' + Math.round(max) + '</text>' +
      '<text x="' + (P - 4) + '" y="' + (H - P + 4) + '" class="tick" text-anchor="end">0</text>' +
      '<path d="' + area + '" class="area"/><path d="' + path + '" class="line"/>' +
      points.map(function (p, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.y).toFixed(1) + '" r="3" class="dot"><title>' + esc(p.label + ': ' + p.y) + '</title></circle>' +
        (i % step === 0 || i === n - 1 ? '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" class="tick" text-anchor="middle">' + esc(p.label) + '</text>' : ''); }).join('') + '</svg>';
  }
  function barChart(items, opt) {
    opt = opt || {};
    if (!items.length) return '<p class="muted small">Nothing recorded yet.</p>';
    var max = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([opt.max || 1]));
    return '<div class="bars">' + items.map(function (i) {
      return '<div class="bar-row"><span class="bar-label">' + esc(i.l) + '</span><span class="bar-track"><span class="bar-fill" style="width:' +
        Math.max(2, Math.round(i.v / max * 100)) + '%;' + (i.c ? 'background:' + i.c : '') + '"></span></span><span class="bar-val">' + esc(opt.fmt ? opt.fmt(i.v) : i.v) + '</span></div>';
    }).join('') + '</div>';
  }
  function progress(pct, color) { return '<span class="progress"><span style="width:' + Math.round(Math.min(100, Math.max(0, pct))) + '%;' + (color ? 'background:' + color : '') + '"></span></span>'; }
  Object.assign(TG, { lineChart: lineChart, barChart: barChart, progress: progress });

  /* ------------------------------------------------------------ layout & router */
  var NAV = [
    { id: 'home', icon: '🏠', label: 'Today' },
    { id: 'talk', icon: '💬', label: 'Words' },
    { id: 'log', icon: '＋', label: 'Record', action: true },
    { id: 'menu', icon: '🍽️', label: 'Meals' },
    { id: 'learn', icon: '📚', label: 'Learn' },
    { id: 'goals', icon: '🎯', label: 'Goals' },
    { id: 'kids', icon: '🧒🏾', label: 'Child tools' },
    { id: 'reports', icon: '📈', label: 'Progress' },
    { id: 'more', icon: '☰', label: 'More' }
  ];
  var PHONE_NAV = ['home', 'talk', 'log', 'menu', 'learn'];
  TG.screens = {};

  function shell() {
    var app = document.getElementById('app');
    app.innerHTML =
      '<aside class="side"><div class="brand"><img src="' + (window.TG_ICON || 'icons/icon-192.png') + '" alt="" width="36" height="36"><div><b>Talk &amp; Grow</b><small id="famName"></small></div></div><nav>' +
      NAV.map(function (n) { return '<a href="#/' + n.id + '" data-nav="' + n.id + '"' + (n.action ? ' class="nav-action"' : '') + '><span>' + n.icon + '</span>' + n.label + '</a>'; }).join('') +
      '</nav><div class="side-foot" id="sideStatus"></div></aside>' +
      '<header class="top"><button class="child-chip" id="childChip"></button><div class="top-right"><button class="status" id="status" aria-label="Sync status"></button><a class="icon-btn more-btn" href="#/more" title="More" aria-label="More">☰</a></div></header>' +
      '<div id="demoBar" class="demo-bar" hidden></div>' +
      '<main id="main" tabindex="-1"></main>' +
      '<nav class="bottom">' + PHONE_NAV.map(function (id) { var n = byId(NAV, id); return '<a href="#/' + id + '" data-nav="' + id + '"' + (n.action ? ' class="nav-action"' : '') + '><span>' + n.icon + '</span><small>' + n.label + '</small></a>'; }).join('') + '</nav>';
    main = document.getElementById('main');
    bindWidgets(main);
    document.getElementById('status').onclick = function () { location.hash = '#/sync'; };
    document.getElementById('childChip').onclick = function (e) {
      var b = e.target.closest('[data-switch]');
      if (b && b.dataset.switch !== S.childId) switchChild(b.dataset.switch); else pickChild();
    };
    document.querySelectorAll('[data-nav="log"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); TG.logMenu(); }); });
  }

  function pickChild() {
    var all = children();
    sheet('Which child?', '<div class="list">' + all.map(function (c) {
      return '<button class="list-item" data-c="' + c.id + '"><span class="avatar" style="background:' + (c.data.color || '#e8913a') + '">' + esc((c.data.name || '?').charAt(0)) + '</span><span><b>' + esc(c.data.name) + '</b><small>' + esc(childSub(c)) + '</small></span>' + (c.id === S.childId ? '<span class="tick">✓</span>' : '') + '</button>';
    }).join('') + '</div><a class="btn" href="#/child/new" data-close>＋ Add a child</a>', function (b) {
      b.querySelectorAll('[data-c]').forEach(function (el) { el.onclick = function () { closeSheet(); if (el.dataset.c !== S.childId) switchChild(el.dataset.c); }; });
    });
  }

  function renderStatus() {
    var el = document.getElementById('status');
    if (!el) return;
    var txt, cls;
    if (S.mode === 'demo') { txt = 'Demo'; cls = 'demo'; }
    else if (syncing) { txt = '↻ Syncing'; cls = 'busy'; }
    else if (!online()) { txt = '● Offline' + (S.queue.length ? ' · ' + S.queue.length : ''); cls = 'off'; }
    else if (S.queue.length) { txt = '↑ ' + S.queue.length + ' to sync'; cls = 'wait'; }
    else if (S.syncError && !S.lastSync) { txt = '! Not synced'; cls = 'err'; }
    else { txt = '✓ Synced'; cls = 'ok'; }
    el.textContent = txt; el.className = 'status ' + cls;
    var side = document.getElementById('sideStatus'); if (side) side.textContent = (me() ? me().name + ' · ' : '') + txt;
  }
  TG.renderStatus = renderStatus;

  function childSub(k) { return k.data.stage === 'school' && k.data.grade ? 'Grade ' + k.data.grade + ' · ' + ageText(ageMonths(k.data.birth)).replace(/ \d+ months?$/, '') : ageText(ageMonths(k.data.birth)); }
  TG.childSub = childSub;

  /* Switch child and stay on the same kind of screen. */
  function switchChild(id) {
    if (!rec(id)) return;
    S.childId = id; persist();
    var r = currentRoute(), k = rec(id), school = k.data.stage === 'school';
    var map = { goal: '#/goals', add: null, child: null };
    var target = location.hash;
    if (r.name === 'goal') target = '#/goals';
    else if (r.name === 'add') target = '#/home';
    else if (r.name === 'talk' && school) target = '#/study';
    else if (r.name === 'study' && !school) target = '#/talk';
    else if (r.name === 'milestones' && school) target = '#/home';
    else if (r.name === 'kids' && r.arg) target = '#/kids';
    else if (r.name === 'daily' && r.arg === 'toilet' && school) target = '#/daily/sleep';
    if (main) { main.classList.remove('swap'); void main.offsetWidth; main.classList.add('swap'); }
    if (target === location.hash) render(); else location.hash = target;
    toast('Now: ' + k.data.name);
  }
  TG.switchChild = switchChild;

  function renderTop() {
    var c = child();
    var chip = document.getElementById('childChip');
    var all = children();
    if (chip) {
      chip.classList.toggle('multi', all.length > 1);
      chip.innerHTML = !c ? '<b>Add a child</b>' : all.length > 1 ? all.map(function (k) {
        var on = k.id === c.id;
        return '<span class="kid-pill' + (on ? ' on' : '') + '" data-switch="' + k.id + '" style="--k:' + (k.data.color || '#e8913a') + '" role="button" aria-label="Switch to ' + esc(k.data.name) + '"><span class="avatar sm" style="background:' + (k.data.color || '#e8913a') + '">' + esc(k.data.name.charAt(0)) + '</span>' +
          (on ? '<span><b>' + esc(k.data.name) + '</b><small>' + esc(childSub(k)) + '</small></span>' : '<span class="kid-name">' + esc(k.data.name) + '</span>') + '</span>';
      }).join('') : '<span class="avatar sm" style="background:' + (c.data.color || '#e8913a') + '">' + esc(c.data.name.charAt(0)) + '</span><span><b>' + esc(c.data.name) + '</b><small>' + esc(childSub(c)) + '</small></span><span class="caret">▾</span>';
    }
    var school = c && c.data.stage === 'school';
    document.querySelectorAll('[data-nav=talk]').forEach(function (a) {
      a.href = school ? '#/study' : '#/talk';
      var small = a.querySelector('small');
      a.innerHTML = '<span>' + (school ? '📚' : '💬') + '</span>' + (small ? '<small>' + (school ? 'Study' : 'Words') + '</small>' : (school ? 'Study' : 'Words'));
    });
    document.querySelectorAll('[data-nav=milestones]').forEach(function (a) { a.hidden = !!school; });
    if (c) document.documentElement.style.setProperty('--child', c.data.color || '#e8913a');
    var fam = document.getElementById('famName'); if (fam) fam.textContent = S.familyName || '';
    var bar = document.getElementById('demoBar');
    if (bar) {
      bar.hidden = S.mode !== 'demo';
      bar.innerHTML = 'Demo with made-up data, saved only on this device. <button class="link" id="leaveDemo">Leave demo</button>';
      var b = bar.querySelector('#leaveDemo'); if (b) b.onclick = function () { confirmBox('Leave the demo and delete its data from this device?', 'Leave demo', function () { resetAll(); }); };
    }
    renderStatus();
  }

  function currentRoute() { var h = (location.hash || '#/home').slice(2).split('/'); return { name: h[0] || 'home', arg: h.slice(1).join('/') }; }
  TG.go = function (h) { if (location.hash === h) render(); else location.hash = h; };

  function render() {
    var r = currentRoute();
    var fn = TG.screens[r.name] || TG.screens.home;
    document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === r.name || (r.name === 'activity' && a.dataset.nav === 'learn') || (r.name === 'study' && a.dataset.nav === 'talk')); });
    renderTop();
    var html;
    try { html = fn(r.arg, main); }
    catch (e) { console.error(e); html = '<div class="card"><h2>Something went wrong</h2><p>' + esc(e.message) + '</p></div>'; }
    if (typeof html === 'string') { main.innerHTML = html; if (fn.after) fn.after(main, r.arg); }
    main.scrollTop = 0; window.scrollTo(0, 0);
  }
  TG.render = render;
  function rerenderSoft() { if (!document.querySelector('.sheet-wrap') && !main.querySelector('form.dirty')) render(); else renderTop(); }

  /* Decide which top-level view to show: connect, people, PIN, add child, or the app. */
  function route() {
    var app = document.getElementById('app');
    app.className = '';
    if (!S.mode) return TG.authScreens.connect(app);
    if (!S.users.length || (S.mode === 'live' && !S.device)) return S.device || S.mode === 'demo' ? TG.authScreens.people(app) : TG.authScreens.connect(app);
    if (!S.session || !me() || (S.session.until && Date.parse(S.session.until) < Date.now())) return TG.authScreens.people(app);
    if (!children().length && currentRoute().name !== 'child') { location.hash = '#/child/new'; }
    if (!main || !document.getElementById('main')) shell();
    app.className = 'in';
    applyTheme();
    render();
  }
  TG.route = route;

  function applyTheme() {
    var t = S.prefs.theme || 'auto';
    document.documentElement.dataset.theme = t === 'auto' ? '' : t;
    var u = me(); if (u) document.documentElement.style.setProperty('--me', u.color);
  }
  TG.applyTheme = applyTheme;

  function resetAll() {
    var keep = { mode: '', api: S.api };
    Object.keys(S).forEach(function (k) { delete S[k]; });
    Object.assign(S, { v: 1, mode: '', api: keep.api, device: null, familyName: '', users: [], records: {}, queue: [], rejected: [], lastPull: '', lastSync: '',
      settings: { masteryPercent: 80, masterySessions: 3 }, session: null, childId: '', prefs: { theme: 'auto', faith: false }, seen: {} });
    persist(true); main = null; location.hash = '#/home'; route();
  }
  TG.resetAll = resetAll;

  /* ------------------------------------------------------------ connect, people, PIN */
  var COLORS = ['#2f7d6d', '#c2410c', '#4f6bb0', '#7a4fa8', '#b5651d', '#0e7490', '#be185d', '#3f6212'];
  TG.COLORS = COLORS;
  TG.authScreens = {
    connect: function (app) {
      var needsUrl = !isGas() && !CFG.API_URL;
      var urlParam = new URLSearchParams(location.search).get('api') || '';
      app.innerHTML = '<div class="auth"><div class="auth-card"><img class="auth-logo" src="' + (window.TG_ICON || 'icons/icon-192.png') + '" alt=""><h1>Talk &amp; Grow</h1>' +
        '<p class="muted">Help your child talk and grow at home. Plan activities, record progress, and share it with your family.</p>' +
        '<form id="conn" class="stack">' +
        (needsUrl ? '<label>Server address (your Apps Script web app link)<input name="api" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(urlParam || S.api || '') + '"></label>' : '') +
        '<label>Family code<input name="code" autocomplete="off" autocapitalize="characters" placeholder="e.g. K7QM-3XPA" required></label>' +
        '<label>Name for this device<input name="deviceName" placeholder="e.g. Papa\'s phone, Family tablet" required></label>' +
        '<button class="btn primary big">Connect this device</button><p class="err" id="connErr"></p></form>' +
        '<div class="or"><span>or</span></div><button class="btn" id="demoBtn">Try the demo first (made-up data)</button>' +
        '<p class="muted small center">The family code is in your Google Sheet: <b>Talk &amp; Grow ▸ Show family code</b>.</p></div></div>';
      app.querySelector('#demoBtn').onclick = function () { TG.startDemo(); };
      app.querySelector('#conn').onsubmit = async function (e) {
        e.preventDefault();
        var v = val(e.target), err = app.querySelector('#connErr'), btn = e.target.querySelector('button');
        err.textContent = '';
        if (needsUrl) {
          if (!/^https:\/\/script\.google(usercontent)?\.com\/.+\/exec/.test(v.api) && !/^http:\/\/localhost/.test(v.api)) { err.textContent = 'The server address must be your Apps Script "Web app URL", ending in /exec.'; return; }
          S.api = v.api;
        } else if (CFG.API_URL) S.api = CFG.API_URL;
        btn.disabled = true; btn.textContent = 'Connecting…';
        try {
          var r = await api('register', { code: v.code, deviceName: v.deviceName });
          if (!r.ok) throw new Error(r.message || r.error);
          S.mode = 'live'; S.device = { id: r.deviceId, key: r.deviceKey, name: v.deviceName };
          S.users = r.users || []; S.familyName = r.familyName || '';
          persist(true);
          await sync();
          route();
        } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.textContent = 'Connect this device'; }
      };
    },

    people: function (app) {
      var users = S.users.filter(function (u) { return u.active !== false; });
      app.innerHTML = '<div class="auth"><div class="auth-card"><img class="auth-logo" src="' + (window.TG_ICON || 'icons/icon-192.png') + '" alt=""><h1>' + esc(S.familyName || 'Talk & Grow') + '</h1>' +
        (users.length ? '<p class="muted">Who is using the app?</p><div class="people">' + users.map(function (u) {
          return '<button class="person" data-u="' + u.id + '"><span class="avatar lg" style="background:' + esc(u.color) + '">' + esc(u.name.charAt(0)) + '</span><b>' + esc(u.name) + '</b><small>' + esc(u.relationship || '') + '</small></button>';
        }).join('') + '</div>' : '<p class="muted">Create your profile. Each person who helps the child gets their own name and PIN, so everyone sees who recorded what.</p>') +
        '<button class="btn ' + (users.length ? '' : 'primary big') + '" id="newPerson">＋ I\'m new</button>' +
        (S.mode === 'live' ? '<button class="link small" id="refresh">Refresh the list</button>' : '') +
        (S.mode === 'demo' ? '<p class="banner tipb small">Demo: the PIN for both people is <b>1234</b>.</p>' : '') + '</div></div>';
      app.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { TG.authScreens.pin(app, byId(S.users, b.dataset.u)); }; });
      app.querySelector('#newPerson').onclick = function () { TG.authScreens.newPerson(app); };
      var rf = app.querySelector('#refresh');
      if (rf) rf.onclick = async function () { rf.textContent = 'Refreshing…'; await sync(true); TG.authScreens.people(app); };
    },

    pin: function (app, user) {
      var entered = '';
      app.innerHTML = '<div class="auth"><div class="auth-card"><span class="avatar lg" style="background:' + esc(user.color) + '">' + esc(user.name.charAt(0)) + '</span><h1>Hi, ' + esc(user.name) + '</h1><p class="muted">Enter your PIN</p>' +
        '<div class="pin-dots" id="dots"></div><p class="err" id="pinErr"></p><div class="keypad">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'ok'].map(function (k) { return '<button class="key" data-k="' + k + '">' + (k === 'back' ? '⌫' : k === 'ok' ? '✓' : k) + '</button>'; }).join('') +
        '</div><button class="link" id="back">← Not me</button></div></div>';
      var dots = app.querySelector('#dots');
      function draw() { dots.innerHTML = Array.from({ length: Math.max(4, entered.length) }, function (_, i) { return '<span class="pd' + (i < entered.length ? ' on' : '') + '"></span>'; }).join(''); }
      draw();
      async function check() {
        var h = await pinHash(entered, user.salt);
        if (h === user.pinHash) {
          S.session = { userId: user.id, until: new Date(Date.now() + 12 * 3600 * 1000).toISOString() };
          persist(true); main = null; route(); scheduleSync(500);
        } else { app.querySelector('#pinErr').textContent = 'That PIN is not correct.'; entered = ''; draw(); }
      }
      function press(k) {
        if (k === 'back') entered = entered.slice(0, -1);
        else if (k === 'ok') { if (entered.length >= 4) check(); return; }
        else if (entered.length < 6) entered += k;
        app.querySelector('#pinErr').textContent = '';
        draw();
      }
      app.querySelectorAll('.key').forEach(function (b) { b.onclick = function () { press(b.dataset.k); }; });
      app.querySelector('#back').onclick = function () { TG.authScreens.people(app); };
      document.onkeydown = function (e) {
        if (!document.getElementById('dots')) { document.onkeydown = null; return; }
        if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('back'); else if (e.key === 'Enter') press('ok');
      };
    },

    newPerson: function (app) {
      app.innerHTML = '<div class="auth"><div class="auth-card"><h1>New profile</h1><form id="np" class="stack">' +
        '<label>Your name<input name="name" required maxlength="40" placeholder="e.g. Ephraim"></label>' +
        '<label>You are the child\'s…' + chips('relationship', ['Father', 'Mother', 'Grandparent', 'Aunt / uncle', 'Sibling', 'Nanny', 'Teacher', 'Therapist'], ['Father']) + '</label>' +
        '<label>Your colour' + '<div class="swatches">' + COLORS.map(function (c, i) { return '<label class="sw"><input type="radio" name="color" value="' + c + '"' + (i === S.users.length % COLORS.length ? ' checked' : '') + '><span style="background:' + c + '"></span></label>'; }).join('') + '</div></label>' +
        '<label>Choose a PIN (4–6 digits)<input name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" required autocomplete="new-password"></label>' +
        '<label>Type the PIN again<input name="pin2" type="password" inputmode="numeric" pattern="\\d{4,6}" required autocomplete="new-password"></label>' +
        '<button class="btn primary big">Create my profile</button><p class="err" id="npErr"></p></form><button class="link" id="back">← Back</button></div></div>';
      bindWidgets(app.querySelector('#np'));
      app.querySelector('#back').onclick = function () { TG.authScreens.people(app); };
      app.querySelector('#np').onsubmit = async function (e) {
        e.preventDefault();
        var v = val(e.target);
        var color = (e.target.querySelector('input[name=color]:checked') || {}).value || COLORS[0];
        var err = app.querySelector('#npErr');
        if (v.pin !== v.pin2) { err.textContent = 'The two PINs are not the same.'; return; }
        if (!/^\d{4,6}$/.test(v.pin)) { err.textContent = 'The PIN must be 4 to 6 digits.'; return; }
        var btn = e.target.querySelector('button.primary'); btn.disabled = true;
        try {
          var user;
          if (S.mode === 'demo') {
            var salt = Math.random().toString(16).slice(2, 18);
            user = { id: 'U-' + uid().slice(1, 9), name: v.name, relationship: v.relationship, color: color, salt: salt, pinHash: await pinHash(v.pin, salt), active: true };
            S.users.push(user);
          } else {
            var r = await api('createUser', { name: v.name, pin: v.pin, color: color, relationship: v.relationship });
            if (!r.ok) throw new Error(r.message || r.error);
            S.users = r.users; user = r.user;
          }
          S.session = { userId: user.id, until: new Date(Date.now() + 12 * 3600 * 1000).toISOString() };
          persist(true); main = null; route();
        } catch (ex) { err.textContent = ex.message + (online() ? '' : ' (You need internet to create a profile.)'); btn.disabled = false; }
      };
    }
  };

  /* ------------------------------------------------------------ start */
  async function start() {
    await openDb();
    var saved = await dbGet();
    if (saved && saved.v === 1) Object.assign(S, saved);
    var p = new URLSearchParams(location.search);
    if (p.get('api') && !S.device) S.api = p.get('api');
    if (!S.api && CFG.API_URL) S.api = CFG.API_URL;
    if ((p.get('demo') === '1' || CFG.DEMO_ONLY) && !S.mode) { TG.startDemo(); }
    window.addEventListener('hashchange', function () { if (document.getElementById('main')) render(); else route(); });
    window.addEventListener('online', function () { renderStatus(); scheduleSync(500); });
    window.addEventListener('offline', renderStatus);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleSync(800); });
    setInterval(function () { if (S.mode === 'live' && S.session) sync(); }, 120000);
    if (S.mode || !((p.get('demo') === '1' || CFG.DEMO_ONLY))) route();
    if (S.mode === 'live') scheduleSync(1200);
    if (window.TG_BUILD === 'pwa' && 'serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var w = reg.installing;
          w && w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('A new version is ready.', { label: 'Update', fn: function () { w.postMessage('skip'); location.reload(); } }); });
        });
      }).catch(function () {});
    }
  }
  TG.start = start;
  TG.internal = { mergePull: mergePull, persistNow: function () { persist(true); } };
  document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
})();
