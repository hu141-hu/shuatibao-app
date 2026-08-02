// ==================== 数据存储层 ====================
const CURRENT_VERSION = '1.0.0';
const THEME_KEY = 'app_theme';
const LABELS = ['A', 'B', 'C', 'D'];

// 内置题目数据
const BUILTIN_QUESTIONS = [
  { id:'cs-001', category:'常识判断', difficulty:2, question:'中国最大的淡水湖是哪个？', options:['洞庭湖','鄱阳湖','太湖','洪泽湖'], answer:1, explanation:{ brief:'鄱阳湖是中国最大的淡水湖，位于江西省北部。', detailed:'鄱阳湖位于江西省北部，长江中下游南岸，面积约3150平方公里，是中国最大的淡水湖。', knowledge:'中国五大淡水湖：鄱阳湖、洞庭湖、太湖、洪泽湖、巢湖。', tips:'注意区分"最大淡水湖"和"最大湖泊"。' }},
  { id:'cs-002', category:'常识判断', difficulty:2, question:'以下哪个朝代是中国历史上存续时间最长的朝代？', options:['唐朝','宋朝','周朝','汉朝'], answer:2, explanation:{ brief:'周朝是中国历史上存续时间最长的朝代，约800年。', detailed:'周朝（约前1046年—前256年）共传30代37王，延续约800年。', knowledge:'周朝约800年、汉朝约400年、唐朝约290年、宋朝约320年。', tips:'周朝分为西周和东周。' }},
  { id:'cs-003', category:'常识判断', difficulty:3, question:'光在真空中的传播速度约为多少？', options:['3×10⁶ m/s','3×10⁸ m/s','3×10¹⁰ m/s','3×10⁵ m/s'], answer:1, explanation:{ brief:'光在真空中的传播速度约为3×10⁸ m/s。', detailed:'精确值为299,792,458 m/s，通常近似为3×10⁸ m/s。', knowledge:'光速在不同介质中不同。', tips:'注意单位是m/s而不是km/s。' }},
  { id:'cs-004', category:'常识判断', difficulty:2, question:'"四面楚歌"这个成语与以下哪位历史人物有关？', options:['刘邦','项羽','韩信','张良'], answer:1, explanation:{ brief:'"四面楚歌"与项羽有关。', detailed:'公元前202年，垓下之战，项羽被围困。', knowledge:'楚汉之争相关成语：破釜沉舟、四面楚歌、霸王别姬。', tips:'主角是被围困的项羽。' }},
  { id:'cs-005', category:'常识判断', difficulty:3, question:'以下哪种气体在地球大气中含量最高？', options:['氧气','氮气','二氧化碳','氩气'], answer:1, explanation:{ brief:'氮气约占78%。', detailed:'氮气(N₂)约78.09%、氧气(O₂)约20.95%。', knowledge:'大气层分层：对流层、平流层、中间层、热层。', tips:'氮气含量远高于氧气。' }},
  { id:'cs-006', category:'常识判断', difficulty:3, question:'世界上面积最大的沙漠是哪个？', options:['戈壁沙漠','撒哈拉沙漠','阿拉伯沙漠','卡拉哈里沙漠'], answer:1, explanation:{ brief:'撒哈拉沙漠面积约906万平方公里。', detailed:'位于非洲北部，是世界上最大的热沙漠。', knowledge:'世界主要沙漠分布。', tips:'南极洲是最大的"冷沙漠"。' }},
  { id:'lr-001', category:'逻辑推理', difficulty:3, question:'所有程序员都会编程。小明会编程。以下哪项一定为真？', options:['小明是程序员','小明不是程序员','有些会编程的人是程序员','以上都不一定为真'], answer:2, explanation:{ brief:'可推出"有些会编程的人是程序员"。', detailed:'全称肯定命题的换位推理。', knowledge:'三段论推理规则。', tips:'"所有A都是B"不能推出"所有B都是A"。' }},
  { id:'lr-002', category:'逻辑推理', difficulty:3, question:'甲说："乙在说谎。"乙说："丙在说谎。"丙说："甲和乙都在说谎。"请问谁在说真话？', options:['甲','乙','丙','无法判断'], answer:1, explanation:{ brief:'乙在说真话。', detailed:'通过假设法逐一验证。', knowledge:'假设法、排除法、矛盾法。', tips:'逐一假设检验。' }},
  { id:'lr-003', category:'逻辑推理', difficulty:2, question:'如果下雨，那么地面是湿的。现在地面是干的。可以推出什么结论？', options:['没有下雨','下雨了','地面可能湿也可能干','无法确定'], answer:0, explanation:{ brief:'逆否命题，没有下雨。', detailed:'原命题与逆否命题等价。', knowledge:'命题逻辑四种形式。', tips:'逆否命题等价。' }},
  { id:'lr-004', category:'逻辑推理', difficulty:4, question:'5个人排队，已知：①甲在乙前面；②丙在丁后面；③戊在甲后面、乙前面。请问排在第三位的是谁？', options:['甲','乙','戊','丙'], answer:2, explanation:{ brief:'第三位是戊。', detailed:'顺序为：甲、乙、戊、丁、丙。', knowledge:'排列组合逻辑题技巧。', tips:'注意相对位置关系。' }},
  { id:'lr-005', category:'逻辑推理', difficulty:3, question:'一个骰子掷一次，已知掷出的是偶数，那么掷出6的概率是多少？', options:['1/6','1/3','1/2','2/3'], answer:1, explanation:{ brief:'条件概率，1/3。', detailed:'偶数有{2,4,6}三种，6占1/3。', knowledge:'条件概率公式。', tips:'样本空间缩小。' }},
  { id:'lr-006', category:'逻辑推理', difficulty:2, question:'找规律：2, 6, 12, 20, 30, ?', options:['40','42','44','48'], answer:1, explanation:{ brief:'下一项为42。', detailed:'相邻差为4,6,8,10,12。', knowledge:'数字推理常见规律。', tips:'先看相邻差。' }},
  { id:'yr-001', category:'言语理解', difficulty:2, question:'依次填入下列横线处的词语，最恰当的一组是：\n他______地走进了考场，脸上带着______的微笑。', options:['从容 自信','慌张 勉强','匆忙 苦涩','紧张 尴尬'], answer:0, explanation:{ brief:'"从容"与"自信"搭配最协调。', detailed:'语义正向搭配。', knowledge:'词语搭配注意语义一致性。', tips:'先看整体情感色彩。' }},
  { id:'yr-002', category:'言语理解', difficulty:3, question:'以下句子中，"破釜沉舟"使用正确的是：', options:['他破釜沉舟地准备了这次考试','公司决定破釜沉舟，投入全部资金研发新产品','他破釜沉舟，每天都坚持锻炼','她破釜沉舟地选择了这条道路'], answer:1, explanation:{ brief:'B选项体现孤注一掷的决心。', detailed:'用于重大决策场景。', knowledge:'破釜沉舟vs孤注一掷vs背水一战。', tips:'日常小事使用会显得夸张。' }},
  { id:'yr-003', category:'言语理解', difficulty:3, question:'将以下句子排列成语意连贯的一段话，正确的顺序是：\n①因此，我们应该重视阅读\n②阅读可以开阔视野\n③读书使人明智\n④同时也能提升个人素养', options:['③②④①','②③①④','①③②④','③①②④'], answer:0, explanation:{ brief:'正确顺序为③②④①。', detailed:'从引出话题到论述再到总结。', knowledge:'语句排序题技巧。', tips:'"因此"通常用在末尾。' }},
  { id:'yr-004', category:'言语理解', difficulty:2, question:'"未雨绸缪"的近义词是：', options:['亡羊补牢','防患未然','临渴掘井','事后诸葛'], answer:1, explanation:{ brief:'"防患未然"与"未雨绸缪"都表示事先准备。', detailed:'两者都强调提前预防。', knowledge:'事先准备类成语。', tips:'注意近义反义区分。' }},
  { id:'yr-005', category:'言语理解', difficulty:3, question:'以下句子没有语病的一项是：', options:['通过这次学习，使我的认识水平有了很大提高','能否坚持锻炼，是身体健康的重要保证','我们要养成认真审题的好习惯','这篇文章的内容和形式都很新颖'], answer:2, explanation:{ brief:'C句表述完整，没有语病。', detailed:'A缺主语，B前后不对应，D搭配不当。', knowledge:'常见语病类型。', tips:'"通过…使…"导致主语缺失。' }},
  { id:'yr-006', category:'言语理解', difficulty:3, question:'"不刊之论"中的"刊"是什么意思？', options:['刊登','削除、修改','出版','印刷'], answer:1, explanation:{ brief:'"刊"是削除、修改的意思。', detailed:'形容言论正确、不可更改。', knowledge:'常见易误解成语。', tips:'"不刊之论"是褒义词！' }},
  { id:'sl-001', category:'数量关系', difficulty:2, question:'一个水池，单独开A管8小时注满，单独开B管12小时注满。两管同时开，几小时注满？', options:['4小时','4.8小时','5小时','6小时'], answer:1, explanation:{ brief:'合计效率5/24，需4.8小时。', detailed:'1/8+1/12=5/24，1÷5/24=4.8。', knowledge:'工程问题基本公式。', tips:'设总量为最小公倍数更方便。' }},
  { id:'sl-002', category:'数量关系', difficulty:3, question:'甲乙两人同时从A地出发去B地，甲的速度是乙的1.5倍。甲到达B地后立即返回，在距B地30公里处与乙相遇。A、B两地相距多少公里？', options:['120公里','150公里','180公里','200公里'], answer:1, explanation:{ brief:'AB距离150公里。', detailed:'(S+30)/(S-30)=3/2，S=150。', knowledge:'行程问题核心公式。', tips:'画图分析。' }},
  { id:'sl-003', category:'数量关系', difficulty:2, question:'一件商品先涨价20%，再降价20%，最终价格比原价：', options:['不变','低了4%','高了4%','低了2%'], answer:1, explanation:{ brief:'低了4%。', detailed:'100→120→96。', knowledge:'百分比增减计算。', tips:'经典陷阱题！' }},
  { id:'sl-004', category:'数量关系', difficulty:3, question:'一个三位数，百位上的数字是个位上数字的2倍，十位上的数字比百位上的数字小1。如果百位与个位数字对调，所得的三位数比原数小198，原来的三位数是：', options:['432','531','421','632'], answer:0, explanation:{ brief:'原数432。', detailed:'99a=198，a=2。', knowledge:'数字问题设元技巧。', tips:'对调的是百位和个位。' }},
  { id:'sl-005', category:'数量关系', difficulty:4, question:'有5个不同的正整数，平均数是15，中位数是14，最大数最大可以是多少？', options:['39','40','41','42'], answer:2, explanation:{ brief:'最大数最大为41。', detailed:'总和75，其他尽量小。', knowledge:'极值问题思路。', tips:'注意"不同正整数"约束。' }},
  { id:'sl-006', category:'数量关系', difficulty:3, question:'一根绳子对折3次后剪一刀，展开后绳子被剪成了几段？', options:['5段','7段','9段','11段'], answer:2, explanation:{ brief:'对折3次=8层，剪一刀=9段。', detailed:'2³=8层，8+1=9段。', knowledge:'对折问题公式。', tips:'实际操作验证。' }},
];

