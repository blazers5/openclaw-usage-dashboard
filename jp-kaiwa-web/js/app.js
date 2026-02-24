const card = document.getElementById('sentenceCard');
const showPron = document.getElementById('showPron');
const onlyFavorites = document.getElementById('onlyFavorites');
const favBtn = document.getElementById('favBtn');

let rows = [];
let filtered = [];
let i = 0;
const favorites = new Set(JSON.parse(localStorage.getItem('jp.fav') || '[]'));

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

(async function init(){
  const res = await fetch('./data/sentences.json');
  const json = await res.json();
  rows = json.sentences || [];
  applyFilter();
  render();
})();
