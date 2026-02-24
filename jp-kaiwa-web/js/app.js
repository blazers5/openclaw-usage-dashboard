const card = document.getElementById('sentenceCard');
const showPron = document.getElementById('showPron');
const onlyFavorites = document.getElementById('onlyFavorites');
const favBtn = document.getElementById('favBtn');
const quizQ = document.getElementById('quizQ');
const quizOpts = document.getElementById('quizOpts');
const quizMeta = document.getElementById('quizMeta');

let rows = [];
let filtered = [];
let i = 0;
const favorites = new Set(JSON.parse(localStorage.getItem('jp.fav') || '[]'));
const quiz = { items: [], idx: 0, score: 0 };

function saveFav(){ localStorage.setItem('jp.fav', JSON.stringify([...favorites])); }

function now(){ return filtered[i] || null; }

function applyFilter(){
  filtered = onlyFavorites.checked ? rows.filter(x=>favorites.has(x.id)) : [...rows];
  if(i >= filtered.length) i = 0;
}

function render(){
  const r = now();
  if(!r){ card.innerHTML = '<p>표시할 문장이 없습니다.</p>'; return; }
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
  u.rate = 1.0;
  window.speechSynthesis.speak(u);
}

document.getElementById('prevBtn').onclick = ()=>{ if(!filtered.length) return; i=(i-1+filtered.length)%filtered.length; render(); };
document.getElementById('nextBtn').onclick = ()=>{ if(!filtered.length) return; i=(i+1)%filtered.length; render(); };
document.getElementById('playBtn').onclick = ()=>{ const r=now(); if(r) speak(r.jp); };
favBtn.onclick = ()=>{ const r=now(); if(!r) return; favorites.has(r.id)?favorites.delete(r.id):favorites.add(r.id); saveFav(); applyFilter(); render(); };
showPron.onchange = render;
onlyFavorites.onchange = ()=>{ applyFilter(); render(); };

function buildQuizItems(count=5){
  const base = [...rows].sort(()=>Math.random()-0.5).slice(0, Math.min(count, rows.length));
  return base.map(s=>{
    const wrong = [...rows].filter(x=>x.id!==s.id).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.ko);
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
  applyFilter();
  render();
})();
