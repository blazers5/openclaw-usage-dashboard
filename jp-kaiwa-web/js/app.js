const card = document.getElementById('sentenceCard');
const showPron = document.getElementById('showPron');
const onlyFavorites = document.getElementById('onlyFavorites');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const favBtn = document.getElementById('favBtn');
const quizQ = document.getElementById('quizQ');
const quizOpts = document.getElementById('quizOpts');
const quizMeta = document.getElementById('quizMeta');
const ttsRateSelect = document.getElementById('ttsRate');
const statsGrid = document.getElementById('statsGrid');

const onboardingModal = document.getElementById('onboardingModal');
const onboardingStepMeta = document.getElementById('onboardingStepMeta');
const onboardingTitle = document.getElementById('onboardingTitle');
const onboardingDesc = document.getElementById('onboardingDesc');
const onboardingSkipBtn = document.getElementById('onboardingSkipBtn');
const onboardingNextBtn = document.getElementById('onboardingNextBtn');

let rows = [];
let filtered = [];
let i = 0;
const favorites = new Set(JSON.parse(localStorage.getItem('jp.fav') || '[]'));
const settings = JSON.parse(localStorage.getItem('jp.settings') || '{"showPron":true,"ttsRate":1}');
const progress = JSON.parse(localStorage.getItem('jp.progress') || '{"viewed":[],"playedCount":0,"quizAttempts":0,"quizBest":0}');
const quiz = { items: [], idx: 0, score: 0 };
const onboarding = {
  done: localStorage.getItem('jp.onboardingDone') === '1',
  idx: 0,
  steps: [
    {
      title: '환영합니다 👋',
      desc: '이 앱은 일본어 회화 문장을 빠르게 반복 학습하도록 설계되었습니다.'
    },
    {
      title: '핵심 기능',
      desc: '카테고리/검색/즐겨찾기 필터로 필요한 문장만 골라 학습하고, 재생 버튼으로 즉시 발화를 들어보세요.'
    },
    {
      title: '학습 팁',
      desc: '문장을 듣고 따라 말한 뒤 즐겨찾기로 모아 반복하세요. 아래 통계 위젯에서 진행 상황을 확인할 수 있습니다.'
    }
  ]
};

function saveFav(){ localStorage.setItem('jp.fav', JSON.stringify([...favorites])); }
function saveSettings(){ localStorage.setItem('jp.settings', JSON.stringify(settings)); }
function saveProgress(){ localStorage.setItem('jp.progress', JSON.stringify(progress)); }

function now(){ return filtered[i] || null; }

function normalize(str = '') {
  return String(str).toLowerCase().trim();
}

function applyFilter(){
  const selectedCategory = categoryFilter.value;
  const query = normalize(searchInput.value);

  filtered = rows.filter((x) => {
    if (onlyFavorites.checked && !favorites.has(x.id)) return false;
    if (selectedCategory !== 'all' && x.category !== selectedCategory) return false;

    if (!query) return true;
    const jp = normalize(x.jp);
    const ko = normalize(x.ko);
    const pron = normalize(x.pron || '');
    return jp.includes(query) || ko.includes(query) || pron.includes(query);
  });

  if(i >= filtered.length) i = 0;
}

function markViewed(id){
  if (!id) return;
  if (!Array.isArray(progress.viewed)) progress.viewed = [];
  if (!progress.viewed.includes(id)) {
    progress.viewed.push(id);
    saveProgress();
  }
}

function renderStats(){
  const viewedCount = (progress.viewed || []).length;
  const completion = rows.length ? Math.round((viewedCount / rows.length) * 100) : 0;
  const best = progress.quizBest || 0;
  const attempts = progress.quizAttempts || 0;
  const playedCount = progress.playedCount || 0;

  const stats = [
    { label: '학습 문장', value: `${viewedCount}/${rows.length || 0}` },
    { label: '진행률', value: `${completion}%` },
    { label: '즐겨찾기', value: favorites.size },
    { label: '오디오 재생', value: playedCount },
    { label: '퀴즈 최고점', value: `${best}/5` },
    { label: '퀴즈 시도', value: attempts }
  ];

  statsGrid.innerHTML = stats
    .map(({ label, value }) => `<div class="stat-item"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`)
    .join('');
}

function render(){
  const r = now();
  if(!r){
    favBtn.textContent = '☆ 즐겨찾기';
    card.innerHTML = '<p>조건에 맞는 문장이 없습니다.</p>';
    renderStats();
    return;
  }

  markViewed(r.id);

  const isFav = favorites.has(r.id);
  favBtn.textContent = isFav ? '★ 즐겨찾기' : '☆ 즐겨찾기';

  card.innerHTML = `
    <div class="small">${r.category}</div>
    <h2>${r.jp}</h2>
    <p><b>뜻:</b> ${r.ko}</p>
    ${showPron.checked ? `<p><b>한국어 발음:</b> ${r.pron}</p>` : ''}
  `;

  renderStats();
}