const DEFAULT_CATEGORIES = [
  { id:'cat-chapter-cs', name:'常识判断', parentId:null, level:'chapter', order:0, questionIds:['cs-001','cs-002','cs-003','cs-004','cs-005','cs-006'] },
  { id:'cat-chapter-lr', name:'逻辑推理', parentId:null, level:'chapter', order:1, questionIds:['lr-001','lr-002','lr-003','lr-004','lr-005','lr-006'] },
  { id:'cat-chapter-yr', name:'言语理解', parentId:null, level:'chapter', order:2, questionIds:['yr-001','yr-002','yr-003','yr-004','yr-005','yr-006'] },
  { id:'cat-chapter-sl', name:'数量关系', parentId:null, level:'chapter', order:3, questionIds:['sl-001','sl-002','sl-003','sl-004','sl-005','sl-006'] },
];

const CATEGORY_ICONS = { '常识判断':'🌍', '逻辑推理':'🧩', '言语理解':'📝', '数量关系':'🔢' };

// === Storage 工具 ===
function loadJSON(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
function saveJSON(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }
function getToday() { return new Date().toISOString().split('T')[0]; }

// === 全局状态 ===
let state = {
  currentUser: null,
  progress: null,
  wrongQuestions: [],
  confusedQuestions: [],
  importedBanks: [],
  importedQuestions: [],
  customQuestions: [],
  categoryHierarchy: [],
  favoriteIds: [],
  practiceHistory: [],
  theme: 'light',
};

function userKey(suffix) { return `${state.currentUser.id}_${suffix}`; }

function initState() {
  // 主题
  const storedTheme = localStorage.getItem(THEME_KEY);
  state.theme = storedTheme || 'light';
  applyTheme();

  // 用户
  let accounts = loadJSON('accounts_list', []);
  if (accounts.length === 0) {
    accounts = [{ id: 'default_user', nickname: '刷题达人', avatar: 'fox', createdAt: new Date().toISOString() }];
    saveJSON('accounts_list', accounts);
  }
  const currentId = localStorage.getItem('current_user_id');
  state.currentUser = accounts.find(a => a.id === currentId) || accounts[0];
  localStorage.setItem('current_user_id', state.currentUser.id);

  loadUserData();
}

function loadUserData() {
  const uid = state.currentUser.id;
  const stored = loadJSON(`${uid}_progress`, null);
  const today = getToday();
  const todayStats = stored?.dailyStats?.[today];
  state.progress = {
    dailyGoal: stored?.dailyGoal || 20,
    todayCount: todayStats?.count || 0,
    todayCorrect: todayStats?.correct || 0,
    totalCount: stored?.totalCount || 0,
    totalCorrect: stored?.totalCorrect || 0,
    streak: stored?.streak || 0,
    lastStudyDate: stored?.lastStudyDate || '',
    wrongQuestionIds: stored?.wrongQuestionIds || [],
    favoriteIds: stored?.favoriteIds || [],
    notes: stored?.notes || [],
    nickname: stored?.nickname || state.currentUser.nickname,
    dailyStats: stored?.dailyStats || {},
  };
  state.favoriteIds = state.progress.favoriteIds;
  state.wrongQuestions = loadJSON(`${uid}_wrongQuestions`, []);
  state.confusedQuestions = loadJSON(`${uid}_confusedQuestions`, []);
  state.importedBanks = loadJSON(`${uid}_importedBanks`, []);
  state.importedQuestions = loadJSON(`${uid}_importedQuestions`, []);
  state.customQuestions = loadJSON(`${uid}_customQuestions`, []);
  state.practiceHistory = loadJSON(`${uid}_practiceHistory`, []);
  const cats = loadJSON(`${uid}_categoryHierarchy`, null);
  state.categoryHierarchy = (cats && cats.length > 0) ? cats : [...DEFAULT_CATEGORIES];
}

function saveProgress() { saveJSON(userKey('progress'), state.progress); }
function saveWrongQuestions() { saveJSON(userKey('wrongQuestions'), state.wrongQuestions); }
function saveImported() { saveJSON(userKey('importedBanks'), state.importedBanks); saveJSON(userKey('importedQuestions'), state.importedQuestions); }
function saveCategories() { saveJSON(userKey('categoryHierarchy'), state.categoryHierarchy); }
function savePracticeHistory() { saveJSON(userKey('practiceHistory'), state.practiceHistory); }

function getAllQuestions() {
  const normalize = q => ({ ...q, category: q.category || '未分类', explanation: q.explanation || { brief:'', detailed:'', knowledge:'', tips:'' } });
  return [...BUILTIN_QUESTIONS, ...state.importedQuestions.map(normalize), ...state.customQuestions.map(normalize)];
}

function recordAnswer(questionId, isCorrect) {
  const today = getToday();
  const ds = { ...state.progress.dailyStats };
  const ts = ds[today] || { count: 0, correct: 0 };
  ts.count++; if (isCorrect) ts.correct++;
  ds[today] = ts;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let streak = state.progress.streak;
  if (state.progress.lastStudyDate !== today) {
    streak = state.progress.lastStudyDate === yesterday ? streak + 1 : 1;
  }
  const wrongIds = isCorrect ? state.progress.wrongQuestionIds.filter(id => id !== questionId) : [...new Set([...state.progress.wrongQuestionIds, questionId])];
  state.progress = { ...state.progress, todayCount: ts.count, todayCorrect: ts.correct, totalCount: state.progress.totalCount + 1, totalCorrect: state.progress.totalCorrect + (isCorrect ? 1 : 0), streak, lastStudyDate: today, wrongQuestionIds: wrongIds, dailyStats: ds };
  saveProgress();
}

function addWrongQuestion(questionId) {
  const existing = state.wrongQuestions.find(w => w.questionId === questionId);
  if (existing) { existing.wrongCount++; existing.lastWrongAt = new Date().toISOString(); }
  else { state.wrongQuestions.push({ questionId, wrongCount: 1, lastWrongAt: new Date().toISOString(), correctOnRetry: 0 }); }
  saveWrongQuestions();
}

function toggleFavorite(questionId) {
  if (state.progress.favoriteIds.includes(questionId)) {
    state.progress.favoriteIds = state.progress.favoriteIds.filter(id => id !== questionId);
  } else {
    state.progress.favoriteIds.push(questionId);
  }
  state.favoriteIds = state.progress.favoriteIds;
  saveProgress();
}

function toggleConfused(questionId) {
  if (state.confusedQuestions.includes(questionId)) {
    state.confusedQuestions = state.confusedQuestions.filter(id => id !== questionId);
  } else {
    state.confusedQuestions.push(questionId);
  }
  saveJSON(userKey('confusedQuestions'), state.confusedQuestions);
}

function addPracticeRecord(record) { state.practiceHistory.push(record); savePracticeHistory(); }

// === 主题 ===
function applyTheme() {
  document.documentElement.classList.toggle('dark', state.theme === 'dark');
}
function setTheme(t) { state.theme = t; localStorage.setItem(THEME_KEY, t); applyTheme(); }
function toggleTheme() { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }

// === 路由 ===
let currentPage = 'home';
let pageParams = {};

function navigate(page, params = {}) {
  currentPage = page;
  pageParams = params;
  renderPage();
  updateNav();
  window.scrollTo(0, 0);
}

function updateNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === currentPage);
  });
}

