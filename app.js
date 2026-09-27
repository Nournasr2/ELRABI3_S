
const state = { search:"", genre:"الكل", selectedOnly:false, selected:new Set(JSON.parse(localStorage.getItem("rabi3Selected")||"[]")) };
const grid = document.getElementById("grid"), empty = document.getElementById("empty");
const selectedCount = document.getElementById("selectedCount"), totalGames = document.getElementById("totalGames"), visibleGames = document.getElementById("visibleGames");
const resultNote = document.getElementById("resultNote");

const genreGroups = ["الكل","Action","Racing","Fighting","Sports","Horror","Platform","Open World","Co-op","FPS","Simulation"];
function genreMatch(g, f){ if(f==="الكل") return true; return g.genre.toLowerCase().includes(f.toLowerCase()); }

function saveSelected(){ localStorage.setItem("rabi3Selected", JSON.stringify([...state.selected])); updateCount(); }
function updateCount(){ selectedCount.textContent=state.selected.size; }
function esc(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

function coverCandidates(game){
  const base = game.wiki || game.title;
  const api = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(base.replace(/ /g,"_"));
  return [api];
}
async function resolveCover(img, game){
  img.classList.add("skeleton");
  try{
    const r = await fetch(coverCandidates(game)[0], {headers:{Accept:"application/json"}});
    if(!r.ok) throw new Error("not found");
    const d = await r.json();
    if(d.thumbnail?.source){
      img.src = d.thumbnail.source.replace(/\?.*$/,"");
      img.onload=()=>img.classList.remove("skeleton");
      img.onerror=()=>fallbackSearch(img, game);
      return;
    }
    throw new Error("no thumbnail");
  }catch(e){ fallbackSearch(img, game); }
}
async function fallbackSearch(img, game){
  try{
    const u="https://en.wikipedia.org/w/api.php?action=opensearch&search="+encodeURIComponent(game.title)+"&limit=1&namespace=0&format=json&origin=*";
    const r=await fetch(u); const d=await r.json(); const title=d[1]?.[0];
    if(!title) throw new Error();
    const s=await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(title.replace(/ /g,"_")));
    const j=await s.json();
    if(j.thumbnail?.source){img.src=j.thumbnail.source.replace(/\?.*$/,"");img.onload=()=>img.classList.remove("skeleton");return;}
  }catch(e){}
  img.classList.remove("skeleton");
  img.alt="صورة اللعبة غير متاحة";
  img.style.opacity=".18";
}

function filtered(){
  const q=state.search.trim().toLowerCase();
  return GAMES.filter(g=>(!q || (g.name+" "+g.title+" "+g.genre).toLowerCase().includes(q)) && genreMatch(g,state.genre) && (!state.selectedOnly || state.selected.has(g.id)));
}
function renderFilters(){
  const wrap=document.getElementById("filters");
  wrap.innerHTML=genreGroups.map(x=>`<button class="filter ${state.genre===x?"active":""}" data-filter="${x}">${x}</button>`).join("");
  wrap.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{state.genre=b.dataset.filter;renderFilters();render();});
}
function render(){
  const list=filtered(); visibleGames.textContent=list.length; resultNote.textContent=`${list.length} لعبة ${state.selectedOnly?"في اختياراتك":"متاحة"}`;
  grid.innerHTML="";
  empty.hidden=!!list.length;
  list.forEach(g=>{
    const card=document.createElement("article"); card.className="card";
    const sel=state.selected.has(g.id);
    card.innerHTML=`<div class="cover"><span class="badge">PS4</span><img class="game-cover skeleton" alt="${esc(g.title)}"><span class="rate">★ ${g.rating}</span></div>
      <div class="card-body"><div class="game-title">${esc(g.name)}</div><div class="game-meta">${esc(g.genre)}</div><p class="desc">${esc(g.description)}</p>
      <button class="add ${sel?"selected":""}">${sel?"✓ مضاف لاختياراتك":"＋ أضف لاختياراتي"}</button></div>`;
    const img=card.querySelector("img"); resolveCover(img,g);
    card.querySelector(".add").onclick=()=>{ if(state.selected.has(g.id)) state.selected.delete(g.id); else state.selected.add(g.id); saveSelected(); render(); renderSelected(); };
    grid.appendChild(card);
  });
}
function renderSelected(){
  const box=document.getElementById("selectedList");
  const items=GAMES.filter(g=>state.selected.has(g.id));
  box.innerHTML=items.length?items.map(g=>`<div class="selected-row"><img src="" data-id="${g.id}" alt=""><div><b>${esc(g.name)}</b><small>${esc(g.genre)}</small></div><button class="remove" data-remove="${g.id}">×</button></div>`).join(""):`<div class="empty"><div>🎮</div><h3>لسه مفيش اختيارات</h3><p>اضغط «أضف لاختياراتي» على أي لعبة.</p></div>`;
  box.querySelectorAll("img").forEach(img=>{const g=GAMES.find(x=>x.id==img.dataset.id);resolveCover(img,g);});
  box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.selected.delete(Number(b.dataset.remove));saveSelected();render();renderSelected();});
}
function openDrawer(){document.getElementById("drawer").classList.add("open");document.getElementById("backdrop").classList.add("open");document.getElementById("drawer").setAttribute("aria-hidden","false");renderSelected();}
function closeDrawer(){document.getElementById("drawer").classList.remove("open");document.getElementById("backdrop").classList.remove("open");document.getElementById("drawer").setAttribute("aria-hidden","true");}
async function copySelected(){
  const items=GAMES.filter(g=>state.selected.has(g.id));
  if(!items.length){openDrawer();return;}
  const text="اختيارات ألعاب شركة الربيع:\n"+items.map((g,i)=>`${i+1}. ${g.name}`).join("\n")+"\n\nشركة الربيع لأجهزة الألعاب — خبرة سنين بتفرق";
  try{await navigator.clipboard.writeText(text); alert("تم نسخ قائمة الألعاب.");}catch(e){prompt("انسخ القائمة:",text);}
}
document.getElementById("search").oninput=e=>{state.search=e.target.value;render();};
document.getElementById("showSelected").onclick=openDrawer;
document.getElementById("toggleSelected").onclick=()=>{state.selectedOnly=!state.selectedOnly;document.getElementById("toggleSelected").classList.toggle("active",state.selectedOnly);render();};
document.getElementById("copySelected").onclick=copySelected;
document.getElementById("copySelected2").onclick=copySelected;
document.getElementById("clearSelected").onclick=()=>{state.selected.clear();saveSelected();render();renderSelected();};
document.getElementById("closeDrawer").onclick=closeDrawer;
document.getElementById("backdrop").onclick=closeDrawer;
totalGames.textContent=GAMES.length; updateCount(); renderFilters(); render(); renderSelected();
