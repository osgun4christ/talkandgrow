/* Talk & Grow — school years: study plan, maths practice, reading drill, reading log, worksheets. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, X = TG.screens;

  function isSchool(c) { c = c || TG.child(); return !!(c && c.data.stage === 'school'); }
  function grade(c) { c = c || TG.child(); return Math.min(6, Math.max(1, +(c && c.data.grade) || 1)); }
  function gradeInfo(g) { return TG.byId(C.GRADES.map(function (x) { return Object.assign({ id: String(x.g) }, x); }), String(g)); }
  function stageOf(areaId) { var a = TG.byId(C.AREAS, areaId); return a ? a.stage : 'early'; }
  function areaFits(areaId, c) { var s = stageOf(areaId); return s === 'both' || s === (isSchool(c) ? 'school' : 'early'); }
  Object.assign(TG, { isSchool: isSchool, grade: grade, gradeInfo: gradeInfo, areaFits: areaFits });

  /* ---------- maths question generator, by grade ---------- */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var GEN = {
    1: [function () { var a = rnd(1, 10), b = rnd(1, 10); return [a + ' + ' + b, a + b]; },
      function () { var a = rnd(5, 20), b = rnd(1, a); return [a + ' − ' + b, a - b]; },
      function () { var a = rnd(1, 9), t = rnd(1, 9); return [t + ' tens and ' + a + ' ones =', t * 10 + a]; },
      function () { var a = rnd(10, 90); return [a + ' + 10', a + 10]; }],
    2: [function () { var a = rnd(10, 60), b = rnd(10, 39); return [a + ' + ' + b, a + b]; },
      function () { var a = rnd(30, 99), b = rnd(10, a - 1); return [a + ' − ' + b, a - b]; },
      function () { var t = pick([2, 5, 10]), n = rnd(1, 10); return [n + ' × ' + t, n * t]; },
      function () { var n = pick([4, 6, 8, 10, 12, 14, 16, 20]); return ['Half of ' + n, n / 2]; },
      function () { var p = rnd(2, 9) * 5, g = pick([50, 100]); return ['Price ' + p + ', you pay ' + g + '. Change?', g - p]; }],
    3: [function () { var a = rnd(2, 10), b = rnd(2, 10); return [a + ' × ' + b, a * b]; },
      function () { var b = rnd(2, 10), q = rnd(2, 10); return [(b * q) + ' ÷ ' + b, q]; },
      function () { var a = rnd(100, 600), b = rnd(100, 399); return [a + ' + ' + b, a + b]; },
      function () { var a = rnd(300, 999), b = rnd(100, a - 1); return [a + ' − ' + b, a - b]; },
      function () { var n = pick([8, 12, 16, 20, 24, 28]); return ['¼ of ' + n, n / 4]; },
      function () { var n = rnd(11, 99); return ['Round ' + n + ' to the nearest 10', Math.round(n / 10) * 10]; }],
    4: [function () { var a = rnd(12, 49), b = rnd(11, 29); return [a + ' × ' + b, a * b]; },
      function () { var b = rnd(3, 9), q = rnd(12, 99); return [(b * q) + ' ÷ ' + b, q]; },
      function () { var l = rnd(3, 15), w = rnd(2, 12); return ['Area of a ' + l + ' m × ' + w + ' m room (m²)', l * w]; },
      function () { var l = rnd(3, 15), w = rnd(2, 12); return ['Perimeter of a ' + l + ' × ' + w + ' rectangle', 2 * (l + w)]; },
      function () { var a = rnd(1, 9) / 10, b = rnd(1, 9) / 10; return [a.toFixed(1) + ' + ' + b.toFixed(1), +(a + b).toFixed(1)]; },
      function () { var d = pick([4, 5, 8, 10]), n = rnd(1, d - 1), m = rnd(1, d - n); return [n + '/' + d + ' + ' + m + '/' + d + ' = ?/' + d, n + m]; }],
    5: [function () { var p = pick([10, 25, 50]), n = rnd(2, 20) * 20; return [p + '% of ' + n, n * p / 100]; },
      function () { var a = rnd(11, 99) / 10, b = rnd(11, 99) / 10; return [a.toFixed(1) + ' + ' + b.toFixed(1), +(a + b).toFixed(1)]; },
      function () { var a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); return [a + ' + ' + b + ' × ' + c, a + b * c]; },
      function () { var l = rnd(2, 9), w = rnd(2, 6), h = rnd(2, 6); return ['Volume of a ' + l + '×' + w + '×' + h + ' cm box (cm³)', l * w * h]; },
      function () { var arr = [rnd(2, 10), rnd(2, 10), rnd(2, 10)]; var s = arr[0] + arr[1] + arr[2]; arr[2] += (3 - s % 3) % 3; return ['Mean of ' + arr.join(', '), (arr[0] + arr[1] + arr[2]) / 3]; },
      function () { var d = pick([4, 5, 8]), n = rnd(1, d - 1), w = rnd(2, 6); return [w + ' × ' + n + '/' + d + ' = ?/' + d, w * n]; }],
    6: [function () { var p = pick([5, 10, 15, 20, 25, 30, 40, 75]), n = rnd(2, 20) * 20; return [p + '% of ' + n, n * p / 100]; },
      function () { var a = rnd(-10, 10), b = rnd(-10, 10); return ['(' + a + ') + (' + b + ')', a + b]; },
      function () { var x = rnd(2, 15), b = rnd(1, 20); return ['x + ' + b + ' = ' + (x + b) + '. x = ?', x]; },
      function () { var x = rnd(2, 12), m = rnd(2, 9); return [m + 'x = ' + (m * x) + '. x = ?', x]; },
      function () { var a = rnd(30, 100), b = rnd(20, 150 - a); return ['Triangle angles ' + a + '° and ' + b + '°. Third angle?', 180 - a - b]; },
      function () { var r = rnd(2, 5), k = rnd(2, 6); return ['Ratio 1 : ' + r + '. If the first is ' + k + ', the second is', k * r]; },
      function () { var cost = rnd(5, 50) * 10, profit = rnd(1, 20) * 10; return ['Bought at ' + cost + ', sold at ' + (cost + profit) + '. Profit?', profit]; }]
  };
  function mathsQuestions(g, n) { var list = []; for (var i = 0; i < (n || 10); i++) { var q = pick(GEN[g])(); list.push({ q: q[0], a: q[1] }); } return list; }
  TG.mathsQuestions = mathsQuestions;

  function wordsFor(g) { return C.SIGHT_WORDS[g] || C.SPELLING[g] || C.SIGHT_WORDS[3]; }

  /* ---------- which skill to practise today ---------- */
  function subjectGoals(subject) { return TG.goals('active').filter(function (g) { return g.data.area === subject; }); }
  function nextSkill(subject) {
    var list = subjectGoals(subject);
    if (!list.length) return null;
    return list.map(function (g) { var h = TG.goalHistory(g.id); return { g: g, n: h.length, last: h.length ? h[h.length - 1].date : '' }; })
      .sort(function (a, b) { return a.last.localeCompare(b.last) || a.n - b.n; })[0].g;
  }
  function activityFor(subject, g) {
    var list = C.ACTIVITIES.filter(function (a) { return a.subject === subject && a.grades[0] <= g && a.grades[1] >= g; });
    var r = TG.seeded(TG.today() + subject);
    return list[Math.floor(r() * list.length)];
  }
  function studyMinutesThisWeek() {
    var wk = TG.weekKey();
    return TG.sum(TG.sessions().filter(function (s) { return s.date >= wk; }).map(function (s) { return s.data.minutes; })) +
      TG.sum(TG.list('reading', TG.S().childId).filter(function (r) { return r.date >= wk; }).map(function (r) { return r.data.minutes; }));
  }

  /* ---------- Today for a school child ---------- */
  TG.schoolHome = function (c) {
    var me = TG.me(), hour = new Date().getHours(), g = grade(c), gi = gradeInfo(g);
    var hi = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var wk = TG.addDays(TG.today(), -6);
    var days = {}; TG.sessions().concat(TG.list('reading', c.id)).forEach(function (s) { if (s.date >= wk) days[s.date] = 1; });
    var mins = studyMinutesThisWeek();
    var third = new Date().getDay() % 2 ? 'science' : 'reading';
    var doneToday = {};
    TG.sessions().forEach(function (s) { if (s.date === TG.today()) Object.keys(s.data.results || {}).forEach(function (k) { var x = TG.rec(k); if (x) doneToday[x.data.area] = 1; }); if (s.date === TG.today() && s.data.drill === 'maths') doneToday.maths = 1; });
    if (TG.list('reading', c.id).some(function (r) { return r.date === TG.today(); })) doneToday.reading = 1;
    var plan = ['english', 'maths', third].map(function (s) {
      if (s === 'reading') return { s: s, icon: '📖', name: 'Reading', text: '15–20 minutes, then talk about it', href: '#/add/reading' };
      var sk = nextSkill(s), ar = TG.area(s);
      return { s: s, icon: ar.icon, name: ar.short, text: sk ? TG.goalTitle(sk.data) : 'Choose skills', href: sk ? '#/goal/' + sk.id : '#/study/' + s };
    });
    return TG.hero(hi + (me ? ', ' + me.name : ''), c.data.name + '\'s study day', gi.label,
        [['📅', Object.keys(days).length + '/7 days', '#/reports'], ['⏱️', mins + ' min this week', '#/study'], ['🏆', TG.goals('learned').length + ' mastered', '#/goals']]) +
      '<section class="card"><div class="card-head"><h2>Today · about ' + gi.minutes + ' min</h2><a class="small" href="#/study">Study</a></div><div class="list">' + plan.map(function (p) {
        return '<a class="list-item" href="' + p.href + '"><span class="emoji-box">' + p.icon + '</span><span class="grow"><b>' + esc(p.name) + '</b><small>' + esc(p.text) + '</small></span>' + (doneToday[p.s] ? '<span class="tick">✓</span>' : '<span class="chev">›</span>') + '</a>';
      }).join('') + '</div></section>' +
      '<!--MENU-->' +
      '<div class="home-actions"><a class="big-action" href="#/kids/maths"><span>⚡</span>Maths practice</a><a class="big-action kids" href="#/kids/reading"><span>🔤</span>' + (g <= 3 ? 'Reading drill' : 'Spelling drill') + '</a><a class="big-action" href="#/videos"><span>▶️</span>Videos</a></div>';
  };

  /* ---------- Study screen ---------- */
  X.study = function (arg) {
    var c = TG.child(); if (!c) return '';
    if (!isSchool(c)) return '<p>This child is in the early-years plan. <a href="#/talk">Open Words</a>, or change the stage under More ▸ Children.</p>';
    if (arg === 'plan') return curriculum(arg);
    var g = grade(c), tab = arg || 'english';
    var tabs = C.SUBJECTS.concat(['habits', 'reading']);
    var body;
    if (tab === 'reading') {
      var reads = TG.list('reading', c.id);
      var books = {}; reads.forEach(function (r) { if (r.data.book) books[r.data.book] = 1; });
      var pts = []; for (var i = 7; i >= 0; i--) { var ws = TG.addDays(TG.weekKey(), -7 * i), we = TG.addDays(ws, 6); pts.push({ label: TG.fmtDate(ws).replace(/ \d{4}$/, ''), y: TG.sum(reads.filter(function (r) { return r.date >= ws && r.date <= we; }).map(function (r) { return r.data.minutes; })) }); }
      body = '<div class="row gap wrap"><a class="btn primary" href="#/add/reading">＋ Log reading</a><a class="btn" href="#/kids/reading">🔤 ' + (g <= 3 ? 'Reading drill' : 'Spelling drill') + '</a></div>' +
        '<section class="card"><h2>Minutes of reading per week</h2>' + TG.lineChart(pts, { label: 'minutes' }) + '<p class="muted small">' + TG.plural(Object.keys(books).length, 'book') + ' so far. Aim for 15–20 minutes every day.</p></section>' +
        '<section class="card"><h2>Reading log</h2>' + (reads.length ? '<div class="list">' + reads.slice(0, 30).map(TG.entryRow).join('') + '</div>' : '<p class="muted">No reading logged yet.</p>') + '</section>';
    } else {
      var ar = TG.area(tab);
      var all = TG.goals().filter(function (x) { return x.data.area === tab; });
      var sess = TG.sessions().filter(function (s) { return Object.keys(s.data.results || {}).some(function (k) { var gg = TG.rec(k); return gg && gg.data.area === tab; }); });
      var drills = tab === 'maths' ? TG.sessions().filter(function (s) { return s.data.drill === 'maths'; }).slice(0, 12).reverse() : [];
      body = '<section class="card"><div class="card-head"><h2>' + ar.icon + ' ' + esc(ar.name) + '</h2><button class="btn small" id="addSk">＋ Skills</button></div>' +
        (all.length ? '<div class="list">' + all.map(function (x) {
          var p = TG.goalPct(x.id), lib = TG.byId(C.GOALS, x.data.goalId) || {};
          return '<a class="list-item" href="#/goal/' + x.id + '"><span class="grow"><b>' + (x.data.status === 'learned' ? '🏆 ' : '') + esc(TG.goalTitle(x.data)) + (lib.grade && lib.grade !== g ? ' <span class="badge">Grade ' + lib.grade + '</span>' : '') + '</b>' +
            '<small>' + (x.data.status === 'learned' ? 'Mastered' : p.pct === null ? 'Not practised yet' : p.pct + '% correct · ' + TG.plural(p.sessions, 'practice')) + '</small>' + (x.data.status === 'learned' ? '' : TG.progress(p.pct || 0, ar.color)) + '</span><span class="chev">›</span></a>';
        }).join('') + '</div>' : '<p class="muted">No ' + esc(ar.short) + ' skills chosen yet.</p>') + '</section>' +
        (tab === 'maths' ? '<section class="card"><div class="card-head"><h2>Maths practice scores</h2><a class="btn small primary" href="#/kids/maths">⚡ Practise</a></div>' + TG.lineChart(drills.map(function (s) { return { label: TG.fmtDate(s.date).replace(/ \d{4}$/, ''), y: s.data.score || 0 }; }), { max: 10, label: 'score' }) + '</section>' : '') +
        '<section class="card"><h2>Activities for ' + esc(ar.short) + ' (' + esc(gradeInfo(g).short) + ')</h2><div class="list">' + (C.ACTIVITIES.filter(function (a) { return a.subject === tab && a.grades[0] <= g && a.grades[1] >= g; }).map(function (a) {
          return '<a class="list-item" href="#/activity/' + a.id + '"><span class="emoji-box">' + a.emoji + '</span><span><b>' + esc(a.title) + '</b><small>' + a.minutes + ' min</small></span><span class="chev">›</span></a>';
        }).join('') || '<p class="muted small">Use the methods under Learn ▸ How to help.</p>') + '</div></section>' +
        '<p class="muted small">' + TG.plural(sess.length, 'study session') + ' recorded for ' + esc(ar.short) + '.</p>';
    }
    return '<div class="page-head"><h1>' + esc(c.data.name) + '\'s study</h1><a class="btn" href="#/study/plan">📋 All grades</a></div>' +
      '<p class="muted small">' + esc(gradeInfo(g).label) + '. Topics follow common primary curricula in Liberia and Nigeria. Add the topics your child\'s class is doing.</p>' +
      '<div class="seg">' + tabs.map(function (t) { var a = t === 'reading' ? { icon: '📖', short: 'Reading' } : TG.area(t); return '<a href="#/study/' + t + '" class="' + (t === tab ? 'on' : '') + '">' + a.icon + ' ' + esc(a.short) + '</a>'; }).join('') + '</div>' + body;
  };
  X.study.after = function (main) { var b = main.querySelector('#addSk'); if (b) b.onclick = TG.goalLibrary; };

  function curriculum() {
    var c = TG.child(), g = grade(c);
    return '<a class="back" href="#/study">← Study</a><h1>Study plan by grade</h1><p class="muted">The main skills in English, Maths and Science for each primary year. Tap "Add" to work on one.</p>' +
      C.GRADES.map(function (gr) {
        return '<details class="card"' + (gr.g === g ? ' open' : '') + '><summary><b>' + esc(gr.label) + '</b> <span class="muted small">(about age ' + gr.age + '–' + (gr.age + 1) + ' · ' + gr.minutes + ' min a day)</span></summary>' +
          C.SUBJECTS.map(function (s) {
            return '<h3>' + TG.area(s).icon + ' ' + esc(TG.area(s).short) + '</h3><ul class="curr">' + C.GOALS.filter(function (x) { return x.grade === gr.g && x.area === s; }).map(function (x) {
              var have = TG.goals().some(function (y) { return y.data.goalId === x.id; });
              return '<li><span><b>' + esc(x.title) + '</b><small>' + esc(x.detail) + '</small></span>' + (have ? '<span class="tick">✓</span>' : '<button class="btn small" data-add="' + x.id + '">Add</button>') + '</li>';
            }).join('') + '</ul>';
          }).join('') + '</details>';
      }).join('');
  }
  var origStudyAfter = X.study.after;
  X.study.after = function (main, arg) {
    origStudyAfter(main, arg);
    main.querySelectorAll('[data-add]').forEach(function (b) {
      b.onclick = function () { var x = TG.byId(C.GOALS, b.dataset.add); TG.save('goal', { goalId: x.id, area: x.area, status: 'active', started: TG.today() }); TG.toast('Added ✓'); b.outerHTML = '<span class="tick">✓</span>'; };
    });
  };

  /* ---------- Reading log form ---------- */
  TG.FORMS.reading = {
    title: 'Reading',
    html: function (d) {
      return '<label>Book or text<input name="book" maxlength="100" value="' + esc(d.book || '') + '" placeholder="e.g. school reader, story book, newspaper"></label>' +
        '<label>Minutes' + TG.chips('minutes', ['10', '15', '20', '30', '45'], String(d.minutes || '15')) + '</label>' +
        '<label>Pages (optional)<input type="number" name="pages" min="0" max="999" value="' + esc(d.pages || '') + '"></label>' +
        '<label>How?' + TG.chips('how', ['Read together', 'Read aloud to me', 'Read alone', 'I read to them'], d.how || 'Read aloud to me') + '</label>' +
        '<label>Understanding' + TG.chips('understood', ['😀 Told me all about it', '🙂 Some', '😕 Struggled'], d.understood || '') + '</label>' +
        '<label>New words learned (optional)<input name="newWords" maxlength="200" value="' + esc(d.newWords || '') + '" placeholder="e.g. enormous, journey"></label>';
    },
    read: function (v) { return { book: v.book, minutes: +v.minutes || 15, pages: v.pages || 0, how: v.how, understood: v.understood, newWords: v.newWords }; }
  };

  /* ---------- Child tools: maths practice, reading/spelling drill ---------- */
  var K = TG.K;
  var drill = null;
  K.maths = function () {
    var g = grade();
    if (!drill || drill.kind !== 'maths' || drill.child !== TG.S().childId) drill = { kind: 'maths', child: TG.S().childId, qs: mathsQuestions(g, 10), i: 0, right: 0, wrong: [] , input: '' };
    if (drill.i >= drill.qs.length) {
      return TG.kidFrame('Maths practice', '<div class="drill-done"><div class="celebrate">' + (drill.right >= 8 ? '🎉' : drill.right >= 5 ? '👍' : '💪') + ' ' + drill.right + ' / 10</div>' +
        (drill.wrong.length ? '<h3>Let\'s look again:</h3><ul class="drill-wrong">' + drill.wrong.map(function (w) { return '<li>' + esc(w.q) + ' = <b>' + esc(w.a) + '</b> <span class="muted">(you said ' + esc(w.given) + ')</span></li>'; }).join('') + '</ul>' : '<p class="center">All correct!</p>') +
        '<div class="row gap center"><button class="btn primary big" id="again">Play again</button></div></div>');
    }
    var q = drill.qs[drill.i];
    return TG.kidFrame('Maths practice · ' + gradeInfo(g).short, '<div class="drill"><div class="drill-prog">Question ' + (drill.i + 1) + ' of 10 · ⭐ ' + drill.right + '</div><div class="drill-q">' + esc(q.q) + '</div>' +
      '<div class="drill-ans" id="ans">' + esc(drill.input || ' ') + '</div><div class="drill-msg" id="dmsg"></div><div class="numpad">' +
      ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '.'].map(function (k) { return '<button class="key" data-k="' + k + '">' + k + '</button>'; }).join('') +
      '<button class="key wide" data-k="del">⌫</button><button class="key wide ok" data-k="ok">Check ✓</button></div></div>',
      '<p class="small">Questions are for ' + esc(gradeInfo(g).label) + '. Change the grade under More ▸ Children.</p><button class="btn" id="restart">New set of questions</button>');
  };
  K.maths.after = function (main) {
    var again = main.querySelector('#again');
    if (again) { again.onclick = function () { drill = null; TG.render(); }; return; }
    var ans = main.querySelector('#ans'), msg = main.querySelector('#dmsg'), q = drill.qs[drill.i], busy = false;
    function draw() { ans.textContent = drill.input || ' '; }
    function press(k) {
      if (busy) return;
      if (k === 'del') drill.input = drill.input.slice(0, -1);
      else if (k === 'ok') {
        if (!drill.input) return;
        var given = parseFloat(drill.input.replace('−', '-'));
        busy = true;
        if (Math.abs(given - q.a) < 1e-9) { drill.right++; msg.textContent = '✓ Correct!'; msg.className = 'drill-msg good'; TG.say && TG.say('Correct!'); }
        else { drill.wrong.push({ q: q.q, a: q.a, given: drill.input }); msg.textContent = '✗ The answer is ' + q.a; msg.className = 'drill-msg bad'; }
        setTimeout(function () {
          drill.i++; drill.input = '';
          if (drill.i >= drill.qs.length) saveDrill('maths', drill.right, drill.qs.length, drill.wrong.map(function (w) { return w.q; }));
          TG.render();
        }, 1100);
        return;
      } else if (drill.input.length < 8) drill.input += k;
      draw();
    }
    main.querySelectorAll('.numpad .key').forEach(function (b) { b.onclick = function () { press(b.dataset.k); }; });
    main.querySelector('#restart').onclick = function () { drill = null; TG.render(); };
  };

  K.reading = function () {
    var g = grade(), words = wordsFor(g);
    if (!drill || drill.kind !== 'reading' || drill.child !== TG.S().childId) {
      var sh = words.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 10);
      drill = { kind: 'reading', child: TG.S().childId, qs: sh, i: 0, right: 0, wrong: [] };
    }
    var spelling = g >= 4;
    if (drill.i >= drill.qs.length) {
      return TG.kidFrame(spelling ? 'Spelling drill' : 'Reading drill', '<div class="drill-done"><div class="celebrate">' + drill.right + ' / ' + drill.qs.length + '</div>' +
        (drill.wrong.length ? '<p class="center">Practise these again: <b>' + drill.wrong.map(esc).join(', ') + '</b></p>' : '<p class="center">All correct!</p>') +
        '<div class="row gap center"><button class="btn primary big" id="again">Again</button></div></div>');
    }
    var w = drill.qs[drill.i];
    return TG.kidFrame(spelling ? 'Spelling drill' : 'Reading drill', '<div class="drill"><div class="drill-prog">Word ' + (drill.i + 1) + ' of ' + drill.qs.length + '</div>' +
      (spelling ? '<button class="btn big" id="sayW">🔊 Hear the word</button><p class="center muted">Your child writes or spells it aloud. Then tap Show.</p><div class="drill-word" id="dw" hidden>' + esc(w) + '</div><button class="btn" id="show">Show the word</button>'
        : '<div class="drill-word">' + esc(w) + '</div><p class="center muted">Your child reads it aloud.</p>') +
      '<div class="row gap center"><button class="btn big bad" data-r="0">✗ Not yet</button><button class="btn big primary" data-r="1">✓ Correct</button></div></div>',
      '<p class="small">' + (spelling ? 'Words for Grades 4–6 come from common spelling lists.' : 'Common sight words for ' + esc(gradeInfo(g).short) + '.') + ' Use the school\'s own spelling list too (Print ▸ Spelling list).</p>');
  };
  K.reading.after = function (main) {
    var again = main.querySelector('#again');
    if (again) { again.onclick = function () { drill = null; TG.render(); }; return; }
    var w = drill.qs[drill.i];
    var sw = main.querySelector('#sayW'); if (sw) { sw.onclick = function () { TG.say(w); }; }
    var sh = main.querySelector('#show'); if (sh) sh.onclick = function () { main.querySelector('#dw').hidden = false; sh.hidden = true; };
    main.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.r === '1') drill.right++; else drill.wrong.push(w);
        drill.i++;
        if (drill.i >= drill.qs.length) saveDrill(grade() >= 4 ? 'spelling' : 'reading', drill.right, drill.qs.length, drill.wrong);
        TG.render();
      };
    });
  };

  /* A drill is saved as a study session, scored against the first active skill of that subject. */
  function saveDrill(kind, right, total, missed) {
    var subject = kind === 'maths' ? 'maths' : 'english';
    var sk = nextSkill(subject);
    var results = {};
    if (sk) results[sk.id] = { own: right, help: 0, no: total - right };
    TG.save('session', { minutes: 5, drill: kind, score: right, of: total, missed: missed, results: results, note: (kind === 'maths' ? 'Maths practice' : kind === 'spelling' ? 'Spelling drill' : 'Reading drill') + ': ' + right + '/' + total });
    TG.toast('Score saved: ' + right + '/' + total);
  }

  TG.schoolReport = function (R) {
    var bySub = {}; C.SUBJECTS.concat(['habits']).forEach(function (s) { bySub[s] = { n: 0, own: 0, tot: 0 }; });
    R.sessions.forEach(function (s) {
      Object.keys(s.data.results || {}).forEach(function (k) {
        var g = TG.rec(k), r = s.data.results[k]; if (!g || !bySub[g.data.area]) return;
        var b = bySub[g.data.area]; b.n++; b.own += r.own || 0; b.tot += (r.own || 0) + (r.help || 0) + (r.no || 0);
      });
    });
    var drills = R.sessions.filter(function (s) { return s.data.drill === 'maths'; }).slice().reverse();
    return '<h2>Study</h2><table class="rtable"><thead><tr><th>Subject</th><th>Practices</th><th>Correct / on own</th></tr></thead><tbody>' +
      Object.keys(bySub).map(function (s) { var b = bySub[s]; return '<tr><td>' + TG.area(s).icon + ' ' + esc(TG.area(s).short) + '</td><td>' + b.n + '</td><td>' + (b.tot ? Math.round(b.own / b.tot * 100) + '%' : '—') + '</td></tr>'; }).join('') + '</tbody></table>' +
      (drills.length ? '<h3>Maths practice scores</h3>' + TG.lineChart(drills.map(function (s) { return { label: TG.fmtDate(s.date).replace(/ \d{4}$/, ''), y: s.data.score || 0 }; }), { max: 10, label: 'score' }) : '') +
      '<h3>Reading</h3><p>' + R.readMins + ' minutes in ' + TG.plural(R.reads.length, 'session') + '.' + (R.reads.length ? ' Books: ' + esc(Object.keys(R.reads.reduce(function (m, r) { if (r.data.book) m[r.data.book] = 1; return m; }, {})).slice(0, 15).join(', ') || '—') + '.' : '') + '</p>';
  };

  /* ---------- printables for school ---------- */
  var P = TG.PRINT_BUILD;
  function head(t, s) { var c = TG.child(); return '<div class="p-head"><div><h1>' + esc(t) + '</h1>' + (s ? '<p>' + esc(s) + '</p>' : '') + '</div><div class="p-brand">Talk &amp; Grow' + (c ? '<br><small>' + esc(c.data.name) + '</small>' : '') + '</div></div>'; }
  P.mathsheet = function () {
    var g = grade(), qs = mathsQuestions(g, 20);
    return head('Maths worksheet · ' + gradeInfo(g).short, 'Name: ____________________   Date: ____________   Score: ____ / 20') +
      '<ol class="p-maths">' + qs.map(function (q) { return '<li>' + esc(q.q) + ' = <span class="p-blank"></span></li>'; }).join('') + '</ol>' +
      '<div class="p-answers"><b>Answers (fold or cut off):</b> ' + qs.map(function (q, i) { return (i + 1) + ') ' + q.a; }).join(' · ') + '</div>';
  };
  P.spelling = function () {
    var g = grade(), w = wordsFor(g);
    return head((g <= 3 ? 'Sight words' : 'Spelling words') + ' · ' + gradeInfo(g).short, 'Tick each word when your child reads or spells it correctly 3 days in a row.') +
      '<div class="p-words">' + w.map(function (x) { return '<span>☐ ' + esc(x) + '</span>'; }).join('') + '</div>';
  };
  P.readinglog = function () {
    var rows = ''; for (var i = 0; i < 20; i++) rows += '<tr><td></td><td class="wide"></td><td></td><td></td><td></td></tr>';
    return head('Reading log', 'Read for 15–20 minutes every day. A parent signs each line.') +
      '<table class="p-table"><thead><tr><th>Date</th><th class="wide">Book</th><th>Minutes</th><th>Pages</th><th>Parent</th></tr></thead><tbody>' + rows + '</tbody></table>';
  };
  P.timetable = function () {
    var c = TG.child(), g = grade(c), gi = gradeInfo(g);
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var plan = { Mon: ['Maths', 'English'], Tue: ['English', 'Science'], Wed: ['Maths', 'Reading'], Thu: ['English', 'Maths'], Fri: ['Science', 'Spelling test'], Sat: ['Revision (mixed quiz)', 'Fun: experiment or market maths'] };
    var skills = TG.goals('active').filter(function (x) { return C.SUBJECTS.indexOf(x.data.area) >= 0; });
    return head('Home study timetable · ' + gi.label, 'About ' + gi.minutes + ' minutes a day, plus 15–20 minutes of reading. Sunday: rest.') +
      '<table class="p-table"><thead><tr><th>Day</th><th>First (harder subject)</th><th>Second</th><th>Reading</th><th>Done ✓</th></tr></thead><tbody>' +
      days.map(function (d) { return '<tr><td><b>' + d + '</b></td><td>' + plan[d][0] + '</td><td>' + plan[d][1] + '</td><td>15–20 min</td><td class="tall"></td></tr>'; }).join('') + '</tbody></table>' +
      (skills.length ? '<h2>Skills we are working on</h2>' + C.SUBJECTS.map(function (s) { var l = skills.filter(function (x) { return x.data.area === s; }); return l.length ? '<p><b>' + TG.area(s).short + ':</b> ' + l.map(function (x) { return esc(TG.goalTitle(x.data)); }).join('; ') + '</p>' : ''; }).join('') : '') +
      '<p class="small">Same time, same place, TV off. Start with the harder subject. Praise effort.</p>';
  };
  TG.PRINTS.splice(1, 0,
    ['timetable', '🗓️', 'Home study timetable', 'School child: weekly plan by grade', 'school'],
    ['mathsheet', '➗', 'Maths worksheet', '20 questions at the child\'s grade, with answers', 'school'],
    ['spelling', '🔤', 'Sight word / spelling list', 'Grade 1–6 word list to tick off', 'school'],
    ['readinglog', '📖', 'Reading log sheet', 'Daily reading record to sign', 'school']);
})();