function renderPage() {
  const el = document.getElementById('page-content');
  switch (currentPage) {
    case 'home': el.innerHTML = renderHome(); break;
    case 'quiz': el.innerHTML = renderQuiz(); break;
    case 'study': el.innerHTML = renderStudy(); break;
    case 'wrong': el.innerHTML = renderWrong(); break;
    case 'profile': el.innerHTML = renderProfile(); break;
    case 'favorites': el.innerHTML = renderFavorites(); break;
    case 'result': el.innerHTML = renderResult(); break;
    default: el.innerHTML = renderHome();
  }
}

// ==================== 页面渲染 ====================
function renderHome() {
  const p = state.progress;
  const dailyProgress = p.dailyGoal > 0 ? p.todayCount / p.dailyGoal : 0;
  const chapters = state.categoryHierarchy.filter(c => c.level === 'chapter' && c.parentId === null).sort((a, b) => a.order - b.order);
  const allQ = getAllQuestions();
  const pendingReview = new Set([...state.wrongQuestions.map(w => w.questionId), ...state.confusedQuestions]).size;
  const accuracy = p.totalCount > 0 ? Math.round((p.totalCorrect / p.totalCount) * 100) : 0;

  let html = '';
  // 搜索栏 + 主题切换
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
    <div class="search-bar" onclick="navigate('quiz')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span>搜索题目...</span></div>
    <button class="theme-toggle" onclick="toggleTheme();renderPage();">${state.theme === 'dark' ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>'}</button>
  </div>`;

  // 问候
  html += `<div class="greeting"><div><h1>Hi，${state.currentUser.nickname} 👋</h1><p>今天也要加油哦！</p></div>
    <div class="streak-badge"><span class="animate-flame">🔥</span><span class="num">${p.streak}</span><span style="font-size:12px;color:var(--amber)">天</span></div></div>`;

  // 复习提醒
  if (pendingReview > 0) {
    html += `<div class="review-banner" onclick="navigate('wrong')"><div class="inner"><div class="icon">📅</div><div><h3>今日复习提醒</h3><p>${state.wrongQuestions.length} 道错题${state.confusedQuestions.length > 0 ? ' + ' + state.confusedQuestions.length + ' 道不会的题' : ''} 待复习</p></div><span style="margin-left:auto;opacity:0.6;font-size:20px;">→</span></div></div>`;
  }

  // 今日进度
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - Math.min(dailyProgress, 1));
  html += `<div class="card" style="margin-bottom:16px;"><div class="daily-progress">
    <div class="progress-ring"><svg width="100" height="100"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="var(--emerald)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg>
    <div class="ring-text"><span class="ring-num">${p.todayCount}</span><span class="ring-sub">/ ${p.dailyGoal} 题</span></div></div>
    <div style="flex:1"><h2 style="font-size:16px;font-weight:600;">今日刷题进度</h2>
    <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${dailyProgress >= 1 ? '🎉 今日目标已达成！' : `还差 ${p.dailyGoal - p.todayCount} 题完成目标`}</p>
    <div class="progress-bar" style="margin-top:8px;"><div class="progress-bar-fill" style="width:${Math.min(dailyProgress * 100, 100)}%;background:linear-gradient(90deg,#34d399,#059669);"></div></div></div></div></div>`;

  // 入口按钮
  html += `<div class="entry-grid">
    <button class="entry-btn entry-quiz" onclick="navigate('quiz')"><span class="icon">⚡</span><span class="label">刷题模式</span><span class="sub">限时挑战</span></button>
    <button class="entry-btn entry-study" onclick="navigate('study')"><span class="icon">📖</span><span class="label">学习模式</span><span class="sub">深度学习</span></button>
    <button class="entry-btn entry-import" onclick="showImportModal()"><span class="icon">📥</span><span class="label">导入题库</span><span class="sub">MD 文件</span></button>
  </div>
  <p style="font-size:12px;color:var(--text-muted);text-align:center;margin:-8px 0 16px;">支持 MD 文件导入</p>`;

  // 题库分类
  html += `<h2 class="section-title">题库分类</h2><div>`;
  chapters.forEach(ch => {
    const sections = state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === ch.id).sort((a, b) => a.order - b.order);
    const totalQ = ch.questionIds.length + sections.reduce((s, sec) => s + sec.questionIds.length, 0);
    const icon = CATEGORY_ICONS[ch.name] || '📚';
    html += `<div class="chapter-card card card-hover"><div class="color-bar" style="background:var(--emerald);"></div>
      <div class="inner" onclick="${sections.length > 0 ? `toggleChapter('${ch.id}')` : `startQuizWithCategory('${ch.id}')`}">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div><h3>${ch.name}</h3><p class="meta">${totalQ} 道题${sections.length > 0 ? ` · ${sections.length} 个节` : ''}</p></div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">${icon}</span>
          ${sections.length > 0 ? `<svg class="arrow" id="arrow-${ch.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>` : ''}</div>
        </div></div></div>
      <div id="sections-${ch.id}" style="display:none;" class="animate-fade-in">`;
    sections.forEach(sec => {
      html += `<div class="section-item"><div class="inner" onclick="startQuizWithCategory('${sec.id}')"><div class="color-bar"></div><div style="display:flex;align-items:center;justify-content:space-between;"><div><h4>${sec.name}</h4><p class="meta">${sec.questionIds.length} 道题</p></div><span style="color:var(--blue);">→</span></div></div></div>`;
    });
    if (ch.questionIds.length > 0 && sections.length > 0) {
      html += `<div class="section-item"><div class="inner" onclick="startQuizWithCategory('${ch.id}')"><div class="color-bar" style="background:var(--emerald);"></div><div style="display:flex;align-items:center;justify-content:space-between;"><div><h4 style="color:var(--emerald);">章级题目</h4><p class="meta">${ch.questionIds.length} 道题</p></div><span style="color:var(--emerald);">→</span></div></div></div>`;
    }
    html += `</div>`;
  });
  html += `</div>`;

  // 快速统计
  html += `<div class="stats-grid">
    <div class="card stat-card"><p class="num" style="color:var(--emerald);">${p.totalCount}</p><p class="label">总刷题</p></div>
    <div class="card stat-card"><p class="num" style="color:var(--blue);">${accuracy}%</p><p class="label">正确率</p></div>
    <div class="card stat-card"><p class="num" style="color:var(--red);">${state.wrongQuestions.length}</p><p class="label">错题数</p></div>
  </div>`;
  return html;
}

function toggleChapter(chId) {
  const el = document.getElementById(`sections-${chId}`);
  const arrow = document.getElementById(`arrow-${chId}`);
  if (el.style.display === 'none') { el.style.display = 'block'; if (arrow) arrow.classList.add('expanded'); }
  else { el.style.display = 'none'; if (arrow) arrow.classList.remove('expanded'); }
}

// ==================== 刷题模式 ====================
let quizState = { questions: [], currentIndex: 0, selectedAnswer: null, showResult: false, results: [], startTime: 0, questionStartTime: 0, selectedChapterId: null };

function startQuizWithCategory(catId) {
  const qs = getQuestionsByCategoryId(catId);
  if (qs.length === 0) { alert('该分类暂无题目'); return; }
  quizState = { questions: qs, currentIndex: 0, selectedAnswer: null, showResult: false, results: [], startTime: Date.now(), questionStartTime: Date.now(), selectedChapterId: catId };
  currentPage = 'quiz';
  pageParams = { started: true };
  renderPage();
  updateNav();
}

function getQuestionsByCategoryId(catId) {
  const cat = state.categoryHierarchy.find(c => c.id === catId);
  if (!cat) return [];
  const ids = new Set(cat.questionIds);
  if (cat.level === 'chapter') {
    state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === catId).forEach(s => s.questionIds.forEach(id => ids.add(id)));
  }
  return getAllQuestions().filter(q => ids.has(q.id));
}

function renderQuiz() {
  if (pageParams.started && quizState.questions.length > 0) return renderQuizQuestion();
  // 章选择界面
  const chapters = state.categoryHierarchy.filter(c => c.level === 'chapter' && c.parentId === null).sort((a, b) => a.order - b.order);
  const allQ = getAllQuestions();
  let html = `<h1 style="font-size:20px;font-weight:700;margin-bottom:4px;">⚡ 刷题模式</h1><p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">选择一个分类开始刷题</p><div>`;
  chapters.forEach(ch => {
    const sections = state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === ch.id);
    const totalQ = ch.questionIds.length + sections.reduce((s, sec) => s + sec.questionIds.length, 0);
    html += `<div class="card card-hover" style="margin-bottom:12px;cursor:pointer;" onclick="selectQuizChapter('${ch.id}')"><div style="display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-size:15px;font-weight:600;">${ch.name}</h3><p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${totalQ} 道题${sections.length > 0 ? ` · ${sections.length} 个节` : ''}</p></div><span style="color:var(--emerald);font-size:20px;">→</span></div></div>`;
  });
  html += `<div class="card" style="background:linear-gradient(135deg,var(--emerald),#059669);color:white;cursor:pointer;margin-bottom:12px;" onclick="startRandomQuiz()"><h3 style="font-size:15px;font-weight:600;">🎯 随机刷题</h3><p style="font-size:12px;opacity:0.8;margin-top:2px;">全部 ${allQ.length} 道题随机</p></div></div>`;
  return html;
}

