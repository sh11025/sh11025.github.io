// Shin Jae Wan Portfolio — 공통 동작
// 크게 보기(영상·이미지), 영상 거르기, 슬라이더, 메인 장표 넘기기, 메뉴 표시, 다이어그램 그리기
(function(){
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const store = {
    get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v){ try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ── 크게 보기 창 (영상 재생 · 이미지 앞뒤 넘기기) ── */
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "크게 보기");
  modal.innerHTML = '<div class="modal-box"><div class="mbody"></div><div class="modal-bar"><span class="mcap"></span><div class="modal-ctl"><button type="button" class="mprev" aria-label="이전 이미지">← 이전</button><span class="pos"></span><button type="button" class="mnext" aria-label="다음 이미지">다음 →</button><button type="button" class="mclose">닫기 (Esc)</button></div></div></div>';
  document.body.appendChild(modal);
  const mbody = $(".mbody", modal), mcap = $(".mcap", modal), mclose = $(".mclose", modal);
  const mprev = $(".mprev", modal), mnext = $(".mnext", modal), mpos = $(".pos", modal);
  let lastFocus = null, group = [], gi = 0;
  const isOpen = () => modal.classList.contains("open");
  function open(html, cap){
    if (!isOpen()) lastFocus = document.activeElement;
    mbody.innerHTML = html; mcap.innerHTML = cap || "";
    modal.classList.add("open"); document.body.style.overflow = "hidden"; mclose.focus({preventScroll: true});
  }
  function close(){
    modal.classList.remove("open"); mbody.innerHTML = ""; document.body.style.overflow = ""; group = [];
    if (lastFocus) lastFocus.focus({preventScroll: true});
  }
  function showImg(i){
    gi = (i + group.length) % group.length;
    const z = group[gi];
    open('<img class="modal-img" src="' + esc(z.dataset.zoom) + '" alt="' + esc(z.dataset.cap || "") + '">', esc(z.dataset.cap || ""));
    const many = group.length > 1;
    mprev.hidden = mnext.hidden = mpos.hidden = !many;
    mpos.textContent = (gi + 1) + " / " + group.length;
  }
  mclose.addEventListener("click", close);
  mprev.addEventListener("click", () => showImg(gi - 1));
  mnext.addEventListener("click", () => showImg(gi + 1));
  modal.addEventListener("click", e => { if (e.target === modal) close(); });

  document.addEventListener("click", e => {
    const v = e.target.closest("[data-yt]");
    if (v) {
      const id = v.dataset.yt, watch = "https://www.youtube.com/watch?v=" + id;
      // 컴퓨터에서 파일로 바로 열면 유튜브가 재생을 막으므로 유튜브에서 엽니다
      if (location.protocol === "file:") { window.open(watch, "_blank", "noopener"); return; }
      mprev.hidden = mnext.hidden = mpos.hidden = true;
      open('<div class="modal-frame"><iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&origin=' + encodeURIComponent(location.origin) + '" title="' + esc(v.dataset.t || "영상") + '" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe></div>',
           '<a href="' + watch + '" target="_blank" rel="noopener">유튜브에서 보기 ↗</a>');
      return;
    }
    const z = e.target.closest("[data-zoom]");
    if (z) {
      group = z.dataset.group ? $$('[data-zoom][data-group="' + z.dataset.group + '"]') : [z];
      showImg(group.indexOf(z));
    }
  });
  document.addEventListener("keydown", e => {
    if (!isOpen()) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && group.length > 1) showImg(gi - 1);
    else if (e.key === "ArrowRight" && group.length > 1) showImg(gi + 1);
    else if (e.key === "Tab") { // 창 안에서만 이동
      const f = $$("button:not([hidden]),a,iframe", modal);
      if (!f.length) return;
      const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    }
  });

  /* ── 슬라이더: 한 번에 몇 개씩 보이고, ← →로 그만큼 넘깁니다 ── */
  function initRail(rail){
    const track = $(".track", rail);
    if (!track) return;
    const prev = $("[data-prev]", rail), next = $("[data-next]", rail), cnt = $(".rcount", rail);
    const items = () => [...track.children].filter(c => !c.hidden);
    function metrics(){
      const list = items();
      if (!list.length) return {n: 0, w: 1, vis: 1};
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const w = list[0].offsetWidth + gap;
      return {n: list.length, w, vis: Math.max(1, Math.floor((track.clientWidth + gap + 4) / w))};
    }
    function update(){
      const {n, w, vis} = metrics();
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      if (cnt) {
        if (!n) { cnt.textContent = "0 / 0"; return; }
        const first = Math.min(n, Math.round(track.scrollLeft / w) + 1);
        const last = Math.min(n, first + vis - 1);
        cnt.textContent = (last > first ? first + "–" + last : first) + " / " + n;
      }
    }
    const step = dir => { const {w, vis} = metrics(); track.scrollBy({left: dir * w * vis, behavior: reduce ? "auto" : "smooth"}); };
    if (prev) prev.addEventListener("click", () => step(-1));
    if (next) next.addEventListener("click", () => step(1));
    let tk = false;
    track.addEventListener("scroll", () => { if (!tk) { tk = true; requestAnimationFrame(() => { update(); tk = false; }); } }, {passive: true});
    rail.addEventListener("rail:reset", () => { track.scrollLeft = 0; update(); });
    addEventListener("resize", update);
    addEventListener("load", update);
    rail._step = step; rail._update = update;
    rail.addEventListener("mouseenter", () => { hoverRail = rail; });
    rail.addEventListener("mouseleave", () => { if (hoverRail === rail) hoverRail = null; });
    update();
  }
  let hoverRail = null;
  const rails = $$(".rail");
  rails.forEach(initRail);

  /* ── 영상 거르기 ── */
  $$("[data-filter-for]").forEach(box => {
    const grid = document.getElementById(box.dataset.filterFor);
    const cards = $$(".vcard", grid);
    const btns = $$("button", box);
    const rail = grid.closest(".rail");
    const match = (c, f) => f === "all" || (c.dataset.r || "").split(",").includes(f) || c.dataset.s === f;
    btns.forEach(b => {
      const n = cards.filter(c => match(c, b.dataset.f)).length;
      b.insertAdjacentHTML("beforeend", "<em>" + n + "</em>");
      b.addEventListener("click", () => {
        btns.forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        cards.forEach(c => { c.hidden = !match(c, b.dataset.f); });
        if (rail) rail.dispatchEvent(new Event("rail:reset"));
      });
    });
  });

  /* ── 전체화면 ── */
  const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function toggleFS(){
    const d = document;
    try {
      if (fsOn()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    } catch (err) {}
  }

  /* ── 메인 장표: 16:9 한 장씩 넘기기 ── */
  const deck = $(".deck");
  let deckOn = () => false;
  if (deck) {
    const slides = $$(".slide", deck);
    const n = slides.length;
    const MQ = matchMedia("(min-width:1200px) and (min-height:620px)");
    const navLinks = $$(".d-nav a", deck), dots = $$(".d-dots button", deck);
    const tocBox = $(".d-toc", deck), tocLinks = $$(".d-toc-g a", deck);
    const cntB = $(".d-count b", deck), cntEm = $(".d-count em", deck), prog = $(".d-prog i", deck);
    const prevB = $("[data-prev-slide]", deck), nextB = $("[data-next-slide]", deck);
    const viewB = $("[data-view]", deck), fsB = $("[data-fs]", deck), tocB = $("[data-toc]", deck);
    const slidesBox = $(".slides", deck), stage = $(".stage", deck);
    let cur = 0;
    deckOn = () => root.classList.contains("is-deck");
    const pad2 = k => (k < 10 ? "0" : "") + k;

    function indexOfTarget(id){
      if (!id) return -1;
      const el = document.getElementById(id);
      if (!el) return -1;
      const s = el.closest(".slide");
      return s ? slides.indexOf(s) : -1;
    }
    function fit(){ root.style.setProperty("--z", Math.min(innerWidth / 1600, innerHeight / 900)); }
    function markNav(ch){ navLinks.forEach(a => a.classList.toggle("on", a.dataset.ch === ch)); }

    function go(i, opts = {}){
      i = Math.max(0, Math.min(n - 1, i));
      cur = i;
      if (!deckOn()) return;
      slides.forEach((s, k) => {
        s.classList.toggle("cur", k === i);
        s.classList.toggle("before", k < i);
        s.classList.toggle("after", k > i);
        s.inert = k !== i;
        s.setAttribute("aria-hidden", k === i ? "false" : "true");
      });
      [slidesBox, stage, deck].forEach(el => { el.scrollTop = 0; el.scrollLeft = 0; });
      const s = slides[i];
      cntB.textContent = pad2(i + 1); cntEm.textContent = s.dataset.title;
      prog.style.width = ((i + 1) / n * 100) + "%";
      dots.forEach((d, k) => { d.classList.toggle("on", k === i); d.setAttribute("aria-current", k === i ? "step" : "false"); });
      tocLinks.forEach((a, k) => a.classList.toggle("on", k === i));
      if (prevB) prevB.disabled = i === 0; if (nextB) nextB.disabled = i === n - 1;
      markNav(s.dataset.ch);
      if (location.hash !== "#" + s.id) history.replaceState(null, "", "#" + s.id);
      $$(".rv", s).forEach(el => el.classList.add("in"));
      if (!reduce) $$(".bars", s).forEach(b => { b.classList.remove("go"); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add("go"))); });
      else $$(".bars", s).forEach(b => b.classList.add("go"));
      $$(".rail", s).forEach(r => r._update && r._update());
      if (opts.focus) { s.tabIndex = -1; s.focus({preventScroll: true}); }
    }

    function setMode(on){
      root.classList.toggle("is-deck", on);
      if (viewB) viewB.textContent = on ? "스크롤로 보기" : "장표로 보기";
      if (on) { fit(); go(cur); }
      else {
        slides.forEach(s => { s.classList.remove("cur", "before", "after"); s.inert = false; s.removeAttribute("aria-hidden"); });
        closeToc();
        requestAnimationFrame(() => slides[cur].scrollIntoView({block: "start"}));
      }
      rails.forEach(r => r._update && r._update());
      dispatchEvent(new Event("resize"));
    }
    function wantDeck(){ return MQ.matches && store.get("sjw-view") !== "scroll"; }

    // 목차
    function openToc(){ if (!deckOn()) return; tocBox.hidden = false; const a = tocLinks[cur]; if (a) a.focus({preventScroll: true}); }
    function closeToc(){ if (!tocBox.hidden) { tocBox.hidden = true; if (tocB && deckOn()) tocB.focus({preventScroll: true}); } }
    if (tocB) tocB.addEventListener("click", openToc);
    $("[data-toc-close]", deck).addEventListener("click", closeToc);
    tocBox.addEventListener("click", e => { if (e.target === tocBox) closeToc(); });

    // 버튼
    if (prevB) prevB.addEventListener("click", () => go(cur - 1));
    if (nextB) nextB.addEventListener("click", () => go(cur + 1));
    dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
    if (viewB) viewB.addEventListener("click", () => {
      const on = !deckOn();
      store.set("sjw-view", on ? null : "scroll");
      setMode(on);
      closeMenu();
    });
    if (fsB) fsB.addEventListener("click", () => { toggleFS(); closeMenu(); });
    const menuB = $("[data-viewmenu]", deck), pop = $(".d-pop", deck);
    function closeMenu(){ if (pop && !pop.hidden) { pop.hidden = true; menuB.setAttribute("aria-expanded", "false"); } }
    if (menuB && pop) {
      menuB.addEventListener("click", e => { e.stopPropagation(); pop.hidden = !pop.hidden; menuB.setAttribute("aria-expanded", String(!pop.hidden)); });
      document.addEventListener("click", e => { if (!e.target.closest(".d-menu")) closeMenu(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
    }

    // 장 안의 바로가기 링크(#…)는 그 장으로 넘깁니다
    document.addEventListener("click", e => {
      if (!deckOn()) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const k = indexOfTarget(a.getAttribute("href").slice(1));
      if (k < 0) return;
      e.preventDefault(); closeToc(); go(k);
    });
    addEventListener("hashchange", () => { const k = indexOfTarget(location.hash.slice(1)); if (k >= 0) go(k); });

    // 키보드
    document.addEventListener("keydown", e => {
      if (isOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === "f" || e.key === "F" || e.key === "ㄹ") { e.preventDefault(); toggleFS(); return; }
      if (!deckOn()) return;
      if (!tocBox.hidden) { if (e.key === "Escape") { e.preventDefault(); closeToc(); } return; }
      // 마우스가 슬라이더 위에 있으면 ← →는 그 슬라이더를 넘깁니다
      if (hoverRail && hoverRail.closest(".slide.cur") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const btn = $(e.key === "ArrowLeft" ? "[data-prev]" : "[data-next]", hoverRail);
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); return; }
      }
      const onCtl = /BUTTON|A/.test(tag);
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !onCtl && !e.shiftKey)) { e.preventDefault(); go(cur + 1, {focus: true}); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && !onCtl && e.shiftKey)) { e.preventDefault(); go(cur - 1, {focus: true}); }
      else if (e.key === "Home") { e.preventDefault(); go(0, {focus: true}); }
      else if (e.key === "End") { e.preventDefault(); go(n - 1, {focus: true}); }
      else if (e.key === "Escape" && fsOn()) toggleFS();
    });

    // 마우스 휠: 한 번 굴리면 한 장 (관성 스크롤은 한 번으로 셉니다)
    let wLock = false, wt = 0;
    deck.addEventListener("wheel", e => {
      if (!deckOn() || isOpen() || !tocBox.hidden) return;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (e.target.closest(".track") && ax > ay) return; // 슬라이더는 옆으로
      e.preventDefault();
      clearTimeout(wt); wt = setTimeout(() => { wLock = false; }, 180);
      if (wLock || Math.max(ax, ay) < 18) return;
      wLock = true;
      go(cur + ((ay >= ax ? e.deltaY : e.deltaX) > 0 ? 1 : -1));
    }, {passive: false});

    // 터치: 옆으로 밀어서 넘기기
    let tx = 0, ty = 0, tIn = false;
    deck.addEventListener("touchstart", e => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; tIn = !!e.target.closest(".track"); }, {passive: true});
    deck.addEventListener("touchend", e => {
      if (!deckOn() || tIn) return;
      const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) go(cur + (dx < 0 ? 1 : -1));
    }, {passive: true});

    // 스크롤로 볼 때 위쪽 메뉴 표시
    if ("IntersectionObserver" in window) {
      const o = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting || deckOn()) return;
        cur = slides.indexOf(en.target);
        markNav(en.target.dataset.ch);
        const on = navLinks.find(a => a.classList.contains("on")), bar = on && on.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft += on.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - on.offsetWidth) / 2;
      }), {rootMargin: "-45% 0px -50% 0px"});
      slides.forEach(s => o.observe(s));
    }

    // 화면 크기가 바뀌면 장표/스크롤을 다시 정합니다
    let rt;
    addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        root.classList.toggle("can-deck", MQ.matches);
        const want = wantDeck();
        if (want !== deckOn()) setMode(want);
        else if (want) fit();
      }, 80);
    });
    const onFS = () => { if (fsB) fsB.innerHTML = (fsOn() ? "전체화면 끄기" : "전체화면") + " <kbd>F</kbd>"; };
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("webkitfullscreenchange", onFS);

    // 시작
    const start = indexOfTarget(location.hash.slice(1));
    cur = start >= 0 ? start : 0;
    root.classList.toggle("can-deck", MQ.matches);
    if (wantDeck()) { setMode(true); } else { root.classList.remove("is-deck"); if (viewB) viewB.textContent = "장표로 보기"; }
  } else {
    /* 설명 페이지: 위쪽 목차 표시 */
    (function spy(links, rootMargin){
      const o = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
        const on = links.find(a => a.classList.contains("on")), bar = on && on.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft += on.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - on.offsetWidth) / 2;
      }), {rootMargin});
      $$("section[id]").forEach(s => o.observe(s));
    })($$(".toc-bar a[href^='#']"), "-35% 0px -60% 0px");
  }

  /* ── Render 무료 서버 미리 깨우기 ──
     포트폴리오가 열리면 잠든 서버(프롬마루·스토리 담 이음·홈터)에 조용히 신호를 보내,
     '사용해 보기'를 눌렀을 때 기다리지 않게 합니다. 같은 서버는 30분에 한 번만 보냅니다. */
  (function wake(){
    const tags = $$("[data-wake-tag]");
    const urls = [...new Set([...$$("[data-wake]").map(a => a.dataset.wake), ...tags.map(t => t.dataset.wakeTag)])];
    if (!urls.length || !("fetch" in window) || location.protocol === "file:") return;
    const show = (u, st) => tags.filter(t => t.dataset.wakeTag === u).forEach(t => {
      t.hidden = false; t.className = "wake " + st;
      t.textContent = st === "ready" ? "바로 열려요" : "서버 준비 중… (최대 1분)";
    });
    const KEY = u => "sjw-wake:" + u;
    const go = () => urls.forEach(u => {
      let last = 0; try { last = +sessionStorage.getItem(KEY(u)) || 0; } catch (e) {}
      if (Date.now() - last < 30 * 60 * 1000) { show(u, "ready"); return; }
      show(u, "busy");
      const ctl = "AbortController" in window ? new AbortController() : null;
      const t = setTimeout(() => ctl && ctl.abort(), 90000);
      fetch(u, {mode: "no-cors", cache: "no-store", signal: ctl ? ctl.signal : undefined})
        .then(() => { show(u, "ready"); try { sessionStorage.setItem(KEY(u), String(Date.now())); } catch (e) {} })
        .catch(() => tags.filter(x => x.dataset.wakeTag === u).forEach(x => { x.hidden = true; }))
        .finally(() => clearTimeout(t));
    });
    const start = () => setTimeout(go, 2500);
    if (document.readyState === "complete") start(); else addEventListener("load", start);
  })();

  /* ── 읽은 만큼 표시줄 · 맨 위로 ── */
  const bar = $(".progress");
  const up = document.createElement("button");
  up.type = "button"; up.className = "to-top"; up.setAttribute("aria-label", "맨 위로"); up.textContent = "↑";
  up.addEventListener("click", () => scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"}));
  document.body.appendChild(up);
  let ticking = false;
  function onScroll(){
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    up.classList.toggle("show", !deckOn() && scrollY > innerHeight * 0.9);
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  onScroll();

  /* ── 나타나기 효과 · 막대그래프 채우기 ── */
  const rvs = $$(".rv, .bars");
  if ("IntersectionObserver" in window && !reduce) {
    const o = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting || (deckOn() && !en.target.closest(".slide.cur"))) return;
      en.target.classList.add(en.target.classList.contains("bars") ? "go" : "in");
      o.unobserve(en.target);
    }), {rootMargin: "0px 0px -8% 0px"});
    rvs.forEach(el => o.observe(el));
  } else rvs.forEach(el => el.classList.add("in", "go"));

  /* ── 이메일 복사 ── */
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "복사됨 ✓"; }
    catch (err) { b.textContent = "복사 실패"; }
    setTimeout(() => { b.textContent = "주소 복사"; }, 1800);
  }));

  /* ── 다이어그램 (머메이드) ──
     넓은 곳은 가로로, 좁은 곳은 세로로 그려서 글씨가 작아지지 않게 합니다. */
  const mms = $$(".mm");
  if (mms.length) {
    const SRC = window.MERMAID_SRC || "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js";
    mms.forEach(m => m.classList.add("loading"));
    const fail = () => mms.forEach(m => { m.classList.remove("loading"); m.classList.add("failed"); });
    const s = document.createElement("script");
    s.src = SRC; s.async = true;
    s.onerror = fail;
    s.onload = () => {
      if (!window.mermaid) return fail();
      const css = getComputedStyle(root);
      const v = k => css.getPropertyValue(k).trim();
      window.mermaid.initialize({
        startOnLoad: false, securityLevel: "loose", theme: "base",
        fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        themeVariables: {
          fontSize: "15px", primaryColor: v("--card"), primaryTextColor: v("--ink"), primaryBorderColor: v("--line"),
          lineColor: v("--coral"), secondaryColor: v("--bg-soft"), tertiaryColor: v("--bg"),
          clusterBkg: v("--bg"), clusterBorder: v("--line"), edgeLabelBackground: v("--card"), textColor: v("--ink-2")
        },
        flowchart: {htmlLabels: true, curve: "basis", padding: 12, nodeSpacing: 26, rankSpacing: 38, useMaxWidth: true}
      });
      let k = 0, queue = Promise.resolve();
      // 머메이드는 한 번에 하나씩 그려야 안전합니다
      const draw = m => (queue = queue.then(() => drawNow(m)).catch(() => {}));
      async function drawNow(m){
        const raw = $(".mm-src", m).textContent;
        const narrow = m.clientWidth < (+m.dataset.bp || 760);
        const dir = narrow ? (m.dataset.narrow || "TD") : (m.dataset.wide || "LR");
        if (m.dataset.dir === dir) return;
        try {
          const {svg, bindFunctions} = await window.mermaid.render("mmd" + (++k), raw.replace(/\bDIR\b/, dir));
          $$(".mm-out", m).forEach(x => x.remove());
          const out = document.createElement("div");
          out.className = "mm-out"; out.innerHTML = svg;
          m.appendChild(out);
          if (bindFunctions) bindFunctions(out);
          const svgEl = $("svg", out);
          if (svgEl) { svgEl.setAttribute("role", "img"); svgEl.setAttribute("aria-label", m.getAttribute("aria-label") || "다이어그램"); }
          m.dataset.dir = dir; m.classList.remove("loading", "failed");
        } catch (err) { m.classList.remove("loading"); m.classList.add("failed"); }
      }
      if (deck) mms.forEach(draw); // 장표는 모든 장을 미리 그려 둡니다
      else {
        const o = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { draw(en.target); o.unobserve(en.target); } }), {rootMargin: "300px 0px"});
        mms.forEach(m => o.observe(m));
      }
      let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => mms.filter(m => m.dataset.dir).forEach(draw), 200); });
    };
    document.head.appendChild(s);
  }
})();
