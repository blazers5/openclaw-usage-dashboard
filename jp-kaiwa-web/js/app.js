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

let rows = [];
let filtered = [];
let i = 0;
const favorites = new Set(JSON.parse(localStorage.getItem('jp.fav') || '[]'));
const settings = JSON.parse(localStorage.getItem('jp.settings') || '{"showPron":true,"ttsRate":1}');
const quiz = { items: [], idx: 0, score: 0 };

function saveFav(){ localStorage.setItem('jp.fav', JSON.stringify([...favorites])); }
function saveSettings(){ localStorage.setItem('jp.settings', JSON.stringify(settings)); }

function now(){ return filtered[i] || null; }

function normalize(str = '') {
  return str.toLowerCase().trim();
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

function render(){
  const r = now();
  if(!r){
    favBtn.textContent = '☆ 즐겨찾기';
    card.innerHTML = '<p>조건에 맞는 문장이 없습니다.</p>';
    return;
  }

  const isFav = favorites.has(r.id);
  favBtn.textContent = isFav ? '★ 즐겨찾기' : '☆ 즐겨찾기';

  card.innerHTML = `
    <div class="small">${r.category}</div>
    <h2>${r.jp}</h2>
    <p><b>뜻:</b> ${r.ko}</p>
    ${showPron.checked ? `<p><b>한국어 발음:</b> ${r.pron}</p>` : ''}
  `;
}

function speak(text){
  if(!('speechSynthesis' in window)) return alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = Number(settings.ttsRate || 1);
  window.speechSynthesis.speak(u);
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

document.getElementById('prevBtn').onclick = ()=>{ if(!filtered.length) return; i=(i-1+filtered.length)%filtered.length; render(); };
document.getElementById('nextBtn').onclick = ()=>{ if(!filtered.length) return; i=(i+1)%filtered.length; render(); };
document.getElementById('playBtn').onclick = ()=>{ const r=now(); if(r) speak(r.jp); };
favBtn.onclick = ()=>{ const r=now(); if(!r) return; favorites.has(r.id)?favorites.delete(r.id):favorites.add(r.id); saveFav(); applyFilter(); render(); };
showPron.onchange = ()=>{ settings.showPron = showPron.checked; saveSettings(); render(); };
onlyFavorites.onchange = ()=>{ applyFilter(); render(); };

ttsRateSelect.onchange = ()=>{ settings.ttsRate = Number(ttsRateSelect.value || 1); saveSettings(); };
categoryFilter.onchange = ()=>{ applyFilter(); render(); };
searchInput.oninput = ()=>{ applyFilter(); render(); };

function buildQuizItems(count=5){
  const source = filtered.length ? filtered : rows;
  const base = [...source].sort(()=>Math.random()-0.5).slice(0, Math.min(count, source.length));
  return base.map(s=>{
    const wrong = [...source].filter(x=>x.id!==s.id).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.ko);
    const opts = [...wrong, s.ko].sort(()=>Math.random()-0.5);
    return { q: s.jp, a: s.ko, opts };
  });
}

function renderQuiz(){
  const item = quiz.items[quiz.idx];
  if(!item){
    quizQ.textContent = `퀴즈 종료: ${quiz.score}/${quiz.items.length}`;
    quizOpts.innerHTML = '';
    quizMeta.textContent = '';
    return;
  }
  quizQ.textContent = `Q${quiz.idx+1}. ${item.q}`;
  quizMeta.textContent = `점수 ${quiz.score} / ${quiz.items.length}`;
  quizOpts.innerHTML = '';
  item.opts.forEach(opt=>{
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

document.getElementById('quizStartBtn').onclick = ()=>{
  quiz.items = buildQuizItems(5);
  quiz.idx = 0;
  quiz.score = 0;
  renderQuiz();
};

(async function init(){
  const res = await fetch('./data/sentences.json');
  const json = await res.json();
  rows = json.sentences || [];

  showPron.checked = settings.showPron !== false;
  ttsRateSelect.value = String(settings.ttsRate || 1);

  populateCategories();
  applyFilter();
  render();
})();