function selectQuizChapter(chId) {
  const sections = state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === chId).sort((a, b) => a.order - b.order);
  if (sections.length === 0) { startQuizWithCategory(chId); return; }
  // 显示节选择
  const ch = state.categoryHierarchy.find(c => c.id === chId);
  let html = `<div class="quiz-header"><button class="back-btn" onclick="navigate('quiz')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button><h1 style="font-size:18px;font-weight:700;">${ch ? ch.name : '选择节'}</h1></div>`;
  html += `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">选择一个节开始刷题</p><div>`;
  sections.forEach(sec => {
    html += `<div class="card card-hover" style="margin-bottom:10px;cursor:pointer;" onclick="startQuizWithCategory('${sec.id}')"><div style="display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-size:14px;font-weight:500;">${sec.name}</h3><p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${sec.questionIds.length} 道题</p></div><span style="color:var(--blue);font-size:20px;">→</span></div></div>`;
  });
  const totalInCh = getQuestionsByCategoryId(chId).length;
  html += `<div class="card" style="background:linear-gradient(135deg,var(--emerald),#059669);color:white;cursor:pointer;" onclick="startQuizWithCategory('${chId}')"><h3 style="font-size:15px;font-weight:600;">📚 刷本章全部题目</h3><p style="font-size:12px;opacity:0.8;margin-top:2px;">共 ${totalInCh} 道题</p></div></div>`;
  document.getElementById('page-content').innerHTML = html;
}

function startRandomQuiz() {
  const allQ = [...getAllQuestions()].sort(() => Math.random() - 0.5);
  quizState = { questions: allQ, currentIndex: 0, selectedAnswer: null, showResult: false, results: [], startTime: Date.now(), questionStartTime: Date.now(), selectedChapterId: '全部' };
  currentPage = 'quiz'; pageParams = { started: true };
  renderPage(); updateNav();
}

function renderQuizQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  const total = quizState.questions.length;
  const idx = quizState.currentIndex;
  const progress = ((idx + 1) / total) * 100;
  const isConfused = state.confusedQuestions.includes(q.id);
  const isFav = state.progress.favoriteIds.includes(q.id);

  let html = `<div class="quiz-header"><button class="back-btn" onclick="exitQuiz()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
    <div class="quiz-progress"><div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%;background:var(--emerald);"></div></div></div>
    <span class="quiz-count">${idx + 1}/${total}</span></div>`;

  // 题目卡片
  html += `<div class="card question-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div class="q-category">${q.category}</div>
    <div style="display:flex;gap:4px;">
      <button onclick="toggleFav('${q.id}')" style="width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:${isFav ? 'var(--amber-light)' : 'var(--bg-input)'};">${isFav ? '⭐' : '☆'}</button>
      <button onclick="markConfused('${q.id}')" style="width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:${isConfused ? 'var(--amber)' : 'var(--bg-input)'};color:${isConfused ? 'white' : 'var(--text-muted)'};">?</button>
    </div></div>
    <p class="q-text">${escapeHtml(q.question)}</p>
    <p class="q-difficulty">难度：${'★'.repeat(q.difficulty)}${'☆'.repeat(5 - q.difficulty)}</p></div>`;

  // 选项
  html += `<div>`;
  q.options.forEach((opt, i) => {
    let cls = 'option-btn';
    if (quizState.showResult) {
      if (i === q.answer) cls += ' correct';
      else if (i === quizState.selectedAnswer && i !== q.answer) cls += ' wrong';
    }
    html += `<button class="${cls}" ${quizState.showResult ? 'disabled' : ''} onclick="selectQuizAnswer(${i})"><span class="opt-label">${LABELS[i]}</span><span class="opt-text">${escapeHtml(opt)}</span></button>`;
  });
  html += `</div>`;

  // 解析
  if (quizState.showResult) {
    const isCorrect = quizState.selectedAnswer === q.answer;
    html += `<div class="explanation-panel ${isCorrect ? 'correct-bg' : 'wrong-bg'}"><div class="result-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="correct-answer">正确答案：${LABELS[q.answer]}. ${escapeHtml(q.options[q.answer])}</div>
      <div class="exp-text">${escapeHtml(q.explanation.brief)}</div></div>`;
    html += `<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="nextQuizQuestion()">${idx < total - 1 ? '下一题 →' : '查看结果 🎉'}</button>`;
  }
  return html;
}

