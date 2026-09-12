/* 가덕교회 홈페이지 공용 스크립트 */
(function () {
  "use strict";
  var D = window.SITE_DATA || { config: {}, weeks: [], videos: [] };
  var CFG = D.config || {};
  var WEEKS = (D.weeks || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var VIDEOS = (D.videos || []).slice();

  /* ── 유틸 ── */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmtDate(d, withYear) {
    if (!d || d.length < 8) return d || "";
    var y = d.slice(0, 4), m = +d.slice(4, 6), dd = +d.slice(6, 8);
    return (withYear ? y + "년 " : "") + m + "월 " + dd + "일";
  }
  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  var BOOK_ABBR = {
    "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신",
    "여호수아": "수", "사사기": "삿", "시편": "시", "잠언": "잠", "이사야": "사",
    "마태복음": "마", "마가복음": "막", "누가복음": "눅", "요한복음": "요",
    "사도행전": "행", "로마서": "롬", "갈라디아서": "갈", "에베소서": "엡",
    "빌립보서": "빌", "골로새서": "골", "히브리서": "히", "야고보서": "약",
    "베드로전서": "벧전", "요한계시록": "계"
  };
  function bookOf(scripture) {
    if (!scripture) return "";
    var m = scripture.match(/^[가-힣]+/);
    if (!m) return "";
    return BOOK_ABBR[m[0]] || m[0].slice(0, 2);
  }
  /* 타일에 쓸 짧은 본문 표기: '신26:1~11' → '신26' (책 이름 + 장) */
  function tileRef(scripture) {
    var book = bookOf(scripture);
    if (!book) return "말씀";
    var ch = scripture.match(/(\d+):/);
    return book + (ch ? ch[1] : "");
  }
  function weekByDate(date) {
    for (var i = 0; i < WEEKS.length; i++) if (WEEKS[i].date === date) return WEEKS[i];
    return null;
  }
  /* 52주 모자이크는 config.year(2026) 주보만 쓴다.
     공유 드라이브에 지난 연도 주보가 섞여 들어와도 올해 칸을 잘못 채우지 않도록 막는다. */
  function sundayWeeks() {
    var year = String(CFG.year || new Date().getFullYear());
    return WEEKS.filter(function (w) {
      return !w.special && String(w.date).slice(0, 4) === year;
    });
  }
  function latestWeek() {
    var s = sundayWeeks();
    return s.length ? s[s.length - 1] : null;
  }
  function firstSundayOfYear(year) {
    var d = new Date(year, 0, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return d;
  }
  function dateOfWeekNo(n) {
    var year = CFG.year || new Date().getFullYear();
    var d = firstSundayOfYear(year);
    d.setDate(d.getDate() + (n - 1) * 7);
    var mm = ("0" + (d.getMonth() + 1)).slice(-2), dd = ("0" + d.getDate()).slice(-2);
    return "" + d.getFullYear() + mm + dd;
  }
  function videosOf(date) {
    return VIDEOS.filter(function (v) { return v.date === date; });
  }
  function thumbUrl(id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }

  /* ── 공통: 영상 재생 모달 ── */
  function ensureModal() {
    var m = $("#playerModal");
    if (m) return m;
    m = el("div", "player-modal");
    m.id = "playerModal";
    m.innerHTML =
      '<div class="pm-box">' +
      '<div class="pm-frame"><iframe allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="pm-title"><span class="pm-name"></span><button class="pm-close" type="button">닫기</button></div>' +
      "</div>";
    document.body.appendChild(m);
    function close() {
      m.classList.remove("show");
      $("iframe", m).src = "";
    }
    $(".pm-close", m).addEventListener("click", close);
    m.addEventListener("click", function (e) { if (e.target === m) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    return m;
  }
  function playVideo(video) {
    var m = ensureModal();
    $("iframe", m).src = "https://www.youtube.com/embed/" + video.id + "?autoplay=1&rel=0";
    $(".pm-name", m).textContent = video.title;
    m.classList.add("show");
  }
  function videoCard(v) {
    var w = weekByDate(v.date);
    var card = el("article", "video-card");
    card.innerHTML =
      '<div class="thumb"><img loading="lazy" alt="" src="' + thumbUrl(v.id) + '"><span class="play"><i>▶</i></span></div>' +
      '<div class="vc-body">' +
      '<div class="vc-kind">' + esc(v.kind || "예배") + "</div>" +
      '<div class="vc-title">' + esc(fmtDate(v.date, true)) + " " + esc(v.kind || "") + "</div>" +
      '<div class="vc-meta">' +
      (w && w.scripture && v.kind === "오전예배" ? "본문 " + esc(w.scripture) + (w.hymn ? " · 찬송 " + esc(w.hymn) : "") : esc(v.views || "")) +
      "</div></div>";
    card.addEventListener("click", function () { playVideo(v); });
    return card;
  }

  /* ── 52주 말씀 모자이크 ── */
  var TILE_W = 100, TILE_H = 106, COLS = 13, ROWS = 4;
  function buildMosaic(container, detailBox) {
    var NS = "http://www.w3.org/2000/svg";
    var W = COLS * TILE_W, H = ROWS * TILE_H;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "2026년 52주 말씀 여정 모자이크");

    /* 아트워크: 광야에서 은혜의 빛으로 향하는 여정 (연중 채워짐) */
    svg.innerHTML =
      '<defs>' +
      '<linearGradient id="mzSky" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#e9eaf8"/><stop offset="0.55" stop-color="#d9dcf2"/><stop offset="1" stop-color="#f2ead8"/>' +
      "</linearGradient>" +
      '<radialGradient id="mzSun" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#f7e2ae"/><stop offset="0.5" stop-color="#e9bc62"/><stop offset="1" stop-color="#e9bc62" stop-opacity="0"/>' +
      "</radialGradient>" +
      "</defs>" +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#mzSky)"/>' +
      '<circle cx="' + (W - 150) + '" cy="86" r="150" fill="url(#mzSun)"/>' +
      '<circle cx="' + (W - 150) + '" cy="86" r="46" fill="#f0cd7e"/>' +
      '<path d="M0 ' + (H * 0.52) + " Q " + W * 0.18 + " " + H * 0.38 + " " + W * 0.42 + " " + H * 0.5 +
      " T " + W * 0.78 + " " + H * 0.44 + " Q " + W * 0.9 + " " + H * 0.42 + " " + W + " " + H * 0.47 +
      " L " + W + " " + H + " L 0 " + H + ' Z" fill="#a9acd8" opacity="0.85"/>' +
      '<path d="M0 ' + (H * 0.68) + " Q " + W * 0.22 + " " + H * 0.56 + " " + W * 0.5 + " " + H * 0.66 +
      " T " + W + " " + H * 0.6 + " L " + W + " " + H + " L 0 " + H + ' Z" fill="#8286c6"/>' +
      '<path d="M0 ' + (H * 0.85) + " Q " + W * 0.3 + " " + H * 0.74 + " " + W * 0.58 + " " + H * 0.84 +
      " T " + W + " " + H * 0.78 + " L " + W + " " + H + " L 0 " + H + ' Z" fill="#5d61a8"/>' +
      '<path d="M ' + W * 0.04 + " " + H + " C " + W * 0.3 + " " + H * 0.82 + " " + W * 0.45 + " " + H * 0.9 + " " + W * 0.62 + " " + H * 0.66 +
      " S " + W * 0.85 + " " + H * 0.3 + " " + (W - 150) + ' 100" fill="none" stroke="#fdfaf2" stroke-width="10" stroke-linecap="round" opacity="0.9"/>';

    var byWeekNo = {};
    sundayWeeks().forEach(function (w) { byWeekNo[w.week] = w; });

    var tilesG = document.createElementNS(NS, "g");
    svg.appendChild(tilesG);

    var selected = null;
    function selectWeek(w, tile) {
      if (!detailBox) return;
      if (selected) selected.setAttribute("stroke-width", "1");
      selected = tile;
      tile.setAttribute("stroke-width", "3");
      renderDetail(detailBox, w);
      detailBox.classList.add("show");
    }

    for (var n = 1; n <= 52; n++) {
      var c = (n - 1) % COLS, r = Math.floor((n - 1) / COLS);
      var x = c * TILE_W + 3, y = r * TILE_H + 3, w = TILE_W - 6, h = TILE_H - 6;
      var g = document.createElementNS(NS, "g");
      var week = byWeekNo[n];
      var rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", x); rect.setAttribute("y", y);
      rect.setAttribute("width", w); rect.setAttribute("height", h);
      rect.setAttribute("rx", 10);
      var title = document.createElementNS(NS, "title");

      if (week) {
        g.setAttribute("class", "mosaic-tile");
        rect.setAttribute("fill", "rgba(44,46,88,0.16)");
        rect.setAttribute("stroke", "#ffffff");
        rect.setAttribute("stroke-width", "1");
        var t1 = document.createElementNS(NS, "text");
        t1.setAttribute("x", x + w / 2); t1.setAttribute("y", y + h / 2 - 3);
        t1.setAttribute("text-anchor", "middle");
        t1.setAttribute("fill", "#ffffff");
        t1.setAttribute("font-size", "23");
        t1.setAttribute("font-weight", "800");
        t1.setAttribute("letter-spacing", "-0.5");
        t1.setAttribute("stroke", "rgba(52,54,105,0.6)");
        t1.setAttribute("stroke-width", "3");
        t1.setAttribute("paint-order", "stroke");
        t1.textContent = tileRef(week.scripture);
        /* 주차 배지: 흰 알약 위에 네이비 숫자 — 배경이 밝든 어둡든 항상 읽힌다 */
        var badge = document.createElementNS(NS, "rect");
        badge.setAttribute("x", x + w / 2 - 18); badge.setAttribute("y", y + h - 25);
        badge.setAttribute("width", 36); badge.setAttribute("height", 17);
        badge.setAttribute("rx", 8.5);
        badge.setAttribute("fill", "rgba(255,255,255,0.88)");
        var t2 = document.createElementNS(NS, "text");
        t2.setAttribute("x", x + w / 2); t2.setAttribute("y", y + h - 12);
        t2.setAttribute("text-anchor", "middle");
        t2.setAttribute("fill", "#3c3e78");
        t2.setAttribute("font-size", "12.5");
        t2.setAttribute("font-weight", "800");
        t2.textContent = n + "주";
        title.textContent = n + "/52주 · " + fmtDate(week.date) + (week.scripture ? " · " + week.scripture : "");
        g.appendChild(rect); g.appendChild(t1); g.appendChild(badge); g.appendChild(t2); g.appendChild(title);
        (function (wk, rc) {
          g.addEventListener("click", function () { selectWeek(wk, rc); });
        })(week, rect);
      } else {
        g.setAttribute("class", "mosaic-tile empty");
        rect.setAttribute("fill", "rgba(244,245,251,0.94)");
        rect.setAttribute("stroke", "#d8daea");
        rect.setAttribute("stroke-width", "1");
        var t = document.createElementNS(NS, "text");
        t.setAttribute("x", x + w / 2); t.setAttribute("y", y + h / 2 + 5);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("fill", "#b4b6cf");
        t.setAttribute("font-size", "15");
        t.setAttribute("font-weight", "600");
        t.textContent = n;
        title.textContent = n + "/52주 · " + fmtDate(dateOfWeekNo(n)) + " (아직 채워지지 않음)";
        g.appendChild(rect); g.appendChild(t); g.appendChild(title);
      }
      tilesG.appendChild(g);
    }
    container.appendChild(svg);

    /* 최근 주 자동 선택 */
    var lw = latestWeek();
    if (lw && detailBox) renderDetail(detailBox, lw), detailBox.classList.add("show");
  }

  function renderDetail(box, w) {
    var vids = videosOf(w.date);
    var html =
      '<div class="wd-top">' +
      '<span class="chip">' + w.week + "/52주</span>" +
      "<strong>" + esc(fmtDate(w.date, true)) + " 주일</strong>" +
      (w.sundayTitle ? '<span class="chip">' + esc(w.sundayTitle) + "</span>" : "") +
      (w.scripture ? '<span style="color:var(--ink-mute);font-size:var(--fs-body)">본문 ' + esc(w.scripture) + "</span>" : "") +
      (w.hymn ? '<span style="color:var(--ink-mute);font-size:var(--fs-body)">찬송 ' + esc(w.hymn) + "</span>" : "") +
      "</div>" +
      ((w.study && w.study.quote) || w.quote ? "<blockquote>“" + esc((w.study && w.study.quote) || w.quote) + "”</blockquote>" : "") +
      '<div class="wd-actions">' +
      (w.pages && w.pages.length ? '<a class="btn small ghost" href="bulletins.html?date=' + w.date + '">주보 보기</a>' : "") +
      (vids.length ? '<button class="btn small" type="button" data-play="' + w.date + '">설교 영상 보기</button>' : "") +
      ((w.study || w.studyImage) ? '<a class="btn small ghost" href="study.html?date=' + w.date + '">성경공부</a>' : "") +
      "</div>";
    box.innerHTML = html;
    var pb = $("[data-play]", box);
    if (pb) pb.addEventListener("click", function () {
      var list = videosOf(pb.getAttribute("data-play"));
      var main = list.filter(function (v) { return v.kind === "오전예배"; })[0] || list[0];
      if (main) playVideo(main);
    });
  }

  /* ── 페이지: 홈 ── */
  function pageHome() {
    var lw = latestWeek();
    /* 이번 주 카드 */
    var tw = $("#thisWeek");
    if (tw && lw) {
      tw.innerHTML =
        '<div class="tw-label">' + lw.week + "/52주 · " + esc(fmtDate(lw.date, true)) + " 주일말씀</div>" +
        '<div class="tw-quote">“' + esc((lw.study && lw.study.quote) || lw.quote || CFG.slogan || "") + "”</div>" +
        '<div class="tw-meta">' +
        (lw.scripture ? "<span>본문 " + esc(lw.scripture) + "</span>" : "") +
        (lw.hymn ? "<span>찬송 " + esc(lw.hymn) + "</span>" : "") +
        (lw.sundayTitle ? "<span>" + esc(lw.sundayTitle) + "</span>" : "") +
        "</div>";
    }
    /* 모자이크 */
    var holder = $("#mosaicHolder");
    if (holder) {
      buildMosaic(holder, $("#weekDetail"));
      var filled = sundayWeeks().length;
      var pr = $("#mosaicProgress");
      if (pr) pr.textContent = filled + " / 52주";
      var bar = $("#mosaicBar i");
      if (bar) bar.style.width = Math.round(filled / 52 * 100) + "%";
    }
    /* 최근 설교 3개 (오전예배 우선) */
    var vg = $("#latestVideos");
    if (vg) {
      var mains = VIDEOS.filter(function (v) { return v.kind === "오전예배"; }).slice(0, 3);
      if (!mains.length) mains = VIDEOS.slice(0, 3);
      if (mains.length) mains.forEach(function (v) { vg.appendChild(videoCard(v)); });
      else vg.appendChild(el("div", "empty-note", "아직 등록된 설교 영상이 없습니다."));
    }
    /* 새벽기도 + 소식 */
    if (lw) {
      var dawnBox = $("#dawnList");
      if (dawnBox && lw.dawn && lw.dawn.length) {
        lw.dawn.forEach(function (d) {
          dawnBox.appendChild(el("div", "dawn-item",
            '<div class="d-top"><span class="d-day">' + esc(d.day) + " " + esc(d.dow) + '</span>' +
            '<span class="d-title">' + esc(d.title) + '</span>' +
            (d.ref ? '<span class="d-ref">' + esc(d.ref) + "</span>" : "") + "</div>" +
            '<div class="d-msg">' + esc(d.msg) + " · " + esc(d.leader) + "</div>"));
        });
      } else if (dawnBox) {
        dawnBox.appendChild(el("div", "news-item", '<div class="n-sub">이번 주 새벽기도 정보가 아직 없습니다.</div>'));
      }
      var newsBox = $("#newsList");
      if (newsBox && lw.news && lw.news.length) {
        (lw.headline ? [{ title: lw.headline, sub: lw.headlineSub || "" }].concat(lw.news) : lw.news)
          .slice(0, 6).forEach(function (nItem) {
            newsBox.appendChild(el("div", "news-item",
              '<div class="n-title">' + esc(nItem.title) + '</div>' +
              (nItem.sub ? '<div class="n-sub">' + esc(nItem.sub) + "</div>" : "")));
          });
      }
    }
    /* 예배 안내 */
    renderServices($("#serviceGrid"));
    /* 선교관 지도 */
    initMissionMap();
  }

  /* ── 예배 안내 카드 ── */
  function renderServices(grid) {
    if (!grid || !CFG.services) return;
    CFG.services.forEach(function (s) {
      var t = String(s.time || "");
      var hh = parseInt(t.split(":")[0], 10);
      var ampm = isNaN(hh) ? "" : (hh < 12 ? "오전" : "오후");
      var disp = t;
      if (!isNaN(hh)) {
        var h12 = hh % 12 === 0 ? 12 : hh % 12;
        disp = h12 + ":" + (t.split(":")[1] || "00");
      }
      var name = esc(s.name).replace(/^주일\s*/, "");
      grid.appendChild(el("div", "service-card" + (s.main ? " main" : ""),
        '<div class="sc-top">' +
        (s.day ? '<span class="sc-day">' + esc(s.day) + "</span>" : "") +
        '<span class="sc-name">' + name + "</span></div>" +
        '<div class="sc-time">' + (ampm ? "<em>" + ampm + "</em>" : "") + esc(disp) + "</div>" +
        (s.note ? '<div class="sc-note">' + esc(s.note) + "</div>" : "")));
    });
  }

  /* ── 가덕선교마을 지도 (직접 그린 SVG, 구글맵 실측 배치 기반) ── */
  /* 카카오맵 위성사진 실측 기반 배치 (2026-09 사용자 제공 캡처).
     북쪽: 마을(도서관·정두리·파출소·초등·중학교) / 남쪽: 가덕교회 캠퍼스(본당·식당·스토리하우스·선교관동)
     101·201·202호는 캠퍼스 안 선교관동 한 건물이라 house-101 하나로 그린다. */
  var MV = {
    "jeongduri":      { x: 520, y: 108, kind: "house" },
    "library":        { x: 300, y: 122, kind: "library" },
    "police":         { x: 520, y: 208, kind: "police" },
    "elementary":     { x: 524, y: 302, kind: "school" },
    "middle":         { x: 278, y: 310, kind: "school" },
    "seomgim":        { x: 612, y: 392, kind: "house" },
    "church":         { x: 325, y: 480, kind: "church" },
    "house-101":      { x: 450, y: 505, kind: "annex" },
    "greenville-401": { x: 452, y: 592, kind: "house" },
    "haengun-401":    { x: 272, y: 592, kind: "house" }
  };
  var MV_HIT = { annex: [76, 82], house: [88, 76], church: [104, 158], school: [140, 78], police: [92, 80], library: [96, 80] };

  function mvLabel(x, y, txt, size) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 13.5) +
      '" font-weight="700" fill="#3c3e78" stroke="#ffffff" stroke-width="3.5" paint-order="stroke">' + esc(txt) + "</text>";
  }
  function mvWin(x, y, w, h) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="#dfe2f4" stroke="#5a5ea6" stroke-width="1"/>';
  }
  function mvBody(x, y, w, h, fill) {
    return '<rect x="' + (x - w / 2) + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" fill="' + (fill || "#fffdf6") + '" stroke="#4a4c86" stroke-width="1.2"/>';
  }
  function mvRoof(x, topY, w, rise, fill) {
    return '<polygon points="' + (x - w / 2 - 6) + "," + topY + " " + (x + w / 2 + 6) + "," + topY + " " + x + "," + (topY - rise) +
      '" fill="' + fill + '" stroke="#4a4c86" stroke-width="1.2" stroke-linejoin="round"/>';
  }
  function mvDoor(x, y, w, h, fill) {
    return '<rect x="' + (x - w / 2) + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" rx="2" fill="' + (fill || "#5a5ea6") + '"/>';
  }
  function mvBuilding(id, h) {
    var p = MV[id], x = p.x, y = p.y, s = "";
    if (p.kind === "annex") {
      s = mvBody(x, y, 62, 50) + mvRoof(x, y - 50, 62, 17, "#7b7fc0") +
        mvWin(x - 24, y - 42, 13, 11) + mvWin(x - 6, y - 42, 13, 11) + mvWin(x + 12, y - 42, 13, 11) +
        mvDoor(x - 18, y, 10, 14) + mvDoor(x, y, 10, 14) + mvDoor(x + 18, y, 10, 14) +
        mvLabel(x, y + 17, "선교관 101·201·202호", 11);
    } else if (p.kind === "house") {
      s = mvBody(x, y, 64, 40) + mvRoof(x, y - 40, 64, 20, "#7b7fc0") + mvDoor(x, y, 12, 17) +
        mvWin(x - 24, y - 30, 13, 11) + mvWin(x + 11, y - 30, 13, 11) +
        mvLabel(x, y + 18, h.name);
    } else if (p.kind === "church") {
      s = mvBody(x, y, 70, 48) + mvRoof(x, y - 48, 70, 26, "#3c3e78") +
        '<rect x="' + (x - 9) + '" y="' + (y - 106) + '" width="18" height="34" fill="#fffdf6" stroke="#4a4c86" stroke-width="1.2"/>' +
        '<polygon points="' + (x - 12) + "," + (y - 106) + " " + (x + 12) + "," + (y - 106) + " " + x + "," + (y - 128) +
        '" fill="#3c3e78" stroke="#4a4c86" stroke-width="1"/>' +
        '<line x1="' + x + '" y1="' + (y - 143) + '" x2="' + x + '" y2="' + (y - 128) + '" stroke="#3c3e78" stroke-width="2.6"/>' +
        '<line x1="' + (x - 5) + '" y1="' + (y - 138) + '" x2="' + (x + 5) + '" y2="' + (y - 138) + '" stroke="#3c3e78" stroke-width="2.6"/>' +
        '<circle cx="' + x + '" cy="' + (y - 96) + '" r="3.2" fill="#dfe2f4" stroke="#5a5ea6" stroke-width="1"/>' +
        mvDoor(x, y, 14, 19) + '<circle cx="' + x + '" cy="' + (y - 19) + '" r="7" fill="#5a5ea6"/>' +
        mvWin(x - 26, y - 34, 12, 16) + mvWin(x + 14, y - 34, 12, 16) +
        mvLabel(x, y + 19, h.name, 15);
    } else if (p.kind === "school") {
      s = mvBody(x, y, 120, 52) +
        '<rect x="' + (x - 66) + '" y="' + (y - 60) + '" width="132" height="9" rx="3" fill="#7fa886" stroke="#4a4c86" stroke-width="1.2"/>';
      for (var i = 0; i < 4; i++) {
        s += mvWin(x - 52 + i * 29, y - 44, 16, 12) + mvWin(x - 52 + i * 29, y - 25, 16, 12);
      }
      s += mvDoor(x, y, 15, 18) + mvLabel(x, y + 18, h.name);
    } else if (p.kind === "police") {
      s = mvBody(x, y, 70, 42) + mvRoof(x, y - 42, 70, 18, "#5577b0") +
        '<rect x="' + (x - 27) + '" y="' + (y - 39) + '" width="54" height="10" rx="3" fill="#5577b0"/>' +
        '<circle cx="' + x + '" cy="' + (y - 34) + '" r="3" fill="#ffd76a"/>' +
        mvDoor(x, y, 12, 16) + mvWin(x - 25, y - 24, 12, 10) + mvWin(x + 13, y - 24, 12, 10) +
        mvLabel(x, y + 17, h.name);
    } else if (p.kind === "library") {
      s = mvBody(x, y, 74, 44) + mvRoof(x, y - 44, 74, 19, "#7fa886");
      for (var c = -1; c <= 1; c++) {
        s += '<rect x="' + (x + c * 22 - 2.5) + '" y="' + (y - 34) + '" width="5" height="34" fill="#e8e4d2" stroke="#4a4c86" stroke-width="0.8"/>';
      }
      s += mvDoor(x, y, 12, 16) + mvLabel(x, y + 17, h.name);
    }
    var hit = MV_HIT[p.kind];
    return '<g class="mv-b" data-id="' + h.id + '" role="button" tabindex="0" aria-label="' + esc(h.name) + '">' +
      '<rect class="hit" x="' + (x - hit[0] / 2) + '" y="' + (y - hit[1]) + '" width="' + hit[0] + '" height="' + (hit[1] + 26) + '" rx="12"/>' +
      s + "<title>" + esc(h.name) + "</title></g>";
  }
  function mvTree(x, y, r, dark) {
    return '<rect x="' + (x - 2) + '" y="' + (y - 9) + '" width="4" height="9" rx="1.5" fill="#a08a67"/>' +
      '<circle cx="' + x + '" cy="' + (y - 9 - r * 0.7) + '" r="' + r + '" fill="' + (dark ? "#8fae7e" : "#a8c497") + '" stroke="#7d9a6d" stroke-width="1"/>';
  }
  function mvMini(x, y) {
    return '<rect x="' + (x - 8) + '" y="' + (y - 11) + '" width="16" height="11" fill="#eae8f3" stroke="#bcbfda" stroke-width="0.8"/>' +
      '<polygon points="' + (x - 10) + "," + (y - 11) + " " + (x + 10) + "," + (y - 11) + " " + x + "," + (y - 18) +
      '" fill="#c9cce6" stroke="#bcbfda" stroke-width="0.8"/>';
  }
  function mvField(x, y, w, h, fill, rot) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + fill +
      '" opacity="0.85" transform="rotate(' + rot + " " + (x + w / 2) + " " + (y + h / 2) + ')"/>';
  }
  function mvScene() {
    var s = '<rect x="0" y="0" width="1000" height="640" fill="#f4efe0"/>';
    /* 동쪽 밭(패치워크)과 산자락 */
    s += mvField(690, 70, 95, 46, "#e7e0c8", -7) + mvField(806, 138, 110, 50, "#dde5c4", 5) +
      mvField(718, 226, 84, 42, "#efe7d2", -4) + mvField(836, 300, 100, 52, "#e2e8cb", 7) +
      mvField(702, 372, 92, 44, "#e9e2ca", -6) + mvField(842, 452, 92, 46, "#dfe6c7", 4) +
      mvField(730, 536, 80, 40, "#ece4cd", -5);
    s += '<ellipse cx="1015" cy="300" rx="85" ry="390" fill="#c9dcb6"/>';
    /* 서쪽 숲과 거가대로 */
    s += '<ellipse cx="20" cy="130" rx="165" ry="220" fill="#c8dbb4"/>' +
      '<ellipse cx="-10" cy="450" rx="175" ry="260" fill="#bfd5ab"/>' +
      '<ellipse cx="70" cy="620" rx="190" ry="120" fill="#cadeb7"/>';
    var hwy = "M 96 0 C 76 180 110 400 88 640";
    s += '<path d="' + hwy + '" fill="none" stroke="#dfc06a" stroke-width="15" stroke-linecap="round"/>' +
      '<path d="' + hwy + '" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="12 12" opacity="0.85"/>';
    /* 남동쪽 저수지 */
    s += '<ellipse cx="660" cy="604" rx="56" ry="27" fill="#bcd3ec" stroke="#9fbcdf" stroke-width="2"/>';
    /* 길 (동선길: 북쪽 마을에서 남쪽 교회 앞을 지나 내려간다) */
    var road = "M 505 14 C 490 120 470 220 478 320 C 486 400 496 470 504 640";
    s += '<path d="' + road + '" fill="none" stroke="#d3c092" stroke-width="32" stroke-linecap="round"/>';
    s += '<path d="' + road + '" fill="none" stroke="#e9d9ae" stroke-width="24" stroke-linecap="round"/>';
    var lanes = ["M310 130 Q 400 142 494 124", "M520 114 Q 512 104 505 92", "M520 214 L 484 210",
      "M524 308 L 482 306", "M280 316 Q 380 326 476 308", "M612 398 Q 552 404 496 394",
      "M486 590 L 502 582", "M272 598 C 360 614 440 604 500 588"];
    lanes.forEach(function (d) {
      s += '<path d="' + d + '" fill="none" stroke="#ddcb9d" stroke-width="12" stroke-linecap="round"/>';
    });
    /* 북쪽 마을 (작은 집들) */
    s += mvMini(362, 82) + mvMini(408, 68) + mvMini(578, 138) + mvMini(622, 172) + mvMini(392, 168) +
      mvMini(568, 224) + mvMini(614, 254) + mvMini(350, 222) + mvMini(432, 132) + mvMini(590, 90);
    /* 가덕교회 마당 (본당·식당·스토리하우스·선교관동) */
    s += '<rect x="262" y="372" width="230" height="152" rx="18" fill="#f1ebd7" stroke="#e0d5b6" stroke-width="2"/>';
    s += '<rect x="382" y="404" width="36" height="24" fill="#fffdf6" stroke="#4a4c86" stroke-width="1"/>' +
      '<rect x="378" y="400" width="44" height="7" rx="3" fill="#b9bcd8" stroke="#4a4c86" stroke-width="0.8"/>' +
      mvLabel(400, 442, "식당", 9.5) +
      '<rect x="438" y="386" width="34" height="22" fill="#fffdf6" stroke="#4a4c86" stroke-width="1"/>' +
      '<rect x="434" y="382" width="42" height="7" rx="3" fill="#b9bcd8" stroke="#4a4c86" stroke-width="0.8"/>' +
      mvLabel(455, 421, "스토리하우스", 9.5);
    /* 나무 */
    s += mvTree(178, 152, 11) + mvTree(148, 348, 12, 1) + mvTree(206, 476, 11) + mvTree(238, 246, 10, 1) +
      mvTree(648, 306, 11) + mvTree(662, 476, 10, 1) + mvTree(772, 560, 10) + mvTree(578, 512, 11, 1) +
      mvTree(560, 344, 9) + mvTree(410, 350, 10, 1) + mvTree(680, 160, 10);
    return s;
  }

  function initMissionMap() {
    var mapBox = $("#missionMap"), info = $("#missionInfo"), listBox = $("#missionList");
    if (!mapBox || !CFG.missionHouses || !CFG.missionHouses.length) return;
    var intro = $("#missionIntro");
    if (intro && CFG.missionVillageIntro) intro.textContent = CFG.missionVillageIntro;
    /* 최신 주보의 '선교관 8채 사용일정' 표에서 입주 현황을 가져온다 */
    var occWeek = null;
    for (var wi = WEEKS.length - 1; wi >= 0; wi--) {
      if (WEEKS[wi].missionHouses) { occWeek = WEEKS[wi]; break; }
    }
    var cur = null;
    function select(h) {
      cur = h;
      $all(".mv-b", mapBox).forEach(function (p) { p.classList.toggle("on", p.getAttribute("data-id") === h.id); });
      $all("button", listBox).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-id") === h.id); });
      var occ = "", occTitle = "머무시는 분들";
      var entries = occWeek && occWeek.missionHouses[h.id];
      if (entries && entries.length) {
        occTitle = "선교관에 오신·오실 분 <small style='font-weight:600;color:var(--ink-mute)'>(" +
          esc(fmtDate(occWeek.date)) + " 주보 기준)</small>";
        occ = "<ul>" + entries.map(function (e2) {
          return "<li>" + esc(e2.who) + ' <span style="color:var(--ink-mute);font-size:var(--fs-caption)">' + esc(e2.period) + "</span></li>";
        }).join("") + "</ul>";
      } else if (h.occupants && h.occupants.length) {
        occ = "<ul>" + h.occupants.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>";
      } else if (!h.landmark && !h.poi) {
        occ = '<span class="none">현재 머무시는 선교사님 정보가 준비 중입니다.</span>';
      }
      info.innerHTML =
        '<div class="mi-name">' + esc(h.name) + "</div>" +
        '<div class="mi-addr">' + esc(h.address) + "</div>" +
        '<div class="mi-desc">' + esc(h.desc || "") + "</div>" +
        (occ ? '<div class="mi-occ"><b>' + occTitle + "</b>" + occ + "</div>" : "") +
        '<div class="mi-actions">' +
        '<a class="btn small ghost" target="_blank" rel="noopener" href="https://map.kakao.com/link/search/' +
        encodeURIComponent(h.address) + '">카카오맵</a>' +
        '<a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/' +
        encodeURIComponent(h.address) + '">구글맵</a>' +
        "</div>";
    }
    var svg = mvScene();
    CFG.missionHouses.forEach(function (h) {
      if (MV[h.id]) svg += mvBuilding(h.id, h);
      var lb = el("button", "", esc(h.name));
      lb.type = "button";
      lb.setAttribute("data-id", h.id);
      lb.addEventListener("click", function () { select(h); });
      listBox.appendChild(lb);
    });
    mapBox.innerHTML =
      '<svg viewBox="0 0 1000 640" role="img" aria-label="가덕선교마을 지도">' + svg + "</svg>";
    var byId = {};
    CFG.missionHouses.forEach(function (h) { byId[h.id] = h; });
    $all(".mv-b", mapBox).forEach(function (g) {
      function go() { var h = byId[g.getAttribute("data-id")]; if (h) select(h); }
      g.addEventListener("click", go);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    select(CFG.missionHouses[0]);
  }

  /* ── 페이지: 설교방송 ── */
  function pageSermons() {
    var grid = $("#videoArea");
    if (!grid) return;
    var kinds = ["전체", "오전예배", "오후예배", "주일학교예배"];
    var cur = "전체";
    var fr = $("#filterRow");
    kinds.forEach(function (k) {
      var b = el("button", k === cur ? "on" : "", esc(k));
      b.addEventListener("click", function () {
        cur = k;
        $all("button", fr).forEach(function (x) { x.classList.toggle("on", x.textContent === k); });
        render();
      });
      fr.appendChild(b);
    });
    function render() {
      grid.innerHTML = "";
      var list = VIDEOS.filter(function (v) { return cur === "전체" || v.kind === cur; });
      if (!list.length) {
        grid.appendChild(el("div", "empty-note", "해당하는 영상이 없습니다."));
        return;
      }
      var byMonth = {};
      list.forEach(function (v) {
        var key = v.date ? v.date.slice(0, 6) : "기타";
        (byMonth[key] = byMonth[key] || []).push(v);
      });
      Object.keys(byMonth).sort().reverse().forEach(function (mk) {
        var label = mk === "기타" ? "기타" : mk.slice(0, 4) + "년 " + (+mk.slice(4, 6)) + "월";
        grid.appendChild(el("div", "month-label", esc(label)));
        var g = el("div", "video-grid");
        byMonth[mk].sort(function (a, b) { return a.date < b.date ? 1 : -1; })
          .forEach(function (v) { g.appendChild(videoCard(v)); });
        grid.appendChild(g);
      });
    }
    render();
    var want = param("date");
    if (want) {
      var list = videosOf(want);
      var main = list.filter(function (v) { return v.kind === "오전예배"; })[0] || list[0];
      if (main) playVideo(main);
    }
  }

  /* ── 페이지: 주보 ── */
  function pageBulletins() {
    var withPages = WEEKS.filter(function (w) { return w.pages && w.pages.length; });
    if (!withPages.length) {
      $("#bulletinViewer").appendChild(el("div", "empty-note", "아직 등록된 주보가 없습니다. 「주보」 폴더에 PDF를 넣고 업데이트를 실행해 주세요."));
      return;
    }
    var cur = weekByDate(param("date")) || withPages[withPages.length - 1];
    if (!cur.pages || !cur.pages.length) cur = withPages[withPages.length - 1];

    function render() {
      var idx = withPages.indexOf(cur);
      $("#bulletinTitle").textContent = fmtDate(cur.date, true) + " 주보";
      $("#bulletinMeta").innerHTML =
        (cur.special ? '<span class="chip">특별예배</span> ' : '<span class="chip">' + cur.week + "/52주</span> ") +
        (cur.vol ? '<span class="chip">' + esc(cur.vol) + "</span> " : "") +
        (cur.scripture ? '<span class="chip">본문 ' + esc(cur.scripture) + "</span>" : "");
      var tb = $("#bulletinToolbar");
      tb.innerHTML = "";
      var prev = el("button", "btn small ghost", "← 이전 주");
      prev.disabled = idx <= 0;
      prev.style.opacity = idx <= 0 ? 0.4 : 1;
      prev.addEventListener("click", function () { if (idx > 0) { cur = withPages[idx - 1]; render(); } });
      var next = el("button", "btn small ghost", "다음 주 →");
      next.disabled = idx >= withPages.length - 1;
      next.style.opacity = idx >= withPages.length - 1 ? 0.4 : 1;
      next.addEventListener("click", function () { if (idx < withPages.length - 1) { cur = withPages[idx + 1]; render(); } });
      tb.appendChild(prev); tb.appendChild(next);
      tb.appendChild(el("span", "spacer"));
      if (cur.pdf) {
        var dl = el("a", "btn small", "PDF 내려받기");
        dl.href = cur.pdf; dl.setAttribute("download", "가덕교회주보_" + cur.date + ".pdf");
        tb.appendChild(dl);
      }
      var viewer = $("#bulletinViewer");
      viewer.innerHTML = "";
      cur.pages.forEach(function (p) {
        var d = el("div", "bulletin-page");
        d.innerHTML = '<img loading="lazy" src="' + p + '" alt="' + fmtDate(cur.date, true) + ' 주보">';
        viewer.appendChild(d);
      });
      $all("#archiveGrid a").forEach(function (a) {
        a.classList.toggle("on", a.getAttribute("data-date") === cur.date);
      });
    }
    var ag = $("#archiveGrid");
    withPages.slice().reverse().forEach(function (w) {
      var a = el("a", "", esc(fmtDate(w.date, true)) +
        "<small>" + (w.special ? "특별예배" : w.week + "/52주" + (w.scripture ? " · " + esc(w.scripture) : "")) + "</small>");
      a.href = "bulletins.html?date=" + w.date;
      a.setAttribute("data-date", w.date);
      a.addEventListener("click", function (e) { e.preventDefault(); cur = w; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      ag.appendChild(a);
    });
    render();
  }

  /* ── 페이지: 성경공부 ── */
  function pageStudy() {
    var withStudy = WEEKS.filter(function (w) { return w.study || w.studyImage; });
    var nav = $("#studyNav"), sheet = $("#studySheet");
    if (!withStudy.length) {
      sheet.innerHTML = "";
      sheet.appendChild(el("div", "empty-note",
        "아직 등록된 성경공부 자료가 없습니다.<br>「주보」 폴더에 성경공부 이미지를 넣고 업데이트를 실행해 주세요."));
      return;
    }
    var cur = weekByDate(param("date"));
    if (!cur || !(cur.study || cur.studyImage)) cur = withStudy[withStudy.length - 1];

    withStudy.slice().reverse().forEach(function (w) {
      var a = el("a", "", esc(fmtDate(w.date, true)) +
        "<small>" + esc((w.study && w.study.scripture) || w.scripture || "") + "</small>");
      a.href = "study.html?date=" + w.date;
      a.setAttribute("data-date", w.date);
      a.addEventListener("click", function (e) { e.preventDefault(); cur = w; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      nav.appendChild(a);
    });

    function render() {
      $all("a", nav).forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-date") === cur.date); });
      sheet.innerHTML = "";
      var s = cur.study;
      if (!s) {
        sheet.innerHTML =
          '<div class="sh-head"><h2>' + esc(fmtDate(cur.date, true)) + ' 가정예배교재</h2></div>' +
          '<img class="study-img" src="' + cur.studyImage + '" alt="가정예배교재">';
        return;
      }
      var head =
        '<div class="sh-head"><h2>' + esc(s.title || fmtDate(cur.date, true) + " 가정예배교재") + "</h2>" +
        '<div class="sh-meta">' +
        '<span class="chip">' + esc(fmtDate(cur.date, true)) + "</span>" +
        (s.scripture ? '<span class="chip">본문 ' + esc(s.scripture) + "</span>" : "") +
        (s.hymn ? '<span class="chip">찬송 ' + esc(s.hymn) + "</span>" : "") +
        "</div></div>";
      var quote = s.quote ? '<div class="sh-quote">“' + esc(s.quote) + "”</div>" : "";
      var read = s.read ? '<p class="sh-read">📖 ' + esc(s.read) + " 그리고 담임목사님이 강조하신 설교내용을 완성해 보세요. 밑줄을 누르면 답이 나타납니다.</p>" : "";
      var items = '<ol class="sh-items">';
      (s.items || []).forEach(function (it) {
        var html = esc(it).replace(/【(\d+)】/g, function (_, num) {
          var ans = (s.answers || [])[+num - 1] || "";
          return '<button class="blank" type="button" data-ans="' + esc(ans) + '" data-num="' + num + '">' +
            '<span class="num">' + num + "</span></button>";
        });
        items += "<li>" + html + "</li>";
      });
      items += "</ol>";
      var tools = '<div class="sh-tools"><button class="btn small ghost" id="revealAll" type="button">정답 모두 보기</button></div>';
      var share =
        '<div class="sh-share"><b>나눔</b>' +
        "<p>주일설교에서 <b>알게 된 것</b>과 내가 <b>해야 할 것</b>이 무엇인지 가족·구역 식구들과 나누어 보세요.</p></div>";
      sheet.innerHTML = head + quote + read + tools + items + share;

      var allOpen = false;
      $all(".blank", sheet).forEach(function (b) {
        b.addEventListener("click", function () {
          var open = b.classList.toggle("open");
          b.innerHTML = open
            ? esc(b.getAttribute("data-ans"))
            : '<span class="num">' + b.getAttribute("data-num") + "</span>";
        });
      });
      $("#revealAll", sheet).addEventListener("click", function () {
        allOpen = !allOpen;
        this.textContent = allOpen ? "정답 가리기" : "정답 모두 보기";
        $all(".blank", sheet).forEach(function (b) {
          b.classList.toggle("open", allOpen);
          b.innerHTML = allOpen
            ? esc(b.getAttribute("data-ans"))
            : '<span class="num">' + b.getAttribute("data-num") + "</span>";
        });
      });
    }
    render();
  }

  /* ── 페이지: 사진첩 ── */
  var ALBUMS = (D.albums || []).filter(function (a) { return a.photos && a.photos.length; })
    .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var PV = { album: null, i: 0, opener: null };

  function fmtTaken(album, taken) {
    /* "2026-10-04 14:05" → 행사 날짜와 같으면 "오후 2:05", 다르면 날짜까지 */
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(taken || "");
    if (!m) return "";
    var h = +m[4];
    var time = (h < 12 ? "오전 " : "오후 ") + ((h % 12) || 12) + ":" + m[5];
    var day = m[1] + m[2] + m[3];
    return day === album.date ? time : fmtDate(day, true) + " " + time;
  }
  function ensurePhotoModal() {
    var m = $("#photoModal");
    if (m) return m;
    m = el("div", "photo-modal",
      '<img class="pv-img" alt="">' +
      '<div class="pv-info"><div class="pv-text"><b></b><p></p><small></small></div>' +
      '<div class="pv-btns">' +
      '<button type="button" data-go="-1" aria-label="이전 사진">‹ 이전</button>' +
      '<button type="button" data-go="1" aria-label="다음 사진">다음 ›</button>' +
      '<button type="button" class="pv-close">닫기</button></div></div>');
    m.id = "photoModal";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    document.body.appendChild(m);
    function close() {
      m.classList.remove("show");
      document.body.style.overflow = "";
      if (PV.opener) PV.opener.focus();
    }
    function go(d) {
      var n = PV.album.photos.length;
      PV.i = (PV.i + d + n) % n;
      showPhoto();
    }
    m.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b && b.hasAttribute("data-go")) go(+b.getAttribute("data-go"));
      else if (b && b.classList.contains("pv-close")) close();
      else if (e.target === m) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!m.classList.contains("show")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft" && PV.album.photos.length > 1) go(-1);
      else if (e.key === "ArrowRight" && PV.album.photos.length > 1) go(1);
    });
    var sx = null;
    m.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    m.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50 && PV.album.photos.length > 1) go(dx < 0 ? 1 : -1);
    });
    return m;
  }
  function showPhoto() {
    var m = $("#photoModal"), a = PV.album, p = a.photos[PV.i];
    var img = $(".pv-img", m);
    img.src = p.src;
    img.alt = p.title || a.title;
    $(".pv-text b", m).textContent = p.title || a.title;
    var cap = $(".pv-text p", m);
    cap.textContent = p.caption || "";
    cap.hidden = !p.caption;
    var meta = [fmtDate(a.date, true)], tk = fmtTaken(a, p.taken);
    if (tk) meta.push(tk + " 촬영");
    meta.push((PV.i + 1) + " / " + a.photos.length);
    $(".pv-text small", m).textContent = meta.join(" · ");
    $all("[data-go]", m).forEach(function (b) { b.hidden = a.photos.length < 2; });
    if (a.photos.length > 1) new Image().src = a.photos[(PV.i + 1) % a.photos.length].src;
  }
  function openPhotoViewer(album, i, opener) {
    var m = ensurePhotoModal();
    PV.album = album; PV.i = i; PV.opener = opener || null;
    showPhoto();
    m.classList.add("show");
    document.body.style.overflow = "hidden";
    $(".pv-close", m).focus();
  }

  function renderAlbum(a) {
    document.title = a.title + " | 사진첩 | 가덕교회";
    var title = $("#photoTitle");
    title.textContent = a.title;
    var back = el("a", "more-link album-back", "← 사진첩 목록");
    back.href = "photos.html";
    title.parentNode.insertBefore(back, title);
    $("#photoSub").hidden = true;
    var view = $("#photoView");
    view.appendChild(el("div", "album-head",
      '<div class="album-meta"><span class="chip">' + esc(fmtDate(a.date, true)) + "</span>" +
      '<span class="chip">사진 ' + a.photos.length + "장</span></div>" +
      (a.intro ? '<p class="album-intro">' + esc(a.intro) + "</p>" : "")));
    var grid = el("div", "photo-grid");
    a.photos.forEach(function (p, i) {
      var fig = el("figure", "photo-card");
      var btn = el("button", "",
        '<img loading="lazy" src="' + esc(p.src) + '" alt="' + esc(p.title || a.title) + '" width="' + p.w + '" height="' + p.h + '">');
      btn.type = "button";
      btn.setAttribute("aria-label", (p.title || a.title) + " 크게 보기");
      btn.addEventListener("click", function () { openPhotoViewer(a, i, btn); });
      fig.appendChild(btn);
      if (p.title || p.caption) {
        fig.appendChild(el("figcaption", "",
          (p.title ? "<b>" + esc(p.title) + "</b>" : "") + (p.caption ? "<p>" + esc(p.caption) + "</p>" : "")));
      }
      grid.appendChild(fig);
    });
    view.appendChild(grid);
  }

  function pagePhotos() {
    var view = $("#photoView"), filter = $("#photoFilter");
    if (!ALBUMS.length) {
      view.appendChild(el("div", "empty-note",
        "아직 올라온 사진이 없습니다.<br>교회 행사 사진이 올라오면 이곳에 차곡차곡 모입니다."));
      return;
    }
    var want = param("album");
    var found = ALBUMS.filter(function (a) { return a.id === want; })[0];
    if (found) return renderAlbum(found);

    var years = [], cur = "전체";
    ALBUMS.forEach(function (a) { var y = a.date.slice(0, 4); if (years.indexOf(y) < 0) years.push(y); });
    if (years.length > 1) {
      filter.hidden = false;
      ["전체"].concat(years).forEach(function (y) {
        var b = el("button", y === cur ? "on" : "", y === "전체" ? "전체" : y + "년");
        b.type = "button";
        b.addEventListener("click", function () {
          cur = y;
          $all("button", filter).forEach(function (x) { x.classList.toggle("on", x === b); });
          render();
        });
        filter.appendChild(b);
      });
    }
    function render() {
      view.innerHTML = "";
      var grid = el("div", "album-grid");
      ALBUMS.filter(function (a) { return cur === "전체" || a.date.slice(0, 4) === cur; }).forEach(function (a) {
        var card = el("a", "album-card",
          '<div class="ac-cover"><img loading="lazy" src="' + esc(a.cover || a.photos[0].src) + '" alt="">' +
          '<span class="ac-count">사진 ' + a.photos.length + "장</span></div>" +
          '<div class="ac-body"><div class="ac-date">' + esc(fmtDate(a.date, true)) + "</div>" +
          '<div class="ac-title">' + esc(a.title) + "</div>" +
          (a.intro ? '<p class="ac-intro">' + esc(a.intro) + "</p>" : "") + "</div>");
        card.href = "photos.html?album=" + encodeURIComponent(a.id);
        grid.appendChild(card);
      });
      view.appendChild(grid);
    }
    render();
  }

  /* ── 페이지: 교회소개 ── */
  function pageAbout() {
    var sg = $("#staffGrid");
    if (sg && CFG.staff) CFG.staff.forEach(function (s) {
      sg.appendChild(el("div", "staff-card", "<b>" + esc(s.name) + "</b><span>" + esc(s.role) + "</span>"));
    });
    renderServices($("#serviceGrid"));
  }

  /* ── 초기화 ── */
  document.addEventListener("DOMContentLoaded", function () {
    /* 활성 메뉴 */
    var page = document.body.getAttribute("data-page");
    $all(".gnb a").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.classList.add("on");
    });
    /* 푸터 공통 */
    $all("[data-cfg]").forEach(function (e) {
      var key = e.getAttribute("data-cfg");
      if (CFG[key]) e.textContent = CFG[key];
    });
    if (page === "home") pageHome();
    if (page === "sermons") pageSermons();
    if (page === "bulletins") pageBulletins();
    if (page === "study") pageStudy();
    if (page === "photos") pagePhotos();
    if (page === "about") pageAbout();
  });
})();
