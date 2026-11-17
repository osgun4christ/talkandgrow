/* Talk & Grow — child tools: talk board, picture schedule, first–then, star chart, choices, feelings, timer.
   Use them TOGETHER with the child. They are for talking, not for watching. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, X = TG.screens;

  function toolsId() { var c = TG.child(); return c ? 'tools' + c.id.slice(1, 18) : ''; }
  function tools() {
    var r = TG.rec(toolsId());
    var d = r ? JSON.parse(JSON.stringify(r.data)) : {};
    d.custom = d.custom || [];
    d.schedules = d.schedules || {};
    d.stars = d.stars || { goal: 5, reward: C.REWARDS[0], count: 0 };
    d.firstThen = d.firstThen || { first: 'shoes', then: 'outside' };
    d.choices = d.choices || ['banana', 'orange'];
    return d;
  }
  function saveTools(d) { TG.save('tools', d, { id: toolsId() }); }
  TG.tools = tools;

  var voiceOn = true;
  function say(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8; u.pitch = 1.05; u.lang = 'en';
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  TG.say = say;
  function foodWords() { var c = TG.child(), cu = (c && c.data.cuisine) || 'liberian'; return cu === 'liberian' ? C.FOOD_WORDS : cu === 'nigerian' ? C.FOOD_WORDS.filter(function (w) { return ['plantain'].indexOf(w.w) < 0; }).concat(C.FOOD_WORDS_NG) : C.FOOD_WORDS.concat(C.FOOD_WORDS_NG); }
  function card(id) { return TG.byId(C.SCHEDULE_CARDS, id) || { id: id, label: id, e: '❔' }; }

  /* Kid mode: hides menus. The adult leaves by holding the Exit button. */
  function kidFrame(title, inner, adultBar) {
    return '<div class="kid-mode"><div class="kid-top"><button class="kid-exit" id="kidExit" aria-label="Hold to exit">Hold to exit</button><b>' + esc(title) + '</b>' +
      '<button class="kid-voice" id="kidVoice" aria-label="Voice">' + (voiceOn ? '🔊' : '🔇') + '</button></div>' + inner +
      (adultBar ? '<details class="adult"><summary>⚙️ For the adult</summary>' + adultBar + '</details>' : '') + '</div>';
  }
  function bindKid(main) {
    document.body.classList.add('kid');
    var ex = main.querySelector('#kidExit'), t;
    if (ex) {
      var start = function (e) { e.preventDefault(); ex.classList.add('holding'); t = setTimeout(function () { document.body.classList.remove('kid'); TG.go('#/kids'); }, 1200); };
      var stop = function () { clearTimeout(t); ex.classList.remove('holding'); };
      ex.addEventListener('pointerdown', start); ex.addEventListener('pointerup', stop); ex.addEventListener('pointerleave', stop);
      ex.addEventListener('keydown', function (e) { if (e.key === 'Enter') { document.body.classList.remove('kid'); TG.go('#/kids'); } });
    }
    var v = main.querySelector('#kidVoice');
    if (v) v.onclick = function () { voiceOn = !voiceOn; v.textContent = voiceOn ? '🔊' : '🔇'; };
  }
  window.addEventListener('hashchange', function () { if (!/^#\/kids\/./.test(location.hash)) document.body.classList.remove('kid'); });

  X.kids = function (arg) {
    var parts = (arg || '').split('/');
    var tool = parts[0];
    if (tool && K[tool]) return K[tool](parts[1]);
    var c = TG.child(), name = c ? c.data.name : 'your child';
    var school = TG.isSchool && TG.isSchool(c);
    var list = school ? [
      ['maths', '⚡', 'Maths practice', '10 questions at ' + name + '\'s grade. Scores are saved.'],
      ['reading', '🔤', TG.grade(c) <= 3 ? 'Reading drill' : 'Spelling drill', TG.grade(c) <= 3 ? 'Read sight words aloud; tap ✓ or ✗.' : 'Hear a word, spell it, check.'],
      ['schedule/day', '🗓️', 'Picture schedule', 'Morning, homework and bedtime routines.'],
      ['firstthen', '➡️', 'First – then', '"First homework, then play."'],
      ['stars', '⭐', 'Star chart', 'Earn stars for study days.'],
      ['timer', '⏳', 'Timer', 'Study for a set time, then a break.'],
      ['feelings', '😊', 'Feelings', 'Talk about how school went.']
    ] : [
      ['board', '💬', 'Talk board', 'Tap pictures to say words. You tap and say them too.'],
      ['schedule/morning', '🗓️', 'Picture schedule', 'Morning, bedtime, toilet steps or the whole day.'],
      ['firstthen', '➡️', 'First – then', '"First bath, then play."'],
      ['stars', '⭐', 'Star chart', 'Earn stars for a reward.'],
      ['choices', '✌️', 'Choice board', '"What do you want?" with pictures.'],
      ['feelings', '😊', 'Feelings', 'Name how ' + name + ' feels.'],
      ['timer', '⏳', 'Visual timer', 'See how long to wait or play.']
    ];
    return '<h1>Child tools</h1><p class="muted">Use these together with ' + esc(name) + '. Sit close, say each word out loud, and wait for ' + esc(name) + ' to answer. They are for talking, not for watching.</p>' +
      '<div class="tiles">' + list.map(function (t) { return '<a class="tile" href="#/kids/' + t[0] + '"><span class="big-emoji">' + t[1] + '</span><b>' + esc(t[2]) + '</b><small>' + esc(t[3]) + '</small></a>'; }).join('') + '</div>' +
      '<div class="banner tipb">💡 Keep the tablet in one place for the talk board (the table at mealtimes, the play mat). On phones the voice uses the phone\'s own voice; turn the volume up. To leave a tool, <b>hold</b> the "Hold to exit" button.</div>' +
      '<button class="btn" id="printBoard">🖨️ Print a paper talk board</button>';
  };
  X.kids.after = function (main, arg) {
    var tool = (arg || '').split('/')[0];
    if (tool && K[tool] && K[tool].after) { bindKid(main); K[tool].after(main, (arg || '').split('/')[1]); return; }
    if (tool && K[tool]) { bindKid(main); return; }
    var p = main.querySelector('#printBoard'); if (p) p.onclick = function () { TG.printDoc('board'); };
  };

  var K = TG.K = {};
  TG.kidFrame = function (t, i, a) { return kidFrame(t, i, a); };

  /* ---- Talk board ---- */
  var boardTab = 'core', strip = [];
  K.board = function () {
    var d = tools();
    var sets = { core: C.CORE_WORDS, food: foodWords(), feel: C.FEELINGS, mine: d.custom };
    var tiles = sets[boardTab] || [];
    return kidFrame('Talk board',
      '<div class="strip" id="strip">' + (strip.length ? strip.map(function (w) { return '<span>' + w.e + ' ' + esc(w.w) + '</span>'; }).join('') : '<em>Tap pictures to make a sentence</em>') +
      '<button class="strip-btn" id="sayAll" aria-label="Say it">▶</button><button class="strip-btn" id="clear" aria-label="Clear">✕</button></div>' +
      '<div class="board-tabs">' + [['core', 'Words'], ['food', 'Food'], ['feel', 'Feelings'], ['mine', 'Ours']].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (t[0] === boardTab ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="board">' + tiles.map(function (w, i) { return '<button class="btile" data-i="' + i + '"><span>' + w.e + '</span>' + esc(w.w) + '</button>'; }).join('') +
      (boardTab === 'mine' && !tiles.length ? '<p class="muted">Add your own words below: family names, favourite toys, foods.</p>' : '') + '</div>',
      '<p class="small">Add a word to "Ours" (names of family, pets, toys):</p><div class="row gap"><input id="nw" placeholder="Word, e.g. Grandma" maxlength="20"><input id="ne" placeholder="Emoji, e.g. 👵🏾" maxlength="8" style="max-width:7em"><button class="btn" id="addW">Add</button></div>' +
      (d.custom.length ? '<p class="small">Tap to remove: ' + d.custom.map(function (w, i) { return '<button class="chip" data-del="' + i + '">' + w.e + ' ' + esc(w.w) + ' ✕</button>'; }).join('') + '</p>' : '') +
      '<label class="check"><input type="checkbox" id="logUse"' + (d.logBoard ? ' checked' : '') + '> Record words tapped by the child in the word list (as "with help")</label>');
  };
  K.board.after = function (main) {
    var d = tools();
    var sets = { core: C.CORE_WORDS, food: foodWords(), feel: C.FEELINGS, mine: d.custom };
    main.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { boardTab = b.dataset.tab; TG.render(); }; });
    main.querySelectorAll('.btile').forEach(function (b) {
      b.onclick = function () {
        var w = sets[boardTab][+b.dataset.i];
        say(w.w); b.classList.add('pop'); setTimeout(function () { b.classList.remove('pop'); }, 300);
        strip.push(w); if (strip.length > 6) strip.shift();
        drawStrip(main);
        if (d.logBoard) {
          var have = TG.words().some(function (x) { return x.data.word.toLowerCase() === w.w.toLowerCase(); });
          if (!have) TG.save('word', { word: w.w, kind: 'sign', how: 'help', note: 'Talk board', length: 1 });
        }
      };
    });
    main.querySelector('#sayAll').onclick = function () { say(strip.map(function (w) { return w.w; }).join(' ')); };
    main.querySelector('#clear').onclick = function () { strip = []; drawStrip(main); };
    main.querySelector('#addW').onclick = function () {
      var w = main.querySelector('#nw').value.trim(), e = main.querySelector('#ne').value.trim() || '⭐';
      if (!w) return;
      d.custom.push({ w: w, e: e }); saveTools(d); boardTab = 'mine'; TG.render();
    };
    main.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { d.custom.splice(+b.dataset.del, 1); saveTools(d); TG.render(); }; });
    main.querySelector('#logUse').onchange = function (e) { d.logBoard = e.target.checked; saveTools(d); };
  };
  function drawStrip(main) {
    var s = main.querySelector('#strip');
    s.querySelectorAll('span,em').forEach(function (x) { x.remove(); });
    var html = strip.length ? strip.map(function (w) { return '<span>' + w.e + ' ' + esc(w.w) + '</span>'; }).join('') : '<em>Tap pictures to make a sentence</em>';
    s.insertAdjacentHTML('afterbegin', html);
  }

  /* ---- Picture schedule ---- */
  var doneSteps = {};
  K.schedule = function (preset) {
    var d = tools();
    preset = preset || 'morning';
    var p = TG.byId(C.SCHEDULE_PRESETS, preset) || C.SCHEDULE_PRESETS[0];
    var cards = d.schedules[p.id] || p.cards;
    var key = p.id + TG.today();
    var done = doneSteps[key] || (doneSteps[key] = {});
    var next = cards.findIndex(function (c, i) { return !done[i]; });
    return kidFrame(p.name,
      '<div class="board-tabs">' + C.SCHEDULE_PRESETS.map(function (x) { return '<a href="#/kids/schedule/' + x.id + '" class="' + (x.id === p.id ? 'on' : '') + '">' + esc(x.name) + '</a>'; }).join('') + '</div>' +
      '<div class="sched">' + cards.map(function (id, i) { var c = card(id); return '<button class="scard' + (done[i] ? ' done' : '') + (i === next ? ' now' : '') + '" data-i="' + i + '"><span>' + c.e + '</span>' + esc(c.label) + (done[i] ? '<i>✓</i>' : '') + '</button>'; }).join('') + '</div>' +
      (next < 0 ? '<div class="celebrate">🎉 All done!</div>' : ''),
      '<p class="small">Tap cards to change the order for this schedule:</p><div class="pick">' + C.SCHEDULE_CARDS.map(function (c) { return '<button class="chip' + (cards.indexOf(c.id) >= 0 ? ' on' : '') + '" data-add="' + c.id + '">' + c.e + ' ' + esc(c.label) + '</button>'; }).join('') + '</div>' +
      '<p class="small muted">Tapping a card that is on removes it; tapping one that is off adds it at the end.</p><div class="row gap"><button class="btn" id="resetS">Reset to standard</button><button class="btn" id="restart">Start again</button><button class="btn" id="printS">🖨️ Print</button></div>');
  };
  K.schedule.after = function (main, preset) {
    var d = tools();
    var p = TG.byId(C.SCHEDULE_PRESETS, preset || 'morning') || C.SCHEDULE_PRESETS[0];
    var cards = (d.schedules[p.id] || p.cards).slice();
    var key = p.id + TG.today();
    main.querySelectorAll('.scard').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.i, done = doneSteps[key];
        done[i] = !done[i];
        var c = card(cards[i]);
        say(done[i] ? c.label + ', done!' : c.label);
        var all = cards.every(function (x, j) { return done[j]; });
        if (all) say('All done! Well done!');
        TG.render();
      };
    });
    main.querySelectorAll('[data-add]').forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.add, at = cards.indexOf(id);
        if (at >= 0) cards.splice(at, 1); else cards.push(id);
        d.schedules[p.id] = cards; saveTools(d); doneSteps[key] = {}; TG.render();
      };
    });
    main.querySelector('#resetS').onclick = function () { delete d.schedules[p.id]; saveTools(d); doneSteps[key] = {}; TG.render(); };
    main.querySelector('#restart').onclick = function () { doneSteps[key] = {}; TG.render(); };
    main.querySelector('#printS').onclick = function () { TG.printDoc('schedule', p.id); };
  };

  /* ---- First–then ---- */
  K.firstthen = function () {
    var d = tools(), f = card(d.firstThen.first), t = card(d.firstThen.then);
    return kidFrame('First – then',
      '<div class="ft"><button class="ftc' + (d.firstThen.done ? ' done' : '') + '" id="ftFirst"><small>FIRST</small><span>' + f.e + '</span>' + esc(f.label) + (d.firstThen.done ? '<i>✓</i>' : '') + '</button><div class="ft-arrow">➜</div>' +
      '<button class="ftc then' + (d.firstThen.done ? ' now' : '') + '" id="ftThen"><small>THEN</small><span>' + t.e + '</span>' + esc(t.label) + '</button></div>',
      '<div class="row gap wrap"><label>First<select id="sf">' + opts(d.firstThen.first) + '</select></label><label>Then<select id="st">' + opts(d.firstThen.then) + '</select></label></div><button class="btn" id="ftReset">Start again</button>');
  };
  function opts(sel) { return C.SCHEDULE_CARDS.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + c.e + ' ' + esc(c.label) + '</option>'; }).join(''); }
  K.firstthen.after = function (main) {
    var d = tools();
    var f = card(d.firstThen.first), t = card(d.firstThen.then);
    main.querySelector('#ftFirst').onclick = function () {
      d.firstThen.done = !d.firstThen.done; saveTools(d);
      say(d.firstThen.done ? f.label + ', done! Now ' + t.label + '!' : 'First ' + f.label + ', then ' + t.label); TG.render();
    };
    main.querySelector('#ftThen').onclick = function () { say(d.firstThen.done ? t.label + '!' : 'First ' + f.label + '. Then ' + t.label + '.'); };
    main.querySelector('#sf').onchange = function (e) { d.firstThen.first = e.target.value; d.firstThen.done = false; saveTools(d); TG.render(); };
    main.querySelector('#st').onchange = function (e) { d.firstThen.then = e.target.value; d.firstThen.done = false; saveTools(d); TG.render(); };
    main.querySelector('#ftReset').onclick = function () { d.firstThen.done = false; saveTools(d); TG.render(); };
  };

  /* ---- Star chart ---- */
  K.stars = function () {
    var d = tools(), s = d.stars, full = s.count >= s.goal;
    var slots = '';
    for (var i = 0; i < s.goal; i++) slots += '<button class="star' + (i < s.count ? ' on' : '') + '" data-i="' + i + '">' + (i < s.count ? '⭐' : '☆') + '</button>';
    return kidFrame('Star chart', '<div class="reward">Working for: <b>' + esc(s.reward) + '</b></div><div class="stars">' + slots + '</div>' +
      (full ? '<div class="celebrate">🎉 You did it! ' + esc(s.reward) + '!</div>' : '<p class="center muted">' + (s.goal - s.count) + ' more to go</p>'),
      '<label>Stars needed' + TG.chips('goalN', ['3', '5', '10'], String(s.goal)) + '</label><label>Reward' + TG.chips('reward', C.REWARDS, s.reward) + '</label><button class="btn" id="sReset">Start a new chart</button>' +
      '<p class="small muted">Give a star right after the good behaviour, and say exactly what it was for: "A star for sitting on the potty!"</p>');
  };
  K.stars.after = function (main) {
    var d = tools();
    main.querySelectorAll('.star').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.i;
        d.stars.count = i < d.stars.count ? i : i + 1;
        saveTools(d);
        say(d.stars.count >= d.stars.goal ? 'You did it! ' + d.stars.reward.replace(/^\S+\s/, '') + '!' : 'Star! Well done!');
        TG.render();
      };
    });
    main.querySelector('.adult').addEventListener('change', function () {
      var v = TG.val(main.querySelector('.adult'));
      if (v.goalN) d.stars.goal = +v.goalN; if (v.reward) d.stars.reward = v.reward;
      saveTools(d); TG.render();
    });
    main.querySelector('#sReset').onclick = function () { d.stars.count = 0; saveTools(d); TG.render(); };
  };

  /* ---- Choice board ---- */
  var ALL_CHOICES = C.FOOD_WORDS.concat(C.SCHEDULE_CARDS.map(function (c) { return { w: c.label, e: c.e, id: c.id }; }));
  function choiceItem(id) { return ALL_CHOICES.find(function (x) { return (x.id || x.w) === id; }) || { w: id, e: '❔' }; }
  K.choices = function () {
    var d = tools();
    return kidFrame('What do you want?', '<div class="choices c' + d.choices.length + '">' + d.choices.map(function (id) { var x = choiceItem(id); return '<button class="choice" data-id="' + esc(id) + '"><span>' + x.e + '</span>' + esc(x.w) + '</button>'; }).join('') + '</div>' +
      '<p class="center muted">Hold up the real things too, and say both names.</p>',
      '<p class="small">Choose 2–4 things:</p><div class="pick">' + ALL_CHOICES.map(function (x) { var id = x.id || x.w; return '<button class="chip' + (d.choices.indexOf(id) >= 0 ? ' on' : '') + '" data-c="' + esc(id) + '">' + x.e + ' ' + esc(x.w) + '</button>'; }).join('') + '</div>');
  };
  K.choices.after = function (main) {
    var d = tools();
    main.querySelectorAll('.choice').forEach(function (b) { b.onclick = function () { var x = choiceItem(b.dataset.id); say('I want ' + x.w); b.classList.add('pop'); setTimeout(function () { b.classList.remove('pop'); }, 400); }; });
    main.querySelectorAll('[data-c]').forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.c, i = d.choices.indexOf(id);
        if (i >= 0) { if (d.choices.length > 2) d.choices.splice(i, 1); }
        else { d.choices.push(id); if (d.choices.length > 4) d.choices.shift(); }
        saveTools(d); TG.render();
      };
    });
  };

  /* ---- Feelings ---- */
  K.feelings = function () {
    return kidFrame('How do you feel?', '<div class="board feelings">' + C.FEELINGS.map(function (f, i) { return '<button class="btile" data-i="' + i + '"><span>' + f.e + '</span>' + esc(f.w) + '</button>'; }).join('') + '</div>' +
      '<p class="center muted">Name the feeling, then help: "You\'re sad. Do you want a hug?"</p>');
  };
  K.feelings.after = function (main) {
    main.querySelectorAll('.btile').forEach(function (b) { b.onclick = function () { var f = C.FEELINGS[+b.dataset.i]; say('I feel ' + f.w); b.classList.add('pop'); setTimeout(function () { b.classList.remove('pop'); }, 300); }; });
  };

  /* ---- Visual timer ---- */
  var timerInt = null;
  K.timer = function () {
    return kidFrame('Timer', '<div class="vtimer"><svg viewBox="0 0 100 100" class="pie"><circle cx="50" cy="50" r="45" class="pie-bg"/><path id="pieFill" class="pie-fill" d=""/></svg><div class="vt-text" id="vtText">Choose a time</div></div>' +
      '<div class="row gap center wrap">' + [1, 2, 5, 10, 15].map(function (m) { return '<button class="btn big" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div>');
  };
  K.timer.after = function (main) {
    function arc(frac) {
      if (frac >= 0.999) return 'M50 5 A45 45 0 1 1 49.99 5 Z';
      if (frac <= 0) return '';
      var a = frac * 2 * Math.PI, x = 50 + 45 * Math.sin(a), y = 50 - 45 * Math.cos(a);
      return 'M50 50 L50 5 A45 45 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Z';
    }
    main.querySelectorAll('[data-m]').forEach(function (b) {
      b.onclick = function () {
        clearInterval(timerInt);
        var total = +b.dataset.m * 60, left = total, fill = main.querySelector('#pieFill'), txt = main.querySelector('#vtText');
        say(b.dataset.m + ' minutes');
        var tick = function () {
          if (!document.body.contains(fill)) { clearInterval(timerInt); return; }
          fill.setAttribute('d', arc(left / total));
          txt.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
          if (left <= 0) { clearInterval(timerInt); txt.textContent = 'All done!'; say('All done!'); if (navigator.vibrate) try { navigator.vibrate([300, 100, 300]); } catch (e) {} }
          left--;
        };
        tick(); timerInt = setInterval(tick, 1000);
      };
    });
  };
})();