function selectQuizAnswer(idx) {
  if (quizState.showResult) return;
  quizState.selectedAnswer = idx;
  quizState.showResult = true;
  const q = quizState.questions[quizState.currentIndex];
  const isCorrect = idx === q.answer;
  quizState.results.push({ questionId: q.id, selected: idx, isCorrect });
  recordAnswer(q.id, isCorrect);
  addPracticeRecord({ id: `pr-${Date.now()}`, date: getToday(), questionId: q.id, userAnswer: idx, correctAnswer: q.answer, isCorrect, timeSpent: Math.floor((Date.now() - quizState.questionStartTime) / 1000), mode: 'quiz', category: q.category });
  if (!isCorrect) addWrongQuestion(q.id);
  renderPage();
}

function nextQuizQuestion() {
  if (quizState.currentIndex < quizState.questions.length - 1) {
    quizState.currentIndex++;
    quizState.selectedAnswer = null;
    quizState.showResult = false;
    quizState.questionStartTime = Date.now();
    renderPage();
  } else {
    const timeSpent = Math.floor((Date.now() - quizState.startTime) / 1000);
    const correct = quizState.results.filter(r => r.isCorrect).length;
    pageParams = { total: quizState.questions.length, correct, wrong: quizState.results.length - correct, time: timeSpent };
    currentPage = 'result';
    renderPage();
  }
}

function exitQuiz() { quizState.questions = []; pageParams = {}; currentPage = 'quiz'; renderPage(); }

function toggleFav(qId) { toggleFavorite(qId); renderPage(); }
function markConfused(qId) { toggleConfused(qId); renderPage(); }

// ==================== 学习模式 ====================
let studyState = { questions: [], currentIndex: 0, selectedAnswer: null, answered: false, showExplanation: false, questionStartTime: 0 };

function startStudyWithCategory(catId) {
  const qs = getQuestionsByCategoryId(catId);
  if (qs.length === 0) { alert('该分类暂无题目'); return; }
  studyState = { questions: qs, currentIndex: 0, selectedAnswer: null, answered: false, showExplanation: false, questionStartTime: Date.now() };
  currentPage = 'study'; pageParams = { started: true };
  renderPage(); updateNav();
}

function renderStudy() {
  if (pageParams.started && studyState.questions.length > 0) return renderStudyQuestion();
  const chapters = state.categoryHierarchy.filter(c => c.level === 'chapter' && c.parentId === null).sort((a, b) => a.order - b.order);
  let html = `<h1 style="font-size:20px;font-weight:700;margin-bottom:4px;">📖 学习模式</h1><p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">选择一个分类开始深度学习</p><div>`;
  chapters.forEach(ch => {
    const sections = state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === ch.id);
    const totalQ = ch.questionIds.length + sections.reduce((s, sec) => s + sec.questionIds.length, 0);
    html += `<div class="card card-hover" style="margin-bottom:12px;cursor:pointer;" onclick="selectStudyChapter('${ch.id}')"><div style="display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-size:15px;font-weight:600;">${ch.name}</h3><p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${totalQ} 道题 · 含详细解析</p></div><span style="color:var(--blue);font-size:20px;">→</span></div></div>`;
  });
  html += `</div>`;
  return html;
}

function selectStudyChapter(chId) {
  const sections = state.categoryHierarchy.filter(c => c.level === 'section' && c.parentId === chId).sort((a, b) => a.order - b.order);
  if (sections.length === 0) { startStudyWithCategory(chId); return; }
  const ch = state.categoryHierarchy.find(c => c.id === chId);
  let html = `<div class="quiz-header"><button class="back-btn" onclick="navigate('study')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button><h1 style="font-size:18px;font-weight:700;">${ch ? ch.name : '选择节'}</h1></div>`;
  html += `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;">选择一个节开始学习</p><div>`;
  sections.forEach(sec => {
    html += `<div class="card card-hover" style="margin-bottom:10px;cursor:pointer;" onclick="startStudyWithCategory('${sec.id}')"><div style="display:flex;align-items:center;justify-content:space-between;"><div><h3 style="font-size:14px;font-weight:500;">${sec.name}</h3><p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${sec.questionIds.length} 道题 · 含详细解析</p></div><span style="color:var(--blue);font-size:20px;">→</span></div></div>`;
  });
  html += `<div class="card" style="background:linear-gradient(135deg,var(--blue),#2563eb);color:white;cursor:pointer;" onclick="startStudyWithCategory('${chId}')"><h3 style="font-size:15px;font-weight:600;">📚 学习本章全部题目</h3><p style="font-size:12px;opacity:0.8;margin-top:2px;">共 ${getQuestionsByCategoryId(chId).length} 道题</p></div></div>`;
  document.getElementById('page-content').innerHTML = html;
}

function renderStudyQuestion() {
  const q = studyState.questions[studyState.currentIndex];
  const total = studyState.questions.length;
  const idx = studyState.currentIndex;
  const progress = ((idx + 1) / total) * 100;
  const isFav = state.progress.favoriteIds.includes(q.id);
  const isConfused = state.confusedQuestions.includes(q.id);

  let html = `<div class="quiz-header"><button class="back-btn" onclick="exitStudy()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
    <div class="quiz-progress"><div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%;background:var(--blue);"></div></div></div>
    <span class="quiz-count">${idx + 1}/${total}</span>
    <button onclick="toggleFavStudy('${q.id}')" style="width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;background:${isFav ? 'var(--amber-light)' : 'var(--bg-input)'};">${isFav ? '⭐' : '☆'}</button></div>`;

  html += `<div class="card question-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div class="q-category" style="color:var(--blue);">${q.category}</div>
    <button onclick="markConfusedStudy('${q.id}')" style="width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;background:${isConfused ? 'var(--amber)' : 'var(--bg-input)'};color:${isConfused ? 'white' : 'var(--text-muted)'};">?</button></div>
    <p class="q-text">${escapeHtml(q.question)}</p></div>`;

  html += `<div>`;
  q.options.forEach((opt, i) => {
    let cls = 'option-btn';
    if (studyState.answered) {
      if (i === q.answer) cls += ' correct';
      else if (i === studyState.selectedAnswer && i !== q.answer) cls += ' wrong';
    }
    html += `<button class="${cls}" ${studyState.answered ? 'disabled' : ''} onclick="selectStudyAnswer(${i})"><span class="opt-label">${LABELS[i]}</span><span class="opt-text">${escapeHtml(opt)}</span></button>`;
  });
  html += `</div>`;

  if (!studyState.showExplanation) {
    html += `<button class="btn btn-block" style="background:var(--blue-light);color:var(--blue);border:2px solid rgba(59,130,246,0.3);margin-top:8px;" onclick="showStudyExplanation()">👀 查看解析</button>`;
  }

  if (studyState.showExplanation) {
    const isCorrect = studyState.selectedAnswer !== null && studyState.selectedAnswer === q.answer;
    html += `<div class="explanation-panel ${isCorrect ? 'correct-bg' : 'wrong-bg'}"><div class="result-icon">${studyState.selectedAnswer !== null ? (isCorrect ? '✅' : '❌') : '📖'}</div>
      <div class="correct-answer">正确答案：${LABELS[q.answer]}. ${escapeHtml(q.options[q.answer])}</div>
      <div class="exp-text">${escapeHtml(q.explanation.detailed || q.explanation.brief)}</div>`;
    if (q.explanation.knowledge) html += `<div class="exp-section"><div class="exp-label">📚 知识点</div><div class="exp-text">${escapeHtml(q.explanation.knowledge)}</div></div>`;
    if (q.explanation.tips) html += `<div class="exp-section"><div class="exp-label">💡 易错提示</div><div class="exp-text">${escapeHtml(q.explanation.tips)}</div></div>`;
    html += `</div>`;
  }

  // 导航按钮
  html += `<div class="action-btns"><button class="btn btn-outline" ${idx === 0 ? 'disabled' : ''} onclick="prevStudyQuestion()">← 上一题</button>
    <button class="btn btn-blue" ${idx === total - 1 ? 'disabled' : ''} onclick="nextStudyQuestion()">下一题 →</button></div>`;
  if (idx === total - 1) html += `<div style="text-align:center;padding:16px 0;"><p style="font-size:14px;color:var(--text-secondary);">🎉 已到最后一题！</p></div>`;
  return html;
}

