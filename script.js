(() => {
  "use strict";

  // Prefs & moderation
  const PREF_SORT_KEY="kb_home_sort", PREF_LIMIT_KEY="kb_home_limit";
  const DRAFT_KEY="kb_draft_story", LAST_POST_TS="kb_last_post_time";
  const BAD_WORDS=["salak","aptal","lanet"];

  // Store
  const KEY="kb_global_stories_v1";
  const VOTE_KEY="kb_votes_v1"; // storyId -> "up" | "down"
  const $=(s,p=document)=>p.querySelector(s);

  const load=()=>{ try{const r=localStorage.getItem(KEY);const a=r?JSON.parse(r):[];return Array.isArray(a)?a:[]}catch{ return[] } };
  const save=l=>localStorage.setItem(KEY,JSON.stringify(l));
  const uid=()=> "s"+Math.random().toString(36).slice(2,10)+Date.now().toString(36);

  const loadVotes=()=>{ try{ return JSON.parse(localStorage.getItem(VOTE_KEY)||"{}"); }catch{ return {} } };
  const saveVotes=map=>localStorage.setItem(VOTE_KEY,JSON.stringify(map));

  const addStory=(title,text,city,handle)=>{
    const list=load();
    const obj={id:uid(), title, text, city:(city||"").trim()||null, handle:(handle||"").trim()||null,
               createdAt:Date.now(), comments:[], votes:{up:0,down:0}};
    list.push(obj); save(list); return obj;
  };

  // Helpers
  const clean=s=>(s||"").replace(/\s+/g," ").trim();
  const bad=s=>BAD_WORDS.some(w=>(s||"").toLowerCase().includes(w));
  const low=s=>!s||s.length<10||/([a-zA-ZçğıöşüÇĞİÖŞÜ])\1\1\1/.test(s)|| (s===s.toUpperCase()&&/[A-ZÇĞİÖŞÜ]/.test(s));
  const canPost=()=>Date.now()-parseInt(localStorage.getItem(LAST_POST_TS)||"0",10)>60e3;
  const esc=s=>(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const ago=ts=>{const d=Math.floor((Date.now()-ts)/1e3); if(d<60)return d+"s"; const m=Math.floor(d/60); if(m<60)return m+"dk"; const h=Math.floor(m/60); if(h<24)return h+"saat"; return Math.floor(h/24)+"gün" };
  const slice60=t=>t.length>60?t.slice(0,60)+"…":t;
  const toast=m=>{const t=$("#toast"); t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1600)};

  // Voting
  function handleVote(storyId, type){ // type: "up" | "down"
    const votes=loadVotes();
    if (votes[storyId]) { toast("Bu hikâyeye zaten oy verdin"); return; }
    const list=load();
    const i=list.findIndex(s=>s.id===storyId); if(i<0) return;

    list[i].votes = list[i].votes || {up:0,down:0};
    if (type==="up") list[i].votes.up += 1;
    else list[i].votes.down += 1;

    save(list);
    votes[storyId]=type; saveVotes(votes);
    renderComments(); renderLatest();
    toast("Oyun kaydedildi");
  }

  // Routing
  const views={home:$("#home"),advice:$("#advice"),comment:$("#comment")};
  const show=v=>{Object.values(views).forEach(x=>x.classList.add("hidden")); views[v].classList.remove("hidden"); if(v==="home") renderLatest(); if(v==="comment") renderComments();};
  const sync=()=>{const h=location.hash.replace("#",""); if(h==="advice")show("advice"); else if(h==="comment")show("comment"); else show("home");};
  window.addEventListener("hashchange",sync);

  // Renderers
  function voteStats(v){ const up=v?.up||0, down=v?.down||0, total=up+down; const upPct= total? Math.round((up/total)*100):0; const downPct= total? (100-upPct):0;
    return {up,down,total,upPct,downPct};
  }

  function storyCard(s, withVoteBox){
    const el=document.createElement("div"); el.className="story";
    const {up,down,total,upPct,downPct}=voteStats(s.votes);

    el.innerHTML=`
      <div class="meta">${esc(s.handle||"Anon***")}${s.city? " · "+esc(s.city):""} · ${ago(s.createdAt)}</div>
      <div class="title">${esc(s.title||slice60(s.text||""))}</div>
      <div class="body">${esc(s.text||"")}</div>
      <div class="meta" style="margin-top:8px">
        <span class="badge">Haklısın: ${up}</span>
        <span class="badge">Haksızsın: ${down}</span>
        <span class="badge">Toplam: ${total} · ${upPct}% / ${downPct}%</span>
      </div>
    `;

    if(withVoteBox){
      const wrap=document.createElement("div"); wrap.className="vote-box";
      const votes=loadVotes(); const myVote=votes[s.id];

      const upBtn=document.createElement("button");
      upBtn.className="btn vote-btn"+(myVote==="up"?" active":"");
      upBtn.textContent="👍 Haklısın";
      upBtn.addEventListener("click",()=>handleVote(s.id,"up"));

      const downBtn=document.createElement("button");
      downBtn.className="btn vote-btn"+(myVote==="down"?" active":"");
      downBtn.textContent="👎 Haksızsın";
      downBtn.addEventListener("click",()=>handleVote(s.id,"down"));

      const stat=document.createElement("div"); stat.className="vote-stats";
      stat.textContent = `Oy verdikten sonra değiştirilemez.`;

      wrap.append(upBtn,downBtn,stat);
      el.appendChild(wrap);
    }

    return el;
  }

  function renderLatest(){
    const box=$("#latestList"); box.innerHTML="";
    const sort=$("#homeSort").value, lim=parseInt($("#homeLimit").value||"4",10);
    let data=load();

    // “most_comments” -> en çok OY
    data = sort==="most_comments"
      ? data.sort((a,b)=>((b.votes?.up||0)+(b.votes?.down||0)) - ((a.votes?.up||0)+(a.votes?.down||0)))
      : data.sort((a,b)=>b.createdAt-a.createdAt);

    const cut=data.slice(0,Math.min(lim,4));
    if(!cut.length){ box.innerHTML=`<div class="empty">Henüz hikâye yok. İlkini sen yaz ✨</div>`; return; }
    cut.forEach(s=>box.appendChild(storyCard(s,false)));
  }

  function renderComments(){
    const list=$("#commentList"); list.innerHTML="";
    const q=($("#commentQuery")?.value||"").toLowerCase();
    let data=load().sort((a,b)=>b.createdAt-a.createdAt);
    if(q) data=data.filter(s=>(s.title||"").toLowerCase().includes(q));
    if(!data.length){ list.innerHTML=`<div class="empty">Eşleşen hikâye yok.</div>`; return; }
    data.forEach(s=>list.appendChild(storyCard(s,true)));
  }

  // Events
  document.addEventListener("DOMContentLoaded",()=>{
    // filtreleri geri yükle
    const savedSort=localStorage.getItem(PREF_SORT_KEY);
    const savedLimit=localStorage.getItem(PREF_LIMIT_KEY);
    if(savedSort) $("#homeSort").value=savedSort;
    if(savedLimit) $("#homeLimit").value=savedLimit;

    $("#homeSort").addEventListener("change",e=>{localStorage.setItem(PREF_SORT_KEY,e.target.value); renderLatest();});
    $("#homeLimit").addEventListener("change",e=>{localStorage.setItem(PREF_LIMIT_KEY,e.target.value); renderLatest();});

    const storyTitle=$("#storyTitle"), storyText=$("#storyText"), count=$("#storyCount");

    // taslak (problem metni)
    const draft=localStorage.getItem(DRAFT_KEY); if(draft){ storyText.value=draft; count.textContent=draft.length; }
    storyText.addEventListener("input",()=>{ const v=storyText.value; localStorage.setItem(DRAFT_KEY,v);
      const len=v.length; count.textContent=len; count.parentElement.classList.remove("warn","max");
      if(len>=200) count.parentElement.classList.add("max"); else if(len>=180) count.parentElement.classList.add("warn");
    });

    $("#btnPublish").addEventListener("click",()=>{
      const title=clean(storyTitle.value), text=clean(storyText.value);
      const city=clean($("#storyCity").value), handle=clean($("#storyHandle").value);
      if(!title) return toast("Başlık zorunlu");
      if(title.length>40) return toast("Başlık 40 karakteri aşamaz");
      if(!text) return toast("Problem boş olamaz");
      if(text.length>200) return toast("200 karakter sınırı");
      if(low(text)) return toast("Biraz daha açıklayıcı yaz");
      if(!canPost()) return toast("Lütfen 1 dakika sonra tekrar dene");
      if(bad(title) || bad(text)){ const ok=confirm("Uygunsuz kelime tespit edildi. Yine de gönderilsin mi?"); if(!ok) return; }

      addStory(title,text,city,handle);
      localStorage.setItem(LAST_POST_TS,Date.now().toString());

      storyTitle.value=""; storyText.value=""; $("#storyCity").value=""; $("#storyHandle").value="";
      localStorage.removeItem(DRAFT_KEY); count.textContent="0";
      location.hash="#comment"; renderComments(); toast("Global alana gönderildi");
    });

    // arama
    $("#commentQuery").addEventListener("input",renderComments);
    $("#commentClear").addEventListener("click",()=>{ $("#commentQuery").value=""; renderComments(); });

    // tavsiye döngüsü
    const tips=["Empati kurmadan çözüm olmaz.","Özür dilemek kazandırır.","Dinlemek, anlamanın yarısıdır.","İlk adım barışı başlatır.","Sevgi sabır ister."];
    let tipIndex=0;
    setInterval(()=>{ const el=document.getElementById("tipText"); if(el){ el.textContent="💡 "+tips[tipIndex]; tipIndex=(tipIndex+1)%tips.length; } },5000);

    // ilk yükleme
    sync(); renderLatest();

    // seed
    const cur=load(); if(!(cur&&cur.length)){
      addStory("Mesajları geç gördüm","Mesajları geç gördüm, kalbini kırdım. Ne yapmalıyım?","İstanbul","Deniz***");
      addStory("Yıldönümünü unuttum","Unuttum, telafi için öneri? Evde romantik akşam?","Ankara","Atlas***");
      renderLatest();
    }
  });
})();
