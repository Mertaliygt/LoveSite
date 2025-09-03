/* script.nav.js - Mobil menü kontrolü */
(() => {
  const $ = (s, p=document)=>p.querySelector(s);
  const menu = $("#navLinks");
  const btn = $("#menuToggle");
  const backdrop = $("#navBackdrop");
  if(!menu || !btn || !backdrop) return;

  const open = () => {
    menu.classList.add("open");
    btn.classList.add("active");
    document.body.classList.add("menu-open");
    btn.setAttribute("aria-expanded","true");
    backdrop.classList.add("show");
  };
  const close = () => {
    menu.classList.remove("open");
    btn.classList.remove("active");
    document.body.classList.remove("menu-open");
    btn.setAttribute("aria-expanded","false");
    backdrop.classList.remove("show");
  };

  btn.addEventListener("click", ()=>{
    if(menu.classList.contains("open")) close(); else open();
  });
  backdrop.addEventListener("click", close);

  // Menüde linke tıklayınca kapat
  menu.addEventListener("click", (e)=>{
    const a = e.target.closest("a[href^='#']");
    if(a) close();
  });

  // ESC tuşu ile kapatma
  window.addEventListener("keydown", (e)=>{ if(e.key === "Escape") close(); });

  // Hash değişince kapatma
  window.addEventListener("hashchange", close);
})();