function selectStudyAnswer(idx) {
  if (studyState.answered) return;
  studyState.selectedAnswer = idx;
  studyState.answered = true;
  studyState.showExplanation = true;
  const q = studyState.questions[studyState.currentIndex];
  const isCorrect = idx === q.answer;
  recordAnswer(q.id, isCorrect);
  addPracticeRecord({ id: `pr-${Date.now()}`, date: getToday(), questionId: q.id, userAnswer: idx, correctAnswer: q.answer, isCorrect, timeSpent: Math.floor((Date.now() - studyState.questionStartTime) / 1000), mode: 'study', category: q.category });
  if (!isCorrect) addWrongQuestion(q.id);
  renderPage();
}

function showStudyExplanation() { studyState.showExplanation = true; studyState.answered = true; renderPage(); }
function prevStudyQuestion() { if (studyState.currentIndex > 0) { studyState.currentIndex--; studyState.selectedAnswer = null; studyState.answered = false; studyState.showExplanation = false; studyState.questionStartTime = Date.now(); renderPage(); } }
function nextStudyQuestion() { if (studyState.currentIndex < studyState.questions.length - 1) { studyState.currentIndex++; studyState.selectedAnswer = null; studyState.answered = false; studyState.showExplanation = false; studyState.questionStartTime = Date.now(); renderPage(); } }
function exitStudy() { studyState.questions = []; pageParams = {}; currentPage = 'study'; renderPage(); }
function toggleFavStudy(qId) { toggleFavorite(qId); renderPage(); }
function markConfusedStudy(qId) { toggleConfused(qId); renderPage(); }

// ==================== 错题本 ====================
let wrongFilter = '全部';
let retryState = { active: false, questionId: null, selectedAnswer: null, showResult: false };

