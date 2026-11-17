/* Talk & Grow — demo with made-up data, kept only on this device. */
(function () {
  'use strict';
  var TG = window.TG;

  TG.startDemo = async function () {
    var S = TG.S();
    var C = TG.C;
    var rnd = TG.seeded('demo-joy');
    var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var salt1 = 'd3m0a1b2c3d4e5f6', salt2 = 'd3m0f6e5d4c3b2a1';
    var hash = async function (pin, salt) { var h = pin; for (var i = 0; i < 100; i++) { var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + h)); h = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); } return h; };
    var papa = { id: 'U-demopapa', name: 'Papa', relationship: 'Father', color: '#2f7d6d', salt: salt1, pinHash: await hash('1234', salt1), active: true };
    var mama = { id: 'U-demomama', name: 'Mama', relationship: 'Mother', color: '#be185d', salt: salt2, pinHash: await hash('1234', salt2), active: true };
    S.mode = 'demo'; S.familyName = 'Demo family'; S.users = [papa, mama]; S.records = {}; S.queue = [];
    var T = TG.today();
    var birth = TG.addDays(T, -(3 * 365 + 62));
    var n = 0;
    function put(type, data, date, childId, by, time) {
      var id = 'r' + (1e6 + (n++)).toString(36) + 'demo' + Math.floor(rnd() * 1e6).toString(36);
      var at = new Date(TG.parseD(date).getTime() + (time ? (+time.split(':')[0] * 60 + +time.split(':')[1]) * 60000 : 9 * 3600000)).toISOString();
      S.records[id] = { id: id, type: type, childId: childId, date: date, data: data, summary: type, by: by, at: at, ub: by, ua: at, del: false };
      return S.records[id];
    }
    var child = put('child', { name: 'Joy', birth: birth, color: '#e8913a', languages: ['Liberian English', 'Kpelle'], start: 'words', areas: ['behaviour', 'attention', 'thinking', 'selfcare', 'social'], notes: 'Two ear infections last rainy season. Hearing test planned.' }, TG.addDays(T, -28), '', papa.id);
    var cid = child.id;
    S.childId = cid;
    var gids = ['t-two-words', 't-action-words', 't-label', 't-fill-in', 'a-stay', 'b-words-not-hits', 'sc-toilet', 'c-shapes', 'f-new-food'];
    var goals = gids.map(function (g) { var lib = TG.byId(C.GOALS, g); return put('goal', { goalId: g, area: lib.area, status: 'active', started: TG.addDays(T, -28) }, TG.addDays(T, -28), cid, papa.id); });
    put('goal', { goalId: 't-request-word', area: 'talk', status: 'learned', started: TG.addDays(T, -28), learnedOn: TG.addDays(T, -9) }, TG.addDays(T, -28), cid, mama.id);

    var early = ['mama', 'papa', 'no', 'bye', 'water', 'ball', 'car', 'dog', 'eat', 'up', 'more', 'shoe', 'baby', 'cup', 'rice', 'banana', 'go', 'hot', 'book', 'bath', 'open', 'help'];
    var later = ['fish', 'chicken', 'sleep', 'outside', 'goat', 'egg', 'orange', 'jump', 'wash', 'cook', 'bread', 'keke', 'Grandma', 'all done', 'mango', 'stop', 'sit', 'milk', 'nose', 'eye'];
    var phrases = ['more water', 'car go', 'mama come', 'big ball', 'eat rice', 'papa go', 'all done', 'open door', 'wash hand', 'Joy shoe'];
    early.forEach(function (w) { put('word', { word: w, kind: 'word', how: 'own', length: 1, lang: 'Liberian English' }, TG.addDays(T, -28), cid, papa.id); });
    put('word', { word: 'moo', kind: 'sound', how: 'own', length: 1 }, TG.addDays(T, -27), cid, mama.id);
    put('word', { word: 'more (sign)', kind: 'sign', how: 'own', length: 1 }, TG.addDays(T, -25), cid, mama.id);
    later.forEach(function (w, i) { put('word', { word: w, kind: 'word', how: pick(['own', 'own', 'copied', 'help']), length: w.split(' ').length }, TG.addDays(T, -26 + i), cid, i % 2 ? mama.id : papa.id); });
    phrases.forEach(function (w, i) { put('word', { word: w, kind: 'phrase', how: i < 4 ? 'copied' : pick(['own', 'copied']), length: 2 }, TG.addDays(T, -20 + i * 2), cid, i % 2 ? papa.id : mama.id); });

    var acts = ['rsg', 'snack', 'peer', 'bubbles', 'kitchen', 'bath', 'jar', 'potty', 'foodplay', 'special', 'walk'];
    for (var d = 27; d >= 0; d--) {
      var date = TG.addDays(T, -d), day = 28 - d;
      if (rnd() < 0.82) {
        var res = {};
        goals.slice(0, 5).forEach(function (g, i) {
          if (rnd() < 0.6) {
            var p = Math.min(0.9, 0.15 + day * 0.025 + (i === 2 ? 0.2 : 0));
            var tries = 4 + Math.floor(rnd() * 5), own = 0, help = 0, no = 0;
            for (var k = 0; k < tries; k++) { var x = rnd(); if (x < p) own++; else if (x < p + 0.3) help++; else no++; }
            res[g.id] = { own: own, help: help, no: no };
          }
        });
        put('session', { minutes: pick([10, 10, 15, 20]), activityId: pick(acts), results: res, mood: pick(['😀 Happy', '🙂 OK', '🙂 OK', '😴 Tired']), note: '' }, date, cid, d % 2 ? papa.id : mama.id, '17:30');
      }
      if (rnd() < Math.max(0.15, 0.7 - day * 0.02)) {
        put('behaviour', { time: pick(['08:10', '12:40', '17:55', '19:20', '19:45']), behaviours: [pick(['Tantrum / crying', 'Tantrum / crying', 'Throwing things', 'Hitting or kicking', 'Dropping to the floor'])], intensity: 1 + Math.floor(rnd() * 4), minutes: 2 + Math.floor(rnd() * 10),
          before: [pick(['Toy or phone taken away', 'Asked to stop an activity', 'Could not say what they wanted', 'Tired', 'Wanted something'])], after: [pick(['Comforted / hugged', 'Talked to calmly', 'Calm corner', 'Got what they wanted'])], helped: [pick(['Hug / comfort', 'Big breaths', 'First–then card', 'Named the feeling', 'Offered a choice'])], note: '' }, date, cid, d % 3 ? mama.id : papa.id);
      }
      if (day > 10) {
        ['07:00', '10:30', '13:00', '18:30'].forEach(function (t) {
          var ok = rnd() < 0.3 + day * 0.02;
          put('toilet', { time: t, kind: pick(['pee', 'pee', 'poo']), where: ok ? 'potty' : pick(['accident', 'nothing']), told: ok && rnd() < 0.35 }, date, cid, mama.id, t);
        });
      }
      put('sleep', { bed: pick(['19:45', '20:00', '20:30', '21:00']), wake: pick(['06:00', '06:30', '07:00']), naps: pick([0, 60, 90]), wakings: Math.floor(rnd() * 2) }, date, cid, mama.id, '07:00');
      ['breakfast', 'lunch', 'dinner'].forEach(function (m, i) {
        if (rnd() < 0.7) put('meal', { meal: m, groups: ['grains'].concat(['protein', 'greens', 'fruit', 'milk', 'fats'].filter(function () { return rnd() < 0.55; })), amount: pick(['All', 'Most', 'Some']),
          newFood: i === 1 && rnd() < 0.3 ? pick(['pawpaw', 'pawpaw', 'okra', 'avocado']) : '', step: pick(['👃 Smelled', '👅 Licked', '😋 Tasted']), food: '' }, date, cid, i ? mama.id : papa.id, ['07:30', '13:00', '19:00'][i]);
      });
      if (rnd() < 0.8) put('checkin', { mood: pick(['😀 Great', '🙂 Good', '🙂 Good', '😐 OK', '🙁 Hard']), health: d === 12 || d === 11 ? ['Cold / cough'] : d === 10 ? ['Ear pain'] : ['Well'], screen: pick([30, 60, 60, 90]), outside: pick([30, 60, 120]), note: '' }, date, cid, mama.id, '20:30');
    }
    var ms = C.MILESTONES.filter(function (m) { return m.band === '30m' || m.band === '3y'; });
    ms.forEach(function (m, i) {
      var a = m.band === '30m' ? (i % 7 === 3 ? 'sometimes' : 'yes') : (m.area === 'language' ? (i % 2 ? 'no' : 'sometimes') : (i % 3 ? 'yes' : 'sometimes'));
      var id = 'ms' + cid.slice(1, 18) + '_' + m.id.replace(/-/g, '_');
      S.records[id] = { id: id, type: 'milestone', childId: cid, date: TG.addDays(T, -14), data: { item: m.id, answer: a }, summary: '', by: papa.id, at: new Date().toISOString(), ub: papa.id, ua: new Date().toISOString(), del: false };
    });
    put('journal', { title: 'First two-word phrase: "more water"!', text: 'At lunch, she held up her cup and said it. We all clapped.' }, TG.addDays(T, -20), cid, mama.id);
    put('journal', { title: 'First time telling us "pee" before going', text: '' }, TG.addDays(T, -4), cid, papa.id);
    // second child: school age, Grade 4
    var kid2 = put('child', { name: 'Daniel', birth: TG.addDays(T, -(9 * 365 + 40)), color: '#4f6bb0', stage: 'school', grade: 4, school: 'Demo Primary School', subjects: ['english', 'maths', 'science', 'habits'],
      languages: ['English', 'Liberian English'], cuisine: 'both', areas: ['behaviour', 'attention'], notes: 'Finds long division and spelling hard. Loves science.' }, TG.addDays(T, -21), '', mama.id);
    var did = kid2.id;
    var sk = ['g4-english-1', 'g4-english-4', 'g4-english-7', 'g4-maths-1', 'g4-maths-2', 'g4-maths-3', 'g4-science-1', 'g4-science-3', 'h-read', 'h-homework'];
    var dgoals = sk.map(function (g) { var lib = TG.byId(C.GOALS, g); return put('goal', { goalId: g, area: lib.area, status: 'active', started: TG.addDays(T, -21) }, TG.addDays(T, -21), did, mama.id); });
    put('goal', { goalId: 'g3-maths-1', area: 'maths', status: 'learned', started: TG.addDays(T, -21), learnedOn: TG.addDays(T, -6) }, TG.addDays(T, -21), did, papa.id);
    var books = ['The Village Boy', 'Anansi stories', 'Science reader Book 4', 'Daily Observer (kids page)', 'Children\'s Bible stories'];
    for (var e = 20; e >= 0; e--) {
      var dd = TG.addDays(T, -e), dday = 21 - e;
      if (rnd() < 0.75) {
        var r2 = {};
        dgoals.slice(0, 8).forEach(function (g, i) {
          if (rnd() < 0.45) { var p = Math.min(0.92, 0.3 + dday * 0.025 + (i === 5 ? -0.15 : 0)), t = 5 + Math.floor(rnd() * 6), o = 0, h = 0, n2 = 0;
            for (var k = 0; k < t; k++) { var x = rnd(); if (x < p) o++; else if (x < p + 0.2) h++; else n2++; } r2[g.id] = { own: o, help: h, no: n2 }; }
        });
        put('session', { minutes: pick([20, 30, 40]), activityId: pick(['shopmaths', 'journal', 'experiment', 'wordproblem', 'kitchenfrac', 'spellbee']), results: r2, mood: pick(['🙂 OK', '😀 Happy']), note: '' }, dd, did, e % 2 ? papa.id : mama.id, '18:00');
      }
      if (rnd() < 0.5) put('session', { minutes: 5, drill: 'maths', score: Math.min(10, 4 + Math.floor(dday / 4) + Math.floor(rnd() * 3)), of: 10, results: {}, note: 'Maths practice' }, dd, did, papa.id, '07:15');
      if (rnd() < 0.7) put('reading', { book: pick(books), minutes: pick([15, 20, 20, 30]), pages: 5 + Math.floor(rnd() * 15), how: pick(['Read alone', 'Read aloud to me']), understood: pick(['😀 Told me all about it', '🙂 Some']) }, dd, did, mama.id, '19:30');
      if (rnd() < 0.6) put('sleep', { bed: pick(['20:30', '21:00', '21:30']), wake: '06:15', naps: 0, wakings: 0 }, dd, did, mama.id, '06:30');
      if (rnd() < 0.5) put('meal', { meal: 'lunch', groups: ['grains', 'protein'].concat(rnd() < 0.6 ? ['greens'] : []).concat(rnd() < 0.5 ? ['fruit'] : []), food: pick(['Jollof rice, Chicken', 'Rice, Potato greens, Fish', 'Beans, Plantain', 'Eba / garri, Efo riro, Fish']), amount: 'All' }, dd, did, mama.id, '13:00');
    }
    put('behaviour', { time: '18:20', behaviours: ['Could not focus / ran from task', 'Refusing'], intensity: 2, minutes: 10, before: ['Asked to do something'], after: ['Given first–then'], helped: ['First–then card', 'Offered a choice'] }, TG.addDays(T, -5), did, papa.id);
    put('journal', { title: 'Got 9/10 in the class maths test!', text: 'His times tables practice paid off.' }, TG.addDays(T, -3), did, papa.id);
    S.childId = cid;
    S.session = null;
    TG.internal.persistNow();
    location.hash = '#/home';
    TG.route();
  };
})();
