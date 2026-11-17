/* Talk & Grow — videos and free learning sites.
   Links open YouTube searches and well-known free sites, so they keep working when single videos are removed. */
(function () {
  'use strict';
  var TG = window.TG, C = TG.C, esc = TG.esc, X = TG.screens;

  function yt(q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }
  TG.yt = yt;

  /* For each activity: a "watch how" search for the parent, and sometimes a "watch together" search for the child */
  var ACT = {
    rsg: ['ready set go game toddler speech therapy', 'ready steady go song for toddlers'],
    bubbles: ['bubbles speech therapy toddler first words', ''],
    snack: ['snack time communication temptations toddler speech', ''],
    jar: ['communication temptations clear container speech therapy', ''],
    songstop: ['pause in songs fill in the blank toddler speech therapy', 'Super Simple Songs action songs'],
    peer: ['dialogic reading PEER sequence parents', 'read aloud picture book for toddlers'],
    feelybag: ['mystery bag game toddler language', ''],
    animals: ['animal sounds speech therapy toddler', 'animal sounds song for kids'],
    bodyparts: ['body parts game toddler language', 'head shoulders knees and toes song'],
    simon: ['following directions game toddler speech therapy', 'Simon says for kids'],
    kitchen: ['self talk parallel talk toddler speech therapy', ''],
    bath: ['bath time language toddler speech therapy tips', ''],
    dress: ['backward chaining dressing toddler occupational therapy', ''],
    pretendcook: ['pretend play ideas toddler language development', ''],
    hide: ['hide and seek objects toddler where questions speech', ''],
    photos: ['family photo book toddler first words', ''],
    phone: ['pretend phone play toddler conversation', ''],
    puppet: ['sock puppet speech therapy activity', 'puppet show for preschool'],
    mirror: ['mirror play speech sounds toddler', ''],
    blocks: ['block play speech therapy toddler first words', ''],
    laundry: ['sorting laundry toddler learning colors', ''],
    walk: ['nature walk talking with toddler language', ''],
    ballturns: ['turn taking ball game toddler', ''],
    feelfaces: ['teaching feelings to toddlers', 'Sesame Street feelings song'],
    dough: ['homemade playdough no cook recipe kids', ''],
    beads: ['threading pasta fine motor toddler', ''],
    draw: ['pre writing strokes lines circles toddler', 'drawing shapes for kids'],
    jumpstop: ['stop and go game preschool', 'freeze dance song for kids'],
    lids: ['twist lids fine motor activity toddler', ''],
    colourcups: ['color sorting activity toddler', 'colors song for toddlers'],
    puzzle: ['homemade puzzle toddler cardboard', ''],
    count: ['counting with toddlers one to one', 'counting song 1 to 10 Jack Hartmann'],
    potty: ['potty training tips pediatrician toddler', 'potty song for toddlers'],
    handwash: ['hand washing steps for kids', 'wash your hands song for kids'],
    foodplay: ['picky eating food exposure toddler tips', 'Sesame Street trying new foods'],
    meal: ['family mealtime conversation toddler language', ''],
    bedtime: ['bedtime routine toddler tips', 'bedtime song for toddlers'],
    calmcorner: ['calm down corner toddler belly breathing', 'Sesame Street belly breathing'],
    firstthen: ['first then board how to use autism toddler', ''],
    waitgame: ['teaching toddler to wait', ''],
    special: ['PCIT special time PRIDE skills', ''],
    listen: ['listening game sounds toddler', 'guess the sound game for kids'],
    market: ['pretend shop play preschool', ''],
    actions: ['action rhymes for toddlers', 'Super Simple Songs action songs'],
    namegame: ['teaching toddler to respond to name', ''],
    freeze: ['freeze dance game kids self control', 'freeze dance song for kids'],
    taskbox: ['task box activity preschool attention', ''],
    shortstory: ['story basket preschool storytelling objects', ''],
    shapes: ['shape hunt activity preschool', 'shapes song for kids'],
    readaloud: ['how to read with your child at home tips', ''],
    sightdrill: ['how to teach sight words at home', 'sight words song Jack Hartmann'],
    spellbee: ['look say cover write check spelling', ''],
    retell: ['story retelling first next then last kids', ''],
    journal: ['journal writing for kids ideas', ''],
    newsclip: ['how to summarize a news article for kids', ''],
    letterhome: ['how to write a friendly letter for kids', ''],
    shopmaths: ['money maths game at home kids', 'counting money for kids'],
    mathsdrill: ['make math practice fun at home', 'Numberblocks'],
    kitchenfrac: ['fractions with food kids', 'fractions for kids Khan Academy'],
    measurehouse: ['measurement activities at home kids', 'measuring length for kids'],
    mentalkeke: ['mental math strategies for kids', ''],
    wordproblem: ['bar model word problems for kids', ''],
    survey: ['bar graph tally chart for kids', 'bar graphs for kids'],
    experiment: ['easy science experiments at home kids sink or float', 'SciShow Kids experiments'],
    seeddiary: ['bean seed growing experiment kids', 'how do seeds grow for kids'],
    naturewalk: ['nature walk science activity kids', 'living and non living things for kids'],
    watercycle: ['water cycle in a bag experiment', 'water cycle for kids'],
    pulse: ['measure your heart rate experiment kids', 'how the heart works for kids']
  };
  TG.activityVideos = function (a) {
    var v = ACT[a.id] || [a.title + (a.grades ? ' activity for kids at home' : ' activity toddler language'), ''];
    return { how: yt(v[0]), together: v[1] ? yt(v[1]) : '' };
  };
  var METHOD_Q = {
    owl: 'Hanen observe wait listen OWL', face: 'face to face speech therapy toddler tip', lead: 'follow your child\'s lead language development',
    imitate: 'imitate your child speech therapy toddler', selftalk: 'self talk parallel talk speech therapy', oneup: 'expansion language strategy toddler',
    recast: 'recasting speech therapy toddler', tempt: 'communication temptations speech therapy', choices: 'offering choices toddler language',
    pause: 'expectant pause speech therapy', questions: 'comment more ask less toddler language', book: 'dialogic reading PEER CROWD',
    gesture: 'baby sign language more all done', aac: 'AAC core board modeling parents', routines: 'routines based intervention language toddler',
    pride: 'PCIT PRIDE skills special time', praise: 'labeled praise parenting', abc: 'ABC behavior antecedent behavior consequence parents',
    firstthen: 'first then board visual schedule', calm: 'co-regulation toddler tantrum calm', foodexpose: 'repeated exposure picky eating',
    attnshort: 'building attention span toddler', attnspace: 'reduce distractions toddler attention', attnmove: 'movement breaks kids attention',
    readdaily: 'how to read with your child every day', retrieval: 'retrieval practice for kids study', littleoften: 'spaced practice for kids',
    mathtalk: 'everyday math at home with kids', handson: 'hands on science at home kids', growth: 'growth mindset for kids parents', homework: 'homework routine tips parents'
  };
  TG.methodVideo = function (m) { return yt(METHOD_Q[m.id] || m.name); };

  /* Trusted sources only. Tags: ✝️ Christian · 🔬 tested in research studies · 🌍 made in Africa. Ages in months.
     "url" = official website; "q" = YouTube search for the official channel's exact name. */
  var SOURCES = [
    // For parents
    { who: 'parent', name: 'The Hanen Centre', tags: '🔬', q: 'The Hanen Centre', url: 'https://www.hanen.org', ages: [0, 72], text: 'Speech and language tips for parents from the makers of It Takes Two to Talk (studied in many trials).' },
    { who: 'parent', name: 'CDC: Learn the Signs. Act Early.', tags: '🔬', url: 'https://www.cdc.gov/act-early/', ages: [0, 72], text: 'Milestones with short videos of what each one looks like.' },
    { who: 'parent', name: 'Parenting for Lifelong Health (WHO & UNICEF)', tags: '🔬', q: 'Parenting for Lifelong Health tips', ages: [12, 156], text: 'Free positive-parenting tips, tested in trials in African countries.' },
    { who: 'parent', name: 'PCIT: special time and PRIDE skills', tags: '🔬', url: 'https://www.pcit.org', ages: [24, 84], text: 'The parent–child play method behind "special play time".' },
    { who: 'parent', name: 'Focus on the Family: parenting', tags: '✝️', url: 'https://www.focusonthefamily.com/parenting/', ages: [0, 156], text: 'Christian articles and videos on raising children.' },
    { who: 'parent', name: 'Plugged In (check a video before showing it)', tags: '✝️', url: 'https://www.pluggedin.com/youtube-reviews/', ages: [24, 156], text: 'Christian reviews of children\'s YouTube channels, films and games.' },
    // Watch together: Christian
    { who: 'faith', name: 'Superbook (CBN)', tags: '✝️', url: 'https://en.superbook.tv', ages: [60, 156], text: 'Animated Bible stories, free to watch.' },
    { who: 'faith', name: 'Bible App for Kids (YouVersion & OneHope)', tags: '✝️', url: 'https://bibleappforkids.com', ages: [24, 96], text: 'Free interactive Bible stories for young children; read and talk together.' },
    { who: 'faith', name: 'Saddleback Kids', tags: '✝️', q: 'Saddleback Kids Bible stories', ages: [36, 120], text: 'Short animated Bible stories (reviewed by Plugged In).' },
    { who: 'faith', name: 'Seeds Family Worship', tags: '✝️', q: 'Seeds Family Worship', ages: [24, 144], text: 'Bible verses sung word for word: great for memory and language.' },
    // Watch together: learning
    { who: 'child', name: 'Sesame Street', tags: '🔬', q: 'Sesame Street official', ages: [24, 72], text: 'The most-studied children\'s programme: letters, numbers, feelings.' },
    { who: 'child', name: 'Akili and Me (Ubongo)', tags: '🔬🌍', q: 'Akili and Me', url: 'https://www.ubongo.org', ages: [36, 72], text: 'African cartoon for school readiness; studies found gains in early learning.' },
    { who: 'child', name: 'Ubongo Kids', tags: '🔬🌍', q: 'Ubongo Kids', ages: [72, 144], text: 'African cartoon for maths and science; evaluated in impact studies.' },
    { who: 'child', name: 'Ms Rachel', tags: '', q: 'Ms Rachel toddler learning', ages: [24, 48], text: 'Uses speech-therapy techniques (slow words, signs, pauses). Popular, but not yet tested in studies.' },
    { who: 'child', name: 'Khan Academy', tags: '🔬', url: 'https://www.khanacademy.org', ages: [72, 156], text: 'Free maths and science practice by grade; studied in schools.' }
  ];
  var SITES = [
    { name: 'Khan Academy Kids (free app)', tags: '🔬', url: 'https://learn.khanacademy.org/khan-academy-kids/', ages: [24, 96], text: 'Reading, maths and stories; studies show learning gains. Use it together.' },
    { name: 'African Storybook', tags: '🌍', url: 'https://www.africanstorybook.org', ages: [24, 132], text: 'Free picture stories in English and many African languages. Read on the phone or print.' },
    { name: 'PBS Kids', tags: '🔬', url: 'https://pbskids.org', ages: [24, 96], text: 'Learning games from the US public broadcaster, backed by research.' }
  ];

  function fits(x, age) { return age === null || (age >= x.ages[0] - 6 && age <= x.ages[1]); }
  function linkRow(href, icon, title, sub) {
    return '<a class="list-item" href="' + esc(href) + '" target="_blank" rel="noopener"><span class="emoji-box">' + icon + '</span><span class="grow"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span><span class="chev">↗</span></a>';
  }

  function srcRow(x) {
    var href = x.url || yt(x.q);
    return '<a class="list-item" href="' + esc(href) + '" target="_blank" rel="noopener"><span class="emoji-box">' + (x.who === 'faith' ? '✝️' : x.url ? '🌐' : '▶️') + '</span><span class="grow"><b>' + esc(x.name) + (x.tags ? ' <span class="src-tags">' + x.tags + '</span>' : '') + '</b><small>' + esc(x.text) + '</small></span><span class="chev">↗</span></a>';
  }
  X.videos = function () {
    var c = TG.child(), age = TG.childAge();
    var name = c ? c.data.name : 'your child';
    var pick = function (who) { return SOURCES.filter(function (x) { return x.who === who && fits(x, age); }); };
    var note = age !== null && age < 24 ? 'WHO advises no screen time under age 2 (video calls are fine). Use the videos for you, then sing and play together.'
      : age !== null && age < 60 ? 'Up to 1 hour a day for ages 2–4 (WHO). Watch together, pause, and talk about it.'
        : 'Agree screen times, watch with ' + name + ' sometimes, and talk about what you learned.';
    var faith = pick('faith'), kids = pick('child'), sites = SITES.filter(function (x) { return fits(x, age); });
    return '<a class="back" href="#/learn">← Learn</a><h1>Videos & learning</h1>' +
      '<div class="banner tipb">📺 ' + esc(note) + '</div>' +
      '<p class="muted small">✝️ Christian · 🔬 tested in research studies · 🌍 made in Africa</p>' +
      (faith.length ? '<section class="card"><h2>Bible stories & songs</h2><div class="list">' + faith.map(srcRow).join('') + '</div></section>' : '') +
      (kids.length ? '<section class="card"><h2>Learning to watch together</h2><div class="list">' + kids.map(srcRow).join('') + '</div></section>' : '') +
      '<section class="card"><h2>For you: how to help</h2><div class="list">' + pick('parent').map(srcRow).join('') + '</div></section>' +
      (sites.length ? '<section class="card"><h2>Free learning apps & sites</h2><div class="list">' + sites.map(srcRow).join('') + '</div></section>' : '') +
      '<div class="banner warn small"><b>Keep it safe:</b> on the child\'s device use the YouTube Kids app or turn on Restricted Mode. "Watch how" buttons on activities open a YouTube search, so look at the video first. Check new channels on Plugged In.</div>';
  };

  /* Add video buttons to activity and method pages */
  var actOrig = X.activity;
  X.activity = function (id) {
    var html = actOrig(id), a = TG.byId(C.ACTIVITIES, id);
    if (!a) return html;
    var v = TG.activityVideos(a);
    var block = '<div class="video-row"><a class="btn" href="' + esc(v.how) + '" target="_blank" rel="noopener">▶ Watch how (for you)</a>' +
      (v.together && (TG.childAge() === null || TG.childAge() >= 24) ? '<a class="btn" href="' + esc(v.together) + '" target="_blank" rel="noopener">▶ Watch together</a>' : '') + '</div>';
    return html.replace('<h2>You need</h2>', block + '<h2>You need</h2>');
  };
  X.activity.after = actOrig.after;
  var methOrig = X.method;
  X.method = function (id) {
    var html = methOrig(id), m = TG.byId(C.METHODS, id);
    if (!m) return html;
    return html.replace('<h2>Why it works</h2>', '<a class="btn" href="' + esc(TG.methodVideo(m)) + '" target="_blank" rel="noopener">▶ Watch an example</a><h2>Why it works</h2>');
  };
  X.method.after = methOrig.after;
})();
