/* Talk & Grow — progress report and printable sheets. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, X = TG.screens;

  function inRange(r, from) { return !from || r.date >= from; }

  function reportData(days) {
    var c = TG.child(); if (!c) return null;
    var from = days ? TG.addDays(TG.today(), -(days - 1)) : '';
    var prevFrom = days ? TG.addDays(from, -days) : '';
    var age = TG.ageMonths(c.data.birth);
    var sessions = TG.sessions().filter(function (s) { return inRange(s, from); });
    var practiceDays = {}; sessions.forEach(function (s) { practiceDays[s.date] = 1; });
    var words = TG.words();
    var newWords = words.filter(function (w) { return inRange(w, from); });
    var phrases = words.filter(function (w) { return w.data.kind === 'phrase'; });
    var longest = words.reduce(function (m, w) { return Math.max(m, w.data.length || 1); }, 0);
    var goals = TG.goals().filter(function (g) { return g.data.status !== 'paused'; }).map(function (g) {
      var h = TG.goalHistory(g.id), hp = h.filter(function (x) { return inRange(x, from); });
      var first = hp[0], last = hp[hp.length - 1];
      return { g: g, title: TG.goalTitle(g.data), area: g.data.area, status: g.data.status, learnedOn: g.data.learnedOn, pct: TG.goalPct(g.id).pct, sessions: hp.length, firstPct: first ? first.pct : null, lastPct: last ? last.pct : null };
    });
    var beh = TG.list('behaviour', c.id), behP = beh.filter(function (r) { return inRange(r, from); });
    var behPrev = days ? beh.filter(function (r) { return r.date >= prevFrom && r.date < from; }) : [];
    var toilet = TG.list('toilet', c.id).filter(function (r) { return inRange(r, from); });
    var tOk = toilet.filter(function (r) { return r.data.where === 'potty' && r.data.kind !== 'sit'; }).length, tAcc = toilet.filter(function (r) { return r.data.where === 'accident'; }).length;
    var sleep = TG.list('sleep', c.id).filter(function (r) { return inRange(r, from); });
    var meals = TG.list('meal', c.id).filter(function (r) { return inRange(r, from); });
    var byDay = {}; meals.forEach(function (r) { byDay[r.date] = byDay[r.date] || {}; (r.data.groups || []).forEach(function (g) { byDay[r.date][g] = 1; }); });
    var mealDays = Object.keys(byDay);
    var checks = TG.list('checkin', c.id).filter(function (r) { return inRange(r, from); });
    var sick = checks.filter(function (r) { return (r.data.health || []).some(function (h) { return h !== 'Well'; }); });
    var ear = checks.filter(function (r) { return (r.data.health || []).indexOf('Ear pain') >= 0; }).length;
    var scr = checks.filter(function (r) { return r.data.screen !== '' && r.data.screen !== undefined; });
    var band = TG.bandFor(age || 0);
    var msItems = C.MILESTONES.filter(function (m) { return m.band === band.id; });
    var msAns = msItems.map(function (m) { return { m: m, a: TG.msAnswer(c.id, m.id) }; });
    var journal = TG.list('journal', c.id).filter(function (r) { return inRange(r, from); });
    return {
      c: c, age: age, days: days, from: from, sessions: sessions, minutes: TG.sum(sessions.map(function (s) { return s.data.minutes; })), practiceDays: Object.keys(practiceDays).length,
      words: words, newWords: newWords, phrases: phrases, longest: longest, goals: goals,
      beh: behP, behPrev: behPrev, toiletOk: tOk, toiletAcc: tAcc, toiletTold: toilet.filter(function (r) { return r.data.told; }).length,
      sleepAvg: sleep.length ? TG.sum(sleep.map(function (r) { return TG.sleepHours(r.data); })) / sleep.length : null,
      groupsAvg: mealDays.length ? TG.sum(mealDays.map(function (d) { return Object.keys(byDay[d]).length; })) / mealDays.length : null,
      newFoods: meals.filter(function (r) { return r.data.newFood; }).length,
      sickDays: sick.length, earDays: ear, screenAvg: scr.length ? Math.round(TG.sum(scr.map(function (r) { return r.data.screen; })) / scr.length) : null,
      band: band, msAns: msAns, journal: journal,
      reads: TG.list('reading', c.id).filter(function (r) { return inRange(r, from); }),
      readMins: TG.sum(TG.list('reading', c.id).filter(function (r) { return inRange(r, from); }).map(function (r) { return r.data.minutes; })),
      books: Object.keys(TG.list('reading', c.id).filter(function (r) { return inRange(r, from); }).reduce(function (m, r) { if (r.data.book) m[r.data.book.toLowerCase()] = 1; return m; }, {})).length,
      drillAvg: (function () { var d = sessions.filter(function (s) { return s.data.drill === 'maths'; }); return d.length ? Math.round(TG.sum(d.map(function (s) { return s.data.score; })) / d.length * 10) / 10 : null; })()
    };
  }

  function wordsChart(words, days) {
    var span = days || 84, step = span <= 14 ? 1 : 7, n = Math.ceil(span / step), pts = [];
    var start = TG.addDays(TG.today(), -(n - 1) * step);
    for (var i = 0; i < n; i++) { var d = TG.addDays(start, i * step); pts.push({ label: TG.fmtDate(d).replace(/ \d{4}$/, ''), y: words.filter(function (w) { return w.date <= d; }).length }); }
    return TG.lineChart(pts, { label: 'words' });
  }

  function reportHtml(R, forPrint) {
    var c = R.c, name = esc(c.data.name), area = TG.area;
    var period = R.days ? 'last ' + R.days + ' days (' + TG.fmtDate(R.from, true) + ' – ' + TG.fmtDate(TG.today(), true) + ')' : 'all time';
    var notYet = R.msAns.filter(function (x) { return x.a === 'no'; });
    var ins = TG.behaviourInsights(R.beh);
    var stat = function (v, l) { return '<div class="rstat"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; };
    return '<div class="report">' +
      '<div class="r-head"><div><h1>' + name + ' — progress report</h1><p>' + (TG.isSchool(c) ? esc(TG.gradeInfo(TG.grade(c)).label) + ' · ' : '') + esc(TG.ageText(R.age)) + ' (born ' + esc(TG.fmtDate(c.data.birth, true)) + ') · ' + esc(period) + '</p>' +
      '<p class="muted small">' + esc(TG.S().familyName || '') + ' · Languages at home: ' + esc((c.data.languages || []).join(', ') || '—') + ' · Printed ' + esc(new Date().toLocaleDateString()) + '</p></div></div>' +
      '<div class="rstats">' + stat(R.practiceDays + (R.days ? '/' + R.days : ''), 'days with practice') + stat(R.minutes, 'minutes of practice') + (TG.isSchool(c) ? stat(R.readMins, 'minutes of reading') + stat(R.books, 'books / texts') + stat(R.drillAvg === null ? '–' : R.drillAvg + '/10', 'maths practice average') :
      stat(R.words.length, 'words, signs & sounds') + stat('+' + R.newWords.length, 'new in this period') + stat(R.longest || 0, 'longest phrase (words)')) + stat(R.goals.filter(function (g) { return g.status === 'learned'; }).length, 'goals learned') + '</div>' +
      (TG.isSchool(c) ? TG.schoolReport(R) : '<h2>Talking</h2>' + wordsChart(R.words, R.days) +
      (R.newWords.length ? '<p><b>New words & phrases:</b> ' + R.newWords.slice(0, 80).map(function (w) { return esc(w.data.word) + ({ own: '', copied: '*', help: '†' }[w.data.how] || ''); }).join(', ') + (R.newWords.length > 80 ? '…' : '') + '</p><p class="muted small">* copied an adult · † with help. Others said on their own.</p>' : '<p class="muted">No new words recorded in this period.</p>') +
      '') + '<h2>' + (TG.isSchool(c) ? 'Skills' : 'Goals') + '</h2>' + (R.goals.length ? '<table class="rtable"><thead><tr><th>Goal</th><th>Area</th><th>Status</th><th>Practices</th><th>On own</th></tr></thead><tbody>' + R.goals.map(function (g) {
        var trend = g.firstPct !== null && g.lastPct !== null && g.sessions > 1 ? g.firstPct + '% → ' + g.lastPct + '%' : (g.pct === null ? '—' : g.pct + '%');
        return '<tr><td>' + esc(g.title) + '</td><td>' + esc(area(g.area).short) + '</td><td>' + (g.status === 'learned' ? '🏆 Learned ' + esc(TG.fmtDate(g.learnedOn, true)) : 'Working on it') + '</td><td>' + g.sessions + '</td><td>' + trend + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="muted">No goals set.</p>') +
      (TG.isSchool(c) ? '' : '<h2>Milestones (' + esc(R.band.label) + ')</h2><p>' + R.msAns.filter(function (x) { return x.a === 'yes'; }).length + ' yes · ' + R.msAns.filter(function (x) { return x.a === 'sometimes'; }).length + ' sometimes · ' + notYet.length + ' not yet · ' + R.msAns.filter(function (x) { return !x.a; }).length + ' not checked</p>' +
      (notYet.length ? '<p><b>Not yet:</b></p><ul>' + notYet.map(function (x) { return '<li>' + esc(x.m.text) + '</li>'; }).join('') + '</ul>' : '')) +
      '<h2>Behaviour</h2>' + (R.beh.length ? '<p>' + R.beh.length + ' episodes recorded' + (R.days ? ' (previous period: ' + R.behPrev.length + ')' : '') + '. Most common: ' + esc(TG.countMap(R.beh, 'behaviours').slice(0, 3).map(function (x) { return x.l + ' (' + x.v + ')'; }).join(', ')) + '.</p>' +
        (ins.length ? '<p>Often happens: ' + esc(ins.slice(0, 3).map(function (x) { return x.l.toLowerCase() + ' (' + x.v + ')'; }).join(', ')) + '. What helped: ' + esc(TG.countMap(R.beh, 'helped').slice(0, 3).map(function (x) { return x.l; }).join(', ') || '—') + '.</p>' : '') : '<p class="muted">None recorded.</p>') +
      '<h2>Daily life</h2><ul>' +
      (TG.isSchool(c) ? '' : '<li>Toilet: ' + (R.toiletOk + R.toiletAcc ? R.toiletOk + ' in potty, ' + R.toiletAcc + ' accidents (' + Math.round(R.toiletOk / (R.toiletOk + R.toiletAcc) * 100) + '%), told us first ' + R.toiletTold + ' times' : 'not recorded') + '</li>') +
      '<li>Sleep: ' + (R.sleepAvg !== null ? R.sleepAvg.toFixed(1) + ' hours a day on average' : 'not recorded') + '</li>' +
      '<li>Food: ' + (R.groupsAvg !== null ? R.groupsAvg.toFixed(1) + ' of 6 food groups a day; ' + R.newFoods + ' tries of new foods' : 'not recorded') + '</li>' +
      '<li>Health: ' + R.sickDays + ' unwell days recorded' + (R.earDays ? ', including ' + R.earDays + ' with ear pain' : '') + '</li>' +
      '<li>Screen time: ' + (R.screenAvg !== null ? R.screenAvg + ' minutes a day on average' : 'not recorded') + '</li></ul>' +
      (c.data.notes ? '<h2>Notes from the family</h2><p>' + esc(c.data.notes) + '</p>' : '') +
      (R.journal.length ? '<h2>Celebrations</h2><ul>' + R.journal.slice(0, 12).map(function (j) { return '<li>' + esc(TG.fmtDate(j.date, true)) + ': ' + esc(j.data.title) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="muted small r-foot">Recorded at home by the family with the Talk & Grow app. Methods: parent-implemented language strategies (Hanen, Enhanced Milieu Teaching, dialogic reading), PCIT play skills, ABC behaviour recording. Milestones: CDC 2022 checklists. This is not a diagnosis or a standardised screening test.</p>' +
      '</div>';
  }

  X.reports = function (arg) {
    var days = arg === 'all' ? 0 : (+arg || 30);
    var R = reportData(days);
    if (!R) return '<p>Add a child first.</p>';
    return '<div class="page-head"><h1>Progress</h1><button class="btn primary" id="printRep">🖨️ Print / PDF</button></div>' +
      '<div class="seg">' + [['7', '7 days'], ['30', '30 days'], ['90', '3 months'], ['all', 'All time']].map(function (t) { return '<a href="#/reports/' + t[0] + '" class="' + (String(arg || '30') === t[0] ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div>' +
      '<section class="card">' + reportHtml(R) + '</section>' +
      '<p class="muted small">Tip: choose "Save as PDF" in the print window to send the report by WhatsApp or email to a doctor or therapist.</p>';
  };
  X.reports.after = function (main, arg) { main.querySelector('#printRep').onclick = function () { TG.printDoc('report', arg || '30'); }; };

  /* ---------------- printing ---------------- */
  var PRINTS = [
    ['report', '📈', 'Progress report', 'For the doctor, therapist or teacher'],
    ['week', '🗓️', 'This week\'s home plan', 'Focus method, activities and routine ideas'],
    ['datasheet', '📝', 'Practice tally sheet', 'Paper record of goals for 7 days'],
    ['wordlog', '💬', 'Word log sheet', 'Write down new words on the fridge', 'early'],
    ['abc', '💛', 'Behaviour (ABC) sheet', 'Paper version of the behaviour log'],
    ['board', '🖼️', 'Paper talk board', 'Point to pictures to talk', 'early'],
    ['schedule', '📅', 'Picture schedule cards', 'Cut out and stick on the wall'],
    ['firstthen', '➡️', 'First–then board', 'Draw or stick pictures in the boxes'],
    ['stars', '⭐', 'Star chart', '10 stars to colour in'],
    ['toilet', '🚽', 'Toilet sticker chart', '7 days, with times', 'early'],
    ['milestones', '🪜', 'Milestone checklist', 'For the child\'s age', 'early'],
    ['meals', '🍽️', 'Weekly meal plan', 'Liberian foods, all food groups'],
    ['tracing', '✏️', 'Tracing lines & circles', 'Pre-writing practice', 'early'],
    ['feelings', '😊', 'Feelings faces', 'Name and draw feelings'],
    ['activities', '🎲', 'All activity cards', 'A small book of activities']
  ];
  X.print = function () {
    return '<h1>Print</h1><p class="muted">Everything opens in the print window. Choose your printer, or "Save as PDF" to share it on WhatsApp.</p><div class="tiles">' +
      PRINTS.filter(function (p) { return !p[4] || p[4] === (TG.isSchool() ? 'school' : 'early'); }).map(function (p) { return '<button class="tile" data-p="' + p[0] + '"><span class="big-emoji">' + p[1] + '</span><b>' + esc(p[2]) + '</b><small>' + esc(p[3]) + '</small></button>'; }).join('') + '</div>';
  };
  X.print.after = function (main) { main.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { TG.printDoc(b.dataset.p); }; }); };

  function pageHead(title, sub) {
    var c = TG.child();
    return '<div class="p-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div><div class="p-brand">Talk &amp; Grow' + (c ? '<br><small>' + esc(c.data.name) + '</small>' : '') + '</div></div>';
  }
  function actCard(a) {
    return '<div class="p-card"><h2>' + a.emoji + ' ' + esc(a.title) + '</h2><p class="muted">' + a.minutes + ' minutes · ' + esc(TG.area(a.area).name) + '</p>' +
      '<p><b>You need:</b> ' + a.materials.map(esc).join('; ') + '</p><ol>' + a.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p><b>Words to say:</b> ' + a.say.map(function (s) { return '"' + esc(s) + '"'; }).join(' · ') + '</p><p class="p-tip">💡 ' + esc(a.tip) + '</p></div>';
  }
  function tiles(list, cls) { return '<div class="p-grid ' + (cls || '') + '">' + list.map(function (x) { return '<div class="p-tile"><span>' + x.e + '</span>' + esc(x.w || x.label) + '</div>'; }).join('') + '</div>'; }

  var BUILD = {
    report: function (arg) { var R = reportData(arg === 'all' ? 0 : (+arg || 30)); return R ? reportHtml(R, true) : ''; },
    activity: function (id) { var a = TG.byId(C.ACTIVITIES, id); return pageHead('Activity card') + actCard(a); },
    activities: function () { return pageHead('Activity cards', 'Talk & Grow home activities') + C.ACTIVITIES.map(actCard).join(''); },
    week: function () {
      var f = TG.weeklyFocus(), plan = TG.todaysPlan(), goals = TG.goals('active');
      var more = C.ACTIVITIES.filter(function (a) { return plan.indexOf(a) < 0 && a.goals.some(function (g) { return goals.some(function (x) { return x.data.goalId === g; }); }); }).slice(0, 3);
      return pageHead('Home plan for the week of ' + TG.fmtDate(TG.weekKey(), true)) +
        (f ? '<div class="p-card"><h2>' + f.icon + ' Focus this week: ' + esc(f.name) + '</h2><p>' + esc(f.short) + '</p><ol>' + f.how.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><p><i>' + esc(f.example) + '</i></p></div>' : '') +
        '<div class="p-card"><h2>🎯 Our goals</h2><ul>' + goals.map(function (g) { return '<li>' + esc(TG.goalTitle(g.data)) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="p-card"><h2>🔄 In daily routines</h2><ul>' + C.ROUTINE_TIPS.map(function (t) { return '<li><b>' + esc(t.when) + ':</b> ' + esc(t.text) + '</li>'; }).join('') + '</ul></div>' +
        plan.concat(more).map(actCard).join('');
    },
    datasheet: function () {
      var goals = TG.goals('active'), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return pageHead('Practice tally sheet', 'Week of ' + TG.fmtDate(TG.weekKey(), true) + '. Mark each try: ✓ on own · H with help · ✗ not yet') +
        '<table class="p-table"><thead><tr><th>Goal</th>' + days.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (goals.length ? goals : [{ data: { custom: '' } }, { data: { custom: '' } }, { data: { custom: '' } }, { data: { custom: '' } }]).map(function (g) { return '<tr><td class="wide">' + esc(TG.goalTitle(g.data)) + '</td>' + days.map(function () { return '<td class="tall"></td>'; }).join('') + '</tr>'; }).join('') +
        '<tr><td>Minutes practised</td>' + days.map(function () { return '<td></td>'; }).join('') + '</tr><tr><td>Who practised</td>' + days.map(function () { return '<td></td>'; }).join('') + '</tr></tbody></table><p class="muted">Copy the totals into the app later (Log ▸ Practice session).</p>';
    },
    wordlog: function () {
      var rows = ''; for (var i = 0; i < 24; i++) rows += '<tr><td></td><td></td><td>⭐ 🪞 🤝</td><td></td></tr>';
      var w = TG.words();
      return pageHead('New words', 'Write each new word, sign or sound. Circle: ⭐ on own · 🪞 copied · 🤝 with help') +
        '<table class="p-table"><thead><tr><th>Date</th><th class="wide">Word / phrase / sign</th><th>How</th><th class="wide">Where / when</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        (w.length ? '<p class="small"><b>Words already recorded (' + w.length + '):</b> ' + w.map(function (x) { return esc(x.data.word); }).join(', ') + '</p>' : '');
    },
    abc: function () {
      var rows = ''; for (var i = 0; i < 8; i++) rows += '<tr><td></td><td class="tall"></td><td class="tall"></td><td class="tall"></td><td class="tall"></td></tr>';
      return pageHead('Behaviour (ABC) sheet', 'A = what happened just before · B = the behaviour · C = what happened after') +
        '<table class="p-table"><thead><tr><th>Date & time</th><th>A — Before</th><th>B — Behaviour (how strong 1–5, how long)</th><th>C — After</th><th>What helped</th></tr></thead><tbody>' + rows + '</tbody></table>';
    },
    board: function () {
      var custom = (TG.tools ? TG.tools().custom : []);
      return pageHead('Talk board', 'Point to a picture and say the word. Your child can point too.') + tiles(C.CORE_WORDS.concat(custom), 'g6') + '<h2>Food</h2>' + tiles(C.FOOD_WORDS, 'g6') + '<h2>Feelings</h2>' + tiles(C.FEELINGS, 'g8');
    },
    schedule: function (preset) {
      var t = TG.tools ? TG.tools() : { schedules: {} };
      var p = TG.byId(C.SCHEDULE_PRESETS, preset) || null;
      var cards = p ? (t.schedules[p.id] || p.cards).map(function (id) { return TG.byId(C.SCHEDULE_CARDS, id); }) : C.SCHEDULE_CARDS;
      return pageHead(p ? p.name + ' schedule' : 'Picture cards', 'Cut out the cards. Stick them in order on the wall at the child\'s eye level.') + tiles(cards.filter(Boolean), 'g4 cut');
    },
    firstthen: function () { return pageHead('First – then') + '<div class="p-ft"><div><b>FIRST</b><div class="p-box"></div></div><div class="p-arrow">➜</div><div><b>THEN</b><div class="p-box"></div></div></div><p>Draw or stick a picture in each box. Keep your promise: the "then" always happens.</p>' + tiles(C.SCHEDULE_CARDS.slice(0, 16), 'g4 cut'); },
    stars: function () { var s = ''; for (var i = 0; i < 10; i++) s += '<div class="p-star">☆</div>'; return pageHead('My star chart', 'When all the stars are coloured: ___________________________') + '<div class="p-stars">' + s + '</div><p>Give a star right after the good behaviour and say what it was for.</p>'; },
    toilet: function () {
      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], times = ['Wake up', 'After breakfast', 'Mid-morning', 'After lunch', 'Afternoon', 'After dinner', 'Before bed'];
      return pageHead('Toilet sticker chart', 'A sticker or ✓ for every sit. A big star when something comes in the potty!') +
        '<table class="p-table"><thead><tr><th></th>' + days.map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr></thead><tbody>' + times.map(function (t) { return '<tr><td>' + t + '</td>' + days.map(function () { return '<td class="tall"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    },
    milestones: function () {
      var c = TG.child(), b = TG.bandFor(TG.childAge() || 36);
      var items = C.MILESTONES.filter(function (m) { return m.band === b.id; });
      return pageHead('Milestone checklist: ' + b.label, 'CDC "Learn the Signs. Act Early." (2022)') +
        Object.keys(C.MILESTONE_AREAS).map(function (ar) {
          var l = items.filter(function (m) { return m.area === ar; }); if (!l.length) return '';
          return '<h2>' + esc(C.MILESTONE_AREAS[ar]) + '</h2><table class="p-table"><tbody>' + l.map(function (m) { var a = c ? TG.msAnswer(c.id, m.id) : ''; return '<tr><td class="wide">' + esc(m.text) + '</td><td>' + (a === 'yes' ? '☑' : '☐') + ' Yes</td><td>' + (a === 'sometimes' ? '☑' : '☐') + ' Sometimes</td><td>' + (a === 'no' ? '☑' : '☐') + ' Not yet</td></tr>'; }).join('') + '</tbody></table>';
        }).join('') + '<p class="small">If your child loses skills, or has several "not yet", talk to the doctor and ask for a hearing test.</p>';
    },
    meals: function () {
      var F = C.FOOD;
      var cu = TG.cuisine(), wk = cu === 'nigerian' ? F.weekNG : F.week;
      return pageHead('Weekly meal plan' + (cu === 'nigerian' ? ' (Nigerian)' : cu === 'both' ? ' (Liberian & Nigerian)' : ''), 'For a child: 3 meals + 1–2 snacks. Little salt, little pepper, no bones.') +
        (cu === 'both' ? '<h2>Liberian week</h2>' : '') +
        '<table class="p-table"><thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snack</th><th>Dinner</th></tr></thead><tbody>' + wk.map(function (r) { return '<tr>' + r.map(function (x, i) { return i ? '<td>' + esc(x) + '</td>' : '<td><b>' + x + '</b></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' +
        (cu === 'both' ? '<h2>Nigerian week</h2><table class="p-table"><thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snack</th><th>Dinner</th></tr></thead><tbody>' + F.weekNG.map(function (r) { return '<tr>' + r.map(function (x, i) { return i ? '<td>' + esc(x) + '</td>' : '<td><b>' + x + '</b></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '') +
        '<h2>Every day, try to include</h2><ul>' + F.groups.map(function (g) { return '<li>' + g.emoji + ' <b>' + esc(g.name) + '</b> — ' + esc(g.daily) + '</li>'; }).join('') + '</ul><h2>Safety</h2><ul>' + F.safety.slice(0, 4).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    },
    tracing: function () {
      var row = function (path) { return '<svg viewBox="0 0 600 70" class="p-trace"><path d="' + path + '"/></svg>'; };
      var lines = 'M20 35 H580', waves = 'M20 35 Q50 5 80 35 T140 35 T200 35 T260 35 T320 35 T380 35 T440 35 T500 35 T560 35', zig = 'M20 55 L60 15 L100 55 L140 15 L180 55 L220 15 L260 55 L300 15 L340 55 L380 15 L420 55 L460 15 L500 55 L540 15 L580 55';
      var circles = ''; for (var i = 0; i < 8; i++) circles += 'M' + (70 + i * 70) + ' 35 a25 25 0 1 0 -0.1 0 ';
      var vert = ''; for (var j = 0; j < 14; j++) vert += 'M' + (30 + j * 40) + ' 10 V60 ';
      return pageHead('Tracing practice', 'Trace over the dotted lines with a crayon. Say the words: "down", "across", "round and round".') + row(lines) + row(vert) + row(waves) + row(zig) + row(circles) + row(lines) + row(circles);
    },
    feelings: function () {
      return pageHead('Feelings', 'Make each face together in a mirror. Then draw your own faces in the empty circles.') + tiles(C.FEELINGS, 'g4') +
        '<div class="p-faces">' + C.FEELINGS.slice(0, 4).map(function (f) { return '<div><div class="p-circle"></div><p>' + esc(f.w) + '</p></div>'; }).join('') + '</div>';
    }
  };

  TG.printDoc = function (kind, arg) {
    var html = BUILD[kind] ? BUILD[kind](arg) : '';
    var area = document.getElementById('printArea');
    area.innerHTML = '<div class="print-bar"><button class="btn primary" id="pbPrint">🖨️ Print / Save as PDF</button><button class="btn" id="pbClose">✕ Close</button></div><div class="print-page">' + html + '</div>';
    document.body.classList.add('printing');
    window.scrollTo(0, 0);
    area.querySelector('#pbClose').onclick = function () { document.body.classList.remove('printing'); area.innerHTML = ''; };
    area.querySelector('#pbPrint').onclick = function () { try { window.print(); } catch (e) { TG.toast('Printing is not available here.'); } };
    setTimeout(function () { try { window.print(); } catch (e) {} }, 350);
  };
  TG.reportData = reportData;
  TG.PRINT_BUILD = BUILD;
  TG.PRINTS = PRINTS;
})();
