
window.FIREBASE_CONFIG = {
   apiKey: "AIzaSyBWmKgj-w0_deNrF2bxiMS0MUlPszDiF7I",
  authDomain: "loveweb-5ccf3.firebaseapp.com",
  projectId: "loveweb-5ccf3",
  storageBucket: "loveweb-5ccf3.firebasestorage.app",
  messagingSenderId: "423980752901",
  appId: "1:423980752901:web:9193a82e797e3900923c6c",
  measurementId: "G-1YEEPEY0XG" 
};

// Firebase compat SDK yükle
(function(){
  function add(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  const cfg = window.FIREBASE_CONFIG;
  if(!cfg){ console.error("[KB] FIREBASE_CONFIG eksik!"); return; }
  Promise.resolve()
    .then(()=>add("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"))
    .then(()=>add("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"))
    .then(()=>{
      /* global firebase */
      firebase.initializeApp(cfg);
      window.db = firebase.firestore();
      console.log("[KB] Firebase hazır.");
    })
    .catch(err=>console.error("[KB] Firebase yüklenemedi:", err));
})();
