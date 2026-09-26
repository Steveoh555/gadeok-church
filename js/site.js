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
     101·201·202호는 캠퍼스 안 선교관동 한 건물이라 house-101 하나로 그린다.
     건물 이름표는 SVG 글자가 아니라 지도 위에 겹친 HTML 버튼이다(2026-09-15).
     SVG 글자는 지도와 함께 줄어 휴대폰에서 읽을 수 없었기 때문. 이름표 위치는 viewBox 좌표를 %로 바꿔 둔다.
     label: "l"이면 이름표를 건물 왼쪽에(기본은 아래), name: 지도에 쓸 이름(없으면 config 이름)
     s: 건물 그림 배율(바닥 가운데 기준). 학교·파출소는 사용자 요청으로 0.5 (2026-09-15) */
  var MV = {
    "jeongduri":      { x: 520, y: 108, kind: "house" },
    "library":        { x: 300, y: 122, kind: "library" },
    "police":         { x: 520, y: 208, kind: "police", s: 0.5 },
    "elementary":     { x: 524, y: 302, kind: "school", s: 0.5 },
    "middle":         { x: 278, y: 310, kind: "school", s: 0.5 },
    "seomgim":        { x: 612, y: 392, kind: "house" },
    "church":         { x: 325, y: 480, kind: "church", label: "l" },
    "house-101":      { x: 450, y: 505, kind: "annex", name: "선교관 101·201·202호" },
    "greenville-401": { x: 452, y: 592, kind: "house" },
    "haengun-401":    { x: 272, y: 592, kind: "house" }
  };
  var MV_HIT = { annex: [76, 82], house: [88, 76], church: [104, 158], school: [140, 78], police: [92, 80], library: [96, 80] };
  /* 클릭 대상이 아닌 안내 글자. a: 기준점 대비 위치(b 아래·t 위·l 왼쪽·r 오른쪽·c 가운데) */
  var MV_NOTES = [
    { t: "식당", x: 396, y: 444, a: "b" },
    { t: "스토리하우스", x: 455, y: 378, a: "t" },
    { t: "거가대로", x: 116, y: 250, a: "r" },
    { t: "저수지", x: 660, y: 604, a: "c" }
  ];
  /* [벽, 지붕, 창·문] — 사용자 선택(2026-09-15): 선교관(도서관 포함)은 따뜻한 테라코타,
     교회는 하얀 벽에 페리윙클 지붕, 학교·파출소는 연한 회색. 처음의 진한 남색은 "무서워 보인다"고 해서 뺐다 */
  var TERRA = ["#ecd2bb", "#c27f5a", "rgba(122,72,45,0.28)"], GRAYC = ["#cfd1dc", "#a7a9ba", "rgba(79,83,160,0.25)"];
  var MV_COLOR = {
    house: TERRA, annex: TERRA, library: TERRA, church: ["#fcfcff", "#7b7fc0", "rgba(79,83,160,0.3)"],
    school: GRAYC, police: GRAYC
  };

  function mvRect(x, y, w, h, fill, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' +
      (rx ? ' rx="' + rx + '"' : "") + ' fill="' + fill + '"/>';
  }
  var mvInk = GRAYC[2]; /* 창·문 색. mvBuilding이 건물마다 MV_COLOR[kind][2]로 바꾼다 */
  function mvWin(x, y, w, h) { return mvRect(x, y, w, h, mvInk, 1); }
  function mvDoor(x, y, w, h) { return mvRect(x - w / 2, y - h, w, h, mvInk, 1); }
  function mvBody(x, y, w, h, fill) { return mvRect(x - w / 2, y - h, w, h, fill); }
  function mvRoof(x, topY, w, rise, fill) {
    return '<polygon points="' + (x - w / 2 - 5) + "," + topY + " " + (x + w / 2 + 5) + "," + topY + " " + x + "," + (topY - rise) +
      '" fill="' + fill + '"/>';
  }
  function mvShadow(x, y, w) {
    return '<ellipse cx="' + x + '" cy="' + (y + 1) + '" rx="' + (w / 2 + 10) + '" ry="6" fill="rgba(42,43,69,0.10)"/>';
  }
  function mvBuilding(id, h) {
    var p = MV[id], x = p.x, y = p.y, c = MV_COLOR[p.kind], s = "";
    mvInk = c[2];
    if (p.kind === "annex") {
      s = mvShadow(x, y, 62) + mvBody(x, y, 62, 50, c[0]) + mvRoof(x, y - 50, 62, 17, c[1]) +
        mvWin(x - 24, y - 42, 13, 11) + mvWin(x - 6, y - 42, 13, 11) + mvWin(x + 12, y - 42, 13, 11) +
        mvDoor(x - 18, y, 10, 14) + mvDoor(x, y, 10, 14) + mvDoor(x + 18, y, 10, 14);
    } else if (p.kind === "house") {
      s = mvShadow(x, y, 64) + mvBody(x, y, 64, 40, c[0]) + mvRoof(x, y - 40, 64, 20, c[1]) + mvDoor(x, y, 12, 17) +
        mvWin(x - 24, y - 30, 13, 11) + mvWin(x + 11, y - 30, 13, 11);
    } else if (p.kind === "church") {
      s = mvShadow(x, y, 70) + mvRect(x - 9, y - 106, 18, 36, c[0]) +
        '<rect x="' + (x - 9) + '" y="' + (y - 106) + '" width="18" height="36" fill="none" stroke="rgba(79,83,160,0.35)"/>' +
        '<polygon points="' + (x - 12) + "," + (y - 106) + " " + (x + 12) + "," + (y - 106) + " " + x + "," + (y - 128) + '" fill="' + c[1] + '"/>' +
        '<path d="M' + x + " " + (y - 143) + "V" + (y - 128) + "M" + (x - 5) + " " + (y - 138) + "H" + (x + 5) +
        '" stroke="' + c[1] + '" stroke-width="2.4" stroke-linecap="round"/>' +
        mvBody(x, y, 70, 48, c[0]) +
        '<rect x="' + (x - 35) + '" y="' + (y - 48) + '" width="70" height="48" fill="none" stroke="rgba(79,83,160,0.35)"/>' +
        mvRoof(x, y - 48, 70, 26, c[1]) +
        '<circle cx="' + x + '" cy="' + (y - 94) + '" r="3.2" fill="rgba(79,83,160,0.35)"/>' +
        mvDoor(x, y, 14, 20) + mvWin(x - 26, y - 34, 12, 16) + mvWin(x + 14, y - 34, 12, 16);
    } else if (p.kind === "school") {
      s = mvShadow(x, y, 120) + mvBody(x, y, 120, 52, c[0]) + mvRect(x - 64, y - 60, 128, 8, c[1], 2);
      for (var i = 0; i < 4; i++) {
        s += mvWin(x - 52 + i * 29, y - 44, 16, 12) + mvWin(x - 52 + i * 29, y - 25, 16, 12);
      }
      s += mvDoor(x, y, 15, 18);
    } else if (p.kind === "police") {
      s = mvShadow(x, y, 70) + mvBody(x, y, 70, 42, c[0]) + mvRoof(x, y - 42, 70, 18, c[1]) +
        mvDoor(x, y, 12, 16) + mvWin(x - 25, y - 30, 12, 10) + mvWin(x + 13, y - 30, 12, 10);
    } else if (p.kind === "library") {
      s = mvShadow(x, y, 74) + mvBody(x, y, 74, 44, c[0]) + mvRoof(x, y - 44, 74, 19, c[1]);
      for (var k = -1; k <= 1; k++) s += mvRect(x + k * 22 - 2.5, y - 36, 5, 36, mvInk);
    }
    var k = p.s || 1, hw = MV_HIT[p.kind][0] * k, hh = MV_HIT[p.kind][1] * k;
    if (k !== 1) s = '<g transform="translate(' + x + " " + y + ") scale(" + k + ") translate(" + (-x) + " " + (-y) + ')">' + s + "</g>";
    return '<g class="mv-b" data-id="' + h.id + '" role="button" tabindex="0" aria-label="' + esc(h.name) + '">' +
      '<rect class="hit" x="' + (x - hw / 2) + '" y="' + (y - hh) + '" width="' + hw + '" height="' + (hh + 12) + '" rx="10"/>' +
      s + "<title>" + esc(h.name) + "</title></g>";
  }
  function mvTree(x, y, r, dark) {
    return '<circle cx="' + x + '" cy="' + (y - r) + '" r="' + r + '" fill="' + (dark ? "#cbd6bf" : "#d6dfcb") + '"/>';
  }
  function mvMini(x, y) { return mvRect(x - 8, y - 12, 16, 12, "#e0ded5", 1.5); }
  function mvField(x, y, w, h, fill, rot) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + fill +
      '" transform="rotate(' + rot + " " + (x + w / 2) + " " + (y + h / 2) + ')"/>';
  }
  function mvPath(d, color, w, dash) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  }
  function mvScene() {
    var s = '<rect x="0" y="0" width="1000" height="640" fill="#f3f2ed"/>';
    /* 동쪽 밭과 산자락 */
    s += mvField(690, 70, 95, 46, "#eae8df", -7) + mvField(806, 138, 110, 50, "#e5e8dc", 5) +
      mvField(718, 226, 84, 42, "#eae8df", -4) + mvField(836, 300, 100, 52, "#e5e8dc", 7) +
      mvField(702, 372, 92, 44, "#eae8df", -6) + mvField(842, 452, 92, 46, "#e5e8dc", 4) +
      mvField(730, 536, 80, 40, "#eae8df", -5);
    s += '<ellipse cx="1015" cy="300" rx="85" ry="390" fill="#e1e6d8"/>';
    /* 서쪽 숲 */
    s += '<ellipse cx="20" cy="130" rx="165" ry="220" fill="#e0e6d6"/>' +
      '<ellipse cx="-10" cy="450" rx="175" ry="260" fill="#dbe2d1"/>' +
      '<ellipse cx="70" cy="620" rx="190" ry="120" fill="#e1e7d8"/>';
    /* 남동쪽 저수지 */
    s += '<ellipse cx="660" cy="604" rx="56" ry="27" fill="#d5e1ea"/>';
    /* 가덕교회 마당 경계 (길보다 먼저 그려 길이 경계 위를 지나가게) */
    s += '<rect x="262" y="372" width="230" height="152" rx="16" fill="rgba(90,94,166,0.06)" stroke="rgba(90,94,166,0.38)" stroke-width="1.2" stroke-dasharray="5 5"/>';
    /* 길: 테두리를 모두 먼저 그리고 속을 덮어서 갈림길이 매끈하게 이어지게 한다 */
    var hwy = "M 96 0 C 76 180 110 400 88 640";
    var road = "M 505 14 C 490 120 470 220 478 320 C 486 400 496 470 504 640";
    var lanes = ["M310 130 Q 400 142 494 124", "M520 114 Q 512 104 505 92", "M520 214 L 484 210",
      "M524 308 L 482 306", "M280 316 Q 380 326 476 308", "M612 398 Q 552 404 496 394",
      "M486 590 L 502 582", "M272 598 C 360 614 440 604 500 588"];
    s += mvPath(hwy, "#dedbd1", 20) + mvPath(road, "#e2dfd5", 30);
    lanes.forEach(function (d) { s += mvPath(d, "#e2dfd5", 13); });
    s += mvPath(hwy, "#fbfaf7", 15) + mvPath(hwy, "#d9d5c9", 1.2, "10 12") + mvPath(road, "#fdfcfa", 24);
    lanes.forEach(function (d) { s += mvPath(d, "#fdfcfa", 8); });
    /* 북쪽 마을 (작은 집들) */
    s += mvMini(362, 82) + mvMini(408, 68) + mvMini(578, 138) + mvMini(622, 172) + mvMini(392, 168) +
      mvMini(568, 224) + mvMini(614, 254) + mvMini(350, 222) + mvMini(432, 132) + mvMini(590, 90);
    /* 캠퍼스 부속 건물: 식당·스토리하우스 */
    s += mvRect(382, 404, 36, 24, "#c3c5dd") + mvRect(378, 400, 44, 6, "#a4a7cc", 2) +
      mvRect(438, 386, 34, 22, "#c3c5dd") + mvRect(434, 382, 42, 6, "#a4a7cc", 2);
    /* 나무 */
    s += mvTree(178, 152, 11) + mvTree(148, 348, 12, 1) + mvTree(206, 476, 11) + mvTree(238, 246, 10, 1) +
      mvTree(648, 306, 11) + mvTree(662, 476, 10, 1) + mvTree(772, 560, 10) + mvTree(578, 512, 11, 1) +
      mvTree(560, 344, 9) + mvTree(410, 350, 10, 1) + mvTree(680, 160, 10);
    /* 방위표 */
    s += '<g transform="translate(956 50)"><circle r="17" fill="#ffffff" stroke="#dcdeee"/>' +
      '<polygon points="0,-11 5,2 0,0 -5,2" fill="#3c3e78"/><polygon points="0,11 5,2 0,0 -5,2" fill="#c3c5d4"/>' +
      '<text y="-22" text-anchor="middle" font-size="11" font-weight="700" fill="#3c3e78">N</text></g>';
    return s;
  }
  /* 지도 위 HTML 글자. id가 있으면 누를 수 있는 이름표 버튼, 없으면 안내 글자 */
  function mvTag(x, y, a, cls, text, id) {
    var style = "left:" + (x / 10) + "%;top:" + (y / 6.4) + "%";
    if (!id) return '<span class="mv-note a-' + a + '" style="' + style + '" aria-hidden="true">' + text + "</span>";
    return '<button type="button" class="mv-tag a-' + a + (cls ? " " + cls : "") + '" data-id="' + id + '" style="' + style + '">' + text + "</button>";
  }

  function initMissionMap() {
    var mapBox = $("#missionMap"), info = $("#missionInfo"), listBox = $("#missionList");
    if (!mapBox || !CFG.missionHouses || !CFG.missionHouses.length) return;
    var scroller = $("#missionScroll");
    var intro = $("#missionIntro");
    if (intro && CFG.missionVillageIntro) intro.textContent = CFG.missionVillageIntro;
    /* 최신 주보의 '선교관 8채 사용일정' 표에서 입주 현황을 가져온다 */
    var occWeek = null;
    for (var wi = WEEKS.length - 1; wi >= 0; wi--) {
      if (WEEKS[wi].missionHouses) { occWeek = WEEKS[wi]; break; }
    }
    /* 201·202호는 101호와 같은 선교관동 건물이라 지도에서는 house-101을 표시한다 */
    function mapIdOf(h) { return MV[h.id] ? h.id : (h.minor ? "house-101" : ""); }
    /* 휴대폰처럼 지도를 옆으로 밀어 보는 화면에서 고른 건물을 가운데로 */
    function reveal(id, smooth) {
      if (!scroller || !MV[id] || scroller.scrollWidth <= scroller.clientWidth) return;
      var left = Math.max(0, MV[id].x / 1000 * scroller.scrollWidth - scroller.clientWidth / 2);
      if (smooth && scroller.scrollTo) scroller.scrollTo({ left: left, behavior: "smooth" });
      else scroller.scrollLeft = left;
    }
    function select(h, fromMap) {
      var mid = mapIdOf(h);
      $all(".mv-b, .mv-tag", mapBox).forEach(function (p) { p.classList.toggle("on", p.getAttribute("data-id") === mid); });
      $all("button", listBox).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-id") === h.id); });
      if (!fromMap) reveal(mid, true);
      var occ = "", occTitle = "머무시는 분들";
      var entries = occWeek && occWeek.missionHouses[h.id];
      if (entries && entries.length) {
        occTitle = "선교관에 오신·오실 분 <small style='font-weight:600;color:var(--ink-mute)'>(" +
          esc(fmtDate(occWeek.date)) + " 주보 기준)</small>";
        occ = "<ul>" + entries.map(function (e2) {
          return "<li>" + esc(e2.who) + ' <span style="color:var(--ink-mute);font-size:var(--fs-caption)">' + esc(e2.period) + "</span></li>";
        }).join("") + "</ul>" +
          '<p class="mi-note">선교사님의 안전을 위해 이름은 영문 글자로 표시합니다.</p>';
      } else if (h.occupants && h.occupants.length) {
        occ = "<ul>" + h.occupants.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>";
      } else if (!h.landmark && !h.poi) {
        occ = '<span class="none">현재 머무시는 선교사님 정보가 준비 중입니다.</span>';
      }
      info.innerHTML =
        '<div class="mi-kind">' + (h.landmark ? "교회" : h.poi ? "주변 시설" : "선교관") + "</div>" +
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
    var byId = {};
    CFG.missionHouses.forEach(function (h) { byId[h.id] = h; });

    var svg = mvScene(), tags = "";
    CFG.missionHouses.forEach(function (h) {
      var p = MV[h.id];
      if (!p) return;
      svg += mvBuilding(h.id, h);
      var left = p.label === "l";
      tags += mvTag(left ? p.x - MV_HIT[p.kind][0] / 2 : p.x, left ? p.y - 30 : p.y + 10, left ? "l" : "b",
        h.landmark ? "landmark" : (h.poi ? "poi" : "house"), esc(p.name || h.name), h.id);
    });
    MV_NOTES.forEach(function (n) { tags += mvTag(n.x, n.y, n.a, "", esc(n.t)); });
    mapBox.innerHTML = '<svg viewBox="0 0 1000 640" role="img" aria-label="가덕선교마을 지도">' + svg + "</svg>" + tags;
    /* 지도 아래 목록: 선교관 / 교회·주변 시설 */
    [["선교관", function (h) { return !h.landmark && !h.poi; }],
     ["교회 · 주변 시설", function (h) { return h.landmark || h.poi; }]].forEach(function (g) {
      var items = CFG.missionHouses.filter(g[1]);
      if (!items.length) return;
      var box = el("div", "ml-group", '<div class="ml-label">' + esc(g[0]) + "</div>");
      var chips = el("div", "ml-chips");
      items.forEach(function (h) {
        var lb = el("button", "", esc(h.name));
        lb.type = "button";
        lb.setAttribute("data-id", h.id);        lb.addEventListener("click", function () { select(h); });
        chips.appendChild(lb);
      });
      box.appendChild(chips);
      listBox.appendChild(box);
    });

    $all(".mv-b, .mv-tag", mapBox).forEach(function (g) {
      function go() { var h = byId[g.getAttribute("data-id")]; if (h) select(h, true); }
      g.addEventListener("click", go);
      if (g.tagName !== "BUTTON") {
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      }
    });
    select(CFG.missionHouses[0], true);
    reveal(mapIdOf(CFG.missionHouses[0]), false);
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
    var meta = [albumWhen(a)], tk = fmtTaken(a, p.taken);
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

  /* 월별 앨범(주보 소식 사진 묶음)은 날짜 대신 「2026년 9월」로 보여 준다 */
  function albumWhen(a) {
    return a.month ? a.date.slice(0, 4) + "년 " + (+a.date.slice(4, 6)) + "월" : fmtDate(a.date, true);
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
      '<div class="album-meta"><span class="chip">' + esc(albumWhen(a)) + "</span>" +
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
          '<div class="ac-body"><div class="ac-date">' + esc(albumWhen(a)) + "</div>" +
          '<div class="ac-title">' + esc(a.title) + "</div>" +
          (a.intro ? '<p class="ac-intro">' + esc(a.intro) + "</p>" : "") + "</div>");
        card.href = "photos.html?album=" + encodeURIComponent(a.id);
        grid.appendChild(card);
      });
      view.appendChild(grid);
    }
    render();
  }

  /* ── 페이지: 신명기 한눈에 보기 ──
     단락 → 장 → 내용 3단계 접이식(<details>). 어르신이 읽기 쉽도록 글자를 크게 한다(style.css 참고).
     장 요약·단락은 js/deuteronomy.js(손으로 쓰는 내용), 설교 본문·문장·영상은 주보 데이터에서 가져온다. */
  function pageDeut() {
    var DT = window.DEUT;
    if (!DT) return;
    var fix = DT.quoteFix || {};
    function quoteOf(w) { return (w.study && w.study.quote) || fix[w.date] || w.quote || ""; }
    var TOGGLE = '<span class="dt-toggle" aria-hidden="true"></span>';

    var holder = $("#dtParts");
    DT.parts.forEach(function (p, i) {
      var preached = 0;
      for (var k = p.range[0]; k <= p.range[1]; k++) if (DT.chapters[k - 1].sermons) preached++;
      var d = el("details", "dt-acc dt-part dt-c" + (i + 1));
      d.id = p.id;
      var html =
        "<summary>" +
        '<span class="dt-step">' + (i + 1) + "</span>" +
        '<span class="dt-sum-main"><span class="dt-part-label">' + esc(p.label) + " · " + p.range[0] + "~" + p.range[1] + "장</span>" +
        "<b><em>「" + esc(p.key) + "」</em> " + esc(p.title) + "</b></span>" + TOGGLE + "</summary>" +
        '<div class="dt-part-body">' +
        '<p class="dt-part-desc">' + esc(p.desc) + "</p>" +
        '<blockquote class="dt-part-verse">' + esc(p.verseText) + " <cite>(" + esc(p.verse) + ")</cite></blockquote>" +
        (p.range[0] <= 8 ? '<p class="dt-note">' + (p.range[1] <= 8 ? "이 단락" : p.range[0] + "~8장") +
          "은 2026년 이전에 설교한 부분이라 성경 본문 요약만 실었습니다.</p>" : "") +
        '<div class="dt-chs">';
      for (var n = p.range[0]; n <= p.range[1]; n++) html += chapterItem(DT.chapters[n - 1]);
      html += "</div></div>";
      d.innerHTML = html;
      holder.appendChild(d);
    });

    function chapterItem(ch) {
      var weeks = (ch.sermons || []).map(weekByDate).filter(Boolean);
      var sermons = weeks.map(function (w) {
        var vids = videosOf(w.date), q = quoteOf(w);
        return '<div class="dt-sermon">' +
          '<div class="dt-s-meta">' + esc(fmtDate(w.date)) + " 주일 설교 · " + esc(w.scripture || "") + "</div>" +
          (q ? "<blockquote>“" + esc(q) + "”</blockquote>" : "") +
          '<div class="dt-s-links">' +
          (vids.length ? '<button type="button" class="btn" data-play="' + w.date + '">▶ 설교 영상 보기</button>' : "") +
          (w.pages && w.pages.length ? '<a class="btn ghost" href="bulletins.html?date=' + w.date + '">주보 보기</a>' : "") +
          ((w.study || w.studyImage) ? '<a class="btn ghost" href="study.html?date=' + w.date + '">성경공부</a>' : "") +
          "</div></div>";
      }).join("");
      return '<details class="dt-acc dt-ch" id="ch' + ch.n + '">' +
        '<summary><span class="dt-no">' + ch.n + "<small>장</small></span>" +
        '<span class="dt-sum-main"><b>' + esc(ch.title) + "</b><span>" + esc(ch.short) + "</span></span>" + TOGGLE + "</summary>" +
        '<div class="dt-ch-body">' +
        '<p class="dt-summary">' + esc(ch.summary) + "</p>" +
        (ch.verseText ? '<p class="dt-verse"><b>기억할 말씀 · ' + esc(ch.verse) + "</b><br>" + esc(ch.verseText) + "</p>"
          : '<p class="dt-verse-ref">기억할 말씀 · <b>' + esc(ch.verse) + "</b></p>") +
        (sermons ? '<div class="dt-sermons"><h4>우리가 들은 말씀</h4>' + sermons + "</div>"
          : (ch.n > 8 ? '<p class="dt-note">올해 주일 오전예배 본문으로 다루지 않은 장입니다.</p>' : "")) +
        "</div></details>";
    }

    $all("[data-play]", holder).forEach(function (b) {
      b.addEventListener("click", function () {
        var list = videosOf(b.getAttribute("data-play"));
        var main = list.filter(function (v) { return v.kind === "오전예배"; })[0] || list[0];
        if (main) playVideo(main);
      });
    });

    /* 모두 펼치기 / 모두 접기 */
    var allBtn = $("#dtAll");
    function syncAll() {
      var any = $all("details.dt-acc", holder).some(function (x) { return !x.open; });
      allBtn.textContent = any ? "모두 펼치기" : "모두 접기";
    }
    allBtn.addEventListener("click", function () {
      var open = allBtn.textContent === "모두 펼치기";
      $all("details.dt-acc", holder).forEach(function (x) { x.open = open; });
      syncAll();
    });
    $all("details.dt-acc", holder).forEach(function (x) { x.addEventListener("toggle", syncAll); });

    /* 주소 끝 #ch12 · #p3 로 들어오면 그 단락(과 장)을 펼쳐서 보여 준다 */
    if (location.hash) {
      var t = document.getElementById(location.hash.slice(1));
      if (t && t.tagName === "DETAILS") {
        t.open = true;
        var par = t.parentElement && t.parentElement.closest("details");
        if (par) par.open = true;
        requestAnimationFrame(function () { t.scrollIntoView(); });
      }
    }
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
      if (a.getAttribute("data-nav") === (page === "deut" ? "sermons" : page)) a.classList.add("on");
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
    if (page === "deut") pageDeut();
  });
})();
