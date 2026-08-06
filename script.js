/* ==========================================================================
   Video Bercocok Tanam — script.js
   Vanilla JS (ES6). Tidak ada dependency eksternal.
   ========================================================================== */

(() => {
  "use strict";

  /* ---------------------------------------------------------------------
   * State & konstanta
   * ------------------------------------------------------------------- */
  const DATA_URL = "videos.json";
  const NO_IMAGE = "assets/noimage.jpg";

  let allVideos = [];      // seluruh data dari videos.json
  let filteredVideos = []; // hasil setelah pencarian
  let currentVideo = null;

  /* ---------------------------------------------------------------------
   * Helper DOM
   * ------------------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  const els = {
    header: $("#siteHeader"),
    search: $("#searchInput"),
    darkToggle: $("#darkModeToggle"),
    player: $("#videoPlayer"),
    playerSkeleton: $("#playerSkeleton"),
    playerError: $("#playerError"),
    retryVideo: $("#retryVideo"),
    title: $("#videoTitle"),
    date: $("#videoDate"),
    category: $("#videoCategory"),
    description: $("#videoDescription"),
    copyLinkBtn: $("#copyLinkBtn"),
    shareWhatsapp: $("#shareWhatsapp"),
    shareFacebook: $("#shareFacebook"),
    recentList: $("#recentList"),
    popularList: $("#popularList"),
    videoGrid: $("#videoGrid"),
    resultCount: $("#resultCount"),
    emptyState: $("#emptyState"),
    breadcrumbCurrent: $("#breadcrumbCurrent"),
    scrollTopBtn: $("#scrollTopBtn"),
    toast: $("#toast"),
    year: $("#year"),
  };

  /* ---------------------------------------------------------------------
   * Util
   * ------------------------------------------------------------------- */
  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return isoDate;
    }
  }

  function slugToVideo(slug) {
    return allVideos.find((v) => v.id === slug);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  /* ---------------------------------------------------------------------
   * Dark mode (tersimpan di localStorage)
   * ------------------------------------------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem("vbt-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    els.darkToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    localStorage.setItem("vbt-theme", theme);
  }

  els.darkToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  /* ---------------------------------------------------------------------
   * Lazy loading thumbnail (IntersectionObserver, dengan fallback native)
   * ------------------------------------------------------------------- */
  let thumbObserver = null;
  function getThumbObserver() {
    if (thumbObserver) return thumbObserver;
    if (!("IntersectionObserver" in window)) return null;
    thumbObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "150px" }
    );
    return thumbObserver;
  }

  function makeLazyImg(src, alt, className) {
    const img = el("img", className);
    img.alt = alt;
    img.loading = "lazy";
    img.width = 320;
    img.height = 180;
    img.onerror = () => {
      img.onerror = null;
      img.src = NO_IMAGE;
    };
    const observer = getThumbObserver();
    if (observer) {
      img.dataset.src = src;
      img.src = NO_IMAGE; // placeholder sebelum masuk viewport
      observer.observe(img);
    } else {
      img.src = src; // fallback browser lama
    }
    return img;
  }

  /* ---------------------------------------------------------------------
   * Render: kartu sidebar (terbaru / populer)
   * ------------------------------------------------------------------- */
  function renderSideList(container, videos) {
    container.innerHTML = "";
    videos.forEach((v) => {
      const card = el("a", "side-card");
      card.href = `#${v.id}`;
      card.setAttribute("data-id", v.id);
      const thumb = makeLazyImg(v.thumbnail, v.title, "side-thumb");
      const info = el(
        "div",
        "side-info",
        `<div class="side-title"></div><div class="side-date">${formatDate(v.date)}</div>`
      );
      info.querySelector(".side-title").textContent = v.title;
      card.append(thumb, info);
      card.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToVideo(v.id, true);
      });
      container.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
   * Render: grid seluruh video
   * ------------------------------------------------------------------- */
  const playIconSVG = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

  function renderGrid() {
    els.videoGrid.innerHTML = "";
    els.resultCount.textContent = `${filteredVideos.length} video`;
    els.emptyState.hidden = filteredVideos.length !== 0;

    filteredVideos.forEach((v) => {
      const card = el("a", "video-card");
      card.href = `#${v.id}`;
      card.setAttribute("data-id", v.id);

      const thumbWrap = el(
        "div",
        "card-thumb-wrap",
        `<div class="card-play">${playIconSVG}</div>`
      );
      const thumb = makeLazyImg(v.thumbnail, v.title, "card-thumb");
      thumbWrap.prepend(thumb);

      const body = el(
        "div",
        "card-body",
        `<div class="card-title"></div><div class="card-date">${formatDate(v.date)}</div>`
      );
      body.querySelector(".card-title").textContent = v.title;

      card.append(thumbWrap, body);
      card.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToVideo(v.id, true);
      });
      els.videoGrid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
   * Player: memuat video terpilih
   * ------------------------------------------------------------------- */
  function loadPlayer(video) {
    els.player.hidden = true;
    els.playerError.hidden = true;
    els.playerSkeleton.hidden = false;

    els.player.onload = () => {
      els.playerSkeleton.hidden = true;
      els.player.hidden = false;
    };
    els.player.onerror = () => showPlayerError();

    els.player.src = video.video;

    // Deteksi gagal muat (mis. koneksi terputus) setelah jeda wajar.
    window.clearTimeout(loadPlayer._t);
    loadPlayer._t = window.setTimeout(() => {
      if (els.playerSkeleton.hidden === false) showPlayerError();
    }, 12000);
  }

  function showPlayerError() {
    els.playerSkeleton.hidden = true;
    els.player.hidden = true;
    els.playerError.hidden = false;
  }

  els.retryVideo.addEventListener("click", () => {
    if (currentVideo) loadPlayer(currentVideo);
  });

  /* ---------------------------------------------------------------------
   * Navigasi ke video (mengubah URL via History API, tanpa reload)
   * ------------------------------------------------------------------- */
  function navigateToVideo(id, pushHistory) {
    const video = slugToVideo(id) || allVideos[0];
    if (!video) return;
    currentVideo = video;

    loadPlayer(video);
    els.title.textContent = video.title;
    els.date.textContent = formatDate(video.date);
    els.category.textContent = video.category || "";
    els.description.textContent = video.description;
    els.breadcrumbCurrent.textContent = video.title;
    document.title = `${video.title} — Video Bercocok Tanam`;

    els.copyLinkBtn.dataset.url = `${location.origin}${location.pathname}#${video.id}`;
    const shareUrl = encodeURIComponent(els.copyLinkBtn.dataset.url);
    const shareText = encodeURIComponent(video.title);
    els.shareWhatsapp.href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
    els.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;

    // Tandai kartu aktif di sidebar
    document.querySelectorAll(".side-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === video.id);
    });

    if (pushHistory) {
      history.pushState({ id: video.id }, "", `#${video.id}`);
    }

    els.player.closest(".player-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  window.addEventListener("popstate", (e) => {
    const id = (e.state && e.state.id) || window.location.hash.replace("#", "") || allVideos[0]?.id;
    if (id) navigateToVideo(id, false);
  });

  /* ---------------------------------------------------------------------
   * Pencarian video (real-time, tanpa reload)
   * ------------------------------------------------------------------- */
  let searchDebounce;
  els.search.addEventListener("input", () => {
    window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
      const q = els.search.value.trim().toLowerCase();
      filteredVideos = !q
        ? allVideos
        : allVideos.filter(
            (v) =>
              v.title.toLowerCase().includes(q) ||
              (v.category || "").toLowerCase().includes(q) ||
              v.description.toLowerCase().includes(q)
          );
      renderGrid();
    }, 200);
  });

  /* ---------------------------------------------------------------------
   * Salin link & bagikan
   * ------------------------------------------------------------------- */
  els.copyLinkBtn.addEventListener("click", async () => {
    const url = els.copyLinkBtn.dataset.url || location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link video disalin!");
    } catch {
      // Fallback untuk browser tanpa Clipboard API
      const temp = document.createElement("textarea");
      temp.value = url;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      showToast("Link video disalin!");
    }
  });

  /* ---------------------------------------------------------------------
   * Scroll to top
   * ------------------------------------------------------------------- */
  window.addEventListener("scroll", () => {
    els.scrollTopBtn.hidden = false;
    els.scrollTopBtn.classList.toggle("visible", window.scrollY > 500);
  });
  els.scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------------------------------------------------------------------
   * Inisialisasi aplikasi
   * ------------------------------------------------------------------- */
  async function init() {
    initTheme();
    els.year.textContent = new Date().getFullYear();

    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat data video");
      allVideos = await res.json();
    } catch (err) {
      els.videoGrid.innerHTML = "";
      els.emptyState.textContent = "Gagal memuat daftar video. Coba muat ulang halaman.";
      els.emptyState.hidden = false;
      console.error(err);
      return;
    }

    if (!allVideos.length) {
      els.emptyState.textContent = "Belum ada video yang tersedia.";
      els.emptyState.hidden = false;
      return;
    }

    filteredVideos = allVideos;

    const recent = [...allVideos].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const popular = allVideos.filter((v) => v.popular).slice(0, 3);
    renderSideList(els.recentList, recent);
    renderSideList(els.popularList, popular.length ? popular : allVideos.slice(0, 3));
    renderGrid();

    const initialId = window.location.hash.replace("#", "") || recent[0].id;
    navigateToVideo(initialId, false);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
