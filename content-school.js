/* Talk & Grow — school years (Grade/Primary 1–6) and food choices (Liberian, Nigerian).
   The study topics follow the main topics of primary curricula in Liberia and Nigeria (similar to Cambridge Primary stages).
   Always check your child's school scheme of work and add topics the class is doing. */
(function () {
  'use strict';
  var C = window.TG_CONTENT;

  /* ---------- areas for school children ---------- */
  C.AREAS.push(
    { id: 'english', name: 'English: reading & writing', short: 'English', icon: '📚', color: '#1d4ed8', stage: 'school' },
    { id: 'maths', name: 'Mathematics', short: 'Maths', icon: '🔢', color: '#b45309', stage: 'school' },
    { id: 'science', name: 'Science', short: 'Science', icon: '🔬', color: '#047857', stage: 'school' },
    { id: 'habits', name: 'Study habits', short: 'Habits', icon: '🗂️', color: '#6d28d9', stage: 'school' }
  );
  C.AREAS.forEach(function (a) {
    if (!a.stage) a.stage = ['behaviour', 'attention', 'food', 'sleep', 'social'].indexOf(a.id) >= 0 ? 'both' : 'early';
  });
  C.SUBJECTS = ['english', 'maths', 'science'];

  C.GRADES = [1, 2, 3, 4, 5, 6].map(function (g) {
    return { g: g, label: 'Grade ' + g + ' / Primary ' + g, short: 'Grade ' + g, age: g + 5, minutes: [0, 20, 25, 30, 40, 50, 60][g] };
  });
  C.STUDY_TIME_NOTE = 'A common guideline is about 10 minutes of home study per grade (Grade 1 ≈ 10–20 minutes, Grade 6 ≈ 60 minutes), plus 15–20 minutes of reading every day. Shorter, daily sessions work better than one long session at the weekend.';

  /* ---------- skills per grade: [grade, subject, skill, how to practise at home] ---------- */
  var SKILLS = [
    [1, 'english', 'Knows all letter names and sounds', 'Point to letters on packets and signs: "What sound does this make?" Five minutes a day.'],
    [1, 'english', 'Blends sounds to read short words (c-a-t)', 'Say the sounds slowly, then fast: "m-a-p… map!" Use the Reading drill.'],
    [1, 'english', 'Reads the first 40 sight words', 'Use the Reading drill in the app or the printed word list. Five words a day.'],
    [1, 'english', 'Writes all letters correctly (capital and small)', 'Trace, then copy. Check the letter starts at the right place.'],
    [1, 'english', 'Writes own name and simple words', 'Write labels for things at home: door, cup, bed.'],
    [1, 'english', 'Writes a simple sentence with a capital and full stop', '"I like rice." Let your child say it first, then write it.'],
    [1, 'english', 'Retells a short story in order', 'After reading, ask: "What happened first? Then? At the end?"'],
    [1, 'maths', 'Counts, reads and writes numbers to 100', 'Count steps, beans or bottle tops; write the number.'],
    [1, 'maths', 'Adds within 20', 'Use real things first, then fingers, then in the head. Use Maths practice.'],
    [1, 'maths', 'Subtracts within 20', '"You have 8 sweets and eat 3. How many are left?"'],
    [1, 'maths', 'Understands tens and ones', 'Bundle 10 sticks with a rubber band. 23 = 2 bundles and 3 sticks.'],
    [1, 'maths', 'Compares numbers: more, less, equal', '"Who has more?" with groups of objects; then with written numbers.'],
    [1, 'maths', 'Names 2D and 3D shapes', 'Find circles, squares, triangles, cubes and cylinders at home.'],
    [1, 'maths', 'Tells time to the hour and half hour', 'Ask the time on a clock with hands at meals and bedtime.'],
    [1, 'maths', 'Recognises coins and notes', 'Play shop with real coins and notes (L$ or ₦).'],
    [1, 'science', 'Names body parts and the five senses', 'Game: "What do we use to smell? To hear?"'],
    [1, 'science', 'Sorts living and non-living things', 'Walk outside and sort what you see: does it grow, eat, breathe?'],
    [1, 'science', 'Knows plants need water and sunlight', 'Grow two bean seeds: one with water, one without. Watch.'],
    [1, 'science', 'Describes weather and seasons (rainy, dry)', 'Keep a weather chart for a week.'],
    [1, 'science', 'Keeps clean and healthy (hand washing, teeth)', 'Talk about germs while washing hands with soap.'],
    [1, 'science', 'Knows animals and their homes', 'Match animals to homes: bird–nest, fish–water, goat–pen.'],

    [2, 'english', 'Reads words with blends and digraphs (sh, ch, th, bl, st)', 'Make word lists for each sound and read them fast.'],
    [2, 'english', 'Reads 100+ sight words quickly', 'Reading drill every day; time how many in one minute.'],
    [2, 'english', 'Reads short books smoothly with expression', 'Read a page to your child, then they read the same page like you did.'],
    [2, 'english', 'Answers who, what, where, why about a story', 'Ask two questions after every reading.'],
    [2, 'english', 'Writes 3–5 sentences on one topic', '"Write about your weekend." Talk first, then write.'],
    [2, 'english', 'Spells common words correctly', 'Look, say, cover, write, check. Use the spelling list.'],
    [2, 'english', 'Knows nouns, verbs and adjectives', 'Find naming, doing and describing words in a sentence.'],
    [2, 'maths', 'Reads numbers to 1000 and knows place value', 'Hundreds, tens and ones with money: L$/₦ 100, 10 and 1.'],
    [2, 'maths', 'Adds and subtracts within 100 (with carrying)', 'Short daily practice; check by adding back.'],
    [2, 'maths', 'Knows the 2, 5 and 10 times tables', 'Count in 2s, 5s, 10s while walking or clapping.'],
    [2, 'maths', 'Finds halves and quarters', 'Share food fairly: half an orange, a quarter of bread.'],
    [2, 'maths', 'Measures length (cm, m) and weight (kg)', 'Measure the table, the door, a bag of rice.'],
    [2, 'maths', 'Tells time to 5 minutes', '"What time is it? What time will it be in 10 minutes?"'],
    [2, 'maths', 'Adds prices and gives change', 'Play shop: "Bread is 50. You give 100. Change?"'],
    [2, 'maths', 'Reads simple tables and picture graphs', 'Make a chart of favourite fruits in the family.'],
    [2, 'science', 'Names plant parts and what plants need', 'Pull up a weed: roots, stem, leaves. Draw and label.'],
    [2, 'science', 'Groups animals (mammals, birds, fish, insects)', 'Sort pictures of animals into groups.'],
    [2, 'science', 'Knows materials and their uses', 'Why is a pot metal and a window glass?'],
    [2, 'science', 'Understands push and pull', 'Push a car, pull a bucket: which moves further?'],
    [2, 'science', 'Knows healthy foods and food groups', 'Sort the day\'s meals into food groups.'],
    [2, 'science', 'Knows the sun, moon and stars', 'Look at the moon each night for a week and draw it.'],

    [3, 'english', 'Reads chapter books alone for 20 minutes', 'Daily quiet reading time; record it in the Reading log.'],
    [3, 'english', 'Works out new words from context', 'When stuck: read the sentence again and guess, then check.'],
    [3, 'english', 'Finds the main idea and details', '"Tell me in one sentence what this was about."'],
    [3, 'english', 'Writes a paragraph with a topic sentence', 'First sentence says the idea; next sentences give reasons.'],
    [3, 'english', 'Uses commas, question marks and speech marks', 'Hunt for punctuation in a book, then use it.'],
    [3, 'english', 'Spells words with common patterns (silent e, ai, ee, oa)', 'Group spelling words by pattern.'],
    [3, 'english', 'Writes a short letter', 'Write a real letter to a grandparent.'],
    [3, 'maths', 'Knows times tables to 10 × 10', 'Five minutes of Maths practice daily, one table at a time.'],
    [3, 'maths', 'Divides by sharing and grouping', 'Share 12 sweets among 3 people.'],
    [3, 'maths', 'Adds and subtracts 3-digit numbers', 'Use prices: "345 + 128".'],
    [3, 'maths', 'Understands simple fractions (1/2, 1/3, 1/4)', 'Fold paper; cut bread or plantain into equal parts.'],
    [3, 'maths', 'Measures perimeter', 'Walk around a mat and measure each side; add them.'],
    [3, 'maths', 'Uses am/pm and the calendar', 'Count days to a birthday or holiday on a calendar.'],
    [3, 'maths', 'Draws and reads bar graphs', 'Survey the family and draw a bar graph.'],
    [3, 'maths', 'Rounds to the nearest 10 and 100', '"About how much is 47? About 50."'],
    [3, 'science', 'Describes life cycles (butterfly, frog, plant)', 'Draw a life cycle as a circle with arrows.'],
    [3, 'science', 'Knows solids, liquids and gases', 'Ice, water, steam when cooking.'],
    [3, 'science', 'Explains the water cycle', 'Make a water cycle in a sealed plastic bag in the sun.'],
    [3, 'science', 'Knows simple machines', 'Find levers, wheels and slopes at home.'],
    [3, 'science', 'Understands light and shadows', 'Make shadow shapes with a torch.'],
    [3, 'science', 'Knows soil and rocks', 'Look at soil in water: sand, clay, stones.'],
    [3, 'science', 'Knows how to prevent malaria and keep safe', 'Talk about mosquito nets and standing water.'],

    [4, 'english', 'Summarises a story or article', 'Five-sentence summary: who, what, where, problem, ending.'],
    [4, 'english', 'Compares characters and events', '"How are these two characters different?"'],
    [4, 'english', 'Uses a dictionary', 'Look up one new word a day and use it at dinner.'],
    [4, 'english', 'Writes a story with beginning, middle and end', 'Plan with three boxes before writing.'],
    [4, 'english', 'Writes a short report with facts', 'Write about an animal or a place: heading, facts, picture.'],
    [4, 'english', 'Uses tenses, pronouns and joining words correctly', 'Read writing aloud together and fix what sounds wrong.'],
    [4, 'english', 'Spells words with prefixes and suffixes (un-, re-, -ful, -ly)', 'Build word families: help, helpful, unhelpful.'],
    [4, 'english', 'Speaks clearly in front of others', 'Short talk to the family about something learned.'],
    [4, 'maths', 'Multiplies 2-digit by 2-digit numbers', 'Practise with prices: 24 bags × 15.'],
    [4, 'maths', 'Does long division with remainders', 'Share money: 125 shared by 4.'],
    [4, 'maths', 'Finds equivalent fractions and adds like fractions', 'Paper strips: 1/2 = 2/4 = 4/8.'],
    [4, 'maths', 'Understands decimals (tenths, hundredths) and money', 'Money and measuring: 1.5 m, 2.25 kg.'],
    [4, 'maths', 'Finds area and perimeter of rectangles', 'Measure a room; count floor tiles.'],
    [4, 'maths', 'Knows angles and lines', 'Find right angles at home (door corners).'],
    [4, 'maths', 'Finds factors and multiples', 'Arrange 12 bottle tops in all possible rectangles.'],
    [4, 'maths', 'Solves word problems with several steps', 'One word problem a day: underline what is asked.'],
    [4, 'science', 'Explains food chains and habitats', 'Draw a food chain: grass → goat → person.'],
    [4, 'science', 'Knows the digestive system and skeleton', 'Follow a piece of food on a body drawing.'],
    [4, 'science', 'Builds a simple circuit', 'Battery, wire and small bulb (with an adult).'],
    [4, 'science', 'Understands sound and vibration', 'Make a string telephone with two cups.'],
    [4, 'science', 'Knows energy sources', 'Which machines at home use electricity, fuel, sun?'],
    [4, 'science', 'Understands pollution and recycling', 'Sort household rubbish; what can be reused?'],
    [4, 'science', 'Does a fair test', 'Change one thing only: which cloth dries fastest in the sun?'],

    [5, 'english', 'Discusses themes in novels and non-fiction', '"What lesson does this story teach?"'],
    [5, 'english', 'Makes inferences (reads between the lines)', '"How do you know she was angry? The book didn\'t say."'],
    [5, 'english', 'Writes to persuade', 'Write why the family should visit somewhere: reasons + examples.'],
    [5, 'english', 'Writes in paragraphs with varied sentences', 'Start sentences in different ways.'],
    [5, 'english', 'Uses clauses, adverbs and apostrophes correctly', 'Edit a paragraph together with a pencil.'],
    [5, 'english', 'Takes notes and researches a topic', 'Read a short article and write 5 key points.'],
    [5, 'english', 'Checks and improves own writing', 'Read aloud, fix mistakes, add one better word.'],
    [5, 'maths', 'Adds and subtracts fractions with different denominators', 'Find a common bottom number with drawings first.'],
    [5, 'maths', 'Multiplies fractions by whole numbers', '3 × 1/4 of a loaf = ?'],
    [5, 'maths', 'Does all four operations with decimals', 'Shopping list totals with decimals.'],
    [5, 'maths', 'Finds simple percentages (10%, 25%, 50%)', '"The shop gives 10% off. What is the new price?"'],
    [5, 'maths', 'Finds volume of cuboids', 'Measure a box: length × width × height.'],
    [5, 'maths', 'Uses coordinates on a grid', 'Battleship game on squared paper.'],
    [5, 'maths', 'Finds the mean (average)', 'Average hours of sleep this week.'],
    [5, 'maths', 'Uses order of operations (BODMAS)', 'Practise 3 + 4 × 2 and explain why it is 11.'],
    [5, 'science', 'Knows the heart, lungs and blood', 'Count pulse before and after jumping.'],
    [5, 'science', 'Knows how plants reproduce (flowers, seeds)', 'Open a flower and a fruit; find the seeds.'],
    [5, 'science', 'Separates mixtures (filtering, evaporation)', 'Filter muddy water through cloth; evaporate salty water.'],
    [5, 'science', 'Explains day/night and phases of the moon', 'Use a torch and a ball as the sun and earth.'],
    [5, 'science', 'Understands gravity and friction', 'Slide things down a slope on different surfaces.'],
    [5, 'science', 'Knows germs, disease and vaccines', 'Talk about how vaccines and hand washing protect us.'],
    [5, 'science', 'Uses the scientific method', 'Question, guess, test, record, conclude.'],

    [6, 'english', 'Analyses purpose, viewpoint and figurative language', 'Find similes and metaphors in a story or song.'],
    [6, 'english', 'Writes essays (story, argument, explanation)', 'Plan, write, check: one essay a week.'],
    [6, 'english', 'Summarises long texts', 'Summarise a news article in 50 words.'],
    [6, 'english', 'Uses advanced punctuation (semicolon, colon)', 'Rewrite sentences using a colon for a list.'],
    [6, 'english', 'Builds vocabulary: synonyms, antonyms, root words', 'A "word of the day" on the fridge.'],
    [6, 'english', 'Writes formal letters and emails', 'Write a real thank-you letter or a request.'],
    [6, 'english', 'Answers comprehension questions under time', 'Past exam passages with a timer.'],
    [6, 'maths', 'Uses ratio and proportion', 'Recipes: double or halve the ingredients.'],
    [6, 'maths', 'Finds percentages, profit and loss', 'Market selling game: cost price, selling price, profit.'],
    [6, 'maths', 'Uses negative numbers', 'Temperature and money owed: -3 + 5.'],
    [6, 'maths', 'Solves simple equations (find the unknown)', '"I think of a number, add 5, get 12."'],
    [6, 'maths', 'Finds area of triangles and circles', 'Measure a round tray and a triangle cut from paper.'],
    [6, 'maths', 'Knows angles in triangles and on a line', 'Tear the corners of a paper triangle and line them up: 180°.'],
    [6, 'maths', 'Finds mean, median and mode; reads charts', 'Use family heights or test scores.'],
    [6, 'maths', 'Solves exam-style problems', 'Past papers in short timed sets; review every mistake.'],
    [6, 'science', 'Classifies living things', 'Make a key to sort leaves or animals.'],
    [6, 'science', 'Understands growing up and body changes', 'Talk openly at home, alongside what the school teaches.'],
    [6, 'science', 'Knows electricity and magnetism', 'Test which things a magnet picks up.'],
    [6, 'science', 'Knows reflection and refraction of light', 'A pencil in a glass of water looks bent: why?'],
    [6, 'science', 'Tells chemical from physical change', 'Melting ice vs cooking an egg.'],
    [6, 'science', 'Understands ecosystems and conservation', 'Discuss why forests and clean rivers matter in our country.'],
    [6, 'science', 'Knows about nutrition, drugs and hygiene', 'Talk honestly about drugs, alcohol and healthy choices.']
  ];
  var count = {};
  SKILLS.forEach(function (s) {
    var key = s[0] + s[1].charAt(0);
    count[key] = (count[key] || 0) + 1;
    C.GOALS.push({ id: 'g' + s[0] + '-' + s[1] + '-' + count[key], area: s[1], grade: s[0], level: s[0], title: s[2], detail: s[3],
      methods: s[1] === 'english' ? ['readdaily', 'retrieval'] : s[1] === 'maths' ? ['mathtalk', 'retrieval'] : ['handson', 'littleoften'],
      ages: [(s[0] + 4) * 12, (s[0] + 7) * 12] });
  });
  [['h-time', 'Studies at a set time and place (TV off)', 'Same time each day, a table and good light.'],
    ['h-read', 'Reads every day for 15–20 minutes', 'Any book, newspaper or Bible story counts.'],
    ['h-homework', 'Finishes homework without many reminders', 'Use a checklist and a timer; praise the effort.'],
    ['h-bag', 'Packs the school bag the night before', 'A picture checklist by the door.'],
    ['h-help', 'Asks for help when stuck', 'Praise questions: "Good question!"'],
    ['h-screen', 'Keeps screens to agreed times', 'Agree screen times together; phones off at study time.']
  ].forEach(function (h) { C.GOALS.push({ id: h[0], area: 'habits', title: h[1], detail: h[2], methods: ['homework', 'growth'], ages: [60, 144], level: 1 }); });

  /* ---------- study methods ---------- */
  C.METHODS.push(
    { id: 'readdaily', area: 'english', icon: '📖', name: 'Read every day', from: 'Reading research; national literacy guidance', evidence: 'strong',
      short: '15–20 minutes of reading every day, plus talking about it.',
      why: 'How much children read is one of the strongest predictors of reading level, vocabulary and success in every subject.',
      how: ['Grades 1–2: read aloud together, take turns by page.', 'Grades 3–6: quiet reading, then a 2-minute chat.', 'Let your child choose books they enjoy; comics and newspapers count.', 'Record it in the Reading log to see the streak.'],
      example: '"Tell me the best part. Who was your favourite?"', avoid: 'Turning reading into punishment.' },
    { id: 'retrieval', area: 'maths', icon: '🧠', name: 'Quiz, don\'t just re-read', from: 'Retrieval practice research (cognitive science)', evidence: 'strong',
      short: 'Short quizzes and flashcards help children remember far better than reading notes again.',
      why: 'Pulling an answer out of memory makes it stick. Mistakes in a low-stakes quiz help learning.',
      how: ['Use Maths practice and the Reading drill in the app.', 'Ask 3 questions about yesterday\'s lesson at breakfast.', 'Make flashcards: question on one side, answer on the other.', 'Mix old topics with new ones.'],
      example: '"What is 7 × 8? What is a noun? What do plants need?"', avoid: 'Long cramming the night before tests.' },
    { id: 'littleoften', area: 'science', icon: '📅', name: 'Little and often', from: 'Spaced practice research', evidence: 'strong',
      short: 'Ten to twenty minutes a day beats two hours on Saturday.',
      why: 'Spreading practice over days builds long-lasting memory.',
      how: ['Set a daily study time with the study plan on Today.', 'Come back to a topic after a few days.', 'Stop while your child can still focus.'],
      example: 'Times tables: 5 minutes every morning for a month.', avoid: 'Marathon sessions.' },
    { id: 'mathtalk', area: 'maths', icon: '🛒', name: 'Maths in everyday life', from: 'Family maths research', evidence: 'good',
      short: 'Use money, cooking, time and measuring at home to practise maths.',
      why: 'Children understand numbers better when they use them for real reasons.',
      how: ['Let your child pay and count change at the shop.', 'Double a recipe or share food fairly.', 'Ask "how many more?" and "how long until…?" every day.'],
      example: '"Rice is 450, oil is 300. We have 1000. Enough? Change?"', avoid: 'Saying "I was bad at maths" in front of your child.' },
    { id: 'handson', area: 'science', icon: '🧪', name: 'Try it with your hands', from: 'Inquiry-based science teaching', evidence: 'good',
      short: 'Small experiments with things at home make science make sense.',
      why: 'Seeing and doing turns facts into understanding and curiosity.',
      how: ['Ask "What do you think will happen?" before trying.', 'Change one thing at a time.', 'Draw or write what happened.'],
      example: 'Which dries faster in the sun: cotton or plastic?', avoid: 'Only memorising definitions.' },
    { id: 'growth', area: 'habits', icon: '🌱', name: 'Praise effort, not "smart"', from: 'Growth mindset research (Dweck)', evidence: 'good',
      short: 'Praise hard work, good strategies and not giving up.',
      why: 'Children praised for effort keep trying when things get hard.',
      how: ['Say "You worked hard on that" instead of "You\'re so clever".', 'Treat mistakes as normal steps in learning.', 'Add "yet": "You can\'t do it yet."'],
      example: '"You tried three ways before you got it. Well done!"', avoid: 'Comparing with siblings or classmates.' },
    { id: 'homework', area: 'habits', icon: '🗂️', name: 'A homework routine', from: 'School–family partnership guidance', evidence: 'helpful',
      short: 'Same time, same place, phone away. Guide, don\'t do it for them.',
      why: 'Routines reduce arguments, and children learn more when they do the thinking.',
      how: ['A table, good light, pencil and eraser ready.', 'Start with the hardest subject while fresh.', 'Ask questions instead of giving answers.', 'Check the work and sign the book if the school asks.', 'Talk to the teacher if homework takes much longer than expected.'],
      example: '"What does the question ask? What did your teacher show you?"', avoid: 'Doing the homework yourself.' }
  );

  /* ---------- study activities (grades in place of ages) ---------- */
  function sa(o) { o.ages = [(o.grades[0] + 4) * 12, (o.grades[1] + 6) * 12]; o.goals = o.goals || []; C.ACTIVITIES.push(o); }
  sa({ id: 'readaloud', emoji: '📖', title: 'Reading together', area: 'english', minutes: 15, grades: [1, 6], subject: 'english',
    materials: ['A school reader, story book, newspaper or children\'s Bible'],
    steps: ['Sit together with the TV off.', 'Grades 1–2: you read a page, your child reads a page. Grades 3–6: your child reads aloud or alone.', 'When your child is stuck, wait 5 seconds, then help with the sounds.', 'Ask 2 questions after reading: what happened, and why.', 'Log it in the Reading log.'],
    say: ['What do you think will happen?', 'Why did she do that?', 'Show me where it says that', 'Sound it out'], tip: 'Reading the same book again is good practice, not a waste.' });
  sa({ id: 'sightdrill', emoji: '🔤', title: 'Reading drill (sight words)', area: 'english', minutes: 5, grades: [1, 3], subject: 'english',
    materials: ['The Reading drill in Child tools, or the printed word list'],
    steps: ['Open Child tools ▸ Reading drill.', 'Your child reads each word; tap ✓ or ✗.', 'Practise the ✗ words again tomorrow.', 'Aim for each word in under 3 seconds.'],
    say: ['Read it fast', 'Sound it out', 'Great reading!'], tip: 'Short and daily. Stop at 5 minutes.' });
  sa({ id: 'spellbee', emoji: '🐝', title: 'Home spelling bee', area: 'english', minutes: 10, grades: [2, 6], subject: 'english',
    materials: ['This week\'s school spelling list, or the printed list', 'Paper and pencil'],
    steps: ['Look: read the word together.', 'Say: spell it out loud.', 'Cover: hide the word.', 'Write: write it from memory.', 'Check: compare and fix.', 'Friday: a family spelling bee.'],
    say: ['Look, say, cover, write, check', 'What sound do you hear?'], tip: 'Group words by pattern (-ight, -tion) to learn them faster.' });
  sa({ id: 'retell', emoji: '🎭', title: 'Retell the story', area: 'english', minutes: 10, grades: [1, 3], subject: 'english',
    materials: ['A story you just read'],
    steps: ['Close the book.', 'Your child tells the story: first, next, then, at the end.', 'Draw 3 pictures of the story and write a sentence under each.'],
    say: ['What happened first?', 'And then?', 'How did it end?'], tip: 'Retelling builds understanding and writing skills.' });
  sa({ id: 'journal', emoji: '📓', title: 'Journal writing', area: 'english', minutes: 15, grades: [2, 6], subject: 'english',
    materials: ['An exercise book as a journal'],
    steps: ['Pick a topic: my day, a visit, my dream job, a funny moment.', 'Talk about it first for 2 minutes.', 'Write: Grade 2 = 3 sentences, Grade 4 = a paragraph, Grade 6 = a page.', 'Your child reads it to you. Praise one good word or idea.', 'Fix only one kind of mistake each time.'],
    say: ['Tell me first, then write', 'What happened next?', 'Can you use a better word?'], tip: 'Writing about real life is easier than writing about made-up topics.' });
  sa({ id: 'newsclip', emoji: '📰', title: 'News summary', area: 'english', minutes: 15, grades: [4, 6], subject: 'english',
    materials: ['A short newspaper or online news story for children'],
    steps: ['Read the article together.', 'Underline who, what, when, where, why.', 'Write a 3–5 sentence summary.', 'Talk: what do you think about it?'],
    say: ['What is the main idea?', 'Do you agree?'], tip: 'Good preparation for comprehension and essay questions in exams.' });
  sa({ id: 'letterhome', emoji: '✉️', title: 'Letter to a relative', area: 'english', minutes: 20, grades: [3, 6], subject: 'english',
    materials: ['Paper, envelope, or a WhatsApp message'],
    steps: ['Choose who to write to.', 'Plan: greeting, news, question, closing.', 'Write and check spelling.', 'Send it for real.'],
    say: ['Dear…', 'How are you?', 'Yours sincerely / With love'], tip: 'A real reader makes children care about their writing.' });
  sa({ id: 'shopmaths', emoji: '🛒', title: 'Market maths', area: 'maths', minutes: 15, grades: [1, 6], subject: 'maths',
    materials: ['Real money or paper money (L$ or ₦)', 'Things to "sell" with price labels'],
    steps: ['Set prices: Grade 1 under 20, Grade 3 in hundreds, Grade 5 with decimals or discounts.', 'Your child buys: adds the total and pays.', 'Your child sells: gives change.', 'Older children: work out profit if bought at one price and sold at another.'],
    say: ['How much altogether?', 'What is my change?', 'Is it enough?', 'What if 10% off?'], tip: 'Use real shopping trips too: let your child check the change.' });
  sa({ id: 'mathsdrill', emoji: '⚡', title: 'Maths practice (10 questions)', area: 'maths', minutes: 5, grades: [1, 6], subject: 'maths',
    materials: ['Maths practice in Child tools, or a printed worksheet'],
    steps: ['Open Child tools ▸ Maths practice.', 'Your child types the answers on the number pad.', 'Look at the mistakes together and try them again.', 'The score is saved to see progress.'],
    say: ['Take your time', 'Check your answer', 'Beat yesterday\'s score!'], tip: 'Five minutes a day builds speed and confidence.' });
  sa({ id: 'kitchenfrac', emoji: '🍕', title: 'Kitchen fractions', area: 'maths', minutes: 15, grades: [2, 6], subject: 'maths',
    materials: ['Bread, plantain, an orange or a cake', 'Measuring cups'],
    steps: ['Cut food into equal parts: halves, quarters, eighths.', 'Ask: "If you eat 2 of 8 pieces, what fraction is left?"', 'Double or halve a recipe together.'],
    say: ['Equal parts', 'Half', 'Quarter', 'What fraction is left?'], tip: 'Real food makes fractions easy to see.' });
  sa({ id: 'measurehouse', emoji: '📏', title: 'Measure the house', area: 'maths', minutes: 15, grades: [1, 5], subject: 'maths',
    materials: ['A tape measure or ruler (or hand spans for Grade 1)', 'Paper'],
    steps: ['Guess first, then measure: table, door, bed.', 'Grade 3+: find the perimeter of a room.', 'Grade 4+: find the area of a mat or floor.', 'Write results in a table.'],
    say: ['Guess first', 'How long?', 'Which is longer?', 'Perimeter / area'], tip: 'Guessing first builds a sense of size.' });
  sa({ id: 'mentalkeke', emoji: '🚕', title: 'Mental maths on the road', area: 'maths', minutes: 10, grades: [1, 6], subject: 'maths',
    materials: ['Nothing: just time in the car, keke or walking'],
    steps: ['Ask quick questions at the right level.', 'Grade 1–2: "7 + 5?" Grade 3–4: "6 × 7?" Grade 5–6: "25% of 80?"', 'Let your child ask you questions too.'],
    say: ['Quick!', 'How did you work it out?'], tip: 'Ask how they worked it out: there are many good ways.' });
  sa({ id: 'wordproblem', emoji: '🧩', title: 'Word problem of the day', area: 'maths', minutes: 10, grades: [3, 6], subject: 'maths',
    materials: ['Paper and pencil'],
    steps: ['Make a problem from real life: "We need 3 bags of rice at 450 each…"', 'Read it twice. Underline the question.', 'Draw a picture or bar model.', 'Solve and check: does the answer make sense?'],
    say: ['What do we need to find?', 'Draw it', 'Does it make sense?'], tip: 'Exams use many word problems: this habit pays off.' });
  sa({ id: 'survey', emoji: '📊', title: 'Family survey and bar graph', area: 'maths', minutes: 20, grades: [2, 6], subject: 'maths',
    materials: ['Paper, ruler, coloured pencils'],
    steps: ['Ask family and friends a question: favourite food or football club.', 'Tally the answers.', 'Draw a bar graph.', 'Grade 5–6: find the mean, median and mode.'],
    say: ['Which is most popular?', 'How many more?'], tip: 'Real data is more interesting than textbook data.' });
  sa({ id: 'experiment', emoji: '🧪', title: 'Kitchen experiment', area: 'science', minutes: 20, grades: [1, 6], subject: 'science',
    materials: ['Cups, water, salt, sugar, oil, a stone, a leaf, a bottle top'],
    steps: ['Ask a question: "Which things float?" or "Does sugar dissolve faster in hot or cold water?"', 'Guess first and write the guess.', 'Test, changing only one thing.', 'Write or draw what happened, and why.'],
    say: ['What do you think?', 'Let\'s test it', 'What happened?', 'Why?'], tip: 'Use the steps your child learns in school: question, predict, test, conclude.' });
  sa({ id: 'seeddiary', emoji: '🌱', title: 'Grow a seed', area: 'science', minutes: 10, grades: [1, 4], subject: 'science',
    materials: ['Beans or maize seeds, a cup of soil, water'],
    steps: ['Plant 2–3 seeds.', 'Water a little each day.', 'Measure and draw it every 2 days in a diary.', 'Try one without light or water to compare.'],
    say: ['Root', 'Stem', 'Leaf', 'How tall now?'], tip: 'Ten days of diary entries make a great school project.' });
  sa({ id: 'naturewalk', emoji: '🔍', title: 'Nature walk notebook', area: 'science', minutes: 20, grades: [1, 6], subject: 'science',
    materials: ['Notebook and pencil'],
    steps: ['Walk around the compound or a park.', 'Find 5 living and 5 non-living things.', 'Draw one insect or plant closely.', 'Older children: group what you found (mammal, bird, insect…).'],
    say: ['Is it living?', 'How do you know?', 'What group is it?'], tip: 'Bring a magnifying glass if you have one.' });
  sa({ id: 'watercycle', emoji: '💧', title: 'Water cycle in a bag', area: 'science', minutes: 15, grades: [3, 5], subject: 'science',
    materials: ['A clear plastic bag, water, tape, a sunny window'],
    steps: ['Put a little water in the bag and seal it.', 'Tape it to a sunny window.', 'Watch over a day: drops form at the top and "rain" down.', 'Label: evaporation, condensation, precipitation.'],
    say: ['Evaporation', 'Condensation', 'Rain'], tip: 'Link it to the rainy season in Liberia or Nigeria.' });
  sa({ id: 'pulse', emoji: '❤️', title: 'Heart rate test', area: 'science', minutes: 10, grades: [4, 6], subject: 'science',
    materials: ['A watch or phone timer'],
    steps: ['Find the pulse on the wrist and count for 15 seconds × 4.', 'Jump for 1 minute, then count again.', 'Rest 2 minutes and count again.', 'Make a table and explain why it changed.'],
    say: ['Beats per minute', 'Why faster?'], tip: 'Great for learning about the heart and lungs.' });

  /* ---------- word lists ---------- */
  C.SIGHT_WORDS = {
    1: 'the a and to I is it in you he she we my me go up can see look said was for on are with they this have here come play like what do no yes big little down one two three red blue get'.split(' '),
    2: 'about after again all any ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when where which who why would your because been best both buy call does fast first found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash wish work write'.split(' '),
    3: 'always around before better bring carry clean cut done draw drink eight fall far full grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm another answer believe different enough except friend great heard important learn minute often people piece probably quite though thought through trouble usually weight'.split(' ')
  };
  C.SPELLING = {
    4: 'accident actually address answer appear believe bicycle breath build busy calendar caught centre certain circle complete consider continue decide describe different difficult disappear early earth eight enough exercise experience famous favourite February forward fruit grammar group guard guide heard heart height history imagine increase important interest island knowledge learn length library material medicine minute natural naughty notice occasion often opposite ordinary particular peculiar perhaps popular position possess possible potatoes pressure probably promise purpose quarter question recent regular reign remember sentence separate special straight strange strength suppose surprise therefore though thought through various weight woman women'.split(' '),
    5: 'accommodate accompany according achieve aggressive amateur ancient apparent appreciate attached available average awkward bargain bruise category cemetery committee communicate community competition conscience conscious controversy convenience correspond criticise curiosity definite desperate determined develop dictionary disastrous embarrass environment equip especially exaggerate excellent existence explanation familiar foreign forty frequently government guarantee harass hindrance identity immediately individual interfere interrupt language leisure lightning marvellous mischievous muscle necessary neighbour nuisance occupy occur opportunity parliament persuade physical prejudice privilege profession programme pronunciation queue recognise recommend relevant restaurant rhyme rhythm sacrifice secretary shoulder signature sincere soldier stomach sufficient suggest symbol system temperature thorough twelfth variety vegetable vehicle yacht'.split(' '),
    6: 'abbreviation absence acquaintance acquire analysis apparently argument beginning beneficial boundary business calculation characteristic colleague column commitment conscientious consequence dependent discipline efficient eighth eliminate emphasise exceed fascinate fluorescent fulfil gauge generally grateful hierarchy humorous hypocrisy independent intelligence irrelevant jewellery maintenance manoeuvre millennium miniature misspell noticeable occasionally occurrence parallel pastime perseverance phenomenon possession precede preferred questionnaire receive reference referred resistance responsibility rhythmic schedule scissors siege significant subtle successful surprise technique tendency tomorrow tongue truly unnecessary vacuum weird withhold'.split(' ')
  };

  /* ---------- food: Nigerian, and a list of foods to tap in the meal log ---------- */
  var F = C.FOOD;
  F.cuisines = [{ id: 'liberian', label: '🇱🇷 Liberian' }, { id: 'nigerian', label: '🇳🇬 Nigerian' }, { id: 'both', label: 'Both' }];
  var NG = {
    grains: ['Rice (jollof, white rice, ofada)', 'Yam (boiled, porridge/asaro), cocoyam, sweet potato', 'Plantain (boiled, roasted boli; dodo only sometimes)', 'Pap (ogi/akamu), oats, bread', 'Garri/eba, amala, semo, fufu, pounded yam (small soft pieces)', 'Corn, beans-and-corn (adalu)'],
    protein: ['Beans (ewa), moi moi, akara', 'Eggs', 'Fish (mackerel/titus, catfish, dried fish — no bones), crayfish in soups', 'Chicken, beef, goat meat (soft, small pieces); liver once a week', 'Groundnut paste, egusi in soup'],
    greens: ['Ugu (pumpkin leaves), efo/spinach, bitter leaf, waterleaf', 'Okra, ewedu, garden egg', 'Carrots, tomatoes, pumpkin, green beans'],
    fruit: ['Orange, banana, pawpaw, pineapple, mango', 'Watermelon, guava, agbalumo (in season), avocado'],
    milk: ['Milk, yogurt', 'Wara (fresh local cheese)', 'Powdered milk mixed exactly as the tin says'],
    fats: ['Red palm oil (a little in soups)', 'Egusi, groundnut paste', 'Avocado', 'Oily fish: sardines, mackerel']
  };
  F.groups.forEach(function (g) { g.foodsNG = NG[g.id]; });
  F.mealsNG = {
    breakfast: ['Pap (ogi) with milk and akara', 'Boiled yam with egg sauce (little pepper)', 'Bread, boiled egg and pawpaw', 'Moi moi with pap', 'Oats with milk and banana'],
    lunch: ['Jollof rice with chicken and vegetables', 'Beans porridge with plantain', 'Rice and tomato stew with fish and ugu', 'Yam porridge (asaro) with vegetables and fish', 'Moi moi with rice and spinach'],
    dinner: ['Eba or semo (small soft pieces) with efo riro and fish', 'Amala with ewedu and fish stew', 'Okra soup with fish and a little fufu', 'Egusi soup with spinach and rice', 'Vegetable soup (edikang ikong) with yam'],
    snacks: ['Orange, banana, pawpaw or pineapple pieces', 'Boiled egg', 'Yogurt', 'Boiled corn (cut off the cob)', 'Roasted plantain (boli)', 'Bread with groundnut paste (not whole groundnuts)', 'Akara (small, not too oily)']
  };
  F.weekNG = [
    ['Mon', 'Pap + milk + akara', 'Jollof rice + chicken + carrots', 'Pawpaw', 'Eba (small) + efo riro + fish'],
    ['Tue', 'Bread + egg + orange', 'Beans porridge + plantain', 'Yogurt', 'Rice + okra soup + fish'],
    ['Wed', 'Boiled yam + egg sauce', 'Rice + tomato stew + fish + ugu', 'Banana', 'Amala + ewedu + fish stew'],
    ['Thu', 'Oats + milk + banana', 'Yam porridge + vegetables', 'Boiled egg', 'Rice + egusi soup + spinach'],
    ['Fri', 'Moi moi + pap', 'Rice + beans + plantain', 'Pineapple', 'Vegetable soup + yam'],
    ['Sat', 'Bread + groundnut paste + milk', 'Jollof rice + fish + salad', 'Roasted plantain', 'Semo (small) + okra soup'],
    ['Sun', 'Akara + pap', 'Rice + stew + chicken + vegetables', 'Watermelon', 'Beans + corn (adalu) + avocado']
  ];
  F.ngSafety = 'Nigerian meals are often peppery: cook for the child with little pepper and stock cubes, and add pepper for adults after serving. Swallows (eba, amala, fufu) should be soft and in small pieces, with soup and protein.';
  // tap-to-add foods in the meal log: [name, groups, cuisine]
  F.items = [
    ['Rice', 'grains', 'both'], ['Bread', 'grains', 'both'], ['Plantain', 'grains', 'both'], ['Oats', 'grains', 'both'], ['Sweet potato', 'grains', 'both'],
    ['Eggs', 'protein', 'both'], ['Fish', 'protein', 'both'], ['Chicken', 'protein', 'both'], ['Beans', 'protein', 'both'], ['Groundnut paste', 'protein fats', 'both'],
    ['Banana', 'fruit', 'both'], ['Orange', 'fruit', 'both'], ['Pawpaw', 'fruit', 'both'], ['Mango', 'fruit', 'both'], ['Pineapple', 'fruit', 'both'], ['Avocado', 'fruit fats', 'both'],
    ['Milk', 'milk', 'both'], ['Yogurt', 'milk', 'both'], ['Okra', 'greens', 'both'], ['Tomato & carrots', 'greens', 'both'],
    ['Cassava', 'grains', 'liberian'], ['Eddoes', 'grains', 'liberian'], ['Fufu', 'grains', 'liberian'], ['Dumboy', 'grains', 'liberian'], ['Jollof rice', 'grains', 'both'],
    ['Potato greens', 'greens', 'liberian'], ['Cassava leaf', 'greens', 'liberian'], ['Palm butter', 'fats', 'liberian'], ['Bitter ball', 'greens', 'liberian'], ['Pumpkin', 'greens', 'both'],
    ['Pap (ogi)', 'grains', 'nigerian'], ['Yam', 'grains', 'nigerian'], ['Eba / garri', 'grains', 'nigerian'], ['Amala', 'grains', 'nigerian'], ['Semo', 'grains', 'nigerian'], ['Pounded yam', 'grains', 'nigerian'],
    ['Moi moi', 'protein', 'nigerian'], ['Akara', 'protein', 'nigerian'], ['Egusi soup', 'protein fats greens', 'nigerian'], ['Efo riro', 'greens', 'nigerian'], ['Ugu', 'greens', 'nigerian'],
    ['Ewedu', 'greens', 'nigerian'], ['Bitter leaf soup', 'greens', 'nigerian'], ['Wara', 'milk', 'nigerian'], ['Agbalumo', 'fruit', 'nigerian'], ['Crayfish', 'protein', 'nigerian'], ['Palm oil', 'fats', 'both']
  ].map(function (x) { return { n: x[0], g: x[1].split(' '), c: x[2] }; });
  C.FOOD_WORDS_NG = [{ w: 'yam', e: '🍠' }, { w: 'beans', e: '🫘' }, { w: 'pap', e: '🥣' }, { w: 'moi moi', e: '🟧' }, { w: 'akara', e: '🟤' }, { w: 'jollof', e: '🍛' }];
})();