function speak(text){
  if(!('speechSynthesis' in window)) {
    alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = Number(settings.ttsRate || 1);
  window.speechSynthesis.speak(u);
  progress.playedCount = (progress.playedCount || 0) + 1;
  saveProgress();
  renderStats();
}

function populateCategories(){
  const categories = [...new Set(rows.map((x) => x.category))];
  categoryFilter.innerHTML = '<option value="all">전체</option>';
  categories.forEach((category) => {
    const opt = document.createElement('option');
    opt.value = category;
    opt.textContent = category;
    categoryFilter.appendChild(opt);
  });
}

function buildQuizItems(count=5){
  const source = filtered.length ? filtered : rows;
  const base = [...source].sort(()=>Math.random()-0.5).slice(0, Math.min(count, source.length));
  return base.map((s) => {
    const wrong = [...source]
      .filter((x) => x.id !== s.id)
      .sort(()=>Math.random()-0.5)
      .slice(0,3)
      .map((x) => x.ko);
    const opts = [...wrong, s.ko].sort(()=>Math.random()-0.5);
    return { q: s.jp, a: s.ko, opts };
  });
}

function finishQuiz(){
  progress.quizAttempts = (progress.quizAttempts || 0) + 1;
  progress.quizBest = Math.max(progress.quizBest || 0, quiz.score);
  saveProgress();
  renderStats();
}

function renderQuiz(){
  const item = quiz.items[quiz.idx];
  if(!item){
    quizQ.textContent = `퀴즈 종료: ${quiz.score}/${quiz.items.length}`;
    quizOpts.innerHTML = '';
    quizMeta.textContent = '';
    if (quiz.items.length) finishQuiz();
    return;
  }
  quizQ.textContent = `Q${quiz.idx+1}. ${item.q}`;
  quizMeta.textContent = `점수 ${quiz.score} / ${quiz.items.length}`;
  quizOpts.innerHTML = '';
  item.opts.forEach((opt) => {
    const b=document.createElement('button');
    b.textContent=opt;
    b.onclick=()=>{
      if(opt===item.a) quiz.score++;
      quiz.idx++;
      renderQuiz();
    };
    quizOpts.appendChild(b);
  });
}

function renderOnboarding(){
  const step = onboarding.steps[onboarding.idx];
  onboardingStepMeta.textContent = `${onboarding.idx + 1} / ${onboarding.steps.length}`;
  onboardingTitle.textContent = step.title;
  onboardingDesc.textContent = step.desc;
  onboardingNextBtn.textContent = onboarding.idx === onboarding.steps.length - 1 ? '시작하기' : '다음';
}

function closeOnboarding(done = true){
  onboarding.done = done;
  onboardingModal.classList.add('hidden');
  if (done) localStorage.setItem('jp.onboardingDone', '1');
}

function openOnboarding(){
  onboarding.idx = 0;
  renderOnboarding();
  onboardingModal.classList.remove('hidden');
}

document.getElementById('prevBtn').onclick = ()=>{ if(!filtered.length) return; i=(i-1+filtered.length)%filtered.length; render(); };
document.getElementById('nextBtn').onclick = ()=>{ if(!filtered.length) return; i=(i+1)%filtered.length; render(); };
document.getElementById('playBtn').onclick = ()=>{ const r=now(); if(r) speak(r.jp); };
favBtn.onclick = ()=>{
  const r=now();
  if(!r) return;
  favorites.has(r.id) ? favorites.delete(r.id) : favorites.add(r.id);
  saveFav();
  applyFilter();
  render();
};
showPron.onchange = ()=>{ settings.showPron = showPron.checked; saveSettings(); render(); };
onlyFavorites.onchange = ()=>{ applyFilter(); render(); };
ttsRateSelect.onchange = ()=>{ settings.ttsRate = Number(ttsRateSelect.value || 1); saveSettings(); };
categoryFilter.onchange = ()=>{ applyFilter(); render(); };
searchInput.oninput = ()=>{ applyFilter(); render(); };

document.getElementById('quizStartBtn').onclick = ()=>{
  quiz.items = buildQuizItems(5);
  quiz.idx = 0;
  quiz.score = 0;
  renderQuiz();
};

onboardingSkipBtn.onclick = ()=> closeOnboarding(true);
onboardingNextBtn.onclick = ()=>{
  if (onboarding.idx >= onboarding.steps.length - 1) {
    closeOnboarding(true);
    return;
  }
  onboarding.idx++;
  renderOnboarding();
};

(async function init(){
  try {
    const res = await fetch('./data/sentences.json');
    const json = await res.json();
    rows = json.sentences || [];
  } catch (e) {
    rows = [];
    card.innerHTML = '<p>데이터를 불러오지 못했습니다. 로컬 서버 환경에서 다시 시도해주세요.</p>';
  }

  showPron.checked = settings.showPron !== false;
  ttsRateSelect.value = String(settings.ttsRate || 1);

  populateCategories();
  applyFilter();
  render();

  if (!onboarding.done) openOnboarding();
})();
