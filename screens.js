/* Talk & Grow — the parent screens: Today, Words, Goals, practice, Learn, milestones, behaviour, daily logs, food, settings. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, S = TG.S, X = TG.screens;
  var chips = TG.chips, counter = TG.counter, val = TG.val;

  function area(id) { return TG.byId(C.AREAS, id) || { name: id, icon: '•', color: '#888', short: id }; }
  function areaTag(id) { var a = area(id); return '<span class="tag" style="--c:' + a.color + '">' + a.icon + ' ' + esc(a.short) + '</span>'; }
  function cname() { var c = TG.child(); return c ? c.data.name : 'your child'; }
  function who(r) { return '<span class="who" style="--c:' + TG.userColor(r.ub || r.by) + '">' + esc(TG.userName(r.ub || r.by)) + '</span>'; }
  function back(href, label) { return '<a class="back" href="' + href + '">← ' + esc(label || 'Back') + '</a>'; }
  function empty(text, btn) { return '<div class="empty"><p>' + text + '</p>' + (btn || '') + '</div>'; }
  TG.areaTag = areaTag; TG.area = area;

  /* ---------- data helpers ---------- */
  function goals(status) {
    return TG.list('goal', TG.S().childId).filter(function (g) { return !status || g.data.status === status; })
      .sort(function (a, b) { return a.data.area === b.data.area ? a.at.localeCompare(b.at) : C.AREAS.findIndex(function (x) { return x.id === a.data.area; }) - C.AREAS.findIndex(function (x) { return x.id === b.data.area; }); });
  }
  function sessions() { return TG.list('session', TG.S().childId); }
  function goalHistory(goalRecId) {
    return sessions().filter(function (s) { return s.data.results && s.data.results[goalRecId]; }).map(function (s) {
      var r = s.data.results[goalRecId], tot = (r.own || 0) + (r.help || 0) + (r.no || 0);
      return { date: s.date, own: r.own || 0, help: r.help || 0, no: r.no || 0, total: tot, pct: tot ? Math.round((r.own || 0) / tot * 100) : 0, session: s };
    }).filter(function (h) { return h.total > 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
  }
  function goalPct(goalRecId) {
    var h = goalHistory(goalRecId).slice(-5);
    var own = TG.sum(h.map(function (x) { return x.own; })), tot = TG.sum(h.map(function (x) { return x.total; }));
    return { pct: tot ? Math.round(own / tot * 100) : null, sessions: goalHistory(goalRecId).length };
  }
  function readyToMaster(goalRecId) {
    var st = TG.S().settings, n = st.masterySessions || 3, p = st.masteryPercent || 80;
    var h = goalHistory(goalRecId).slice(-n);
    return h.length >= n && h.every(function (x) { return x.pct >= p; });
  }
  function words(kind) { return TG.list('word', TG.S().childId).filter(function (w) { return !kind || (w.data.kind || 'word') === kind; }); }
  Object.assign(TG, { goals: goals, sessions: sessions, goalHistory: goalHistory, goalPct: goalPct, readyToMaster: readyToMaster, words: words });

  function weeklyFocus() {
    var c = TG.child(); if (!c) return null;
    var wk = TG.weekKey();
    var plan = TG.rec('plan' + c.id.slice(1, 18) + '_' + wk.replace(/-/g, ''));
    if (plan && plan.data.focus) return TG.byId(C.METHODS, plan.data.focus);
    var n = Math.floor(TG.daysBetween(c.date || TG.today(), wk) / 7);
    var list = TG.isSchool(c) ? ['readdaily', 'retrieval', 'mathtalk', 'growth', 'homework', 'littleoften', 'handson', 'praise', 'attnspace'] : C.WEEKLY_FOCUS;
    return TG.byId(C.METHODS, list[((n % list.length) + list.length) % list.length]);
  }
  function setFocus(methodId) {
    var c = TG.child(); var wk = TG.weekKey();
    TG.save('plan', { week: wk, focus: methodId }, { id: 'plan' + c.id.slice(1, 18) + '_' + wk.replace(/-/g, ''), date: wk });
  }
  TG.weeklyFocus = weeklyFocus;

  function todaysPlan() {
    var c = TG.child(); if (!c) return [];
    var age = TG.ageMonths(c.data.birth) || 36;
    var active = goals('active');
    var goalIds = active.map(function (g) { return g.data.goalId; }).filter(Boolean);
    var recent = {};
    sessions().filter(function (s) { return TG.daysBetween(s.date, TG.today()) <= 2; }).forEach(function (s) { if (s.data.activityId) recent[s.data.activityId] = 1; });
    var rnd = TG.seeded(TG.today() + c.id);
    var scored = C.ACTIVITIES.filter(function (a) { return !a.grades && age >= a.ages[0] - 6 && age <= a.ages[1] + 12; }).map(function (a) {
      var overlap = a.goals.filter(function (g) { return goalIds.indexOf(g) >= 0; }).length;
      return { a: a, score: overlap * 3 + (a.area === 'talk' ? 1 : 0) - (recent[a.id] ? 2 : 0) + rnd() * 2.5 };
    }).sort(function (x, y) { return y.score - x.score; });
    var picked = [], areas = {};
    scored.forEach(function (s) {
      if (picked.length >= 3) return;
      if (areas[s.a.area] >= 2) return;
      areas[s.a.area] = (areas[s.a.area] || 0) + 1;
      picked.push(s.a);
    });
    return picked;
  }
  TG.todaysPlan = todaysPlan;

  function bandFor(age) {
    var b = C.MILESTONE_BANDS.filter(function (x) { return x.months <= age + 1; });
    return b.length ? b[b.length - 1] : C.MILESTONE_BANDS[0];
  }
  function msId(childId, itemId) { return 'ms' + childId.slice(1, 18) + '_' + itemId.replace(/-/g, '_'); }
  function msAnswer(childId, itemId) { var r = TG.rec(msId(childId, itemId)); return r ? r.data.answer : ''; }
  TG.bandFor = bandFor; TG.msAnswer = msAnswer;

  function streak() {
    var days = {};
    sessions().forEach(function (s) { days[s.date] = 1; });
    var n = 0, d = TG.today();
    if (!days[d]) d = TG.addDays(d, -1);
    while (days[d]) { n++; d = TG.addDays(d, -1); }
    return n;
  }

  /* ---------- TODAY ---------- */
  X.home = function () {
    var c = TG.child();
    if (!c) return empty('Add your child to start.', '<a class="btn primary" href="#/child/new">＋ Add a child</a>');
    if (TG.isSchool(c)) return TG.schoolHome(c);
    var me = TG.me(), hour = new Date().getHours();
    var hi = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var age = TG.ageMonths(c.data.birth);
    var w = words(), wk = TG.addDays(TG.today(), -6);
    var newW = w.filter(function (x) { return x.date >= wk; }).length;
    var practiceDays = {}; sessions().forEach(function (s) { if (s.date >= wk) practiceDays[s.date] = 1; });
    var focus = weeklyFocus();
    var plan = todaysPlan();
    var doneToday = {}; sessions().forEach(function (s) { if (s.date === TG.today() && s.data.activityId) doneToday[s.data.activityId] = 1; });
    var band = bandFor(age || 0);
    var notYet = band.months <= (age || 0) && C.MILESTONES.some(function (m) { return m.band === band.id && msAnswer(c.id, m.id) === 'no'; });
    return TG.hero(hi + (me ? ', ' + me.name : ''), c.data.name + '\'s day', TG.ageText(age),
        [['💬', w.length + ' words' + (newW ? ' (+' + newW + ')' : ''), '#/talk'], ['🔥', Object.keys(practiceDays).length + '/7 days', '#/reports'], ['🎯', goals('active').length + ' goals', '#/goals']]) +
      '<section class="card"><div class="card-head"><h2>Today</h2><a class="small" href="#/activities">More ideas</a></div>' +
      (focus ? '<a class="focus-line" href="#/method/' + focus.id + '">' + focus.icon + ' <span>This week: <b>' + esc(focus.name) + '</b></span><span class="chev">›</span></a>' : '') +
      '<div class="list">' + plan.map(function (a) {
        return '<a class="list-item" href="#/activity/' + a.id + '"><span class="emoji-box">' + a.emoji + '</span><span class="grow"><b>' + esc(a.title) + '</b><small>' + a.minutes + ' min</small></span>' + (doneToday[a.id] ? '<span class="tick">✓</span>' : '<span class="chev">›</span>') + '</a>';
      }).join('') + '</div></section>' +
      '<!--MENU-->' +
      '<div class="home-actions"><a class="big-action kids" href="#/kids"><span>🧒🏾</span>Child tools</a><a class="big-action" href="#/videos"><span>▶️</span>Videos</a></div>' +
      (notYet ? '<a class="card link-card" href="#/guide/help">🩺 Some milestones are "not yet". When to get help ›</a>' : '');
  };
  TG.hero = function (hi, title, sub, chips) {
    return '<section class="hello"><p class="muted">' + esc(hi) + '</p><h1>' + esc(title) + '</h1><p class="muted small">' + esc(sub) + '</p>' +
      (chips && chips.length ? '<div class="hero-chips">' + chips.map(function (x) { return '<a href="' + x[2] + '">' + x[0] + ' ' + esc(x[1]) + '</a>'; }).join('') + '</div>' : '') + '</section>';
  };
  function stat(icon, value, label, sub, href) { return '<a class="stat" href="' + href + '"><span class="stat-icon">' + icon + '</span><b>' + esc(value) + '</b><span>' + esc(label) + '</span><small>' + esc(sub) + '</small></a>'; }

  var TYPE_ICON = { word: '💬', session: '⏱️', goal: '🎯', behaviour: '💛', toilet: '🚽', sleep: '🌙', meal: '🍽️', checkin: '🌤️', milestone: '🪜', journal: '🎉', child: '🧒🏾', plan: '📌', tools: '🧩', reading: '📖' };
  function entryRow(r) {
    return '<a class="list-item" href="#/add/' + r.type + '/' + r.id + '"><span class="emoji-box">' + (TYPE_ICON[r.type] || '•') + '</span><span><b>' + esc(prettySummary(r)) + '</b><small>' + esc(TG.fmtDate(r.date)) + (r.data.time ? ' ' + esc(r.data.time) : '') + ' · ' + who(r) + '</small></span><span class="chev">›</span></a>';
  }
  function prettySummary(r) {
    var d = r.data;
    switch (r.type) {
      case 'word': return '"' + d.word + '"' + ({ own: ' — on own', copied: ' — copied', help: ' — with help' }[d.how] || '');
      case 'reading': return 'Read ' + (d.minutes || '?') + ' min' + (d.book ? ': ' + d.book : '');
      case 'session': if (d.drill) return ({ maths: 'Maths practice', reading: 'Reading drill', spelling: 'Spelling drill' }[d.drill] || 'Drill') + ': ' + d.score + '/' + d.of;
        return 'Practice ' + (d.minutes || '?') + ' min' + (d.activityId ? ': ' + ((TG.byId(C.ACTIVITIES, d.activityId) || {}).title || '') : '');
      case 'behaviour': return (d.behaviours || []).join(', ') || 'Behaviour';
      case 'toilet': return { pee: 'Pee', poo: 'Poo', sit: 'Sat on potty' }[d.kind] + ' — ' + { potty: 'in the potty ✓', accident: 'accident', nothing: 'nothing came' }[d.where] + (d.told ? ' (told us!)' : '');
      case 'sleep': return 'Slept ' + sleepHours(d).toFixed(1) + ' h';
      case 'meal': return cap(d.meal) + ': ' + (d.groups || []).length + ' food groups' + (d.newFood ? ', tried ' + d.newFood : '');
      case 'checkin': return 'Day: ' + (d.mood || '') + ' ' + (d.health || []).join(', ');
      case 'journal': return d.title || 'Journal';
      case 'goal': return 'Goal: ' + TG.goalTitle(d);
      default: return r.summary;
    }
  }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  TG.entryRow = entryRow; TG.prettySummary = prettySummary;

  /* ---------- LOG MENU ---------- */
  TG.logMenu = function () {
    var items = [['word', '💬', 'New word, sign or sound'], ['session', '⏱️', 'Practice session'], ['behaviour', '💛', 'Behaviour (ABC)'], ['toilet', '🚽', 'Toilet'], ['meal', '🍽️', 'Meal / new food'], ['sleep', '🌙', 'Sleep'], ['checkin', '🌤️', 'How was today'], ['journal', '🎉', 'Celebration / note']];
    TG.sheet('What do you want to record?', '<div class="quick">' + items.map(function (q) { return '<a class="q" href="#/add/' + q[0] + '" data-close><span>' + q[1] + '</span>' + q[2] + '</a>'; }).join('') +
      '<a class="q" href="#/milestones" data-close><span>🪜</span>Milestones</a></div>');
  };

  /* ---------- GENERIC ADD / EDIT ---------- */
  var FORMS = TG.FORMS = {};
  TG.cuisine = function (c) { c = c || TG.child(); return (c && c.data.cuisine) || 'liberian'; };
  X.add = function (arg) {
    var parts = (arg || '').split('/'), type = parts[0], id = parts[1] || '';
    var r = id && id.indexOf(':') < 0 ? TG.rec(id) : null;
    var f = FORMS[type];
    if (!f) return '<p>Unknown form.</p>';
    var hint = id.indexOf(':') > 0 ? id : '';
    var html = '<form class="card form" id="entryForm" data-type="' + type + '">' + '<h1>' + (r ? 'Edit: ' : '') + esc(f.title) + '</h1>' + f.html(r ? r.data : {}, r, hint) +
      '<label>Date<input type="date" name="_date" value="' + esc(r ? r.date : TG.today()) + '" max="' + TG.addDays(TG.today(), 1) + '"></label>' +
      '<div class="row gap"><button class="btn primary big">Save</button>' + (r ? '<button type="button" class="btn danger" id="delBtn">Delete</button>' : '') + '</div>' +
      (r ? '<p class="muted small">Recorded by ' + esc(TG.userName(r.by)) + ' on ' + esc(new Date(r.at).toLocaleString()) + (r.ub && r.ua !== r.at ? '. Last changed by ' + esc(TG.userName(r.ub)) + ' on ' + esc(new Date(r.ua).toLocaleString()) : '') + '.</p>' : '') +
      '</form>' + (f.info ? f.info() : '');
    return back('javascript:history.back()', 'Back') + html;
  };
  X.add.after = function (main, arg) {
    var parts = (arg || '').split('/'), type = parts[0], id = parts[1] || '';
    var r = id && id.indexOf(':') < 0 ? TG.rec(id) : null;
    var f = FORMS[type], form = main.querySelector('#entryForm');
    if (!form) return;
    form.addEventListener('input', function () { form.classList.add('dirty'); });
    form.addEventListener('change', function () { form.classList.add('dirty'); });
    if (f.after) f.after(form, r);
    form.onsubmit = function (e) {
      e.preventDefault();
      var v = val(form);
      var data = f.read(v, form, r);
      if (typeof data === 'string') { TG.toast(data); return; }
      var saved = TG.save(type, data, { id: r ? r.id : undefined, date: v._date || TG.today(), childId: f.global ? '' : undefined });
      if (f.saved) f.saved(saved);
      TG.toast(r ? 'Changes saved ✓' : 'Saved ✓');
      form.classList.remove('dirty');
      history.length > 1 ? history.back() : TG.go('#/home');
    };
    var del = main.querySelector('#delBtn');
    if (del) del.onclick = function () {
      TG.remove(r.id);
      TG.toast('Deleted.', { label: 'Undo', fn: function () { TG.restore(r.id); TG.render(); } });
      history.back();
    };
  };

  /* Word */
  var KINDS = [{ v: 'word', l: '💬 Word' }, { v: 'phrase', l: '🗨️ Phrase (2+ words)' }, { v: 'sign', l: '🤟 Sign / gesture' }, { v: 'sound', l: '🔊 Sound' }];
  var HOW = [{ v: 'own', l: '⭐ On own' }, { v: 'copied', l: '🪞 Copied me' }, { v: 'help', l: '🤝 With help' }];
  FORMS.word = {
    title: 'New word, sign or sound',
    html: function (d) {
      return '<label>What did ' + esc(cname()) + ' say or do?<input name="word" required maxlength="80" value="' + esc(d.word || '') + '" placeholder="e.g. more, mama, \'car go\'" autocomplete="off"></label>' +
        '<label>It was a…' + chips('kind', KINDS, d.kind || 'word') + '</label>' +
        '<label>How?' + chips('how', HOW, d.how || 'own') + '</label>' +
        '<label>Language' + chips('lang', ['English', 'Liberian English', 'Kpelle', 'Bassa', 'Kru', 'Other'], d.lang || '') + '</label>' +
        '<label>Where or when? (optional)<input name="note" maxlength="200" value="' + esc(d.note || '') + '" placeholder="e.g. asking for water at lunch"></label>';
    },
    after: function (form) {
      var inp = form.querySelector('[name=word]');
      inp.addEventListener('input', function () {
        var n = inp.value.trim().split(/\s+/).filter(Boolean).length;
        if (n >= 2) form.querySelectorAll('[data-name=kind] .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === 'phrase'); });
        var dup = words().find(function (x) { return x.data.word.toLowerCase() === inp.value.trim().toLowerCase(); });
        var hint = form.querySelector('.dup') || form.insertBefore(document.createElement('p'), inp.parentNode.nextSibling);
        hint.className = 'dup small muted';
        hint.textContent = dup ? 'Already in the list since ' + TG.fmtDate(dup.date, true) + '. Saving adds it again only if you want to record it as new.' : '';
      });
    },
    read: function (v) {
      if (!v.word) return 'Type the word first.';
      var n = v.word.split(/\s+/).filter(Boolean).length;
      return { word: v.word, kind: v.kind || (n > 1 ? 'phrase' : 'word'), how: v.how || 'own', lang: v.lang, note: v.note, length: n };
    }
  };

  /* Practice session */
  FORMS.session = {
    title: 'Practice session',
    html: function (d, r, hint) {
      var act = goals('active');
      var pre = {};
      if (r) Object.keys(d.results || {}).forEach(function (k) { pre[k] = d.results[k]; });
      var actId = d.activityId || (hint.indexOf('a:') === 0 ? hint.slice(2) : '');
      var a = TG.byId(C.ACTIVITIES, actId);
      if (!r) act.forEach(function (g) {
        if ((a && a.goals.indexOf(g.data.goalId) >= 0) || hint === 'g:' + g.id) pre[g.id] = { own: 0, help: 0, no: 0 };
      });
      var mins = [5, 10, 15, 20, 30];
      return '<label>How many minutes?' + chips('minutesChip', mins.map(function (m) { return { v: String(m), l: m + ' min' }; }), String(d.minutes || (a ? a.minutes : 10))) + '</label>' +
        '<label>Activity (optional)<select name="activityId"><option value="">— Everyday routine / free play —</option>' + C.ACTIVITIES.map(function (x) { return '<option value="' + x.id + '"' + (x.id === actId ? ' selected' : '') + '>' + x.emoji + ' ' + esc(x.title) + '</option>'; }).join('') + '</select></label>' +
        '<h3>Goals practised</h3>' +
        (act.length ? '<p class="muted small">Tick the goals you worked on. Tap + each time ' + esc(cname()) + ' did it.</p><div class="goal-scores">' + act.map(function (g) {
          var res = pre[g.id];
          return '<div class="gscore' + (res ? ' on' : '') + '" data-g="' + g.id + '"><label class="check"><input type="checkbox" ' + (res ? 'checked' : '') + '> ' + areaTag(g.data.area) + ' ' + esc(TG.goalTitle(g.data)) + '</label><div class="counters">' +
            counter('own', TG.isSchool() ? '✓ Correct' : '⭐ On own', res && res.own, 'good') + counter('help', '🤝 With help', res && res.help) + counter('no', TG.isSchool() ? '✗ Wrong / not yet' : '✗ Not yet', res && res.no, 'bad') + '</div></div>';
        }).join('') + '</div>' : '<p class="muted">No goals chosen yet. <a href="#/goals">Choose goals</a> to track progress, or just record the time.</p>') +
        '<label>How was ' + esc(cname()) + '?' + chips('mood', ['😀 Happy', '🙂 OK', '😴 Tired', '😣 Upset', '🤒 Unwell'], d.mood || '') + '</label>' +
        '<label>Notes (optional)<textarea name="note" rows="2" maxlength="1000" placeholder="What worked? What was hard?">' + esc(d.note || '') + '</textarea></label>';
    },
    after: function (form) {
      form.querySelectorAll('.gscore').forEach(function (box) {
        var cb = box.querySelector('input[type=checkbox]');
        cb.onchange = function () { box.classList.toggle('on', cb.checked); };
        box.addEventListener('click', function (e) { if (e.target.closest('.cbtn') && !cb.checked) { cb.checked = true; box.classList.add('on'); } });
      });
    },
    read: function (v, form) {
      var results = {};
      form.querySelectorAll('.gscore').forEach(function (box) {
        if (!box.querySelector('input[type=checkbox]').checked) return;
        var r = {};
        box.querySelectorAll('.counter').forEach(function (c) { r[c.dataset.name] = +c.querySelector('output').textContent || 0; });
        results[box.dataset.g] = r;
      });
      return { minutes: +v.minutesChip || 10, activityId: v.activityId, results: results, mood: v.mood, note: v.note };
    },
    saved: function (r) {
      var ready = Object.keys(r.data.results || {}).filter(readyToMaster);
      if (ready.length) setTimeout(function () { TG.toast('🎉 A goal looks learned! Open Goals to mark it.'); }, 2700);
    }
  };

  /* Behaviour */
  var B = C.BEHAVIOUR;
  FORMS.behaviour = {
    title: 'Behaviour (ABC)',
    html: function (d) {
      return '<label>Time<input type="time" name="time" value="' + esc(d.time || TG.nowTime()) + '"></label>' +
        '<label><b>B</b> — What happened?' + chips('behaviours', B.behaviours, d.behaviours || [], true) + '</label>' +
        '<label>How strong? (1 = mild, 5 = very strong)' + chips('intensity', ['1', '2', '3', '4', '5'], String(d.intensity || '')) + '</label>' +
        '<label>How long? (minutes)<input type="number" name="minutes" min="0" max="240" value="' + esc(d.minutes || '') + '"></label>' +
        '<label><b>A</b> — What happened just before?' + chips('before', B.before, d.before || [], true) + '</label>' +
        '<label><b>C</b> — What happened after?' + chips('after', B.after, d.after || [], true) + '</label>' +
        '<label>What helped calm things?' + chips('helped', B.helped, d.helped || [], true) + '</label>' +
        '<label>Notes<textarea name="note" rows="2" maxlength="1000">' + esc(d.note || '') + '</textarea></label>';
    },
    read: function (v) {
      if (!v.behaviours.length) return 'Choose what happened.';
      return { time: v.time, behaviours: v.behaviours, intensity: +v.intensity || 0, minutes: v.minutes || 0, before: v.before, after: v.after, helped: v.helped, note: v.note };
    },
    info: function () { return '<div class="card tip"><p><b>Why ABC?</b> Most difficult behaviour is a way of saying something. After 1–2 weeks, <a href="#/behaviour">Behaviour</a> shows the patterns and what to teach instead.</p></div>'; }
  };

  /* Toilet */
  FORMS.toilet = {
    title: 'Toilet',
    html: function (d) {
      return '<label>Time<input type="time" name="time" value="' + esc(d.time || TG.nowTime()) + '"></label>' +
        '<label>What?' + chips('kind', [{ v: 'pee', l: '💧 Pee' }, { v: 'poo', l: '💩 Poo' }, { v: 'sit', l: '🪑 Just sat' }], d.kind || 'pee') + '</label>' +
        '<label>Where?' + chips('where', [{ v: 'potty', l: '✓ Potty / toilet' }, { v: 'accident', l: '✗ Accident' }, { v: 'nothing', l: '— Nothing came' }], d.where || 'potty') + '</label>' +
        '<label class="check"><input type="checkbox" name="told"' + (d.told ? ' checked' : '') + '> ' + esc(cname()) + ' told us first (word, sign or picture)</label>';
    },
    read: function (v) { return { time: v.time, kind: v.kind || 'pee', where: v.where || 'potty', told: !!v.told }; },
    info: function () { return '<a class="card link-card" href="#/guide/toilet">🚽 Toilet training guide ›</a>'; }
  };

  /* Sleep */
  function sleepHours(d) {
    if (!d.bed || !d.wake) return (d.naps || 0) / 60;
    var b = d.bed.split(':'), w = d.wake.split(':');
    var mins = (+w[0] * 60 + +w[1]) - (+b[0] * 60 + +b[1]);
    if (mins <= 0) mins += 1440;
    return (mins + (+d.naps || 0)) / 60;
  }
  TG.sleepHours = sleepHours;
  FORMS.sleep = {
    title: 'Sleep',
    html: function (d) {
      return '<p class="muted small">Use the date of the morning ' + esc(cname()) + ' woke up.</p>' +
        '<div class="row gap"><label>Went to sleep<input type="time" name="bed" value="' + esc(d.bed || '20:00') + '"></label><label>Woke up<input type="time" name="wake" value="' + esc(d.wake || '06:30') + '"></label></div>' +
        '<label>Naps yesterday (minutes in total)<input type="number" name="naps" min="0" max="600" value="' + esc(d.naps === undefined ? '' : d.naps) + '"></label>' +
        counter('wakings', 'Night wakings', d.wakings) +
        '<label>Notes<input name="note" maxlength="300" value="' + esc(d.note || '') + '"></label>';
    },
    read: function (v) { return { bed: v.bed, wake: v.wake, naps: v.naps || 0, wakings: v.wakings, note: v.note }; },
    info: function () { return '<a class="card link-card" href="#/guide/sleep">🌙 Sleep guide ›</a>'; }
  };

  /* Meal */
  var GROUP_CHIPS = C.FOOD.groups.map(function (g) { return { v: g.id, l: g.emoji + ' ' + g.name.split(' (')[0] }; });
  FORMS.meal = {
    title: 'Meal / new food',
    html: function (d, r) {
      if (!r && TG.prefill) { d = TG.prefill; TG.prefill = null; }
      return '<label>Which meal?' + chips('meal', [{ v: 'breakfast', l: 'Breakfast' }, { v: 'lunch', l: 'Lunch' }, { v: 'dinner', l: 'Dinner' }, { v: 'snack', l: 'Snack' }], d.meal || guessMeal()) + '</label>' +
        '<label>Tap the foods served</label><div class="pick" id="foodPick">' + foodItems().map(function (x) { return '<button type="button" class="chip" data-f="' + esc(x.n) + '" data-g="' + x.g.join(' ') + '">' + esc(x.n) + '</button>'; }).join('') + '</div>' +
        '<label>Food groups on the plate' + chips('groups', GROUP_CHIPS, d.groups || [], true) + '</label>' +
        '<label>What did you serve? (optional)<input name="food" maxlength="120" value="' + esc(d.food || '') + '" placeholder="e.g. rice, potato greens, fish"></label>' +
        '<label>How much did ' + esc(cname()) + ' eat?' + chips('amount', ['All', 'Most', 'Some', 'A little', 'None'], d.amount || '') + '</label>' +
        '<label>New food tried? (optional)<input name="newFood" maxlength="60" value="' + esc(d.newFood || '') + '" placeholder="e.g. pawpaw"></label>' +
        '<label>How far did they get with it?' + chips('step', ['👀 Looked', '✋ Touched', '👃 Smelled', '👅 Licked', '😋 Tasted', '🍽️ Ate it'], d.step || '') + '</label>' +
        '<label>Notes<input name="note" maxlength="300" value="' + esc(d.note || '') + '"></label>';
    },
    after: function (form) {
      var food = form.querySelector('[name=food]');
      form.querySelectorAll('#foodPick .chip').forEach(function (b) {
        b.onclick = function () {
          b.classList.toggle('on');
          var names = food.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
          var i = names.indexOf(b.dataset.f);
          if (b.classList.contains('on') && i < 0) names.push(b.dataset.f); else if (!b.classList.contains('on') && i >= 0) names.splice(i, 1);
          food.value = names.join(', ');
          if (b.classList.contains('on')) b.dataset.g.split(' ').forEach(function (g) { var c = form.querySelector('[data-name=groups] .chip[data-v="' + g + '"]'); if (c) c.classList.add('on'); });
        };
      });
    },
    read: function (v) { return { meal: v.meal || guessMeal(), groups: v.groups, food: v.food, amount: v.amount, newFood: v.newFood, step: v.newFood ? v.step : '', note: v.note }; },
    info: function () { return '<a class="card link-card" href="#/food">🍌 Food guide: what a ' + esc(TG.ageText(TG.childAge()) || 'young child') + ' needs ›</a>'; }
  };
  function foodItems() { var cu = TG.cuisine(); return C.FOOD.items.filter(function (x) { return cu === 'both' || x.c === 'both' || x.c === cu; }); }
  function guessMeal() { var h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : 'dinner'; }

  /* Day check-in */
  FORMS.checkin = {
    title: 'How was today?',
    html: function (d) {
      return '<label>Mood' + chips('mood', ['😀 Great', '🙂 Good', '😐 OK', '🙁 Hard', '😢 Very hard'], d.mood || '') + '</label>' +
        '<label>Health' + chips('health', ['Well', 'Cold / cough', 'Fever', 'Ear pain', 'Tummy upset', 'Teething', 'Malaria / clinic', 'Other'], d.health || [], true) + '</label>' +
        '<label>Screen time (TV, phone, tablet videos)' + chips('screen', [{ v: '0', l: 'None' }, { v: '15', l: '15 min' }, { v: '30', l: '30 min' }, { v: '60', l: '1 hour' }, { v: '90', l: '1½ h' }, { v: '120', l: '2 h +' }], String(d.screen === undefined ? '' : d.screen)) + '</label>' +
        '<label>Outside / active play' + chips('outside', [{ v: '0', l: 'None' }, { v: '30', l: '30 min' }, { v: '60', l: '1 hour' }, { v: '120', l: '2 h +' }], String(d.outside === undefined ? '' : d.outside)) + '</label>' +
        '<label>Notes<textarea name="note" rows="2" maxlength="1000">' + esc(d.note || '') + '</textarea></label>';
    },
    read: function (v) { return { mood: v.mood, health: v.health, screen: v.screen === '' ? '' : +v.screen, outside: v.outside === '' ? '' : +v.outside, note: v.note }; },
    info: function () { return '<div class="card tip"><p><b>Why record health?</b> Colds and ear infections can make hearing muffled for weeks, which slows talking. Many sick days or ear pain are worth mentioning to the doctor.</p></div>'; }
  };

  /* Journal */
  FORMS.journal = {
    title: 'Celebration / note',
    html: function (d) {
      return '<label>Title<input name="title" maxlength="80" required value="' + esc(d.title || '') + '" placeholder="e.g. First time saying \'Papa\'!"></label>' +
        '<label>What happened?<textarea name="text" rows="4" maxlength="3000">' + esc(d.text || '') + '</textarea></label>';
    },
    read: function (v) { return v.title ? { title: v.title, text: v.text } : 'Add a title.'; }
  };

  /* Goal record edit (from entries list) */
  FORMS.goal = {
    title: 'Goal',
    html: function (d) { return '<p><b>' + esc(TG.goalTitle(d)) + '</b></p><label>Status' + chips('status', [{ v: 'active', l: 'Working on it' }, { v: 'learned', l: '🏆 Learned' }, { v: 'paused', l: 'Paused' }], d.status) + '</label>'; },
    read: function (v, f, r) { var d = Object.assign({}, r.data); d.status = v.status || d.status; if (d.status === 'learned' && !d.learnedOn) d.learnedOn = TG.today(); return d; }
  };
  FORMS.milestone = { title: 'Milestone', html: function (d) { var m = TG.byId(C.MILESTONES, d.item) || {}; return '<p>' + esc(m.text || d.item) + '</p>' + chips('answer', [{ v: 'yes', l: '✓ Yes' }, { v: 'sometimes', l: '~ Sometimes' }, { v: 'no', l: '✗ Not yet' }], d.answer); }, read: function (v, f, r) { return { item: r.data.item, answer: v.answer || r.data.answer }; } };
  FORMS.plan = { title: 'Weekly focus', html: function (d) { return '<p>' + esc((TG.byId(C.METHODS, d.focus) || {}).name || '') + '</p>'; }, read: function (v, f, r) { return r.data; } };
  FORMS.tools = { title: 'Child tools settings', html: function () { return '<p>Change these in Child tools.</p>'; }, read: function (v, f, r) { return r.data; } };
  FORMS.child = { title: 'Child', html: function () { return '<p>Edit the child under More ▸ Children.</p>'; }, read: function (v, f, r) { return r.data; } };

  /* ---------- WORDS ---------- */
  X.talk = function (arg) {
    var c = TG.child(); if (!c) return X.home();
    var filter = arg || 'all';
    var all = words();
    var shown = all.filter(function (w) { return filter === 'all' || (w.data.kind || 'word') === filter; });
    var counts = { word: 0, phrase: 0, sign: 0, sound: 0 };
    all.forEach(function (w) { counts[w.data.kind || 'word']++; });
    var longest = all.reduce(function (m, w) { return Math.max(m, w.data.length || 1); }, 0);
    var have = {}; all.forEach(function (w) { have[w.data.word.toLowerCase()] = 1; });
    var ideas = C.CORE_WORDS.concat(C.FOOD_WORDS).filter(function (x) { return !have[x.w.toLowerCase()]; }).slice(0, 18);
    // growth chart: cumulative words by week for the last 12 weeks
    var pts = [], start = TG.weekKey(TG.addDays(TG.today(), -77));
    for (var i = 0; i < 12; i++) {
      var end = TG.addDays(start, 7 * i + 6);
      pts.push({ label: TG.fmtDate(TG.addDays(start, 7 * i)).replace(/ \d{4}$/, ''), y: all.filter(function (w) { return w.date <= end; }).length });
    }
    return '<div class="page-head"><h1>' + esc(c.data.name) + '\'s words</h1><a class="btn primary" href="#/add/word">＋ Add</a></div>' +
      '<div class="stats small4">' + stat('💬', counts.word, 'words', '', '#/talk/word') + stat('🗨️', counts.phrase, 'phrases', longest > 1 ? 'longest: ' + longest + ' words' : '', '#/talk/phrase') + stat('🤟', counts.sign, 'signs', '', '#/talk/sign') + stat('🔊', counts.sound, 'sounds', '', '#/talk/sound') + '</div>' +
      '<form class="card quickword" id="qw"><input name="w" placeholder="Heard a new word? Type it here" autocomplete="off" maxlength="80">' + chips('how', HOW, 'own') + '<button class="btn primary">Add</button></form>' +
      '<section class="card"><h2>Words over the last 12 weeks</h2>' + TG.lineChart(pts, { label: 'words' }) + '</section>' +
      (ideas.length ? '<section class="card"><h2>Words to listen for</h2><p class="muted small">Useful first words. Tap one when you hear it (or see the sign).</p><div class="idea-chips">' + ideas.map(function (x) { return '<button class="chip idea" data-w="' + esc(x.w) + '">' + x.e + ' ' + esc(x.w) + '</button>'; }).join('') + '</div></section>' : '') +
      '<section class="card"><div class="card-head"><h2>All</h2>' + '<div class="seg">' + ['all', 'word', 'phrase', 'sign', 'sound'].map(function (k) { return '<a href="#/talk/' + k + '" class="' + (k === filter ? 'on' : '') + '">' + cap(k === 'all' ? 'all' : k + 's') + '</a>'; }).join('') + '</div></div>' +
      '<input class="search" id="wsearch" placeholder="Search…">' +
      (shown.length ? '<div class="word-list" id="wlist">' + shown.map(function (w) {
        return '<a class="word" href="#/add/word/' + w.id + '" data-s="' + esc(w.data.word.toLowerCase()) + '"><b>' + esc(w.data.word) + '</b><small>' + ({ own: '⭐', copied: '🪞', help: '🤝' }[w.data.how] || '') + ' ' + esc(TG.fmtDate(w.date)) + '</small></a>';
      }).join('') + '</div>' : empty('No ' + (filter === 'all' ? 'words' : filter + 's') + ' yet. Every sound and sign counts: add them as you hear them.')) + '</section>' +
      '<p class="muted small">⭐ on own · 🪞 copied you · 🤝 with help. A word counts when ' + esc(c.data.name) + ' uses it to mean something, even if it isn\'t clear yet ("wa" for water).</p>';
  };
  X.talk.after = function (main) {
    var f = main.querySelector('#qw');
    f.onsubmit = function (e) {
      e.preventDefault();
      var v = val(f); if (!v.w) return;
      var n = v.w.split(/\s+/).filter(Boolean).length;
      TG.save('word', { word: v.w, kind: n > 1 ? 'phrase' : 'word', how: v.how || 'own', length: n });
      TG.toast('"' + v.w + '" added ✓'); TG.render();
    };
    main.querySelectorAll('.idea').forEach(function (b) {
      b.onclick = function () {
        TG.sheet('Heard "' + b.dataset.w + '"?', '<p>How did ' + esc(cname()) + ' say it?</p>' + chips('how', HOW, 'own') + chips('kind', KINDS.slice(0, 3), 'word') + '<button class="btn primary big" id="ok">Add "' + esc(b.dataset.w) + '"</button>', function (body) {
          TG.bindWidgets(body);
          body.querySelector('#ok').onclick = function () { var v = val(body); TG.save('word', { word: b.dataset.w, kind: v.kind || 'word', how: v.how || 'own', length: 1 }); TG.closeSheet(); TG.toast('Added ✓'); TG.render(); };
        });
      };
    });
    var s = main.querySelector('#wsearch');
    if (s) s.oninput = function () { var q = s.value.toLowerCase(); main.querySelectorAll('#wlist .word').forEach(function (w) { w.hidden = q && w.dataset.s.indexOf(q) < 0; }); };
  };

  /* ---------- GOALS ---------- */
  X.goals = function () {
    var c = TG.child(); if (!c) return X.home();
    var act = goals('active'), learned = goals('learned'), paused = goals('paused');
    var st = TG.S().settings;
    return '<div class="page-head"><h1>Goals for ' + esc(c.data.name) + '</h1><button class="btn primary" id="addGoals">＋ Add goals</button></div>' +
      '<p class="muted small">Work on 3–6 goals at a time. A goal is learned when ' + esc(c.data.name) + ' does it on their own ' + st.masteryPercent + '% of the time in ' + st.masterySessions + ' practices in a row.</p>' +
      (act.length ? groupByArea(act).map(function (grp) {
        return '<section class="card"><h2>' + area(grp.area).icon + ' ' + esc(area(grp.area).name) + '</h2><div class="list">' + grp.items.map(goalRow).join('') + '</div></section>';
      }).join('') : empty('No goals yet. Add a few goals so the daily plan and progress charts fit ' + esc(c.data.name) + '.', '<button class="btn primary" id="addGoals2">Choose goals</button>')) +
      (learned.length ? '<section class="card"><h2>🏆 Learned (' + learned.length + ')</h2><div class="list">' + learned.map(goalRow).join('') + '</div></section>' : '') +
      (paused.length ? '<section class="card"><h2>Paused</h2><div class="list">' + paused.map(goalRow).join('') + '</div></section>' : '');
  };
  function groupByArea(list) {
    var out = [];
    list.forEach(function (g) { var grp = out.find(function (x) { return x.area === g.data.area; }); if (!grp) out.push(grp = { area: g.data.area, items: [] }); grp.items.push(g); });
    return out;
  }
  function goalRow(g) {
    var p = goalPct(g.id), ready = g.data.status === 'active' && readyToMaster(g.id);
    return '<a class="list-item goal-row" href="#/goal/' + g.id + '"><span class="grow"><b>' + esc(TG.goalTitle(g.data)) + '</b>' +
      (g.data.status === 'learned' ? '<small>Learned ' + esc(TG.fmtDate(g.data.learnedOn, true)) + '</small>' :
        '<small>' + (p.pct === null ? 'Not practised yet' : p.pct + '% on own · ' + TG.plural(p.sessions, 'practice')) + (ready ? ' · <span class="badge">Ready to mark learned!</span>' : '') + '</small>' + TG.progress(p.pct || 0, area(g.data.area).color)) +
      '</span><span class="chev">›</span></a>';
  }
  X.goals.after = function (main) { ['#addGoals', '#addGoals2'].forEach(function (s) { var b = main.querySelector(s); if (b) b.onclick = goalLibrary; }); };

  var libGrade = 0;
  function goalLibrary() {
    var c = TG.child(), age = TG.ageMonths(c.data.birth) || 36;
    var have = {}; goals().forEach(function (g) { if (g.data.goalId && g.data.status !== 'paused') have[g.data.goalId] = 1; });
    var sp = TG.byId(C.STARTING_POINTS, c.data.start) || null;
    var suggested = sp ? sp.goals : [];
    var school = TG.isSchool(c), gr = libGrade || TG.grade(c);
    var html = (school ? '<p class="muted small">⭐ = for ' + esc(c.data.name) + '\'s class. Choose another grade to catch up or work ahead:</p><div class="seg" id="libGrades">' + C.GRADES.map(function (g) { return '<button type="button" data-g="' + g.g + '" class="' + (g.g === gr ? 'on' : '') + '">' + g.short + '</button>'; }).join('') + '</div>'
      : '<p class="muted small">⭐ = suggested for ' + esc(c.data.name) + '\'s age and starting point.</p>') + C.AREAS.filter(function (a) { return TG.areaFits(a.id, c); }).map(function (a) {
      var gs = C.GOALS.filter(function (g) { return g.area === a.id && (!g.grade || g.grade === gr); });
      return '<h3>' + a.icon + ' ' + esc(a.name) + '</h3><div class="lib">' + gs.map(function (g) {
        var sug = school ? (g.grade ? g.grade === TG.grade(c) : true) : suggested.indexOf(g.id) >= 0 || (a.id !== 'talk' && age >= g.ages[0] - 3 && age <= g.ages[1]);
        return '<label class="lib-item' + (have[g.id] ? ' have' : '') + '"><input type="checkbox" value="' + g.id + '"' + (have[g.id] ? ' disabled checked' : '') + '><span><b>' + (sug && !have[g.id] ? '⭐ ' : '') + esc(g.title) + '</b><small>' + esc(g.detail) + '</small></span></label>';
      }).join('') + '</div>';
    }).join('') +
      '<h3>Your own goal</h3><div class="row gap"><input id="customGoal" placeholder="e.g. Says Grandma\'s name" maxlength="80"><select id="customArea">' + C.AREAS.filter(function (a) { return TG.areaFits(a.id, c); }).map(function (a) { return '<option value="' + a.id + '">' + esc(a.short) + '</option>'; }).join('') + '</select></div>' +
      '<button class="btn primary big sticky-btn" id="addSel">Add selected goals</button>';
    TG.sheet(school ? 'Choose skills' : 'Choose goals', html, function (body) {
      body.querySelectorAll('#libGrades [data-g]').forEach(function (b) { b.onclick = function () { libGrade = +b.dataset.g; goalLibrary(); libGrade = 0; }; });
      body.querySelector('#addSel').onclick = function () {
        var n = 0;
        body.querySelectorAll('input[type=checkbox]:checked:not(:disabled)').forEach(function (cb) {
          var g = TG.byId(C.GOALS, cb.value);
          var old = goals().find(function (x) { return x.data.goalId === g.id; });
          TG.save('goal', { goalId: g.id, area: g.area, status: 'active', started: TG.today() }, { id: old ? old.id : undefined }); n++;
        });
        var cg = body.querySelector('#customGoal').value.trim();
        if (cg) { TG.save('goal', { custom: cg, area: body.querySelector('#customArea').value, status: 'active', started: TG.today() }); n++; }
        TG.closeSheet(); TG.toast(TG.plural(n, 'goal') + ' added ✓'); TG.render();
      };
    });
  }
  TG.goalLibrary = goalLibrary;

  X.goal = function (id) {
    var g = TG.rec(id); if (!g) return empty('Goal not found.');
    var lib = TG.byId(C.GOALS, g.data.goalId) || {};
    var h = goalHistory(g.id);
    var acts = C.ACTIVITIES.filter(function (a) { return a.goals.indexOf(g.data.goalId) >= 0; });
    var meth = (lib.methods || []).map(function (m) { return TG.byId(C.METHODS, m); }).filter(Boolean);
    var ready = g.data.status === 'active' && readyToMaster(g.id);
    return back('#/goals', 'Goals') + '<section class="card"><div>' + areaTag(g.data.area) + '</div><h1>' + esc(TG.goalTitle(g.data)) + '</h1>' + (lib.detail ? '<p>' + esc(lib.detail) + '</p>' : '') +
      '<p class="muted small">Started ' + esc(TG.fmtDate(g.data.started || g.date, true)) + (lib.ages ? ' · usually between ' + TG.ageText(lib.ages[0]) + ' and ' + TG.ageText(lib.ages[1]) : '') + '</p>' +
      (ready ? '<div class="banner good">🎉 ' + esc(cname()) + ' did this on their own in the last ' + TG.S().settings.masterySessions + ' practices. Mark it as learned?</div>' : '') +
      '<div class="row gap wrap">' + (g.data.status === 'active' ? '<a class="btn primary" href="#/add/session/g:' + g.id + '">⏱️ Practise now</a><button class="btn" data-st="learned">🏆 Mark learned</button><button class="btn" data-st="paused">Pause</button>' : '<button class="btn primary" data-st="active">Work on it again</button>') + '</div></section>' +
      '<section class="card"><h2>Progress</h2>' + (h.length ? TG.lineChart(h.slice(-15).map(function (x) { return { label: TG.fmtDate(x.date).replace(/ \d{4}$/, ''), y: x.pct }; }), { max: 100, label: '% on own' }) +
        '<p class="muted small">% of tries done on own, per practice.</p><div class="list">' + h.slice(-6).reverse().map(function (x) {
          return '<a class="list-item" href="#/add/session/' + x.session.id + '"><span class="grow"><b>' + esc(TG.fmtDate(x.date)) + ' — ' + x.pct + '%</b><small>⭐ ' + x.own + ' · 🤝 ' + x.help + ' · ✗ ' + x.no + ' · ' + who(x.session) + '</small></span></a>';
        }).join('') + '</div>' : '<p class="muted">No practice recorded yet for this goal.</p>') + '</section>' +
      (meth.length ? '<section class="card"><h2>How to help</h2><div class="list">' + meth.map(function (m) { return '<a class="list-item" href="#/method/' + m.id + '"><span class="emoji-box">' + m.icon + '</span><span><b>' + esc(m.name) + '</b><small>' + esc(m.short) + '</small></span><span class="chev">›</span></a>'; }).join('') + '</div></section>' : '') +
      (acts.length ? '<section class="card"><h2>Activities for this goal</h2><div class="list">' + acts.map(actRow).join('') + '</div></section>' : '');
  };
  X.goal.after = function (main, id) {
    main.querySelectorAll('[data-st]').forEach(function (b) {
      b.onclick = function () {
        var g = TG.rec(id), d = Object.assign({}, g.data); d.status = b.dataset.st;
        if (d.status === 'learned') { d.learnedOn = TG.today(); }
        TG.save('goal', d, { id: id });
        if (d.status === 'learned') TG.save('journal', { title: '🏆 Learned: ' + TG.goalTitle(d), text: 'Marked as learned by ' + TG.me().name + '.' });
        TG.toast(d.status === 'learned' ? '🏆 Well done, ' + cname() + '!' : 'Saved ✓'); TG.render();
      };
    });
  };

  /* ---------- LEARN ---------- */
  X.learn = function () {
    var tiles = [
      ['#/activities', '🎲', 'Activities', C.ACTIVITIES.length + ' play activities with steps and words to use'],
      ['#/methods', '🦉', 'How to help a child talk', 'The proven methods, one at a time'],
      ['#/milestones', '🪜', 'Milestones', 'What most children do by each age'],
      ['#/videos', '▶️', 'Videos & learning', 'YouTube channels and free learning sites by age'],
      ['#/food', '🍌', 'Food guide', 'Liberian meals, food groups, safety, picky eating'],
      ['#/guide/behaviour', '💛', 'Behaviour', 'ABC, calm-down, first–then, praise'],
      ['#/methods', '👂', 'Attention & listening', 'Short sessions, fewer distractions, move then focus'],
      ['#/guide/toilet', '🚽', 'Toilet training', 'Readiness signs and steps'],
      ['#/guide/sleep', '🌙', 'Sleep', 'How much, and a good routine'],
      ['#/guide/help', '🩺', 'When to get help', 'Signs to see a doctor or therapist'],
      ['#/guide/facts', '💡', 'Good to know', 'Languages, screens, diets, late talkers']
    ];
    if (TG.isSchool()) {
      tiles = tiles.filter(function (t) { return ['#/milestones', '#/guide/toilet'].indexOf(t[0]) < 0; });
      tiles.unshift(['#/study/plan', '📋', 'Study plan by grade', 'English, Maths and Science for Grade 1–6']);
      tiles[2] = ['#/methods', '🧠', 'How to help with school', 'Reading daily, quizzing, maths in daily life, homework routine'];
    }
    if (TG.S().prefs.faith) tiles.push(['#/guide/faith', '🙏🏾', 'Faith routines', 'Prayers and songs as language practice']);
    tiles.push(['#/guide/sources', '📑', 'Where this comes from', 'The research and guidance behind the app']);
    return '<h1>Learn</h1><div class="tiles">' + tiles.map(function (t) { return '<a class="tile" href="' + t[0] + '"><span class="big-emoji">' + t[1] + '</span><b>' + esc(t[2]) + '</b><small>' + esc(t[3]) + '</small></a>'; }).join('') + '</div>';
  };

  function actRow(a) { return '<a class="list-item" href="#/activity/' + a.id + '"><span class="emoji-box">' + a.emoji + '</span><span><b>' + esc(a.title) + '</b><small>' + a.minutes + ' min · ' + esc(area(a.area).short) + '</small></span><span class="chev">›</span></a>'; }
  X.activities = function (arg) {
    var c = TG.child(), age = c ? TG.ageMonths(c.data.birth) : null;
    var filter = arg || 'mine';
    var goalIds = goals('active').map(function (g) { return g.data.goalId; });
    var school = TG.isSchool(c), gr = TG.grade(c);
    var list = C.ACTIVITIES.filter(function (a) {
      if (!TG.areaFits(a.area, c) || (school && a.grades && (a.grades[0] > gr || a.grades[1] < gr)) || (!school && a.grades)) return false;
      if (filter === 'mine' && school) return !!a.grades || goalIds.some(function (g) { return a.goals.indexOf(g) >= 0; });
      if (filter === 'mine') return !goalIds.length || a.goals.some(function (g) { return goalIds.indexOf(g) >= 0; });
      if (filter === 'all') return true;
      return a.area === filter;
    });
    return back('#/learn', 'Learn') + '<h1>Activities</h1><div class="seg wrap">' + [['mine', '🎯 For our goals'], ['all', 'All']].concat(C.AREAS.filter(function (a) { return TG.areaFits(a.id, c); }).map(function (a) { return [a.id, a.icon + ' ' + a.short]; })).map(function (t) {
      return '<a href="#/activities/' + t[0] + '" class="' + (t[0] === filter ? 'on' : '') + '">' + esc(t[1]) + '</a>';
    }).join('') + '</div>' + '<div class="list cards">' + list.map(function (a) {
      var fits = age === null || (age >= a.ages[0] - 3 && age <= a.ages[1]);
      return '<a class="list-item" href="#/activity/' + a.id + '"><span class="emoji-box">' + a.emoji + '</span><span class="grow"><b>' + esc(a.title) + '</b><small>' + a.minutes + ' min · ' + esc(area(a.area).short) + (fits ? '' : ' · for other ages') + '</small></span><span class="chev">›</span></a>';
    }).join('') + '</div>';
  };

  X.activity = function (id) {
    var a = TG.byId(C.ACTIVITIES, id); if (!a) return empty('Not found.');
    var gl = a.goals.map(function (g) { return TG.byId(C.GOALS, g); }).filter(Boolean);
    return back('#/activities', 'Activities') + '<article class="card activity"><div class="act-head"><span class="huge">' + a.emoji + '</span><div><h1>' + esc(a.title) + '</h1><p class="muted">' + a.minutes + ' minutes · ' + esc(area(a.area).name) + ' · ages ' + TG.ageText(a.ages[0]) + '–' + TG.ageText(a.ages[1]) + '</p></div></div>' +
      '<h2>You need</h2><ul>' + a.materials.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<h2>Steps</h2><ol class="steps">' + a.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<h2>Words to say</h2><div class="say">' + a.say.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' +
      '<div class="banner tipb">💡 ' + esc(a.tip) + '</div>' +
      '<h2>Goals it helps</h2><div class="tags">' + gl.map(function (g) { return '<span class="tag" style="--c:' + area(g.area).color + '">' + esc(g.title) + '</span>'; }).join('') + '</div>' +
      '<div class="row gap wrap actions"><button class="btn" id="timerBtn">⏲️ Start ' + a.minutes + '-min timer</button><a class="btn primary" href="#/add/session/a:' + a.id + '">✓ Log this practice</a><button class="btn" id="printAct">🖨️ Print card</button></div></article>';
  };
  X.activity.after = function (main, id) {
    var a = TG.byId(C.ACTIVITIES, id);
    main.querySelector('#printAct').onclick = function () { TG.printDoc('activity', a.id); };
    main.querySelector('#timerBtn').onclick = function () { TG.timerSheet(a.minutes, a.title, '#/add/session/a:' + a.id); };
  };

  TG.timerSheet = function (minutes, title, logHref) {
    var left = minutes * 60, t;
    var body = TG.sheet(title || 'Timer', '<div class="timer-big" id="tleft"></div><div class="row gap"><button class="btn" id="tpause">Pause</button>' + (logHref ? '<a class="btn primary" href="' + logHref + '" data-close>Done — log it</a>' : '') + '</div>');
    var el = body.querySelector('#tleft'), paused = false;
    function draw() { el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); }
    draw();
    t = setInterval(function () {
      if (!document.body.contains(el)) { clearInterval(t); return; }
      if (paused) return;
      left--; draw();
      if (left <= 0) { clearInterval(t); el.textContent = '✓ Time!'; if (navigator.vibrate) try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
    }, 1000);
    body.querySelector('#tpause').onclick = function (e) { paused = !paused; e.target.textContent = paused ? 'Continue' : 'Pause'; };
  };

  X.methods = function () {
    var focus = weeklyFocus();
    var ev = { strong: 'Strong evidence', good: 'Good evidence', helpful: 'Widely recommended' };
    return back('#/learn', 'Learn') + '<h1>How to help</h1><p class="muted">Children learn to talk through many small, happy moments with you every day. Try one method per week until it becomes a habit.</p>' +
      C.AREAS.filter(function (a) { return C.METHODS.some(function (m) { return m.area === a.id; }); }).map(function (a) {
        return '<section class="card"><h2>' + a.icon + ' ' + esc(a.name) + '</h2><div class="list">' + C.METHODS.filter(function (m) { return m.area === a.id; }).map(function (m) {
          return '<a class="list-item" href="#/method/' + m.id + '"><span class="emoji-box">' + m.icon + '</span><span class="grow"><b>' + esc(m.name) + (focus && focus.id === m.id ? ' <span class="badge">This week</span>' : '') + '</b><small>' + esc(m.short) + '</small><small class="ev ev-' + m.evidence + '">' + ev[m.evidence] + '</small></span><span class="chev">›</span></a>';
        }).join('') + '</div></section>';
      }).join('');
  };
  X.method = function (id) {
    var m = TG.byId(C.METHODS, id); if (!m) return empty('Not found.');
    var focus = weeklyFocus();
    var relGoals = C.GOALS.filter(function (g) { return g.methods.indexOf(m.id) >= 0; });
    var relActs = C.ACTIVITIES.filter(function (a) { return a.goals.some(function (g) { return relGoals.some(function (x) { return x.id === g; }); }); }).slice(0, 6);
    return back('#/methods', 'How to help') + '<article class="card"><div class="act-head"><span class="huge">' + m.icon + '</span><div><h1>' + esc(m.name) + '</h1><p class="muted small">From: ' + esc(m.from) + '</p></div></div>' +
      '<p class="lead">' + esc(m.short) + '</p><h2>Why it works</h2><p>' + esc(m.why) + '</p><h2>How to do it</h2><ol class="steps">' + m.how.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<div class="banner tipb"><b>Example:</b> ' + esc(m.example) + '</div><div class="banner warn"><b>Avoid:</b> ' + esc(m.avoid) + '</div>' +
      (focus && focus.id === m.id ? '<p class="badge big">📌 This is your focus this week</p>' : '<button class="btn primary" id="setFocus">📌 Make this our focus this week</button>') + '</article>' +
      (relActs.length ? '<section class="card"><h2>Practise it with</h2><div class="list">' + relActs.map(actRow).join('') + '</div></section>' : '');
  };
  X.method.after = function (main, id) { var b = main.querySelector('#setFocus'); if (b) b.onclick = function () { setFocus(id); TG.toast('This week\'s focus is set ✓'); TG.render(); }; };

  /* ---------- MILESTONES ---------- */
  X.milestones = function (bandId) {
    var c = TG.child(); if (!c) return X.home();
    var age = TG.ageMonths(c.data.birth) || 0;
    var band = TG.byId(C.MILESTONE_BANDS, bandId) || bandFor(age);
    var items = C.MILESTONES.filter(function (m) { return m.band === band.id; });
    var ans = { yes: 0, sometimes: 0, no: 0 };
    items.forEach(function (m) { var a = msAnswer(c.id, m.id); if (a) ans[a]++; });
    var behind = band.months <= age && ans.no > 0;
    return '<h1>Milestones</h1><p class="muted small">From the CDC "Learn the Signs. Act Early." checklists. Most children (75% or more) do these by the age shown. ' + esc(c.data.name) + ' is ' + esc(TG.ageText(age)) + '.</p>' +
      '<div class="seg wrap">' + C.MILESTONE_BANDS.map(function (b) { return '<a href="#/milestones/' + b.id + '" class="' + (b.id === band.id ? 'on' : '') + '">' + esc(b.label) + (b.months > age + 1 ? ' ↗' : '') + '</a>'; }).join('') + '</div>' +
      '<section class="card"><div class="ms-summary"><span>✓ ' + ans.yes + ' yes</span><span>~ ' + ans.sometimes + ' sometimes</span><span>✗ ' + ans.no + ' not yet</span><span class="muted">' + (items.length - ans.yes - ans.sometimes - ans.no) + ' to check</span></div>' +
      (band.months > age + 1 ? '<p class="muted small">This age is still ahead. Use it to see what comes next — the next steps to practise.</p>' : '') +
      (behind ? '<div class="banner warn">Some milestones for this age are "not yet". That is a reason to talk with your child\'s doctor and ask for a developmental check and a hearing test. <a href="#/guide/help">When to get help ›</a></div>' : '') + '</section>' +
      Object.keys(C.MILESTONE_AREAS).map(function (ar) {
        var list = items.filter(function (m) { return m.area === ar; });
        if (!list.length) return '';
        return '<section class="card"><h2>' + esc(C.MILESTONE_AREAS[ar]) + '</h2>' + list.map(function (m) {
          var a = msAnswer(c.id, m.id);
          return '<div class="ms" data-m="' + m.id + '"><p>' + esc(m.text) + '</p><div class="ms-btns">' +
            [['yes', '✓ Yes'], ['sometimes', '~ Sometimes'], ['no', '✗ Not yet']].map(function (o) { return '<button class="msb ' + o[0] + (a === o[0] ? ' on' : '') + '" data-a="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
        }).join('') + '</section>';
      }).join('') + '<p class="muted small">This checklist is not a diagnosis or a screening test. Share it with your doctor at every check-up.</p>';
  };
  X.milestones.after = function (main) {
    var c = TG.child();
    main.querySelectorAll('.ms').forEach(function (row) {
      row.querySelectorAll('.msb').forEach(function (b) {
        b.onclick = function () {
          var cur = msAnswer(c.id, row.dataset.m);
          var id = msId(c.id, row.dataset.m);
          if (cur === b.dataset.a) { TG.remove(id); }
          else TG.save('milestone', { item: row.dataset.m, answer: b.dataset.a }, { id: id });
          row.querySelectorAll('.msb').forEach(function (x) { x.classList.toggle('on', x === b && cur !== b.dataset.a); });
          var y = window.scrollY; TG.render(); window.scrollTo(0, y);
        };
      });
    });
  };

  /* ---------- BEHAVIOUR ---------- */
  function countMap(list, key) {
    var m = {};
    list.forEach(function (r) { (r.data[key] || []).forEach(function (x) { m[x] = (m[x] || 0) + 1; }); });
    return Object.keys(m).map(function (k) { return { l: k, v: m[k] }; }).sort(function (a, b) { return b.v - a.v; });
  }
  TG.countMap = countMap;
  function behaviourInsights(list) {
    var funcs = {};
    list.forEach(function (r) { (r.data.before || []).forEach(function (b) { var f = B.functions[b]; if (f) funcs[f] = (funcs[f] || 0) + 1; }); });
    return Object.keys(funcs).map(function (k) { return { l: k, v: funcs[k] }; }).sort(function (a, b) { return b.v - a.v; });
  }
  TG.behaviourInsights = behaviourInsights;
  X.behaviour = function () {
    var c = TG.child(); if (!c) return X.home();
    var all = TG.list('behaviour', c.id);
    var since = TG.addDays(TG.today(), -29);
    var last = all.filter(function (r) { return r.date >= since; });
    var weeks = [];
    for (var i = 7; i >= 0; i--) {
      var ws = TG.addDays(TG.weekKey(), -7 * i), we = TG.addDays(ws, 6);
      weeks.push({ label: TG.fmtDate(ws).replace(/ \d{4}$/, ''), y: all.filter(function (r) { return r.date >= ws && r.date <= we; }).length });
    }
    var tod = { 'Morning': 0, 'Midday': 0, 'Afternoon': 0, 'Evening': 0 };
    last.forEach(function (r) { var h = +(r.data.time || '12').split(':')[0]; tod[h < 11 ? 'Morning' : h < 14 ? 'Midday' : h < 18 ? 'Afternoon' : 'Evening']++; });
    var ins = behaviourInsights(last);
    var avgI = last.length ? (TG.sum(last.map(function (r) { return r.data.intensity || 0; })) / last.length).toFixed(1) : '–';
    return '<div class="page-head"><h1>Feelings & behaviour</h1><a class="btn primary" href="#/add/behaviour">＋ Log</a></div>' +
      '<div class="stats small4">' + stat('📋', last.length, 'in 30 days', '', '#/behaviour') + stat('📊', avgI, 'average strength', '1–5', '#/behaviour') + '</div>' +
      '<section class="card"><h2>Episodes per week</h2>' + TG.lineChart(weeks, { label: 'episodes' }) + '</section>' +
      (last.length >= 3 ? '<section class="card"><h2>What it may be saying</h2><p class="muted small">Based on what happened before, in the last 30 days.</p>' + TG.barChart(ins.slice(0, 4)) +
        (ins[0] ? '<div class="banner tipb"><b>Try this:</b> ' + esc(B.teach[ins[0].l]) + '</div>' : '') + '</section>' +
        '<section class="card"><h2>Patterns</h2><h3>Most common</h3>' + TG.barChart(countMap(last, 'behaviours').slice(0, 5)) + '<h3>Just before</h3>' + TG.barChart(countMap(last, 'before').slice(0, 5)) +
        '<h3>Time of day</h3>' + TG.barChart(Object.keys(tod).map(function (k) { return { l: k, v: tod[k] }; })) + '<h3>What helped</h3>' + TG.barChart(countMap(last, 'helped').slice(0, 5)) + '</section>'
        : '<section class="card"><p class="muted">Log at least 3 episodes to see patterns. Logging takes 20 seconds: tap what happened before, during and after.</p></section>') +
      '<a class="card link-card" href="#/guide/behaviour">💛 Behaviour guide: praise, calm-down, first–then ›</a>' +
      '<section class="card"><h2>Recent</h2>' + (all.length ? '<div class="list">' + all.slice(0, 15).map(entryRow).join('') + '</div>' : '<p class="muted">Nothing logged.</p>') + '</section>';
  };

  /* ---------- DAILY LOG ---------- */
  X.daily = function (tab) {
    var c = TG.child(); if (!c) return X.home();
    tab = tab || (TG.isSchool(c) ? 'sleep' : 'toilet');
    var tabs = [['toilet', '🚽 Toilet'], ['sleep', '🌙 Sleep'], ['meal', '🍽️ Food'], ['checkin', '🌤️ Day']].filter(function (t) { return !(TG.isSchool(c) && t[0] === 'toilet'); });
    var body = '';
    var wk = TG.addDays(TG.today(), -6);
    if (tab === 'toilet') {
      var t = TG.list('toilet', c.id), t7 = t.filter(function (r) { return r.date >= wk; });
      var inPotty = t7.filter(function (r) { return r.data.where === 'potty' && r.data.kind !== 'sit'; }).length;
      var acc = t7.filter(function (r) { return r.data.where === 'accident'; }).length;
      var told = t7.filter(function (r) { return r.data.told; }).length;
      body = '<section class="card"><h2>Quick add (now)</h2><div class="quick t">' +
        [['pee', 'potty', '💧✓', 'Pee in potty'], ['poo', 'potty', '💩✓', 'Poo in potty'], ['sit', 'nothing', '🪑', 'Sat, nothing'], ['pee', 'accident', '💧✗', 'Pee accident'], ['poo', 'accident', '💩✗', 'Poo accident']]
          .map(function (q) { return '<button class="q" data-k="' + q[0] + '" data-w="' + q[1] + '"><span>' + q[2] + '</span>' + q[3] + '</button>'; }).join('') +
        '</div><label class="check"><input type="checkbox" id="told"> ' + esc(c.data.name) + ' told us first</label></section>' +
        '<div class="stats small4">' + stat('✓', inPotty, 'in potty (7 days)', '', '#/daily/toilet') + stat('✗', acc, 'accidents', '', '#/daily/toilet') + stat('🗣️', told, 'told us first', '', '#/daily/toilet') + stat('%', inPotty + acc ? Math.round(inPotty / (inPotty + acc) * 100) + '%' : '–', 'success', '', '#/daily/toilet') + '</div>' +
        '<a class="card link-card" href="#/guide/toilet">🚽 Toilet training guide ›</a>' + listCard(t);
    } else if (tab === 'sleep') {
      var s = TG.list('sleep', c.id), s7 = s.filter(function (r) { return r.date >= wk; });
      var avg = s7.length ? TG.sum(s7.map(function (r) { return sleepHours(r.data); })) / s7.length : 0;
      var pts = s.slice(0, 14).reverse().map(function (r) { return { label: TG.fmtDate(r.date).replace(/ \d{4}$/, ''), y: Math.round(sleepHours(r.data) * 10) / 10 }; });
      body = '<a class="btn primary" href="#/add/sleep">＋ Log last night</a><div class="stats small4">' + stat('🌙', avg ? avg.toFixed(1) + ' h' : '–', 'average (7 days)', 'Goal for 3–5 years: 10–13 h', '#/daily/sleep') + '</div>' +
        '<section class="card"><h2>Hours of sleep</h2>' + TG.lineChart(pts, { max: 14, label: 'hours' }) + '</section><a class="card link-card" href="#/guide/sleep">🌙 Sleep guide ›</a>' + listCard(s);
    } else if (tab === 'meal') {
      var m = TG.list('meal', c.id), m7 = m.filter(function (r) { return r.date >= wk; });
      var byDay = {}; m7.forEach(function (r) { byDay[r.date] = byDay[r.date] || {}; (r.data.groups || []).forEach(function (g) { byDay[r.date][g] = 1; }); });
      var days = Object.keys(byDay), avgG = days.length ? TG.sum(days.map(function (d) { return Object.keys(byDay[d]).length; })) / days.length : 0;
      var groupCount = {}; m7.forEach(function (r) { (r.data.groups || []).forEach(function (g) { groupCount[g] = (groupCount[g] || 0) + 1; }); });
      var tries = {}; m.forEach(function (r) { if (r.data.newFood) { var k = r.data.newFood.toLowerCase(); tries[k] = (tries[k] || 0) + 1; } });
      body = '<a class="btn primary" href="#/add/meal">＋ Log a meal</a><div class="stats small4">' + stat('🥗', avgG ? avgG.toFixed(1) : '–', 'food groups a day', 'Aim for 5–6 of 6', '#/daily/meal') + stat('🆕', Object.keys(tries).length, 'new foods tried', '', '#/daily/meal') + '</div>' +
        '<section class="card"><h2>Food groups this week</h2>' + TG.barChart(C.FOOD.groups.map(function (g) { return { l: g.emoji + ' ' + g.name.split(' (')[0], v: groupCount[g.id] || 0 }; })) + '</section>' +
        (Object.keys(tries).length ? '<section class="card"><h2>New foods: number of tries</h2><p class="muted small">Many children need 8–15 tries before they like a new food.</p>' + TG.barChart(Object.keys(tries).map(function (k) { return { l: k, v: tries[k] }; }).sort(function (a, b) { return b.v - a.v; }), { max: 10 }) + '</section>' : '') +
        '<a class="card link-card" href="#/food">🍌 Food guide ›</a>' + listCard(m);
    } else {
      var d = TG.list('checkin', c.id), d14 = d.filter(function (r) { return r.date >= TG.addDays(TG.today(), -13); });
      var sick = d14.filter(function (r) { return (r.data.health || []).some(function (h) { return h !== 'Well'; }); }).length;
      var scr = d14.filter(function (r) { return r.data.screen !== '' && r.data.screen !== undefined; });
      var avgS = scr.length ? Math.round(TG.sum(scr.map(function (r) { return r.data.screen; })) / scr.length) : null;
      body = '<a class="btn primary" href="#/add/checkin">＋ How was today?</a><div class="stats small4">' + stat('🤒', sick, 'unwell days (2 weeks)', '', '#/daily/checkin') + stat('📺', avgS === null ? '–' : avgS + ' min', 'screen time a day', 'WHO: under 60 min at 2–4 years', '#/daily/checkin') + '</div>' +
        (avgS !== null && avgS > 60 ? '<div class="banner warn">Screen time is above 1 hour a day. Swapping some of it for talk and play helps language most.</div>' : '') + listCard(d);
    }
    return '<h1>Daily log</h1><div class="seg">' + tabs.map(function (t) { return '<a href="#/daily/' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div>' + body;
  };
  function listCard(list) { return '<section class="card"><h2>Recent</h2>' + (list.length ? '<div class="list">' + list.slice(0, 20).map(entryRow).join('') + '</div>' : '<p class="muted">Nothing logged yet.</p>') + '</section>'; }
  X.daily.after = function (main) {
    main.querySelectorAll('.quick.t .q').forEach(function (b) {
      b.onclick = function () {
        var told = main.querySelector('#told');
        TG.save('toilet', { time: TG.nowTime(), kind: b.dataset.k, where: b.dataset.w, told: !!(told && told.checked) });
        TG.toast(b.dataset.w === 'potty' ? 'Saved ✓ Well done!' : 'Saved ✓'); TG.render();
      };
    });
  };

  /* ---------- FOOD ---------- */
  X.food = function () {
    var F = C.FOOD, cu = TG.cuisine(), ng = cu === 'nigerian', both = cu === 'both';
    var meals = ng ? F.mealsNG : F.meals;
    function foods(g) { return ng ? g.foodsNG : both ? g.foods.concat(g.foodsNG) : g.foods; }
    return back('#/learn', 'Learn') + '<h1>Food guide</h1>' +
      '<div class="card"><label style="margin-top:0">Show foods for' + chips('cuisine', F.cuisines.map(function (x) { return { v: x.id, l: x.label }; }), cu) + '</label><p class="muted small">Saved for ' + esc(cname()) + '. It also changes the food list in the meal log and the printed meal plan.</p></div>' +
      '<p class="lead">' + esc(TG.isSchool() ? 'A school-age child needs 3 meals and 1–2 healthy snacks a day, with a good breakfast before school. Portions grow with age: by Grade 4–6 many children eat close to an adult portion. Variety over the week matters more than any single meal.' : F.intro) + '</p>' +
      '<section class="card plate"><h2>🍽️ The plate</h2><p>' + esc(F.plateRule) + '</p></section>' +
      '<section class="card"><h2>The 6 food groups</h2>' + F.groups.map(function (g) {
        return '<details class="fg"><summary><span class="big-emoji">' + g.emoji + '</span><span><b>' + esc(g.name) + '</b><small>' + esc(g.daily) + '</small></span></summary><p>' + esc(g.why) + '</p><ul>' + foods(g).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>';
      }).join('') + '</section>' +
      '<section class="card"><h2>Nutrients that matter most</h2>' + F.nutrients.map(function (n) { return '<p><b>' + esc(n.name) + '</b> — ' + esc(n.why) + ' <i>' + esc(n.foods) + '</i></p>'; }).join('') +
      (ng || both ? '<p class="muted small">Nigerian sources: iron from beans, moi moi, ugu, efo and liver; vitamin A from palm oil, pawpaw and carrots; omega-3 from mackerel and sardines.</p>' : '') + '</section>' +
      (both ? mealIdeas('🇱🇷 Liberian meal ideas', F.meals) + mealIdeas('🇳🇬 Nigerian meal ideas', F.mealsNG) : mealIdeas(ng ? '🇳🇬 Meal ideas' : 'Meal ideas', meals)) +
      '<button class="btn" id="printWeek">🖨️ Print a week\'s meal plan</button>' +
      '<section class="card warnc"><h2>⚠️ Safety</h2><ul>' + F.safety.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + (ng || both ? '<li>' + esc(F.ngSafety) + '</li>' : '') + '</ul><p><b>Clinic:</b> ' + esc(F.clinic.replace('including Liberia', ng ? 'including Nigeria' : both ? 'including Liberia and Nigeria' : 'including Liberia')) + '</p></section>' +
      '<section class="card"><h2>Picky eating</h2><ul>' + F.picky.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="card"><h2>💬 Meals as talking time</h2><ul>' + F.talkAtMeals.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      '<p class="muted small">Based on WHO, UNICEF and American Academy of Pediatrics guidance on feeding children. School-age children need the same food groups in bigger portions, a good breakfast before school, and water to drink at school. If your child is not growing well, eats very few foods, or gags or chokes often, ask a health worker.</p>';
  };
  function mealIdeas(title, meals) {
    return '<section class="card"><h2>' + title + '</h2>' + ['breakfast', 'lunch', 'dinner', 'snacks'].map(function (k) { return '<h3>' + cap(k) + '</h3><ul>' + meals[k].map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'; }).join('') + '</section>';
  }
  X.food.after = function (main) {
    main.querySelector('#printWeek').onclick = function () { TG.printDoc('meals'); };
    main.querySelector('[data-name=cuisine]').addEventListener('change', function () {
      var cu = val(main).cuisine; var c = TG.child(); if (!cu || !c) return;
      TG.save('child', Object.assign({}, c.data, { cuisine: cu }), { id: c.id, childId: '' }); TG.render();
    });
  };

  /* ---------- GUIDES ---------- */
  X.guide = function (which) {
    var html = '';
    if (which === 'toilet') {
      html = '<h1>🚽 Toilet training</h1><section class="card"><h2>Signs of readiness</h2><ul>' + C.TOILET.readiness.map(li).join('') + '</ul><p class="muted small">Most children are ready somewhere between 2 and 3½ years. Starting before they are ready takes longer.</p></section>' +
        '<section class="card"><h2>How</h2><ul>' + C.TOILET.tips.map(li).join('') + '</ul></section><div class="row gap wrap"><a class="btn primary" href="#/activity/potty">Potty routine activity</a><button class="btn" data-print="toilet">🖨️ Print sticker chart</button><a class="btn" href="#/daily/toilet">Toilet log</a></div>';
    } else if (which === 'sleep') {
      html = '<h1>🌙 Sleep</h1><section class="card"><p class="lead">' + esc(C.SLEEP.hours) + '</p><ul>' + C.SLEEP.tips.map(li).join('') + '</ul></section><div class="row gap wrap"><a class="btn primary" href="#/activity/bedtime">Bedtime routine</a><a class="btn" href="#/kids/schedule/bedtime">Bedtime picture schedule</a></div>';
    } else if (which === 'behaviour') {
      html = '<h1>💛 Feelings & behaviour</h1><section class="card"><p class="lead">Behaviour is communication. A child who cannot yet say "I don\'t want to stop playing" may scream instead. As words grow, difficult behaviour usually shrinks.</p></section>' +
        '<div class="list cards">' + C.METHODS.filter(function (m) { return m.area === 'behaviour' || m.id === 'pride'; }).map(function (m) { return '<a class="list-item" href="#/method/' + m.id + '"><span class="emoji-box">' + m.icon + '</span><span><b>' + esc(m.name) + '</b><small>' + esc(m.short) + '</small></span><span class="chev">›</span></a>'; }).join('') + '</div>' +
        '<section class="card"><h2>What the reasons usually mean</h2>' + Object.keys(B.teach).map(function (k) { return '<p><b>' + esc(k) + ':</b> ' + esc(B.teach[k]) + '</p>'; }).join('') + '</section>';
    } else if (which === 'help') {
      html = '<h1>🩺 When to get help</h1><section class="card"><p class="lead">You know your child best. If you are worried, don\'t wait: early help works best, and home practice can continue at the same time.</p><ul class="flags">' +
        C.RED_FLAGS.map(function (f) { return '<li class="' + (f.urgent ? 'urgent' : '') + '">' + (f.urgent ? '<b>Act now:</b> ' : '') + esc(f.text) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="card"><h2>Who to see</h2><ol>' + C.WHO_TO_SEE.map(li).join('') + '</ol><a class="btn primary" href="#/reports">📈 Open the progress report</a></section>';
    } else if (which === 'facts') {
      html = '<h1>💡 Good to know</h1>' + C.FACTS.map(function (f) { return '<section class="card"><h2>' + esc(f.title) + '</h2><p>' + esc(f.text) + '</p></section>'; }).join('');
    } else if (which === 'faith') {
      html = '<h1>🙏🏾 Faith routines</h1><section class="card"><p class="lead">' + esc(C.FAITH.intro) + '</p></section>' + C.FAITH.routines.map(function (r) { return '<section class="card"><h2>' + esc(r.title) + '</h2><p>' + esc(r.text) + '</p></section>'; }).join('');
    } else if (which === 'sources') {
      html = '<h1>📑 Where this comes from</h1><section class="card"><p>The methods in this app are used by speech and language therapists, developmental paediatricians and parent-training programmes around the world. They are written here in simple words for home use.</p><ul>' + C.SOURCES.map(li).join('') +
        '</ul><p class="muted small">This app is a home-practice and record-keeping tool. It does not diagnose and does not replace a doctor, speech therapist or other professional.</p></section>';
    }
    return back('#/learn', 'Learn') + html;
  };
  X.guide.after = function (main) { main.querySelectorAll('[data-print]').forEach(function (b) { b.onclick = function () { TG.printDoc(b.dataset.print); }; }); };
  function li(s) { return '<li>' + esc(s) + '</li>'; }

  /* ---------- CHILD (add / edit) ---------- */
  var LANGS = ['Liberian English', 'English', 'Kpelle', 'Bassa', 'Kru', 'Grebo', 'Gio (Dan)', 'Mano', 'Vai', 'Lorma', 'Gola', 'Kissi', 'Mandingo', 'Krahn', 'Gbandi', 'French', 'Other'];
  X.child = function (id) {
    var r = id && id !== 'new' ? TG.rec(id) : null, d = r ? r.data : {};
    var first = !TG.children().length;
    var stage = d.stage || 'early';
    return (first ? '' : back('#/more', 'More')) + '<form class="card form" id="childForm"><h1>' + (r ? 'Edit ' + esc(d.name) : first ? 'Welcome! Tell us about your child' : 'Add a child') + '</h1>' +
      '<label>Child\'s name<input name="name" required maxlength="40" value="' + esc(d.name || '') + '"></label>' +
      '<label>Date of birth<input type="date" name="birth" id="birth" required max="' + TG.today() + '" value="' + esc(d.birth || '') + '"></label>' +
      '<label>Colour<div class="swatches">' + TG.COLORS.concat(['#e8913a']).map(function (c, i) { return '<label class="sw"><input type="radio" name="color" value="' + c + '"' + ((d.color || (first ? '#e8913a' : TG.COLORS[(TG.children().length + 2) % TG.COLORS.length])) === c ? ' checked' : '') + '><span style="background:' + c + '"></span></label>'; }).join('') + '</div></label>' +
      '<label>Which plan?' + chips('stage', [{ v: 'early', l: '🧒🏾 Early years (talking & development, 0–5)' }, { v: 'school', l: '🎒 School (Grade / Primary 1–6)' }], stage) + '</label>' +
      '<div id="schoolPart"' + (stage === 'school' ? '' : ' hidden') + '><label>Class at school' + chips('grade', C.GRADES.map(function (g) { return { v: String(g.g), l: g.short + ' / Primary ' + g.g }; }), String(d.grade || '')) + '</label>' +
      '<label>School name (optional)<input name="school" maxlength="80" value="' + esc(d.school || '') + '"></label>' +
      '<label>Subjects to support' + chips('subjects', C.SUBJECTS.concat(['habits']).map(function (a) { var x = TG.area(a); return { v: a, l: x.icon + ' ' + x.short }; }), d.subjects || ['english', 'maths', 'science', 'habits'], true) + '</label></div>' +
      '<label>Languages spoken at home' + chips('languages', LANGS, d.languages || ['Liberian English'], true) + '</label>' +
      '<label>Food we eat at home' + chips('cuisine', C.FOOD.cuisines.map(function (x) { return { v: x.id, l: x.label }; }), d.cuisine || 'liberian') + '</label>' +
      '<div id="earlyPart"' + (stage === 'school' ? ' hidden' : '') + '><h3>Where is ' + (d.name ? esc(d.name) : 'your child') + ' with talking today?</h3><div class="sp">' + C.STARTING_POINTS.map(function (s) {
        return '<label class="sp-item"><input type="radio" name="start" value="' + s.id + '"' + (d.start === s.id ? ' checked' : '') + '><span><b>' + esc(s.label) + '</b><small>' + esc(s.detail) + '</small></span></label>';
      }).join('') + '</div></div>' +
      '<label>What else do you want to work on?' + chips('areas', C.AREAS.filter(function (a) { return a.stage === 'both' || a.stage === 'early' && a.id !== 'talk'; }).map(function (a) { return { v: a.id, l: a.icon + ' ' + a.short }; }), d.areas || (stage === 'school' ? ['behaviour', 'attention'] : ['behaviour', 'attention', 'thinking', 'selfcare', 'social']), true) + '</label>' +
      '<label>Anything else to remember? (optional)<textarea name="notes" rows="2" maxlength="1000" placeholder="e.g. had many ear infections; hearing test done in March">' + esc(d.notes || '') + '</textarea></label>' +
      '<button class="btn primary big">' + (r ? 'Save' : 'Start') + '</button>' +
      (r && TG.children().length > 1 ? '<button type="button" class="btn danger" id="delChild">Remove this child</button>' : '') + '</form>';
  };
  X.child.after = function (main, id) {
    var r = id && id !== 'new' ? TG.rec(id) : null;
    var f = main.querySelector('#childForm');
    function showStage() {
      var st = val(f).stage || 'early';
      f.querySelector('#schoolPart').hidden = st !== 'school';
      f.querySelector('#earlyPart').hidden = st === 'school';
    }
    f.querySelector('[data-name=stage]').addEventListener('change', showStage);
    f.querySelector('#birth').addEventListener('change', function () {
      if (r) return;
      var m = TG.ageMonths(f.querySelector('#birth').value);
      if (m === null) return;
      var st = m >= 66 ? 'school' : 'early';
      f.querySelectorAll('[data-name=stage] .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === st); });
      if (st === 'school') { var g = Math.min(6, Math.max(1, Math.floor(m / 12) - 5)); f.querySelectorAll('[data-name=grade] .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === String(g)); }); }
      showStage();
    });
    f.onsubmit = function (e) {
      e.preventDefault();
      var v = val(f);
      var color = (f.querySelector('input[name=color]:checked') || {}).value || '#e8913a';
      var start = (f.querySelector('input[name=start]:checked') || {}).value || '';
      var stage = v.stage || 'early';
      if (stage === 'early' && !start) { TG.toast('Choose where your child is with talking.'); return; }
      if (stage === 'school' && !v.grade) { TG.toast('Choose the class at school.'); return; }
      var data = Object.assign({}, r ? r.data : {}, { name: v.name, birth: v.birth, color: color, stage: stage, grade: stage === 'school' ? +v.grade : '', school: v.school, subjects: v.subjects,
        languages: v.languages, cuisine: v.cuisine || 'liberian', start: start, areas: v.areas, notes: v.notes });
      var saved = TG.save('child', data, { id: r ? r.id : undefined, childId: '' });
      TG.S().childId = saved.id;
      var add = function (g) { if (g && !TG.list('goal', saved.id).some(function (x) { return x.data.goalId === g.id; })) TG.save('goal', { goalId: g.id, area: g.area, status: 'active', started: TG.today() }, { childId: saved.id }); };
      var age = TG.ageMonths(v.birth) || 36;
      var hadNone = !TG.list('goal', saved.id).length || (r && r.data.stage !== stage) || (r && stage === 'school' && +r.data.grade !== +v.grade);
      if (hadNone) {
        if (stage === 'school') {
          (v.subjects || []).forEach(function (sub) {
            var n = sub === 'science' ? 2 : sub === 'habits' ? 2 : 3;
            C.GOALS.filter(function (x) { return x.area === sub && (sub === 'habits' || x.grade === +v.grade); }).slice(0, n).forEach(add);
          });
        } else {
          TG.byId(C.STARTING_POINTS, start).goals.slice(0, 4).forEach(function (gid) { add(TG.byId(C.GOALS, gid)); });
        }
        (v.areas || []).forEach(function (ar) { add(C.GOALS.filter(function (x) { return x.area === ar && age >= x.ages[0] - 3 && age <= x.ages[1]; })[0]); });
        TG.toast(r ? 'Saved ✓ New ' + (stage === 'school' ? 'skills' : 'goals') + ' were added for this plan.' : 'Welcome, ' + v.name + '! ' + (stage === 'school' ? 'Skills for ' + TG.gradeInfo(+v.grade).short : 'Goals') + ' were chosen for you — change them any time.');
      } else TG.toast('Saved ✓');
      TG.persist(true);
      TG.go('#/home');
    };
    var del = main.querySelector('#delChild');
    if (del) del.onclick = function () { TG.confirmBox('Remove ' + r.data.name + '? Their entries stay in the Sheet.', 'Remove', function () { TG.remove(r.id); TG.S().childId = ''; TG.go('#/home'); }); };
  };

  /* ---------- JOURNAL & ENTRIES ---------- */
  X.journal = function () {
    var j = TG.list('journal', TG.S().childId);
    return '<div class="page-head"><h1>🎉 Celebrations</h1><a class="btn primary" href="#/add/journal">＋ Add</a></div>' +
      (j.length ? j.map(function (r) { return '<a class="card journal" href="#/add/journal/' + r.id + '"><small class="muted">' + esc(TG.fmtDate(r.date, true)) + ' · ' + who(r) + '</small><h3>' + esc(r.data.title) + '</h3>' + (r.data.text ? '<p>' + esc(r.data.text) + '</p>' : '') + '</a>'; }).join('') : empty('Write down the firsts: first word, first sentence, first night dry. You will love reading them later.'));
  };
  X.entries = function (type) {
    var types = [['', 'All'], ['word', 'Words'], ['session', 'Practice'], ['behaviour', 'Behaviour'], ['toilet', 'Toilet'], ['sleep', 'Sleep'], ['meal', 'Meals'], ['checkin', 'Days'], ['goal', 'Goals'], ['milestone', 'Milestones'], ['journal', 'Notes']];
    var list = TG.list(type || null, TG.S().childId).filter(function (r) { return ['tools', 'plan', 'child'].indexOf(r.type) < 0; });
    return back('#/more', 'More') + '<h1>All entries</h1><div class="seg wrap">' + types.map(function (t) { return '<a href="#/entries/' + t[0] + '" class="' + ((type || '') === t[0] ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div>' +
      '<section class="card">' + (list.length ? '<div class="list">' + list.slice(0, 300).map(entryRow).join('') + '</div>' : '<p class="muted">Nothing here yet.</p>') + '</section>';
  };

  /* ---------- MORE / SETTINGS ---------- */
  X.more = function () {
    var me = TG.me(), st = TG.S();
    return '<h1>More</h1>' +
      '<section class="card"><div class="list">' +
      [['#/goals', '🎯', TG.isSchool() ? 'Skills' : 'Goals', 'What we are working on'], ['#/kids', '🧒🏾', 'Child tools', ''], ['#/reports', '📈', 'Progress report', 'Charts and a printable report for the doctor'], ['#/print', '🖨️', 'Print', 'Activity cards, charts, schedules, checklists'],
        ['#/milestones', '🪜', 'Milestones', ''], ['#/behaviour', '💛', 'Behaviour', ''], ['#/daily', '📅', 'Daily log', 'Toilet, sleep, food, health'], ['#/journal', '🎉', 'Celebrations', ''], ['#/entries', '🗂️', 'All entries', 'Who recorded what']]
        .map(function (x) { return '<a class="list-item" href="' + x[0] + '"><span class="emoji-box">' + x[1] + '</span><span><b>' + x[2] + '</b>' + (x[3] ? '<small>' + x[3] + '</small>' : '') + '</span><span class="chev">›</span></a>'; }).join('') + '</div></section>' +
      '<section class="card"><h2>Children</h2><div class="list">' + TG.children().map(function (c) { return '<a class="list-item" href="#/child/' + c.id + '"><span class="avatar" style="background:' + (c.data.color || '#e8913a') + '">' + esc(c.data.name.charAt(0)) + '</span><span><b>' + esc(c.data.name) + '</b><small>' + esc(TG.ageText(TG.ageMonths(c.data.birth))) + '</small></span><span class="chev">›</span></a>'; }).join('') + '</div><a class="btn" href="#/child/new">＋ Add a child</a></section>' +
      '<section class="card"><h2>Family</h2><div class="list">' + st.users.filter(function (u) { return u.active !== false; }).map(function (u) { return '<div class="list-item"><span class="avatar" style="background:' + esc(u.color) + '">' + esc(u.name.charAt(0)) + '</span><span><b>' + esc(u.name) + (me && u.id === me.id ? ' (you)' : '') + '</b><small>' + esc(u.relationship || '') + '</small></span></div>'; }).join('') + '</div>' +
      '<p class="muted small">Someone new (a grandparent, a nanny, a therapist)? Open the app on their phone, connect with the family code, and tap "I\'m new".</p>' +
      '<div class="row gap wrap"><button class="btn" id="editMe">Edit my profile</button><button class="btn" id="changePin">Change my PIN</button>' + (st.mode === 'live' ? '<button class="btn" id="famName">Family name</button>' : '') + '</div></section>' +
      '<section class="card"><h2>Settings</h2><label class="check"><input type="checkbox" id="faith"' + (st.prefs.faith ? ' checked' : '') + '> Show faith routines (prayers and songs as language practice)</label>' +
      '<label>Appearance' + chips('theme', [{ v: 'auto', l: 'Automatic' }, { v: 'light', l: '☀️ Light' }, { v: 'dark', l: '🌙 Dark' }], st.prefs.theme || 'auto') + '</label>' +
      '<p class="muted small">A goal counts as learned at ' + st.settings.masteryPercent + '% on own in ' + st.settings.masterySessions + ' practices in a row (change in the Sheet\'s Settings tab).</p></section>' +
      '<section class="card"><div class="list"><a class="list-item" href="#/sync"><span class="emoji-box">🔄</span><span><b>Sync & data</b><small>' + (st.mode === 'demo' ? 'Demo mode' : st.queue.length + ' waiting · last sync ' + (st.lastSync ? new Date(st.lastSync).toLocaleString() : 'never')) + '</small></span><span class="chev">›</span></a>' +
      '<a class="list-item" href="#/install"><span class="emoji-box">📲</span><span><b>Install the app</b><small>Home-screen icon on phone, tablet or laptop</small></span><span class="chev">›</span></a>' +
      '<a class="list-item" href="#/guide/sources"><span class="emoji-box">📑</span><span><b>About & sources</b></span><span class="chev">›</span></a></div></section>' +
      '<button class="btn big" id="lock2">🔒 Lock / switch person</button>';
  };
  X.more.after = function (main) {
    var st = TG.S();
    main.querySelector('#faith').onchange = function (e) { st.prefs.faith = e.target.checked; TG.persist(); };
    main.querySelector('[data-name=theme]').addEventListener('change', function () { st.prefs.theme = val(main).theme || 'auto'; TG.persist(); TG.applyTheme(); });
    main.querySelector('#lock2').onclick = function () { st.session = null; TG.persist(true); TG.route(); };
    main.querySelector('#changePin').onclick = changePin;
    main.querySelector('#editMe').onclick = editMe;
    var fn = main.querySelector('#famName');
    if (fn) fn.onclick = function () {
      TG.sheet('Family name', '<label>Name<input id="fnv" value="' + esc(st.familyName || '') + '" maxlength="60"></label><button class="btn primary" id="fnok">Save</button>', function (b) {
        b.querySelector('#fnok').onclick = async function () {
          var r = await TG.api('setFamilyName', { name: b.querySelector('#fnv').value }).catch(function (e) { return { ok: false, message: e.message }; });
          if (!r.ok) return TG.toast(r.message || 'Needs internet.');
          st.familyName = b.querySelector('#fnv').value; TG.persist(); TG.closeSheet(); TG.render();
        };
      });
    };
  };
  function changePin() {
    var st = TG.S(), me = TG.me();
    TG.sheet('Change my PIN', '<form id="cp" class="stack"><label>Current PIN<input name="old" type="password" inputmode="numeric" required></label><label>New PIN (4–6 digits)<input name="n1" type="password" inputmode="numeric" required></label><label>New PIN again<input name="n2" type="password" inputmode="numeric" required></label><button class="btn primary">Change PIN</button><p class="err" id="cpErr"></p></form>', function (b) {
      b.querySelector('#cp').onsubmit = async function (e) {
        e.preventDefault(); var v = val(e.target), err = b.querySelector('#cpErr');
        if (v.n1 !== v.n2) return err.textContent = 'The new PINs are not the same.';
        if (!/^\d{4,6}$/.test(v.n1)) return err.textContent = 'The PIN must be 4 to 6 digits.';
        if (st.mode === 'demo') { TG.closeSheet(); return TG.toast('In the demo, PINs stay 1234.'); }
        try {
          var r = await TG.api('setPin', { userId: me.id, oldPin: v.old, newPin: v.n1 });
          if (!r.ok) throw new Error(r.message);
          st.users = r.users; TG.persist(true); TG.closeSheet(); TG.toast('PIN changed ✓');
        } catch (ex) { err.textContent = ex.message + (navigator.onLine === false ? ' (needs internet)' : ''); }
      };
    });
  }
  function editMe() {
    var st = TG.S(), me = TG.me();
    TG.sheet('My profile', '<label>Name<input id="mn" value="' + esc(me.name) + '" maxlength="40"></label><label>Colour<div class="swatches">' + TG.COLORS.map(function (c) { return '<label class="sw"><input type="radio" name="mc" value="' + c + '"' + (c === me.color ? ' checked' : '') + '><span style="background:' + c + '"></span></label>'; }).join('') + '</div></label><button class="btn primary" id="mok">Save</button>', function (b) {
      b.querySelector('#mok').onclick = async function () {
        var name = b.querySelector('#mn').value.trim(), color = (b.querySelector('input[name=mc]:checked') || {}).value;
        if (st.mode === 'demo') { me.name = name || me.name; me.color = color || me.color; }
        else {
          var r = await TG.api('updateUser', { userId: me.id, name: name, color: color }).catch(function (e) { return { ok: false, message: e.message }; });
          if (!r.ok) return TG.toast(r.message || 'Needs internet.');
          st.users = r.users;
        }
        TG.persist(true); TG.closeSheet(); TG.applyTheme(); TG.render();
      };
    });
  }

  X.sync = function () {
    var st = TG.S();
    return back('#/more', 'More') + '<h1>Sync & data</h1><section class="card">' +
      (st.mode === 'demo' ? '<p>This is the <b>demo</b>. Nothing is sent anywhere. Leave the demo to connect to your own Google Sheet.</p><button class="btn danger" id="leave">Leave the demo</button>' :
        '<p><b>' + (navigator.onLine === false ? '● Offline' : '● Online') + '</b></p><p>' + TG.plural(st.queue.length, 'entry', 'entries') + ' waiting to sync.</p><p class="muted small">Last sync: ' + (st.lastSync ? new Date(st.lastSync).toLocaleString() : 'never') + (st.syncError ? '<br>Last problem: ' + esc(st.syncError) : '') + '</p>' +
        '<button class="btn primary" id="syncNow">Sync now</button><p class="muted small">The app syncs by itself every 2 minutes, after each entry, and when the internet comes back. Entries are always saved on this device first.</p>') + '</section>' +
      (st.rejected.length ? '<section class="card"><h2>Not accepted by the server</h2>' + st.rejected.map(function (x, i) { return '<div class="list-item"><span class="grow"><b>' + esc((x.record && x.record.summary) || x.id) + '</b><small>' + esc(x.error) + '</small></span><button class="btn small" data-rm="' + i + '">Remove</button></div>'; }).join('') + '</section>' : '') +
      '<section class="card"><h2>Your data</h2><p>All entries live in your own Google Sheet' + (st.mode === 'live' ? '' : ' (once connected)') + '. Nobody else can see them unless you share the Sheet. Don\'t share the Sheet itself; use the app.</p>' +
      '<button class="btn" id="csv">⬇️ Download entries (CSV)</button></section>' +
      (st.mode === 'live' ? '<section class="card"><h2>This device</h2><p class="small">' + esc(st.device.name || '') + '<br><span class="muted">' + esc(TG.isGas() ? 'Opened from the Apps Script link' : st.api) + '</span></p><button class="btn danger" id="disc">Disconnect this device</button></section>' : '');
  };
  X.sync.after = function (main) {
    var st = TG.S();
    var s = main.querySelector('#syncNow'); if (s) s.onclick = async function () { s.disabled = true; await TG.sync(true); TG.render(); };
    var l = main.querySelector('#leave'); if (l) l.onclick = function () { TG.confirmBox('Delete the demo data from this device?', 'Leave demo', TG.resetAll); };
    var d = main.querySelector('#disc'); if (d) d.onclick = function () {
      TG.confirmBox(st.queue.length ? st.queue.length + ' entries have NOT synced yet and will be lost. Disconnect anyway?' : 'Remove the app\'s data from this device? Everything synced stays in the Sheet.', 'Disconnect', TG.resetAll);
    };
    main.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { st.rejected.splice(+b.dataset.rm, 1); TG.persist(); TG.render(); }; });
    main.querySelector('#csv').onclick = function () {
      var rows = [['Date', 'Type', 'Child', 'Summary', 'Entered by', 'Entered at', 'Changed by', 'Changed at', 'Details']];
      TG.list(null, null).forEach(function (r) {
        var c = TG.rec(r.childId);
        rows.push([r.date, r.type, c ? c.data.name : '', TG.prettySummary(r), TG.userName(r.by), r.at, TG.userName(r.ub), r.ua, JSON.stringify(r.data)]);
      });
      var csv = rows.map(function (r) { return r.map(function (x) { x = String(x === undefined ? '' : x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(','); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      a.download = 'talk-and-grow-' + TG.today() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
  };

  X.install = function () {
    var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua);
    return back('#/more', 'More') + '<h1>Install the app</h1><section class="card">' +
      (TG.isGas() ? '<p>You opened the app from the Google link. You can add it to your home screen as a shortcut. For an app that also <b>opens</b> without internet, use the GitHub Pages version (see the README).</p>' : '') +
      '<h3>Android (Chrome)</h3><p>Menu ⋮ ▸ <b>Install app</b> or <b>Add to Home screen</b>.</p><h3>iPhone / iPad (Safari)</h3><p>Share ⬆️ ▸ <b>Add to Home Screen</b>. (Use Safari, not Chrome, on iPhone.)</p><h3>Laptop (Chrome / Edge)</h3><p>The install icon ⊕ at the right of the address bar.</p>' +
      (ios ? '<div class="banner tipb">You are on an iPhone or iPad: use Safari\'s Share button.</div>' : '') +
      '<p class="muted small">Don\'t clear the browser\'s data while entries are waiting to sync.</p></section>';
  };
})();