function renderWrong() {
  if (retryState.active) return renderRetry();
  const allQ = getAllQuestions();
  const wrongWithDetails = state.wrongQuestions.map(w => {
    const q = allQ.find(aq => aq.id === w.questionId);
    return q ? { ...w, question: q } : null;
  }).filter(Boolean);

  const categories = ['全部', ...new Set(wrongWithDetails.map(w => w.question.category))];
  const filtered = wrongFilter === '全部' ? wrongWithDetails : wrongWithDetails.filter(w => w.question.category === wrongFilter);

  let html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><h1 style="font-size:20px;font-weight:700;">📕 错题本</h1><span style="font-size:14px;color:var(--red);margin-left:auto;">${state.wrongQuestions.length} 题</span></div>`;

  // 筛选
  html += `<div class="filter-tabs">`;
  categories.forEach(cat => {
    html += `<button class="filter-tab ${wrongFilter === cat ? 'active' : ''}" onclick="setWrongFilter('${cat}')">${cat}</button>`;
  });
  html += `</div>`;

  if (filtered.length === 0) {
    html += `<div class="empty-state"><div class="icon">🎉</div><div class="text">暂无错题，继续保持！</div></div>`;
  } else {
    filtered.forEach(item => {
      const q = item.question;
      const timeAgo = getTimeAgo(item.lastWrongAt);
      html += `<div class="card wrong-card"><div class="q-meta"><span class="cat">${q.category}</span><span class="count">错 ${item.wrongCount} 次</span><span class="time">${timeAgo}</span></div>
        <p style="font-size:14px;line-height:1.5;">${escapeHtml(q.question).substring(0, 100)}${q.question.length > 100 ? '...' : ''}</p>
        <div class="answer">正确答案：${LABELS[q.answer]}. ${escapeHtml(q.options[q.answer])}</div>
        <div class="btns"><button class="btn" style="background:var(--red-light);color:var(--red);" onclick="startRetry('${q.id}')">重新作答</button>
        <button class="btn btn-outline" onclick="removeWrong('${q.id}')">已掌握，移出</button></div></div>`;
    });
  }
  return html;
}

function setWrongFilter(cat) { wrongFilter = cat; renderPage(); }
function removeWrong(qId) { state.wrongQuestions = state.wrongQuestions.filter(w => w.questionId !== qId); saveWrongQuestions(); renderPage(); }

function startRetry(qId) { retryState = { active: true, questionId: qId, selectedAnswer: null, showResult: false }; renderPage(); }

function renderRetry() {
  const allQ = getAllQuestions();
  const item = state.wrongQuestions.find(w => w.questionId === retryState.questionId);
  const q = allQ.find(aq => aq.id === retryState.questionId);
  if (!q || !item) { retryState.active = false; return renderWrong(); }

  let html = `<div class="quiz-header"><button class="back-btn" onclick="retryState.active=false;renderPage();"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
    <h2 style="font-size:18px;font-weight:700;">重新作答</h2><span style="font-size:12px;color:var(--red);margin-left:auto;">已错 ${item.wrongCount} 次</span></div>`;

  html += `<div class="card question-card"><div class="q-category">${q.category}</div><p class="q-text">${escapeHtml(q.question)}</p></div><div>`;
  q.options.forEach((opt, i) => {
    let cls = 'option-btn';
    if (retryState.showResult) {
      if (i === q.answer) cls += ' correct';
      else if (i === retryState.selectedAnswer && i !== q.answer) cls += ' wrong';
    }
    html += `<button class="${cls}" ${retryState.showResult ? 'disabled' : ''} onclick="selectRetryAnswer(${i})"><span class="opt-label">${LABELS[i]}</span><span class="opt-text">${escapeHtml(opt)}</span></button>`;
  });
  html += `</div>`;

  if (retryState.showResult) {
    const isCorrect = retryState.selectedAnswer === q.answer;
    html += `<div class="explanation-panel ${isCorrect ? 'correct-bg' : 'wrong-bg'}"><div class="result-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="correct-answer">正确答案：${LABELS[q.answer]}. ${escapeHtml(q.options[q.answer])}</div>
      <div class="exp-text">${escapeHtml(q.explanation.brief)}</div></div>`;
    html += `<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="retryState.active=false;renderPage();">返回错题列表</button>`;
  }
  return html;
}

function selectRetryAnswer(idx) {
  if (retryState.showResult) return;
  retryState.selectedAnswer = idx;
  retryState.showResult = true;
  const q = getAllQuestions().find(aq => aq.id === retryState.questionId);
  const isCorrect = idx === q.answer;
  if (isCorrect) {
    const item = state.wrongQuestions.find(w => w.questionId === retryState.questionId);
    if (item) { item.correctOnRetry++; if (item.correctOnRetry >= 2) { state.wrongQuestions = state.wrongQuestions.filter(w => w.questionId !== retryState.questionId); } }
    saveWrongQuestions();
  }
  renderPage();
}

// ==================== 结果页 ====================
function renderResult() {
  const { total, correct, wrong, time } = pageParams;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  let emoji = '🎉'; if (accuracy < 60) emoji = '💪'; else if (accuracy < 80) emoji = '👍';

  return `<div style="text-align:center;padding:32px 0;">
    <div style="font-size:64px;margin-bottom:16px;">${emoji}</div>
    <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">答题完成！</h1>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;">${accuracy >= 80 ? '太棒了，继续保持！' : '继续加油，多练习哦！'}</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;">
      <div class="card stat-card"><p class="num" style="color:var(--emerald);">${correct}</p><p class="label">答对</p></div>
      <div class="card stat-card"><p class="num" style="color:var(--red);">${wrong}</p><p class="label">答错</p></div>
      <div class="card stat-card"><p class="num" style="color:var(--blue);">${accuracy}%</p><p class="label">正确率</p></div>
      <div class="card stat-card"><p class="num" style="color:var(--violet);">${minutes}:${seconds.toString().padStart(2, '0')}</p><p class="label">用时</p></div>
    </div>
    <button class="btn btn-primary btn-block" onclick="navigate('home')">返回首页</button>
    <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="navigate('quiz')">继续刷题</button>
  </div>`;
}

// ==================== 收藏页 ====================
function renderFavorites() {
  const allQ = getAllQuestions();
  const favQs = allQ.filter(q => state.progress.favoriteIds.includes(q.id));
  let html = `<div class="quiz-header"><button class="back-btn" onclick="navigate('profile')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
    <h1 style="font-size:20px;font-weight:700;">❤️ 我的收藏 (${state.progress.favoriteIds.length})</h1></div>`;
  if (favQs.length === 0) {
    html += `<div class="empty-state"><div class="icon">💛</div><div class="text">暂无收藏题目</div></div>`;
  } else {
    favQs.forEach(q => {
      html += `<div class="card" style="margin-bottom:10px;"><p style="font-size:14px;font-weight:500;">${escapeHtml(q.question).substring(0, 80)}</p><p style="font-size:12px;color:var(--text-muted);margin-top:4px;">${q.category}</p></div>`;
    });
  }
  return html;
}

// ==================== 个人中心 ====================
function renderProfile() {
  const p = state.progress;
  const accuracy = p.totalCount > 0 ? Math.round((p.totalCorrect / p.totalCount) * 100) : 0;
  const AVATARS = { fox:'🦊', cat:'🐱', dog:'🐶', rabbit:'🐰', panda:'🐼', koala:'🐨', tiger:'🐯', penguin:'🐧' };

  let html = '';
  // 用户信息
  html += `<div class="profile-header"><div class="profile-avatar">${AVATARS[state.currentUser.avatar] || '🦊'}</div>
    <div class="profile-info"><h2>${state.currentUser.nickname}</h2><p>点击管理账号 →</p></div></div>`;

  // 统计
  html += `<div class="profile-stats">
    <div class="card profile-stat"><p class="num" style="color:var(--emerald);">${p.totalCount}</p><p class="label">总刷题</p></div>
    <div class="card profile-stat"><p class="num" style="color:var(--blue);">${accuracy}%</p><p class="label">正确率</p></div>
    <div class="card profile-stat"><p class="num" style="color:var(--amber);">${p.streak}</p><p class="label">连续打卡</p></div>
    <div class="card profile-stat"><p class="num" style="color:var(--violet);">${p.todayCount}</p><p class="label">今日完成</p></div>
  </div>`;

  // 学习工具
  html += `<div class="menu-section"><div class="title">学习工具</div>`;
  html += menuItem('📥', '导入题库', `${state.importedBanks.length} 个题库`, 'showImportModal()', 'linear-gradient(135deg,#8b5cf6,#6366f1)', true);
  html += menuItem('❌', '错题本', `${state.wrongQuestions.length} 题`, "navigate('wrong')");
  html += menuItem('❓', '不会的题', `${state.confusedQuestions.length} 题`, "navigate('wrong')");
  html += menuItem('⭐', '我的收藏', `${p.favoriteIds.length} 题`, "navigate('favorites')");
  html += `</div>`;

  // 外观模式
  html += `<div class="menu-section"><div class="title">外观模式</div><div class="card" style="padding:16px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span>🎨</span><span style="font-size:14px;font-weight:500;">外观设置</span></div>
    <div class="theme-switcher">
      <button class="theme-opt ${state.theme === 'light' ? 'active' : ''}" onclick="setTheme('light');renderPage();">☀️ 亮色</button>
      <button class="theme-opt ${state.theme === 'dark' ? 'active' : ''}" onclick="setTheme('dark');renderPage();">🌙 暗色</button>
    </div></div></div>`;

  // 设置
  html += `<div class="menu-section"><div class="title">设置</div>
    <div class="card" style="padding:16px;"><div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;"><span>🎯</span><span style="font-size:14px;">每日目标</span></div>
      <div style="display:flex;align-items:center;gap:8px;"><input type="number" value="${p.dailyGoal}" min="1" max="200" style="width:60px;padding:4px 8px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);text-align:center;font-size:14px;" onchange="setDailyGoal(this.value)"><span style="font-size:13px;color:var(--text-secondary);">题/天</span></div>
    </div></div></div>`;

  // 版本信息
  html += `<div class="menu-section"><div class="title">关于</div>
    <div class="card" style="padding:16px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="display:flex;align-items:center;gap:12px;"><span>📦</span><span style="font-size:14px;">当前版本</span></div><span style="font-size:13px;color:var(--text-muted);">v${CURRENT_VERSION}</span></div>
    <button class="btn btn-outline btn-block" style="min-height:40px;" onclick="checkUpdate()">🔄 检查更新</button></div></div>`;

  return html;
}

function menuItem(icon, text, badge, onclick, gradient, isGradient) {
  if (isGradient) {
    return `<div class="card" style="background:${gradient};color:white;cursor:pointer;margin-bottom:8px;" onclick="${onclick}"><div style="display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;"><span style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">${icon}</span><span style="font-size:14px;font-weight:500;">${text}</span></div><div style="display:flex;align-items:center;gap:4px;font-size:13px;opacity:0.8;">${badge} <span>→</span></div></div></div>`;
  }
  return `<div class="card menu-item card-hover" onclick="${onclick}"><div class="left"><span class="icon" style="background:var(--bg-input);">${icon}</span><span class="text">${text}</span></div><div class="right">${badge} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>`;
}

function setDailyGoal(val) {
  const goal = parseInt(val);
  if (goal > 0 && goal <= 200) { state.progress.dailyGoal = goal; saveProgress(); }
}

function checkUpdate() { alert('当前已是最新版本 v' + CURRENT_VERSION); }

// ==================== 导入功能 ====================
function showImportModal() {
  const chapters = state.categoryHierarchy.filter(c => c.level === 'chapter' && c.parentId === null).sort((a, b) => a.order - b.order);
  let chapterOpts = '<option value="">跳过（归入默认分类）</option>';
  chapters.forEach(ch => { chapterOpts += `<option value="${ch.id}">${ch.name}</option>`; });

  const modalHtml = `<div class="modal-overlay" onclick="closeImportModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header"><h3>导入 MD 题库</h3><button class="modal-close" onclick="closeImportModal()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
      <div id="import-step-select">
        <div class="file-drop" onclick="document.getElementById('file-input').click()"><div class="icon">📂</div><div class="text">点击选择 MD 题库文件</div><div class="hint">支持 .md / .markdown / .txt 格式</div></div>
        <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display:none;" onchange="handleFileSelect(this)">
        <div style="background:var(--bg-input);border-radius:16px;padding:16px;margin-top:16px;"><p style="font-size:12px;font-weight:500;margin-bottom:8px;">支持的格式：</p>
        <pre style="font-size:12px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;">## 题目1：题目内容
- A. 选项A
- B. 选项B
- C. 选项C
- D. 选项D

**答案**：B
**解析**：解析内容

---</pre></div>
      </div>
      <div id="import-step-preview" style="display:none;">
        <div style="background:var(--emerald-light);border-radius:16px;padding:16px;margin-bottom:16px;"><p style="font-size:14px;"><b>文件：</b><span id="import-filename"></span></p><p style="font-size:14px;color:var(--emerald);font-weight:500;margin-top:4px;">解析出 <span id="import-count"></span> 道题目</p></div>
        <div class="form-group"><label>📝 题库名称</label><input type="text" class="form-input" id="import-bankname" placeholder="输入题库名称"></div>
        <div class="form-group"><label>📁 所属分类</label><select class="form-select" id="import-chapter">${chapterOpts}<option value="__new__">＋ 新建章...</option></select></div>
        <div id="import-new-chapter" style="display:none;margin-bottom:16px;"><input type="text" class="form-input" id="import-new-chapter-name" placeholder="输入新章名称"></div>
        <div id="import-preview-list" style="max-height:144px;overflow-y:auto;margin-bottom:16px;"></div>
        <div style="display:flex;gap:12px;"><button class="btn btn-outline" style="flex:1;" onclick="resetImport()">重新选择</button><button class="btn btn-primary" style="flex:1;" onclick="confirmImport()">确认导入</button></div>
      </div>
      <div id="import-step-result" style="display:none;text-align:center;padding:24px 0;"><div id="import-result-icon" style="font-size:48px;margin-bottom:12px;"></div><p id="import-result-msg" style="font-size:14px;font-weight:500;"></p><button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="closeImportModal()">完成</button></div>
    </div>
  </div>`;
  document.getElementById('modal-container').innerHTML = modalHtml;

  // 监听章选择
  setTimeout(() => {
    const sel = document.getElementById('import-chapter');
    if (sel) sel.onchange = function() {
      document.getElementById('import-new-chapter').style.display = this.value === '__new__' ? 'block' : 'none';
    };
  }, 50);
}

