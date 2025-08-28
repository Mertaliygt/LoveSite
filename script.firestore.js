// script.firestore.js (PATCH: tolerant selectors for original IDs)
(() => {
  "use strict";

  // ===== Yardımcılar =====
  const $=(s,p=document)=>p.querySelector(s);
  const esc=s=>(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const ago=ts=>{const d=Math.floor((Date.now()-ts)/1e3); if(d<60)return d+"s"; const m=Math.floor(d/60); if(m<60)return m+"dk"; const h=Math.floor(m/60); if(h<24)return h+"saat"; return Math.floor(h/24)+"gün" };
  const toast=m=>{const t=$("#toast"); if(!t) return; t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1600)};
  const debounce=(fn,w=150)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),w);};};
  const getEl=(...ids)=> ids.map(id=> typeof id==="string" ? $(id) : id).find(Boolean);

  const VOTE_KEY="kb_votes_v1";
  const loadVotes=()=>{ try{ return JSON.parse(localStorage.getItem(VOTE_KEY)||"{}"); }catch{ return {} } };
  const saveVotes=v=>localStorage.setItem(VOTE_KEY, JSON.stringify(v||{}));

  // ===== Firestore API =====
  function requireDB(){
    if(!window.db){ throw new Error("Firebase hazır değil (db bulunamadı)."); }
    return window.db;
  }

  async function fsAddStory({title,text,city,handle}){
    const db = requireDB();
    const ref = await db.collection("stories").add({
      title, text, city:(city||"").trim()||null, handle:(handle||"").trim()||null,
      createdAt: Date.now(), votesUp:0, votesDown:0, votesTotal:0
    });
    return ref.id;
  }

  function fsListenLatest({ sort="new", lim=4, onChange }){
    const db = requireDB();
    let q = db.collection("stories");
    q = (sort==="most_comments")
      ? q.orderBy("votesTotal","desc").limit(lim)
      : q.orderBy("createdAt","desc").limit(lim);
    return q.onSnapshot(snap=>{
      const rows = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      onChange?.(rows);
    });
  }

  async function fsFetchAll(){
    const db = requireDB();
    const snap = await db.collection("stories").orderBy("createdAt","desc").get();
    return snap.docs.map(d=>({ id:d.id, ...d.data() }));
  }

  async function fsVote(storyId, type){
    const db = requireDB();
    const ref = db.collection("stories").doc(storyId);
    const inc = type==="up"
      ? { votesUp: firebase.firestore.FieldValue.increment(1),
          votesTotal: firebase.firestore.FieldValue.increment(1) }
      : { votesDown: firebase.firestore.FieldValue.increment(1),
          votesTotal: firebase.firestore.FieldValue.increment(1) };
    await ref.update(inc);
  }

  // ===== UI =====
  function storyCard(s, withVoteBox){
    const el=document.createElement("div"); el.className="story";
    const up = s.votesUp ?? 0, down = s.votesDown ?? 0, total = s.votesTotal ?? (up+down);
    const upPct= total? Math.round((up/total)*100):0;
    const downPct= total? (100-upPct):0;

    el.innerHTML=`
      <div class="meta">${esc(s.handle||"Anon***")}${s.city? " · "+esc(s.city):""} · ${ago(s.createdAt||Date.now())}</div>
      <div class="title">${esc(s.title||"")}</div>
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
      upBtn.addEventListener("click",async ()=>{
        if(votes[s.id]) return toast("Zaten oy verdin");
        await fsVote(s.id,"up"); votes[s.id]="up"; saveVotes(votes); toast("Oyun kaydedildi"); if(location.hash==="#comment") renderComments();
      });

      const downBtn=document.createElement("button");
      downBtn.className="btn vote-btn"+(myVote==="down"?" active":"");
      downBtn.textContent="👎 Haksızsın";
      downBtn.addEventListener("click",async ()=>{
        if(votes[s.id]) return toast("Zaten oy verdin");
        await fsVote(s.id,"down"); votes[s.id]="down"; saveVotes(votes); toast("Oyun kaydedildi"); if(location.hash==="#comment") renderComments();
      });

      const stat=document.createElement("div"); stat.className="vote-stats";
      stat.textContent = `Oy verdikten sonra değiştirilemez.`;

      wrap.append(upBtn,downBtn,stat);
      el.appendChild(wrap);
    }
    return el;
  }

  // ===== RENDERERS =====
  let stopLatest = null;
  function renderLatest(){
    const sort=$("#homeSort")?.value || "new";
    const lim=parseInt($("#homeLimit")?.value || "4",10);
    const box=$("#latestList"); if(!box) return;
    box.innerHTML = "";

    if (stopLatest) { stopLatest(); stopLatest=null; }
    stopLatest = fsListenLatest({
      sort, lim,
      onChange: (rows)=>{
        box.innerHTML="";
        if(!rows.length){ box.innerHTML=`<div class="empty">Henüz hikâye yok. İlkini sen yaz ✨</div>`; return; }
        rows.forEach(s=>box.appendChild(storyCard(s,false)));
      }
    });
  }

  async function renderComments(){
    const list=$("#commentList"); if(!list) return;
    list.innerHTML=`<div class="empty">Yükleniyor…</div>`;
    const q=($("#commentQuery")?.value||"").toLowerCase();
    let data = await fsFetchAll();
    if(q) data=data.filter(s=>(s.title||"").toLowerCase().includes(q));
    list.innerHTML="";
    if(!data.length){ list.innerHTML=`<div class="empty">Eşleşen hikâye yok.</div>`; return; }
    data.forEach(s=>list.appendChild(storyCard(s,true)));
  }

  // ===== ROUTING =====
  const views={home:$("#home"),advice:$("#advice"),comment:$("#comment")};
  const show=v=>{Object.values(views).forEach(x=>x&&x.classList.add("hidden")); (views[v]||views.home).classList.remove("hidden"); if(v==="home") renderLatest(); if(v==="comment") renderComments();};
  const sync=()=>{const h=location.hash.replace("#",""); if(h==="advice")show("advice"); else if(h==="comment")show("comment"); else show("home");};

  // ===== FORM =====
  const PUBLISH_COOLDOWN_MS = 60*1000;
  const LAST_POST_TS="kb_last_post_time";
  const BAD_WORDS=["salak","aptal","lanet"];
  const clean=s=>(s||"").replace(/\s+/g," ").trim();
  const low=s=>!s||s.length<10||/([a-zA-ZçğıöşüÇĞİÖŞÜ])\1\1\1/.test(s)|| (s===s.toUpperCase()&&/[A-ZÇĞİÖŞÜ]/.test(s));
  const bad=s=>BAD_WORDS.some(w=>(s||"").toLowerCase().includes(w));
  const canPost=()=>Date.now()-parseInt(localStorage.getItem(LAST_POST_TS)||"0",10)>PUBLISH_COOLDOWN_MS;

  function initCounters(){
    // storyText: hem #storyText hem #story destekle
    const storyText = getEl("#storyText", "#story");
    const count = $("#storyCount");
    const upd=()=>{
      if(!storyText||!count) return;
      const v=storyText.value, len=v.length;
      count.textContent=len;
      count.parentElement.classList.remove("warn","max");
      if(len>=200) count.parentElement.classList.add("max"); else if(len>=180) count.parentElement.classList.add("warn");
    };
    storyText?.addEventListener("input", upd); upd();
  }

  function initPublish(){
    $("#btnPublish")?.addEventListener("click", async ()=>{
      try{
        // Hem eski hem yeni id'leri destekle
        const titleEl  = getEl("#storyTitle", "#title");
        const textEl   = getEl("#storyText",  "#story");
        const cityEl   = getEl("#storyCity",  "#city");
        const handleEl = getEl("#storyHandle","#handle");

        const title  = clean(titleEl?.value);
        const text   = clean(textEl?.value);
        const city   = clean(cityEl?.value);
        const handle = clean(handleEl?.value);

        if(!title) return toast("Başlık zorunlu");
        if(title.length>40) return toast("Başlık 40 karakteri aşamaz");
        if(!text) return toast("Problem boş olamaz");
        if(text.length>200) return toast("200 karakter sınırı");
        if(low(text)) return toast("Biraz daha açıklayıcı yaz");
        if(!canPost()) return toast("Lütfen 1 dakika sonra tekrar dene");
        if(bad(title)||bad(text)){ const ok=confirm("Uygunsuz kelime tespit edildi. Yine de gönderilsin mi?"); if(!ok) return; }

        await fsAddStory({title,text,city,handle});
        localStorage.setItem(LAST_POST_TS, Date.now().toString());

        if(titleEl)  titleEl.value="";
        if(textEl)   textEl.value="";
        if(cityEl)   cityEl.value="";
        if(handleEl) handleEl.value="";
        if($("#storyCount")) $("#storyCount").textContent="0";

        location.hash="#comment"; renderComments();
        toast("Global alana gönderildi");
      }catch(e){
        console.error(e); toast("Gönderilemedi (Firebase init?)");
      }
    });
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", ()=>{
    // Hash linkleri
    document.body.addEventListener("click",(e)=>{
      const a=e.target.closest('a[href^="#"], button[data-target^="#"]'); if(!a) return;
      const h=a.getAttribute("href")||a.getAttribute("data-target");
      if(h?.startsWith("#")){ e.preventDefault(); if(location.hash!==h) location.hash=h; else sync(); }
    });
    window.addEventListener("hashchange", sync);

    $("#homeSort")?.addEventListener("change", renderLatest);
    $("#homeLimit")?.addEventListener("change", renderLatest);
    $("#commentQuery")?.addEventListener("input", debounce(renderComments,200));

    initCounters();
    initPublish();
    sync();

    // Firestore hazır olduğunda ilk listeyi bas
    const waitDB = setInterval(()=>{
      if(window.db){ clearInterval(waitDB); renderLatest(); }
    }, 100);
  });
})();
