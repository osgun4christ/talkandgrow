/* Talk & Grow — family food timetable (weekly menu): edit, lock, random replan, print as a menu, shopping list. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, X = TG.screens, F = C.FOOD;

  var SLOTS = [{ id: 'breakfast', label: 'Breakfast', icon: '🌅' }, { id: 'lunch', label: 'Lunch', icon: '☀️' }, { id: 'snack', label: 'Snack', icon: '🍌' }, { id: 'dinner', label: 'Dinner', icon: '🌙' }];
  function absDate(x) { var d = TG.parseD(x); return d.getDate() + ' ' + TG.MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  /* More meal ideas, so a random week has variety */
  F.meals.breakfast.push('Rice porridge with milk and banana', 'Boiled sweet potato and fried egg', 'Bread with avocado and pawpaw', 'Pumpkin porridge with milk', 'Boiled cassava with groundnut paste and orange');
  F.meals.lunch.push('Rice with okra soup and fish', 'Rice with bitter ball and fish', 'Cassava with palm butter and chicken', 'Rice with black-eyed peas and vegetables', 'Rice with pumpkin and fish soup');
  F.meals.dinner.push('Rice with potato greens and egg', 'Plantain with bean soup and greens', 'Sweet potato with fish stew and vegetables', 'Dumboy (small pieces) with pepper-free palm butter', 'Rice with cassava leaf and fish');
  F.meals.snacks.push('Watermelon pieces', 'Guava', 'Milk and a banana', 'Pineapple pieces');
  F.mealsNG.breakfast.push('Custard (pap) with milk and boiled egg', 'Fried plantain (a little) and egg', 'Bread with akara and orange', 'Sweet potato with egg sauce', 'Oats with milk and pawpaw');
  F.mealsNG.lunch.push('White rice with ofada stew (mild) and vegetables', 'Fried rice with chicken and carrots', 'Spaghetti with tomato stew, fish and vegetables', 'Yam with garden egg sauce', 'Rice with efo riro and fish');
  F.mealsNG.dinner.push('Pounded yam (small) with egusi soup and fish', 'Semo (small) with vegetable soup', 'Beans and corn (adalu) with avocado', 'Yam porridge with spinach and fish', 'Bitter leaf soup with eba (small) and fish');
  F.mealsNG.snacks.push('Agbalumo or guava (in season)', 'Watermelon pieces', 'Milk and a banana', 'Moi moi (small)');

  var GROUP_WORDS = {
    grains: ['rice', 'bread', 'oats', 'porridge', 'plantain', 'yam', 'cassava', 'eddoes', 'fufu', 'dumboy', 'eba', 'garri', 'amala', 'semo', 'pap', 'ogi', 'spaghetti', 'corn', 'sweet potato', 'jollof', 'custard', 'cocoyam', 'boli', 'adalu'],
    protein: ['fish', 'egg', 'beans', 'bean', 'chicken', 'meat', 'liver', 'moi moi', 'akara', 'groundnut', 'egusi', 'crayfish', 'sardine', 'peas', 'adalu'],
    greens: ['greens', 'cassava leaf', 'okra', 'bitter ball', 'pumpkin', 'ugu', 'efo', 'spinach', 'ewedu', 'vegetable', 'carrot', 'tomato', 'garden egg', 'salad', 'bitter leaf', 'edikang'],
    fruit: ['banana', 'mango', 'pawpaw', 'orange', 'pineapple', 'watermelon', 'avocado', 'guava', 'agbalumo', 'fruit'],
    milk: ['milk', 'yogurt', 'wara', 'cheese', 'custard'],
    fats: ['palm', 'avocado', 'groundnut', 'egusi', 'sardine', 'mackerel']
  };
  function groupsOf(text) {
    var t = ' ' + String(text || '').toLowerCase() + ' ', g = {};
    var forGrains = t.replace(/potato greens|cassava leaf|bitter leaf/g, ' ');
    Object.keys(GROUP_WORDS).forEach(function (k) {
      var src = k === 'grains' ? forGrains : t;
      if (GROUP_WORDS[k].some(function (w) { return src.indexOf(w) >= 0; })) g[k] = 1;
    });
    return Object.keys(g);
  }
  TG.groupsOf = groupsOf;

  /* ---------- data ---------- */
  function weekStart(offset) { return TG.addDays(TG.weekKey(), 7 * (offset || 0)); }
  function menuId(wk) { return 'menu_' + wk.replace(/-/g, ''); }
  function getMenu(wk) { var r = TG.rec(menuId(wk)); return r ? JSON.parse(JSON.stringify(r.data)) : null; }
  function saveMenu(m) { TG.save('menu', m, { id: menuId(m.week), date: m.week, childId: '', summary: 'Menu for week of ' + m.week }); }
  function pool(cuisine, slot) {
    var key = slot === 'snack' ? 'snacks' : slot;
    if (cuisine === 'nigerian') return F.mealsNG[key].slice();
    if (cuisine === 'both') return F.meals[key].concat(F.mealsNG[key]);
    return F.meals[key].slice();
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Random replan: fills every unlocked meal, avoiding repeats in the week where possible. */
  function replan(m, onlyDay) {
    SLOTS.forEach(function (s) {
      var used = {};
      for (var d = 0; d < 7; d++) { var c = m.cells[d + '-' + s.id]; if (c && (c.lock || (onlyDay !== undefined && d !== onlyDay))) used[c.t] = 1; }
      var bag = shuffle(pool(m.cuisine, s.id).filter(function (x) { return !used[x]; }));
      for (var day = 0; day < 7; day++) {
        if (onlyDay !== undefined && day !== onlyDay) continue;
        var key = day + '-' + s.id, cell = m.cells[key];
        if (cell && cell.lock) continue;
        if (!bag.length) bag = shuffle(pool(m.cuisine, s.id));
        var prev = cell && cell.t, pick = bag.shift();
        if (pick === prev && bag.length) { bag.push(pick); pick = bag.shift(); }
        m.cells[key] = { t: pick, lock: false };
      }
    });
    return m;
  }
  function newMenu(wk) {
    var c = TG.child();
    return replan({ week: wk, cuisine: TG.cuisine(c), cells: {} });
  }
  TG.menuFor = function (wk) { return getMenu(wk); };

  /* ---------- screen ---------- */
  X.menu = function (arg) {
    var off = arg === 'next' ? 1 : 0, wk = weekStart(off), m = getMenu(wk);
    var todayIdx = off ? -1 : (new Date().getDay() + 6) % 7;
    var head = '<div class="page-head"><h1>🍽️ Family menu</h1></div>' +
      '<div class="seg"><a href="#/menu" class="' + (off ? '' : 'on') + '">This week</a><a href="#/menu/next" class="' + (off ? 'on' : '') + '">Next week</a></div>' +
      '<p class="muted small">Week of ' + esc(absDate(wk)) + ' – ' + esc(absDate(TG.addDays(wk, 6))) + '. One menu for the whole family; serve children smaller, softer portions with little pepper.</p>';
    if (!m) {
      return head + '<section class="card center"><p class="lead">No menu for this week yet.</p><p>Make one from Liberian, Nigerian or both kinds of meals. You can change any meal afterwards.</p>' +
        '<label>Food style' + TG.chips('cuisine', F.cuisines.map(function (x) { return { v: x.id, l: x.label }; }), TG.cuisine()) + '</label>' +
        '<button class="btn primary big" id="makeMenu">🎲 Make this week\'s menu</button>' +
        (off ? '' : (getMenu(weekStart(-1)) ? '<button class="btn" id="copyLast">Copy last week\'s menu</button>' : '')) + '</section>';
    }
    var locked = Object.keys(m.cells).filter(function (k) { return m.cells[k].lock; }).length;
    return head +
      '<section class="card menu-tools"><label style="margin-top:0">Food style' + TG.chips('cuisine', F.cuisines.map(function (x) { return { v: x.id, l: x.label }; }), m.cuisine) + '</label>' +
      '<div class="row gap wrap"><button class="btn primary" id="replan">🎲 Replan the week</button><button class="btn" id="printMenu">🖨️ Print menu</button><button class="btn" id="printShop">🛒 Shopping list</button></div>' +
      '<p class="muted small">Replan picks new meals at random' + (locked ? ' and keeps the ' + TG.plural(locked, 'locked meal') + ' 🔒' : '') + '. Tap a meal to change it, lock it, or log it as eaten.</p></section>' +
      '<div class="menu-week">' + DAYS.map(function (day, d) {
        var all = SLOTS.map(function (s) { var c = m.cells[d + '-' + s.id]; return c ? c.t : ''; }).join(' ');
        var gs = groupsOf(all);
        return '<section class="card menu-day' + (d === todayIdx ? ' today' : '') + '"><div class="card-head"><h2>' + day + (d === todayIdx ? ' <span class="badge">Today</span>' : '') + '</h2><button class="icon-btn small-ic" data-reday="' + d + '" title="Replan this day" aria-label="Replan ' + day + '">🎲</button></div>' +
          SLOTS.map(function (s) {
            var c = m.cells[d + '-' + s.id] || { t: '' };
            return '<button class="menu-cell" data-cell="' + d + '-' + s.id + '"><span class="mc-slot">' + s.icon + ' ' + s.label + '</span><span class="mc-food">' + (c.t ? esc(c.t) : '<i class="muted">Tap to add</i>') + '</span>' + (c.lock ? '<span class="mc-lock">🔒</span>' : '') + (c.eaten ? '<span class="mc-lock">✓</span>' : '') + '</button>';
          }).join('') +
          '<div class="mgroups" title="Food groups">' + F.groups.map(function (g) { return '<span class="' + (gs.indexOf(g.id) >= 0 ? 'on' : '') + '" title="' + esc(g.name) + '">' + g.emoji + '</span>'; }).join('') + '<small>' + gs.length + '/6 groups</small></div></section>';
      }).join('') + '</div>' +
      '<div class="row gap wrap"><button class="btn danger" id="clearMenu">Clear this week</button></div>';
  };

  X.menu.after = function (main, arg) {
    var off = arg === 'next' ? 1 : 0, wk = weekStart(off), m = getMenu(wk);
    var mk = main.querySelector('#makeMenu');
    if (mk) mk.onclick = function () { var x = newMenu(wk); x.cuisine = TG.val(main).cuisine || x.cuisine; replan(x); saveMenu(x); TG.toast('Menu ready ✓'); TG.render(); };
    var cp = main.querySelector('#copyLast');
    if (cp) cp.onclick = function () { var last = getMenu(weekStart(-1)); last.week = wk; Object.keys(last.cells).forEach(function (k) { delete last.cells[k].eaten; }); saveMenu(last); TG.render(); };
    if (!m) return;
    main.querySelector('[data-name=cuisine]').addEventListener('change', function () {
      var cu = TG.val(main).cuisine; if (!cu || cu === m.cuisine) return;
      m.cuisine = cu; saveMenu(m);
      TG.toast('Food style changed. Tap "Replan the week" to use it.');
    });
    main.querySelector('#replan').onclick = function () {
      var before = JSON.parse(JSON.stringify(m));
      replan(m); saveMenu(m); TG.render();
      TG.toast('New menu 🎲', { label: 'Undo', fn: function () { saveMenu(before); TG.render(); } });
    };
    main.querySelectorAll('[data-reday]').forEach(function (b) { b.onclick = function () { replan(m, +b.dataset.reday); saveMenu(m); TG.render(); }; });
    main.querySelector('#printMenu').onclick = function () { TG.printDoc('menu', wk); };
    main.querySelector('#printShop').onclick = function () { TG.printDoc('shopping', wk); };
    main.querySelector('#clearMenu').onclick = function () { TG.confirmBox('Delete the menu for this week?', 'Delete', function () { TG.remove(menuId(wk)); TG.render(); }); };
    main.querySelectorAll('.menu-cell').forEach(function (b) { b.onclick = function () { editCell(m, b.dataset.cell); }; });
  };

  function editCell(m, key) {
    var parts = key.split('-'), d = +parts[0], slot = parts[1], s = TG.byId(SLOTS, slot);
    var c = m.cells[key] || { t: '', lock: false };
    var ideas = pool(m.cuisine, slot);
    TG.sheet(DAYS[d] + ' · ' + s.label,
      '<label>Meal<textarea id="mt" rows="2" maxlength="120">' + esc(c.t) + '</textarea></label>' +
      '<p class="small muted">Or pick one:</p><div class="pick">' + ideas.map(function (x) { return '<button type="button" class="chip' + (x === c.t ? ' on' : '') + '" data-idea="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<label class="check"><input type="checkbox" id="ml"' + (c.lock ? ' checked' : '') + '> 🔒 Lock this meal (replanning keeps it)</label>' +
      '<div class="row gap wrap"><button class="btn primary" id="ms">Save</button><button class="btn" id="mr">🎲 Random</button>' +
      (TG.child() ? '<button class="btn" id="me">✓ Eaten — log it</button>' : '') + '<button class="btn danger" id="mx">Clear</button></div>',
      function (body) {
        var ta = body.querySelector('#mt');
        body.querySelectorAll('[data-idea]').forEach(function (b) { b.onclick = function () { ta.value = b.dataset.idea; body.querySelectorAll('[data-idea]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
        function store(extra) { m.cells[key] = Object.assign({ t: ta.value.trim(), lock: body.querySelector('#ml').checked }, extra || {}); if (c.eaten && !extra) m.cells[key].eaten = c.eaten; saveMenu(m); }
        body.querySelector('#ms').onclick = function () { store(); TG.closeSheet(); TG.render(); };
        body.querySelector('#mr').onclick = function () { var others = ideas.filter(function (x) { return x !== ta.value; }); ta.value = others[Math.floor(Math.random() * others.length)] || ta.value; };
        body.querySelector('#mx').onclick = function () { delete m.cells[key]; saveMenu(m); TG.closeSheet(); TG.render(); };
        var e = body.querySelector('#me');
        if (e) e.onclick = function () {
          store({ eaten: true });
          TG.prefill = { meal: slot, food: ta.value.trim(), groups: groupsOf(ta.value) };
          TG.closeSheet(); TG.go('#/add/meal');
        };
      });
  }

  /* ---------- Today card ---------- */
  function todayCard() {
    var m = getMenu(weekStart(0)), d = (new Date().getDay() + 6) % 7;
    if (!m) return '<a class="card link-card" href="#/menu">🍽️ Plan this week\'s meals ›</a>';
    return '<section class="card"><div class="card-head"><h2>Today\'s meals</h2><a class="small" href="#/menu">Week</a></div><div class="today-menu">' +
      SLOTS.map(function (s) { var c = m.cells[d + '-' + s.id]; return '<div><small>' + s.icon + ' ' + s.label + '</small><b>' + esc(c ? c.t : '—') + '</b></div>'; }).join('') + '</div></section>';
  }
  var origHome = X.home;
  X.home = function () {
    var html = origHome.apply(this, arguments);
    if (!TG.child()) return html;
    return html.indexOf('<!--MENU-->') >= 0 ? html.replace('<!--MENU-->', todayCard()) : html;
  };

  /* ---------- printing ---------- */
  var P = TG.PRINT_BUILD;
  P.menu = function (wk) {
    wk = wk || weekStart(0);
    var m = getMenu(wk) || newMenu(wk), fam = TG.S().familyName || 'Our family';
    return '<div class="pmenu"><div class="pmenu-head"><small>' + esc(fam) + '</small><h1>This Week\'s Menu</h1><p>' + esc(absDate(wk)) + ' – ' + esc(absDate(TG.addDays(wk, 6))) + '</p></div>' +
      '<table class="pmenu-table"><thead><tr><th></th>' + SLOTS.map(function (s) { return '<th>' + s.icon + ' ' + s.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
      DAYS.map(function (day, d) { return '<tr><th>' + day + '</th>' + SLOTS.map(function (s) { var c = m.cells[d + '-' + s.id]; return '<td>' + esc(c ? c.t : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' +
      '<p class="pmenu-foot">💧 Water to drink with every meal · 🧼 Wash hands before eating · Children: smaller, soft portions, little salt and pepper, no bones</p></div>';
  };
  P.shopping = function (wk) {
    wk = wk || weekStart(0);
    var m = getMenu(wk) || newMenu(wk);
    var text = Object.keys(m.cells).map(function (k) { return m.cells[k].t; }).join(' | ').toLowerCase();
    var extra = ['potato greens', 'cassava leaf', 'okra', 'bitter ball', 'palm oil', 'palm butter', 'onions', 'tomatoes', 'carrots', 'black-eyed peas', 'garden egg', 'spinach', 'egusi', 'crayfish', 'chicken', 'fish', 'eggs', 'beans', 'rice', 'milk'];
    var names = {};
    F.items.forEach(function (x) { names[x.n] = x.g[0]; });
    extra.forEach(function (n) { if (!names[cap(n)]) names[cap(n)] = groupsOf(n)[0] || 'greens'; });
    var found = {};
    Object.keys(names).forEach(function (n) {
      var key = n.toLowerCase().replace(/ \/.*$/, '').replace(/ \(.*\)$/, '').replace(/s$/, '');
      var count = text.split(key).length - 1;
      if (count) found[n] = { n: n, g: names[n], c: count };
    });
    var byGroup = {};
    Object.keys(found).forEach(function (k) { var x = found[k]; (byGroup[x.g] = byGroup[x.g] || []).push(x); });
    return '<div class="p-head"><div><h1>Shopping list</h1><p>For the menu of ' + esc(absDate(wk)) + ' – ' + esc(absDate(TG.addDays(wk, 6))) + '. The number shows how many meals use it.</p></div><div class="p-brand">Talk &amp; Grow</div></div>' +
      F.groups.map(function (g) { var l = byGroup[g.id]; return l ? '<h2>' + g.emoji + ' ' + esc(g.name.split(' (')[0]) + '</h2><div class="p-words">' + l.map(function (x) { return '<span>☐ ' + esc(x.n) + ' <small>×' + x.c + '</small></span>'; }).join('') + '</div>' : ''; }).join('') +
      '<h2>Also</h2><div class="p-words"><span>☐ Iodised salt</span><span>☐ Onions</span><span>☐ Cooking oil</span><span>☐ Drinking water</span><span>☐ Soap</span><span>☐ ____________</span><span>☐ ____________</span><span>☐ ____________</span></div>';
  };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  TG.PRINTS.splice(TG.PRINTS.findIndex(function (p) { return p[0] === 'meals'; }), 1,
    ['menu', '🍽️', 'Family menu', 'This week\'s menu from the Menu screen'],
    ['shopping', '🛒', 'Shopping list', 'Made from this week\'s menu'],
    ['meals', '📋', 'Sample meal plan', 'Example week, Liberian and/or Nigerian']);
})();