let importParsedQuestions = [];
let importFileContent = '';

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const bankName = file.name.replace(/\.(md|markdown|txt)$/i, '').trim();
  const reader = new FileReader();
  reader.onload = function(e) {
    importFileContent = e.target.result;
    const bankId = `bank-${Date.now()}`;
    importParsedQuestions = parseMDContent(importFileContent, bankId);
    if (importParsedQuestions.length === 0) {
      showImportResult(false, '未能从文件中解析出题目，请检查文件格式');
      return;
    }
    document.getElementById('import-step-select').style.display = 'none';
    document.getElementById('import-step-preview').style.display = 'block';
    document.getElementById('import-filename').textContent = file.name;
    document.getElementById('import-count').textContent = importParsedQuestions.length;
    document.getElementById('import-bankname').value = bankName;
    // 预览
    let previewHtml = '';
    importParsedQuestions.slice(0, 5).forEach((q, i) => {
      previewHtml += `<div style="background:var(--bg-input);border-radius:12px;padding:12px;margin-bottom:8px;font-size:12px;color:var(--text-secondary);"><b>${i + 1}.</b> ${escapeHtml(q.question).substring(0, 50)}${q.question.length > 50 ? '...' : ''}</div>`;
    });
    if (importParsedQuestions.length > 5) previewHtml += `<p style="font-size:12px;color:var(--text-muted);text-align:center;">还有 ${importParsedQuestions.length - 5} 题...</p>`;
    document.getElementById('import-preview-list').innerHTML = previewHtml;
  };
  reader.readAsText(file);
  input.value = '';
}

function confirmImport() {
  const bankName = document.getElementById('import-bankname').value.trim() || '未命名题库';
  const chapterSel = document.getElementById('import-chapter').value;
  let chapterId = '';

  if (chapterSel === '__new__') {
    const newName = document.getElementById('import-new-chapter-name').value.trim();
    if (newName) {
      const newCat = { id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: newName, parentId: null, level: 'chapter', order: state.categoryHierarchy.filter(c => c.level === 'chapter').length, questionIds: [] };
      state.categoryHierarchy.push(newCat);
      chapterId = newCat.id;
    }
  } else if (chapterSel) {
    chapterId = chapterSel;
  }

  // 重新解析
  const bankId = `bank-${Date.now()}`;
  const questions = parseMDContent(importFileContent, bankId);
  if (questions.length === 0) { showImportResult(false, '导入失败，未找到有效题目'); return; }

  // 保存
  const bank = { id: bankId, name: bankName, fileName: bankName, categoryId: chapterId, chapterId: chapterId || 'cat-chapter-cs', questionCount: questions.length, importedAt: new Date().toLocaleDateString('zh-CN') };
  state.importedBanks.push(bank);
  state.importedQuestions.push(...questions);
  saveImported();

  // 加入分类
  const qIds = questions.map(q => q.id);
  const targetId = chapterId || 'cat-chapter-cs';
  const cat = state.categoryHierarchy.find(c => c.id === targetId);
  if (cat) { cat.questionIds.push(...qIds); } else {
    const cs = state.categoryHierarchy.find(c => c.id === 'cat-chapter-cs');
    if (cs) cs.questionIds.push(...qIds);
  }
  saveCategories();

  showImportResult(true, `成功导入 ${questions.length} 道题目！`);
}

function showImportResult(success, msg) {
  document.getElementById('import-step-select').style.display = 'none';
  document.getElementById('import-step-preview').style.display = 'none';
  document.getElementById('import-step-result').style.display = 'block';
  document.getElementById('import-result-icon').textContent = success ? '✅' : '❌';
  document.getElementById('import-result-msg').textContent = msg;
  document.getElementById('import-result-msg').style.color = success ? 'var(--emerald)' : 'var(--red)';
}

function resetImport() {
  document.getElementById('import-step-select').style.display = 'block';
  document.getElementById('import-step-preview').style.display = 'none';
  document.getElementById('import-step-result').style.display = 'none';
}

function closeImportModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-container').innerHTML = '';
  importParsedQuestions = [];
  importFileContent = '';
  renderPage();
}

// ==================== MD 解析器 ====================
function parseMDContent(content, bankId) {
  const lines = content.split('\n');
  const questions = [];
  let current = null;
  let parsingExplanation = false;

  function flush() {
    if (current && current.question && current.options.length >= 2 && current.answer) {
      const num = questions.length + 1;
      questions.push({
        id: `imported-${bankId}-${num}`,
        category: '常识判断',
        difficulty: 2,
        question: current.question,
        options: current.options.slice(0, 4),
        answer: answerToIndex(current.answer),
        explanation: splitExplanation(current.explanation),
      });
    }
    current = null;
    parsingExplanation = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^-{3,}\s*$/.test(line) || /^\*{3,}\s*$/.test(line)) { flush(); continue; }
    if (/^##\s*(?:题目)?\d+\s*[：:、.]/.test(line)) {
      flush();
      const match = line.match(/^##\s*(?:题目)?\d+\s*[：:、]\s*(.+)/);
      current = { question: match ? match[1].trim() : line.replace(/^##\s*/, ''), options: [], answer: '', explanation: '' };
      continue;
    }
    if (!current) continue;
    const optMatch = line.match(/^-?\s*([A-Da-d])[.、．)\uff09]\s*(.+)/);
    if (optMatch && !parsingExplanation) { current.options.push(optMatch[2].trim()); continue; }
    const ansMatch = line.match(/\*{1,2}答案\*{1,2}\s*[：:]\s*([A-Da-d])/);
    if (ansMatch) { current.answer = ansMatch[1].toUpperCase(); parsingExplanation = false; continue; }
    const expMatch = line.match(/\*{1,2}解析\*{1,2}\s*[：:]\s*(.*)/);
    if (expMatch) { parsingExplanation = true; if (expMatch[1].trim()) current.explanation = expMatch[1].trim(); continue; }
    if (parsingExplanation && line) { current.explanation += (current.explanation ? '\n' : '') + line; continue; }
    if (!current.answer && current.options.length === 0 && !parsingExplanation && line) { current.question += '\n' + line; }
  }
  flush();
  return questions;
}

function answerToIndex(ans) { const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }; return map[ans.trim().toUpperCase()] ?? 0; }

function splitExplanation(text) {
  if (!text || !text.trim()) return { brief: '', detailed: '', knowledge: '', tips: '' };
  return { brief: text.trim(), detailed: '', knowledge: '', tips: '' };
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// ==================== 初始化 ====================
window.addEventListener('DOMContentLoaded', () => {
  initState();
  navigate('home');
});
